const cds = require('@sap/cds');
const { initJobs } = require('./jobs');
const { INSERT } = require('@sap/cds/lib/ql/cds-ql');
const { getNotificationService } = require('./notifications/notificationService');
// const {getDestination} = require('@sap-cloud-sdk/core');

const SAP_DESCRIPTION_MAX_LENGTH = 40; // A_ProductDescription.ProductDescription is String(40)

/**
 * Encode a numeric/currency characteristic value for BAPI_OBJCL_CHANGE over RFC.
 * The @sap-rfc/node-rfc-library parses the numeric (ALLOCVALUESNUMNEW) and
 * currency (ALLOCVALUESCURRNEW) VALUE fields as doubles; its native parser
 * rejects JS numbers ("Expected ... String") and OVERFLOWS on strings with
 * trailing zeros or non-plain notation (e.g. "10.00", "20.00", "1500.0",
 * "1.5E3") before the call reaches SAP. String(Number(v)) produces the shortest
 * round-trip decimal ("10.00" -> "10", "20.50" -> "20.5"), which the library
 * accepts unchanged.
 *
 * Rejects invalid input (client error, HTTP 400) rather than letting a bad
 * value crash the native RFC parser: throws on null/undefined/blank and on
 * non-finite input. Every numeric/currency characteristic sent to SAP must
 * carry a real number.
 */
function toRfcFloat(value) {
    if (value === null || value === undefined || String(value).trim() === '') {
        throw Object.assign(new Error('Numeric characteristic value is empty.'), { code: 400 });
    }
    const n = Number(value);
    if (!Number.isFinite(n)) {
        throw Object.assign(new Error(`Numeric characteristic value is not a finite number: ${value}`), { code: 400 });
    }
    return String(n);
}

module.exports = cds.service.impl(async function() {
    initJobs(this);

    // Notification orchestrator (email + Microsoft Teams) — see srv/notifications/
    const notifier = await getNotificationService();
    this.notifier = notifier; // exposed for the cron jobs in jobs.js (N-7 / N-8)

    // --- SERVICE INITIALIZATION ---
    // Establish connections to remote S/4HANA OData services
    const plantService = await cds.connect.to('plant');
    const classService = await cds.connect.to('class');
    const characteristicService = await cds.connect.to('characteristic');
    const materialService = await cds.connect.to('material');
    const materialService2 = await cds.connect.to('material2');
    const vendorService = await cds.connect.to('vendor');
    const materialMasterBapiService = await cds.connect.to('materialMasterBAPI');
    const saveMaterialDataBapiService = await cds.connect.to('saveMaterialDataBAPI');
    
    const CHUNK_SIZE = 50; // Limit for batch processing to avoid URI length issues

    const { ReviewHierarchy, FormApprovalSteps, RequestForm, ApprovalFlow, 
        Plant, MaterialClass, ClassCharacteristic, Material, Material2, 
        MaterialGroup, Vendor, UnitOfMeasure, MaterialCreationValues} = this.entities;

    /**
     * Side Effect handler for Drafts.
     * Automatically fetches and updates the material description when a Product ID is entered.
     */
    this.before('PATCH', 'RequestForm.drafts', async (req) => {
        if ('sapMaterialNumber_Product' in req.data) {
            const { sapMaterialNumber_Product } = req.data;

            if (sapMaterialNumber_Product) {
                const material = await materialService2.run(
                    SELECT.one('I_Product')
                    .where({ Product: sapMaterialNumber_Product})
                );

                if (material) {
                    req.data.materialDescription = material.Product_Text;
                }
            } else {
                req.data.materialDescription = null;
            }
        }
    });

    this.before('PATCH', 'CatalogService.CharacteristicConfig.drafts', async (req) => {
        const { charcID_CharcInternalID } = req.data;

        if (charcID_CharcInternalID) {

            const charc = await characteristicService.run(
                SELECT.one('A_ClfnCharacteristicForKeyDate')
                .where({ CharcInternalID: charcID_CharcInternalID})
            );

            if (charc) {
                req.data.charcDesc = charc.Characteristic;
            }
        }
    });

    this.before('PATCH', 'CatalogService.ReviewHierarchy.drafts', async (req) => {
        const { plant_Plant } = req.data;

        if (plant_Plant) {

            const plant = await plantService.run(
                SELECT.one('A_Plant')
                .where({ Plant: plant_Plant})
            );

            if (plant) {
                req.data.PlantName = plant.PlantName;
            }
        }
    });

    this.before('PATCH', 'CatalogService.PlanningLead.drafts', async (req) => {
        if ('formType_code' in req.data && !req.data.formType_code) {
            req.data.formType_code = '*';
        }
        if ('plant_plant_Plant' in req.data && !req.data.plant_plant_Plant) {
            req.data.plant_plant_Plant = '*';
        }
    });

    this.before('SAVE', 'PlanningLead', async (req) => {
        const { type, formType_code, plant_plant_Plant } = req.data;

        if (type === 'BOM') {
            if (formType_code !== '*') {
                req.error({ status: 400, message: 'BOM planning leads must use * as the Request Type.', target: 'formType_code' });
            }
            if (plant_plant_Plant === '*') {
                req.error({ status: 400, message: 'BOM planning leads must be assigned to a specific plant, not *.', target: 'plant_plant_Plant' });
            }
        } else if (type === 'InfoRecord') {
            if (formType_code === '*') {
                req.error({ status: 400, message: 'InfoRecord planning leads must specify a form type (NewStock or NonStock), not *.', target: 'formType_code' });
            }
        }
    });

    // ----------- SAVE and EDIT logic -----------------------

    this.before('NEW', 'RequestForm.drafts', async (req) => {
        req.data.generalStatus = 'Draft';
        // Seed the numeric fields to 0 so their unit of measure renders from the start: UI5 (>= ~1.149)
        // only shows a static Measures.Unit/ISOCurrency once the field has a value.
        req.data.estDeliveryTime ??= 0;
        req.data.estCostPerUnit ??= 0;
    });

    this.before(['SAVE', 'EDIT'], 'RequestForm', async (req) => {
        const { data, user } = req;
        // On SAVE the ID usually comes in data, but on EDIT it comes in the URL params
        const ID = req.params?.[0]?.ID || data?.ID;

        if (!ID) return;

        if (req.event === 'CREATE' || req.event === 'UPDATE') {
            await this._validateMandatoryFields(data, req, ID);
            await this._validateHierarchyConfigured(data, req, ID);
        }

        const currentPersistedForm = await SELECT.one.from('RequestForm')
            .where({ ID: ID })
            .columns('generalStatus', 'plant_plant_Plant', 'formType_code');

        const status = currentPersistedForm?.generalStatus || null;

        // --- REQUESTOR BRANCH ---
        if (user.is('REQUESTOR')) {

            if (req.event === 'UPDATE' && status === 'Rejected') {
                // Resubmission: clear approval history and restart the cycle
                await DELETE.from('FormApprovalSteps').where({ parentForm_ID: ID });
                req.data.generalStatus = 'Submitted';
                req.data.rejectionComments = '';
                req.data.sapError = '';
            }
        } else {
            // --- REVIEWER BRANCH ---
            const userEmail = user.attr?.email || user.id;

            const plant = currentPersistedForm?.plant_plant_Plant || data?.plant_plant_Plant;
            const formTypeCode = currentPersistedForm?.formType_code || data?.formType_code;

            const stepCtx = await this._resolveApprovalStep(
                plant, formTypeCode, status, ID
            );

            // Flow is complete and no SAP_ERROR or Hierarchy is not configured for formType-Plant: no edits allowed
            if (!stepCtx) {
                return req.reject(403, `User ${userEmail} is not authorized to edit the form at this stage.`);
            }

            const { currentStepNumber, totalSteps, authorizedReviewers } = stepCtx;

            if (authorizedReviewers.length === 0) {
                return req.reject(403, `Approval configuration not found for plant ${plant}, type ${formTypeCode} and step ${currentStepNumber}.`);
            }

            const isAuthorized = authorizedReviewers.some(r => r.reviewer === userEmail);
            if (!isAuthorized) {
                return req.reject(403, `User ${userEmail} is not authorized to edit the form.`);
            }

            // Editing is only allowed at step 1, or at the last step when retrying after an SAP error
            const canEdit =
                currentStepNumber === 1 ||
                (currentStepNumber === totalSteps && status === 'SAP_ERROR');

            if (!canEdit) {
                return req.reject(403, `User ${userEmail} is not authorized to edit the form during step ${currentStepNumber}.`);
            }
        }
    });

    this._truncateDescription = (sText, iMax = SAP_DESCRIPTION_MAX_LENGTH) => {
        const sTrimmed = (sText ?? '').trim();
        if (sTrimmed.length <= iMax) return sTrimmed;

        const sCut = sTrimmed.slice(0, iMax);
        if (/[\s,;]/.test(sTrimmed[iMax])) return sCut.replace(/[\s,;]+$/, '');

        const sWordSafe = sCut.replace(/[^\s,;]+$/, ''); // a first word longer than the limit leaves nothing, so it is cut hard
        return (sWordSafe || sCut).replace(/[\s,;]+$/, '');
    };

    this._formatSapDescription = (sText) => this._truncateDescription(sText).toUpperCase();

    // Nulls out fields that don't belong to a form's request type, keeping the persisted request aligned with its type.
    this._cleanupRequestFormFields = (data) => {
        const type = data.formType_code;
        const isNewStock    = type === 'NewStock';
        const isNonStock    = type === 'NonStock';
        const isDeletion    = type === 'Deletion';
        const isSafetyStock = type === 'SafetyStock';
        const isNonToStock  = type === 'NonToStock';

        // Material-definition fields — only NewStock/NonStock define a material from scratch.
        if (!isNewStock && !isNonStock) {
            data.isResultOfMOC = null;
            data.mocNumber = null;
            data.equipmentNumber = null;
            data.chemicalApproval_code = null;
            data.isPartOfBOM = null;
            data.vendor_Supplier = null;
            data.vendorPartNumber = null;
            data.manufacturer = null;
            data.manufacturerPartNumber = null;
            data.materialClass_ClassInternalID = null;
            data.materialClassCharact = null;
            data.materialGroupNumber_ProductGroup = null;
            data.estCostPerUnit = null;
            data.unitOfMeasure_UnitOfMeasure = null;
            data.estDeliveryTime = null;
            data.minimumLotSize = null;
            data.attachments = [];
        }

        if (!isNewStock && !isNonStock && !isNonToStock) {
            data.isMdata48h = null;
        }

        if (!isNewStock && !isNonToStock) {
            data.justification = null;
            data.isRepairable = null;
            data.estRepairTime = null;
            data.maxQtyPerUse = null;
            data.specialStorageReq = null;
            data.isPreventativeMaintReq = null;
            data.willReqSupplyStock = null;
        }

        // Exclusive to NewStock.
        if (!isNewStock) {
            data.functionalLocation = null;
            data.estUsagePerYear = null;
        }

        if (!isNewStock && !isSafetyStock && !isNonToStock) {
            data.safetyStockReq = null;
        }

        // sapMaterialNumber references an EXISTING material — only Deletion/SafetyStock/NonToStock.
        if (!isSafetyStock && !isDeletion && !isNonToStock) {
            data.sapMaterialNumber_Product = null;
        }
    };

    // Runs on every RequestForm activation. SAVE fires for both create and edit
    this.before('SAVE', 'RequestForm', async (req) => {
        const { data } = req;
        if (data.formType_code == null) {
            const ID = req.params?.[0]?.ID || data?.ID;
            const persisted = ID && await SELECT.one.from(RequestForm).columns('formType_code').where({ ID });
            if (persisted) data.formType_code = persisted.formType_code;
        }
        if (data.formType_code == null) return;
        this._cleanupRequestFormFields(data);

        if (data.formType_code === 'NewStock' || data.formType_code === 'NonStock') {
            if (data.materialClassCharact) {
                const aChars = JSON.parse(data.materialClassCharact);
                if (Array.isArray(aChars)) {
                    const sDesc = aChars
                        .filter(c => c.dataType === 'CHAR')
                        .slice(0, 3)
                        .map(c => c.selectedValue || '')
                        .join(', ');
                    data.materialDescription = this._formatSapDescription(sDesc) || '*'; // formatted here, not at the SAP call, so approvers see the exact text SAP will store
                }
            }
        }
    });

    this.before('SAVE', 'MaterialCreationValues', async (req) => {
        const { data } = req;

        if (req.event === 'UPDATE') {
            const existingData = await SELECT.one.from(MaterialCreationValues).where({ ID: data.ID });
            if (existingData) {
                Object.assign(data, { ...existingData, ...data });
            }
        }

        const type = data.formType_code;
        const isNewStock = type === 'NewStock';
        const isNonStock = type === 'NonStock';

        // Full-create types (NewStock/NonStock) carry a complete SAP material profile.
        // NonToStock only extends an existing material, so it carries the reduced subset from the spec.
        const isFullCreate = isNewStock || isNonStock;

        // Fields only relevant to full-create types; blank for NonToStock.
        const fullCreateOnlyFields = ['industrySector', 'materialType', 'purchasingValueKey', 'grProcessingTime',
            'lotSizeProcedure', 'prodStorageLocation', 'schedMarginKey', 'safetyStock', 'availabilityCheck',
            'profitCenter', 'valuationClass', 'priceControl'];

        // Data cleanup: null out fields that don't belong to this request type
        if (!isNewStock) {                                              // cost thresholds apply to NewStock only
            data.costOperator = null;
            data.costThreshold = null;
        }
        if (isNonStock) {                                              // NonStock has no repairable filter
            data.repairableStatus = null;
        }
        if (!isFullCreate) {
            fullCreateOnlyFields.forEach(field => { data[field] = null; });
        }
        if (data.priceControl !== 'S') {                              // standard price only with price control 'S'
            data.standardPrice = null;
        }
        if (data.storageBin) data.storageBin = data.storageBin.toUpperCase(); // SAP stores the storage bin in uppercase

        // Required-field validation (per request type), run on the cleaned data
        const standardPriceRequired = data.priceControl === 'S';

        this._checkRequired(req, data, 'repairableStatus', !isNonStock);
        this._checkRequired(req, data, 'costOperator', isNewStock);
        this._checkRequired(req, data, 'costThreshold', isNewStock);
        fullCreateOnlyFields.forEach(field => this._checkRequired(req, data, field, isFullCreate));
        this._checkRequired(req, data, 'storageLocation', true);   // storage location applies to every material config row (incl. NonToStock)
        this._checkRequired(req, data, 'standardPrice', standardPriceRequired);

        if (!isNewStock) {
            const duplicate = await SELECT.one.from(MaterialCreationValues).where({
                ID: { '!=': data.ID },
                requestPlant_plant_Plant: data.requestPlant_plant_Plant,
                formType_code: data.formType_code,
                repairableStatus: data.repairableStatus ?? null,
                costOperator: data.costOperator ?? null,
                costThreshold: data.costThreshold ?? null,
            });
            if (duplicate) {
                req.error({
                    status: 400,
                    message: 'A configuration with the same filter values already exists.',
                });
            }
        }

    });

    // ----------- VALIDATION HELPER -----------------------

    this._checkRequired = (req, data, field, condition, message = 'Provide the missing value.') => {
        if (condition && (
            data[field] === undefined || 
            data[field] === null || 
            (typeof data[field] === 'string' && (data[field].trim() === '' || data[field].trim() === '[]')))) {
            req.error({
                status: 400,
                message: message,
                target: field
            });
        }
    };
    
    // Safety net for the plant value help: block activating a form whose plant + form type has no approval hierarchy.
    this._validateHierarchyConfigured = async (data, req, ID) => {
        let plant = data?.plant_plant_Plant;
        let formTypeCode = data?.formType_code;
        if (!plant || !formTypeCode) {
            const persisted = await SELECT.one.from('RequestForm').where({ ID }).columns('plant_plant_Plant', 'formType_code');
            plant ??= persisted?.plant_plant_Plant;
            formTypeCode ??= persisted?.formType_code;
        }
        // Missing plant / form type is already handled by the mandatory-field validation.
        if (!plant || !formTypeCode) return;

        const hierarchy = await SELECT.one.from(ReviewHierarchy)
            .where({ plant_Plant: plant, formType_code: formTypeCode }).columns('ID');
        if (!hierarchy) {
            req.error({
                status: 400,
                message: `No approval hierarchy is configured for plant ${plant} with request type ${formTypeCode}. This plant/request-type combination cannot be submitted — please select a different plant.`,
                target: 'plant_plant_Plant'
            });
        }
    };

    this._validateMandatoryFields = async (data, req, ID) => {
        const type = data.formType_code;

        const isNewStock    = type === 'NewStock';
        const isNonStock    = type === 'NonStock';
        const isDeletion    = type === 'Deletion';
        const isSafetyStock = type === 'SafetyStock';
        const isNonToStock  = type === 'NonToStock';

        const isNewOrNonStock = isNewStock || isNonStock;

        const userEmail = req.user.attr?.email || req.user.id;
        let isProcurementApproval = false;
        if (req.user.is('REVIEWER') && ID) {
            const turnInfo = await this._getUserTurnInfo(ID, userEmail);
            isProcurementApproval = turnInfo.editable;
        }

        // General Fields
        this._checkRequired(req, data, 'plant_plant_Plant', true);
        
        // NewStock & NonStock
        this._checkRequired(req, data, 'isMdata48h', isNewOrNonStock || isNonToStock);
        this._checkRequired(req, data, 'isResultOfMOC', isNewOrNonStock);
        this._checkRequired(req, data, 'mocNumber', data.isResultOfMOC && isNewOrNonStock); 
        this._checkRequired(req, data, 'functionalLocation', isNewStock);
        this._checkRequired(req, data, 'equipmentNumber', isNewOrNonStock);
        this._checkRequired(req, data, 'chemicalApproval_code', isNewOrNonStock);
        this._checkRequired(req, data, 'isPartOfBOM', isNewOrNonStock);
        this._checkRequired(req, data, 'justification', isNewStock || isNonToStock);
        this._checkRequired(req, data, 'vendor_Supplier', isNewOrNonStock);
        this._checkRequired(req, data, 'vendorPartNumber', isNewOrNonStock);
        this._checkRequired(req, data, 'manufacturer', isNewOrNonStock);
        this._checkRequired(req, data, 'manufacturerPartNumber', isNewOrNonStock);
        
        if (isNewOrNonStock && ID) {
            const [activeForm, draftForm] = await Promise.all([
                SELECT.one.from(RequestForm)
                    .where({ ID })
                    .columns(f => f.attachments(a => a.ID)),
                SELECT.one.from(RequestForm.drafts)
                    .where({ ID })
                    .columns(f => f.attachments(a => a.ID))
            ]);

            const hasAttachment =
                (activeForm?.attachments?.length > 0) ||
                (draftForm?.attachments?.length > 0);

            if (!hasAttachment) {
                req.error({
                    status: 400,
                    message: 'At least one attachment is required.',
                    target: 'attachments'
                });
            }
        }

        this._checkRequired(req, data, 'materialClass_ClassInternalID', isNewOrNonStock); 
        this._checkRequired(req, data, 'materialGroupNumber_ProductGroup', isProcurementApproval && isNewOrNonStock);
        this._checkRequired(req, data, 'estCostPerUnit', isNewOrNonStock);
        this._checkRequired(req, data, 'unitOfMeasure_UnitOfMeasure', isProcurementApproval && isNewOrNonStock);
        this._checkRequired(req, data, 'estUsagePerYear', isNewStock);
        this._checkRequired(req, data, 'estDeliveryTime', isNewOrNonStock);
        this._checkRequired(req, data, 'isRepairable', isNewStock || isNonToStock);
        this._checkRequired(req, data, 'estRepairTime', data.isRepairable && (isNewStock || isNonToStock));
        this._checkRequired(req, data, 'maxQtyPerUse', isNewStock || isNonToStock);
        this._checkRequired(req, data, 'safetyStockReq', isNewStock || isSafetyStock || isNonToStock);
        this._checkRequired(req, data, 'specialStorageReq', isNewStock || isNonToStock);
        this._checkRequired(req, data, 'isPreventativeMaintReq', isNewStock || isNonToStock);
        this._checkRequired(req, data, 'willReqSupplyStock', isNewStock || isNonToStock);
        this._checkRequired(req, data, 'minimumLotSize', isProcurementApproval && isNewOrNonStock);

        // Deletion & SafetyStock & NonToStock (all reference an existing material)
        this._checkRequired(req, data, 'sapMaterialNumber_Product', isSafetyStock || isDeletion || isNonToStock);
    };

    // ----------- APPROVE and REJECT logic -----------------------

    this.on('approveRequest', 'RequestForm', async (req) => {

        const { user } = req;
        const ID = req.params[0].ID;

        const form = await SELECT.one.from('RequestForm')
            .where({ ID: ID });

        const userEmail = user.attr?.email || user.id;
        const { editable } = await this._getUserTurnInfo(ID, userEmail);
        if (editable) {
            await this._validateMandatoryFields(form, req, ID);
            if (req.errors?.length) return; // block approval while required fields are missing
        }

        await this._manageRequestForm(form, 'APPROVED', user, req);

    });

    this.on('rejectRequest', 'RequestForm', async (req) => {
        const { user } = req;
        const ID = req.params[0].ID;
        const { comments } = req.data;

        const form = await SELECT.one.from('RequestForm')
            .where({ ID: ID });

        await this._manageRequestForm(form, 'REJECTED', user, req, comments);
    });

    this._manageRequestForm = async (data, decision, user, req, comments) => {

        if (data?.generalStatus === 'Rejected') {
            return req.reject(403, `Form ${data.formNumber} was previously rejected. No further actions allowed except for the requestor to edit and resubmit.`);
        }

        const stepCtx = await this._resolveApprovalStep(
            data.plant_plant_Plant, data.formType_code, data.generalStatus, data.ID
        );

        const userEmail = user.attr?.email || user.id;

        if (!stepCtx) {
            return req.reject(403, `User ${userEmail} is not authorized to edit the form at this stage.`);
        }

        const { currentStepNumber, totalSteps, authorizedReviewers } = stepCtx;

        if (authorizedReviewers.length === 0) {
            return req.reject(403, `Approval configuration not found for plant ${data.plant_plant_Plant}, type ${data.formType_code} and step ${currentStepNumber}.`);
        }

        if (!authorizedReviewers.some(r => r.reviewer === userEmail)) {
            return req.reject(403, `User ${userEmail} is not authorized to perform the approval for step ${currentStepNumber}.`);
        }

        await INSERT.into('FormApprovalSteps').entries({
            parentForm_ID: data.ID,
            step: currentStepNumber,
            status: decision,
            reviewedBy: userEmail,
            reviewedAt: new Date().toISOString()
        });

        if (decision === 'REJECTED') {
            const updateData = { generalStatus: 'Rejected' };
            if (comments) {
                updateData.rejectionComments = comments;
                data.rejectionComments = comments; // keep in-memory copy in sync so N-4 shows the reason
            }

            await UPDATE('RequestForm').set(updateData).where({ ID: data.ID });
            await this._handleRejectionNotifications(data, currentStepNumber);

        } else if (decision === 'APPROVED') {
            if (currentStepNumber === totalSteps) {
                await UPDATE('RequestForm').set({ generalStatus: 'Approved', sapError: '' }).where({ ID: data.ID });
                const sapImpactSuccess = await this._handleSAPImpact(data, req);

                if (sapImpactSuccess) {
                    await this._handleFinalApprovalNotification(data);
                } else {
                    await this._handleSAPErrorNotification(data, userEmail);
                }
            } else {
                await UPDATE('RequestForm').set({ generalStatus: 'Partially Approved' }).where({ ID: data.ID });
                const envVar = `NOTIFY_${data.formType_code.toUpperCase()}`;
                if (process.env[envVar] && process.env[envVar].toUpperCase() === 'TRUE') { 
                    await this._handlePendingActionNotification(data, currentStepNumber);
                }
            }
        }
    };

    // TO DO
    // --- Notification Stubs (Implement later) ---

    this._requestorNotification = async (formData) => {
        if (formData.requestorEmail) {
            console.log(`[Notification] Notifying Requestor ${formData.requestorEmail}: Form ${formData.formNumber} successfully submitted.`);
            await notifier.submitted(formData); // N-1
        }
    };

    this._handleFinalApprovalNotification = async (formData) => {
        console.log(`[Notification] Form ${formData.ID} FULLY approved.`);

        // Re-read so we pick up values written during SAP processing (material number, description).
        const form = await SELECT.one.from('RequestForm').where({ ID: formData.ID });

        // N-5 · requestor + every reviewer in the hierarchy (form is fully approved → all steps passed),
        // not only the ones who actioned.
        const reviewers = await SELECT.from(ReviewHierarchy)
            .where({ plant_Plant: form.plant_plant_Plant, formType_code: form.formType_code })
            .columns('reviewer');
        const recipients = [...new Set(
            [form.requestorEmail, ...reviewers.map(r => r.reviewer)].filter(Boolean).map(e => e.toLowerCase())
        )];
        if (recipients.length) {
            await notifier.finalApproved(form, recipients);
        }

        // N-9 / N-10 · planner notifications (NewStock / NonStock only)
        await this._handleInfoRecordBOMNotifications(form);
    };

    this._handleSAPErrorNotification = async (formData, finalApproverEmail) => {
        console.log(`[Notification] Form ${formData.ID} encountered a SAP error.`);

        // Re-read to pick up the sapError detail written during SAP processing.
        const form = await SELECT.one.from('RequestForm').where({ ID: formData.ID });

        // N-6 · the reviewer who performed the final approval
        if (finalApproverEmail) {
            await notifier.sapError(form, finalApproverEmail);
        }
    };

    this._handlePendingActionNotification = async (formData, currentStepNumber) => {
        const nextStepNumber = currentStepNumber + 1;

        const formWithHierarchy = await SELECT.one.from('RequestForm')
            .where({ ID: formData.ID })
            .columns(f => {
                f.toReviewHierarchy(rh => {
                    rh.reviewer,
                    rh.step
                })
            });

        const nextReviewers = formWithHierarchy?.toReviewHierarchy?.filter(r => r.step === nextStepNumber) || [];
        const nextReviewersEmails = [...new Set(nextReviewers.map(r => r.reviewer).filter(Boolean).map(e => e.toLowerCase()))];

        // N-2 (initial submission, currentStepNumber === 0) / N-3 (subsequent steps)
        if (nextReviewersEmails.length) {
            await notifier.pendingAction(formData, nextReviewersEmails, {
                currentStep: currentStepNumber,
                nextStep: nextStepNumber,
            });
        }
    };

    this._handleRejectionNotifications = async (formData, currentStepNumber) => {
        console.log(`[Notification] Form ${formData.ID} REJECTED.`);

        // N-4 · requestor + every reviewer whose step has already been reached
        const reviewers = await SELECT.from(ReviewHierarchy)
            .where({
                plant_Plant: formData.plant_plant_Plant,
                formType_code: formData.formType_code,
                step: { '<=': currentStepNumber }
            })
            .columns('reviewer');
        const recipients = [...new Set(
            [formData.requestorEmail, ...reviewers.map(r => r.reviewer)].filter(Boolean).map(e => e.toLowerCase())
        )];

        if (recipients.length) {
            await notifier.rejected(formData, recipients, {
                currentStep: currentStepNumber,
                rejectionComments: formData.rejectionComments,
            });
        }
    };

    this._handleInfoRecordBOMNotifications = async (formData) => {

        const { PlanningLead } = this.entities;

        // N-9 · If the material is part of a BOM, notify the responsible BOM planner.
        if (['NewStock', 'NonStock'].includes(formData.formType_code)) {    
            if (formData.isPartOfBOM) {
                const bomPlanner = await SELECT.one.from(PlanningLead).where({
                    type: 'BOM',
                    plant_plant_Plant: formData.plant_plant_Plant
                }).columns('email', 'name');

                if (bomPlanner && bomPlanner.email) {
                    console.log(`[Notification] Notifying BOM Planner ${bomPlanner.name} (${bomPlanner.email}) for new material in plant ${formData.plant_plant_Plant}.`);
                    await notifier.bomPlanner(formData, bomPlanner.email);
                }
            }
        }

        // N-10 · Notify InfoRecord planners (specific plant or wildcard '*')
        const infoRecordPlanners = await SELECT.from(PlanningLead)
            .columns('email', 'name')
            .where({
                type: 'InfoRecord',
                formType_code: formData.formType_code,
                plant_plant_Plant: { in: [ formData.plant_plant_Plant, '*' ] }
            });

        if (infoRecordPlanners && infoRecordPlanners.length > 0) {
            infoRecordPlanners.forEach(planner => {
                console.log(`[Notification] Notifying InfoRecord Planner ${planner.name} (${planner.email}) for new material in plant ${formData.plant_plant_Plant}.`);
            });
            const emails = [...new Set(infoRecordPlanners.map(p => p.email).filter(Boolean).map(e => e.toLowerCase()))];
            if (emails.length) {
                await notifier.infoRecordPlanner(formData, emails);
            }
        }
    };
    
    // ------ FORM NUMBER GENERATION (CREATE) ------------

    this.before('CREATE', 'RequestForm', async (req) => {

        try {
            const type = req.data.formType_code;

            const config = {
                'NewStock': 'NW',
                'NonStock': 'NN',
                'NonToStock': 'NS',
                'SafetyStock': 'SS',
                'Deletion': 'DL'
            };
            const prefix = config[type] || 'REQ';

            const lastRecord = await SELECT.one.from(RequestForm)
                .where({ formType_code: type })
                .orderBy('length(formNumber) desc', 'formNumber desc');

            let nextSeq = 1;
            if (lastRecord && lastRecord.formNumber) {
                const parts = lastRecord.formNumber.split('-');
                if (parts.length > 1) {
                    const lastNum = parseInt(parts[1]);
                    if (!isNaN(lastNum)) nextSeq = lastNum + 1;
                }
            }

            // Pad to a minimum of 4 digits; values >= 10000 keep their full width
            req.data.formNumber = `${prefix}-${nextSeq.toString().padStart(4, '0')}`;

            // Audit metadata: set requestor info from the authenticated session
            const { givenName, familyName, email } = req.user.attr || {};
            req.data.requestorEmail = email || req.user.id;
            req.data.requestorName = (givenName && familyName) 
                ? `${givenName} ${familyName}` 
                : req.data.requestorEmail;

            // Set initial status
            req.data.generalStatus = "Submitted"

        } catch (err) {
            console.error(">>> ERROR GENERATING NUMBER:", err);
            req.error(500, `Technical error while generating number: ${err.message}`);
        }
    });

    this.after('CREATE', 'RequestForm', async (req) => {

        const envVar = `NOTIFY_${req.formType_code.toUpperCase()}`;
        if (process.env[envVar] && process.env[envVar].toUpperCase() === 'TRUE') {
            await this._handlePendingActionNotification(req, 0);
        }
        await this._requestorNotification(req);
    });

    // ------ DATA ENRICHMENT (RequestForm) ------------------

    this.on('READ', RequestForm, async (req, next) => {
        if (req.user.is('REVIEWER')) {
            let actionFilterActive = false;

            if (req.query.SELECT.where) {
                const whereClause = req.query.SELECT.where;
                
                const filterIndex = whereClause.findIndex(w => w.ref && w.ref[0] === 'actionRequiredOnly');

                if (filterIndex !== -1) {
                    actionFilterActive = whereClause[filterIndex + 2]?.val === true;

                    // Safely neutralize the filter
                    whereClause[filterIndex] = { val: '1' };
                    whereClause[filterIndex + 1] = '=';
                    whereClause[filterIndex + 2] = { val: '1' };
                }
            }

            if (actionFilterActive) {
                const userEmail = req.user.attr?.email || req.user.id;
                
                if (!req.query.SELECT.from.as) {
                    req.query.SELECT.from.as = 'RF';
                }
                const rootAlias = req.query.SELECT.from.as;

                req.query.where(`
                    ${rootAlias}.generalStatus != 'Approved' 
                    AND ${rootAlias}.generalStatus != 'Rejected'
                    AND EXISTS (
                        SELECT rh.ID FROM my.MaterialMasterData.ReviewHierarchy AS rh
                        WHERE rh.reviewer = '${userEmail}'
                            AND rh.plant_Plant = ${rootAlias}.plant_plant_Plant
                            AND rh.formType_code = ${rootAlias}.formType_code
                            AND rh.step = (
                                SELECT CASE 
                                    WHEN ${rootAlias}.generalStatus = 'SAP_ERROR' THEN MAX(fas.step)
                                    ELSE COALESCE(MAX(fas.step), 0) + 1
                                END AS nextStep
                                FROM my.MaterialMasterData.FormApprovalSteps AS fas
                                WHERE fas.parentForm_ID = ${rootAlias}.ID
                            )
                    )
                `);
            }
        }
        
        return next(); 
    });

    this.after('READ', 'RequestForm', async (data, req) => {
        const forms = Array.isArray(data) ? data : [data];
        if (forms.length === 0) return;

        const isSingleRequest =
            req.query.SELECT.one ||
            req.query.SELECT.where?.some(w => w.ref?.[0] === 'ID');

        // VISIBILITY FLAGS (single request only)
        if (isSingleRequest) {
            await this._applyVisibilityFlags(forms[0], req);
        }

        // EXTERNAL DATA EXPANSION

        // Determine which virtual/external associations were requested in the OData query ($expand)
        const requestedExpands = req.query.SELECT.columns?.filter(col => col.expand).map(col => col.ref[0]) || [];

        const isClassRequested = requestedExpands.includes('materialClass');
        const isVendorRequested = requestedExpands.includes('vendor');
        const isMaterialGropuRequested = requestedExpands.includes('materialGroupNumber');
        const isUnitMeasureRequested = requestedExpands.includes('unitOfMeasure');

        const promises = [];

        if (!isSingleRequest) {

            // --- CASE A: MULTIPLE FORMS (LIST REPORT) ---
            if (isClassRequested) {
                const classIds = [...new Set(forms.map(f => f.materialClass_ClassInternalID).filter(id => id))];
                if (classIds.length > 0) {
                    const fetchClassesInChunks = async () => {
                        const chunks = chunkArray(classIds, CHUNK_SIZE);
                        let allResults = [];
                        for (const chunk of chunks) {
                            const res = await classService.run(SELECT.from('A_ClfnClassForKeyDate').where({ ClassInternalID: { in: chunk } }).columns(['ClassInternalID', 'Class']));
                            allResults = allResults.concat(res);
                        }
                        return { type: 'class', results: allResults, error: false };
                    };
                    promises.push(fetchClassesInChunks());
                }
            }

            if (isVendorRequested) {
                const vendorIds = [...new Set(forms.map(f => f.vendor_Supplier).filter(id => id))];
                if (vendorIds.length > 0) {
                    const fetchVendorsInChunks = async () => {
                        const chunks = chunkArray(vendorIds, CHUNK_SIZE);
                        let allResults = [];
                        for (const chunk of chunks) {
                            const res = await vendorService.run(SELECT.from('A_Supplier').where({ Supplier: { in: chunk } }).columns(['Supplier', 'SupplierName']));
                            allResults = allResults.concat(res);
                        }
                        return { type: 'vendor', results: allResults, error: false };
                    };
                    promises.push(fetchVendorsInChunks());
                }
            }
        } else {
            
            // --- CASE B: SINGLE FORM (OBJECT PAGE) ---
            const form = forms[0];

            if (isClassRequested && form.materialClass_ClassInternalID) {
                promises.push((async () => {
                    const res = await classService.run(
                        SELECT.one.from('A_ClfnClassForKeyDate')
                            .where({ ClassInternalID: form.materialClass_ClassInternalID })
                            .columns(['ClassInternalID', 'Class'])
                    );
                    return { 
                        type: 'class', 
                        results: res ? [res] : [], 
                        error: false 
                    };
                })());
            }

            if (isVendorRequested && form.vendor_Supplier) {
                promises.push((async () => {
                    const res = await vendorService.run(
                        SELECT.one.from('A_Supplier')
                            .where({ Supplier: form.vendor_Supplier })
                            .columns(['Supplier', 'SupplierName'])
                    );
                    return { 
                        type: 'vendor', 
                        results: res ? [res] : [], 
                        error: false 
                    };
                })());
            }

            if (isMaterialGropuRequested && form.materialGroupNumber_ProductGroup) {
                promises.push((async () => {
                    const res = await materialService2.run(
                        SELECT.one.from('I_ProductGroup_2')
                            .where({ ProductGroup: form.materialGroupNumber_ProductGroup })
                            .columns(['ProductGroup', 'ProductGroup_Text'])
                    );
                    return { 
                        type: 'materialGroupNumber', 
                        results: res ? [res] : [], 
                        error: false 
                    };
                })());
            }

            if (isUnitMeasureRequested && form.unitOfMeasure_UnitOfMeasure) {
                promises.push((async () => {
                    const res = await materialService2.run(
                        SELECT.one.from('I_UnitOfMeasure')
                            .where({ UnitOfMeasure: form.unitOfMeasure_UnitOfMeasure })
                            .columns(['UnitOfMeasure', 'UnitOfMeasure_Text'])
                    );
                    return { 
                        type: 'unitOfMeasure', 
                        results: res ? [res] : [], 
                        error: false 
                    };
                })());
            }
        }

        // --- EXECUTION AND DATA MAPPING ---
        const allExternalData = await Promise.all(promises);

        allExternalData.forEach(extRes => {
            // Logic to re-attach external results back to the main entity response
            if (extRes.type === 'class') {
                forms.forEach(form => {
                    const match = extRes.results.find(c => c.ClassInternalID === form.materialClass_ClassInternalID);
                    if (match) form.materialClass = match;
                });
            } else if (extRes.type === 'vendor') {
                forms.forEach(form => {
                    const match = extRes.results.find(v => v.Supplier === form.vendor_Supplier);
                    if (match) form.vendor = match;
                });
            } else if (extRes.type === 'materialGroupNumber') {
                forms.forEach(form => {
                    const match = extRes.results.find(v => v.ProductGroup === form.materialGroupNumber_ProductGroup);
                    if (match) form.materialGroupNumber = match;
                });
            } else if (extRes.type === 'unitOfMeasure') {
                forms.forEach(form => {
                    const match = extRes.results.find(v => v.UnitOfMeasure === form.unitOfMeasure_UnitOfMeasure);
                    if (match) form.unitOfMeasure = match;
                });
            }
        });
    });

    this.after('READ', 'RequestForm.drafts', async (data, req) => {
        const forms = Array.isArray(data) ? data : [data];
        for (const form of forms) {
            if (form?.ID) await this._applyVisibilityFlags(form, req);
        }
    });

    this._applyVisibilityFlags = async (form, req) => {
        const userEmail = req.user.attr?.email || req.user.id;

        // A user may hold BOTH the REVIEWER and REQUESTOR roles
        const isReviewer  = req.user.is('REVIEWER');
        const isRequestor = req.user.is('REQUESTOR');

        const active = await SELECT.one.from('RequestForm').where({
            ID: form.ID
        }).columns('generalStatus', 'requestorEmail');
        const generalStatus = active?.generalStatus;

        let reviewPending  = false;
        let reviewEditable = false;

        if (isReviewer) {
            const turnInfo = await this._getUserTurnInfo(form.ID, userEmail);

            let alreadyActionedThisStep = false;
            if (turnInfo.currentStepNumber) {
                const action = await SELECT.one.from('FormApprovalSteps').where({
                    parentForm_ID: form.ID,
                    reviewedBy: userEmail,
                    step: turnInfo.currentStepNumber
                });
                alreadyActionedThisStep = !!action && generalStatus !== 'SAP_ERROR';
            }

            reviewPending  = turnInfo.isUserTurn && !alreadyActionedThisStep;
            reviewEditable = turnInfo.editable;
        }

        // The requestor may edit/resubmit their OWN form while it is awaiting
        // submission or has been rejected.
        const requestorEditable =
            isRequestor &&
            active?.requestorEmail === userEmail &&
            ['Submitted', 'Rejected'].includes(generalStatus);

        form.isReviewPending   = reviewPending;
        form.isFormEditable    = reviewEditable || requestorEditable;
        form.areFieldsEditable = reviewEditable;
    };

    this.after('EDIT', 'RequestForm', async (form, req) => {
        if (!form) return;
        await this._applyVisibilityFlags(form, req);
    });

    // ------ APPROVAL FLOW VIRTUAL ENTITY ---------------------
    /**
     * Custom handler for READ on ApprovalFlow.
     * This logic dynamically merges the theoretical hierarchy with actual execution steps.
     */
    this.on('READ', ApprovalFlow, async (req) => {

        const formID = req.query.SELECT.where?.find(x => x.ref?.includes('parentFormID'))?.val 
                        || req.params[0]?.ID;
        
        if (!formID) return [];

        // Fetch document context: Approval paths depend on the specific Plant and Form Type
        const formDoc = await SELECT.one.from(RequestForm, formID)
            .columns('plant_plant_Plant', 'formType_code');

        if (!formDoc) return [];

        // Fetch steps that have already been processed (Approved/Rejected)
        const doneSteps = await SELECT.from(FormApprovalSteps)
            .where({ parentForm_ID: formID })
            .orderBy('reviewedAt desc');

        // Fetch the master approval hierarchy configuration for this context
        const hierarchy = await SELECT.from(ReviewHierarchy)
            .where({ formType_code: formDoc.formType_code }) 
            .and(`plant_Plant = '${formDoc.plant_plant_Plant}'`) 
            .orderBy('step asc');

        // Group potential reviewers by step number
        const stepsMap = new Map();

        hierarchy.forEach(h => {
            if (!stepsMap.has(h.step)) {
                stepsMap.set(h.step, { 
                    step: h.step,
                    approvers: [] 
                });
            }

            stepsMap.get(h.step).approvers.push({
                id: h.ID,        // ReviewHierarchy PK — unique even when the same reviewer repeats on a step
                mail: h.reviewer,
            });
        });

        let formWasRejected = false; // Flag to stop the flow visualization if a rejection occurred

        const result = Array.from(stepsMap.values()).flatMap(hStep => {
    
            // Check if ANY reviewer has already acted on this specific step
            const executed = doneSteps.find(ds => ds.step === hStep.step);

            if (executed) {
                // If the step resulted in rejection, all subsequent steps will be affected
                if (executed.status === 'REJECTED') {
                    formWasRejected = true;
                }

                // STEP RESOLVED: Return only the final decision record
                return [{
                    ID: executed.ID,
                    parentFormID: formID,
                    step: hStep.step,
                    reviewer: executed.reviewedBy, 
                    status: executed.status,
                    reviewedAt: executed.reviewedAt
                }];
            } else {
                // STEP PENDING: If a previous step was rejected, mark future steps as inactive ('-')
                const currentStatus = formWasRejected ? '-' : 'PENDING';

                // MULTI-CANDIDATE VIEW: Return all potential reviewers for this pending step
                return hStep.approvers.map(reviewer => ({
                    ID: reviewer.id, // stable + unique: the ReviewHierarchy row's own PK
                    parentFormID: formID,
                    step: hStep.step,
                    reviewer: reviewer.mail,
                    status: currentStatus,
                    reviewedAt: null
                }));

            }
        });

        const sel = req.query.SELECT || {};
        const skip = sel.limit?.offset?.val ?? 0;
        const top = sel.limit?.rows?.val;
        const page = top != null ? result.slice(skip, skip + top) : (skip ? result.slice(skip) : result);
        page.$count = result.length;
        return page;
    });

    // ------ EXTERNAL SERVICES -----------------
    
    /**
     * Handler for Plant entity. 
     * Proxies the request to the remote S/4HANA Plant service with search support.
     */
    this.on('READ', Plant, async (req) => {
        const sSearch = req.query.SELECT.search?.[0].val; 
        const sFilter = req.query.SELECT.where;

        const query = {
            SELECT: {
                from: { ref: ['A_Plant'] },
                columns: [
                    { ref: ['Plant'] },
                    { ref: ['PlantName'] }
                ]
            }
        };

        let searchFilter = null;
        if (sSearch !== undefined && sSearch !== null) {
            // Map Fiori's $search to 'contains' functions for the remote service
            searchFilter = [
                '(',
                { 
                    func: 'contains', 
                    args: [{ ref: ['Plant'] }, { val: sSearch }] 
                },
                'or',
                { 
                    func: 'contains', 
                    args: [{ ref: ['PlantName'] }, { val: sSearch }] 
                },
                ')'
            ];
            
            delete req.query.SELECT.search;
            query.SELECT.where = searchFilter;

        } else if (sFilter) {
            query.SELECT.where = sFilter;
        }

        // Apply Fiori Elements pagination ($top/$skip) to the remote query
        if (req.query.SELECT.limit) {
            query.SELECT.limit = req.query.SELECT.limit;
        }

        return await plantService.tx(req).run(query);
    });

    /**
     * Handler for MaterialClass entity.
     * Filters by a specific Class Type (001) and handles dynamic search.
     */
    this.on('READ', MaterialClass, async (req) => {
        const classTypeFilter = process.env.MATERIAL_CLASS_TYPE || '001';
        const sSearch = req.query.SELECT.search?.[0].val; 
        const sFilter = req.query.SELECT.where;

        const myFilter = [{ ref: ['ClassType'] }, '=', { val: classTypeFilter }];

        let searchFilter = null;
        if (sSearch !== undefined && sSearch !== null) {
            searchFilter = [
                '(',
                { 
                    func: 'contains', 
                    args: [{ ref: ['Class'] }, { val: sSearch }] 
                },
                'or',
                { 
                    func: 'contains', 
                    args: [{ ref: ['ClassInternalID'] }, { val: sSearch }] 
                },
                ')'
            ];
            delete req.query.SELECT.search;
        }

        let combinedWhere = [...myFilter];

        // Merge base criteria with OData filters and search terms
        if (sFilter) {
            combinedWhere = ['(', ...combinedWhere, ')', 'and', '(', ...sFilter, ')'];
        }
        if (searchFilter) {
            combinedWhere = ['(', ...combinedWhere, ')', 'and', ...searchFilter];
        }

        const query = {
            SELECT: {
                from: { ref: ['A_ClfnClassForKeyDate'] },
                columns: [
                    { ref: ['ClassInternalID'] },
                    { ref: ['ClassType'] }, 
                    { ref: ['Class'] }
                ],
                where: combinedWhere
            }
        };

        if (req.query.SELECT.limit) {
            query.SELECT.limit = req.query.SELECT.limit;
        }

        return await classService.tx(req).run(query);
    });
    
    /**
     * Handler for ClassCharacteristic.
     * Fetches metadata for specific characteristics from the remote catalog.
     */
    this.on('READ', ClassCharacteristic, async (req) => {
        const sSearch = req.query.SELECT.search?.[0].val; 
        const sFilter = req.query.SELECT.where;

        const query = {
            SELECT: {
                from: { ref: ['A_ClfnCharacteristicForKeyDate'] },
                columns: [
                    { ref: ['CharcInternalID'] },
                    { ref: ['Characteristic'] }
                ]
            }
        };

        let searchFilter = null;
        if (sSearch !== undefined && sSearch !== null) {
            searchFilter = [
                '(',
                { 
                    func: 'contains', 
                    args: [{ ref: ['CharcInternalID'] }, { val: sSearch }] 
                },
                'or',
                { 
                    func: 'contains', 
                    args: [{ ref: ['Characteristic'] }, { val: sSearch }] 
                },
                ')'
            ];
            delete req.query.SELECT.search;
            query.SELECT.where = searchFilter;
        } else if (sFilter) {
            query.SELECT.where = sFilter;
        }

        if (req.query.SELECT.limit) {
            query.SELECT.limit = req.query.SELECT.limit;
        }

        return await characteristicService.tx(req).run(query);
    });

    this.on('READ', Material2, async (req) => {
        const materialTypeFilter = process.env.MATERIAL_TYPE || 'ERSA';
        const sSearch = req.query.SELECT.search?.[0].val;
        const sFilter = req.query.SELECT.where;

        // base filter 
        const myFilter = [{ ref: ['ProductType'] }, '=', { val: materialTypeFilter }];

        // dynamic filter
        let searchFilter = null;
        if (sSearch !== undefined && sSearch !== null) {

            searchFilter = [
                '(',
                    { 
                        func: 'contains', 
                        args: [{ ref: ['Product'] }, { val: sSearch }] 
                    },
                    'or',
                    { 
                        func: 'contains', 
                        args: [{ ref: ['Product_Text'] }, { val: sSearch }] 
                    },
                ')'
            ];
            
            delete req.query.SELECT.search;
        }

        let combinedWhere = [...myFilter];

        // final comparison filter
        if (sFilter) {
            combinedWhere = ['(', ...combinedWhere, ')', 'and', '(', ...sFilter, ')'];
        }

        if (searchFilter) {
            combinedWhere = ['(', ...combinedWhere, ')', 'and', ...searchFilter];
        }

        const query = {
            SELECT: {
                from: { ref: ['I_Product'] },
                columns: [
                    { ref: ['Product'] },
                    { ref: ['ProductType'] }, 
                    { ref: ['Product_Text'] }
                ],
                where: combinedWhere
            }
        };

        // keep pagination if Fiori requests it ($top / $skip)
        if (req.query.SELECT.limit) {
            query.SELECT.limit = req.query.SELECT.limit;
        }

        return await materialService2.tx(req).run(query);
    });

    /**
     * Handler for MaterialGroup.
     * Excludes certain internal Product Groups (starting with 'P' or numbers) based on business rules.
     */
    this.on('READ', MaterialGroup, async (req) => {
        const sSearch = req.query.SELECT.search?.[0].val; 
        const sFilter = req.query.SELECT.where;

        // Define exclusion criteria for specific groups
        let myFilter = [
            {
                func: 'not',
                args: [{
                    func: 'startswith',
                    args: [{ ref: ['ProductGroup'] }, { val: 'P' }]
                }]
            }
        ];

        // Iteratively exclude groups starting with digits 0-9
        for (let i = 0; i <= 9; i++) {
            myFilter.push('and', {
                func: 'not',
                args: [{
                    func: 'startswith',
                    args: [{ ref: ['ProductGroup'] }, { val: `${i}` }]
                }]
            });
        }

        let searchFilter = null;
        if (sSearch !== undefined && sSearch !== null) {
            searchFilter = [
                '(',
                { 
                    func: 'contains', 
                    args: [{ ref: ['ProductGroup'] }, { val: sSearch }] 
                },
                'or',
                { 
                    func: 'contains', 
                    args: [{ ref: ['ProductGroup_Text'] }, { val: sSearch }] 
                },
                ')'
            ];
            delete req.query.SELECT.search;
        }

        let combinedWhere = [...myFilter];

        if (sFilter) {
            combinedWhere = ['(', ...combinedWhere, ')', 'and', '(', ...sFilter, ')'];
        }

        if (searchFilter) {
            combinedWhere = ['(', ...combinedWhere, ')', 'and', ...searchFilter];
        }

        const query = {
            SELECT: {
                from: { ref: ['I_ProductGroup_2'] },
                where: combinedWhere 
            }
        };

        if (req.query.SELECT.limit) {
            query.SELECT.limit = req.query.SELECT.limit;
        }

        return await materialService2.tx(req).run(query);
    });

    /**
     * Handler for UnitOfMeasure.
     * Proxies requests to the remote UOM master data service.
     */
    this.on('READ', UnitOfMeasure, async (req) => {
        const sSearch = req.query.SELECT.search?.[0].val; 
        const sFilter = req.query.SELECT.where;

        const query = {
            SELECT: {
                from: { ref: ['I_UnitOfMeasure'] },
                columns: [
                    { ref: ['UnitOfMeasure'] },
                    { ref: ['UnitOfMeasure_Text'] }
                ]
            }
        };

        let searchFilter = null;
        if (sSearch !== undefined && sSearch !== null) {
            searchFilter = [
                '(',
                { 
                    func: 'contains', 
                    args: [{ ref: ['UnitOfMeasure'] }, { val: sSearch }] 
                },
                'or',
                { 
                    func: 'contains', 
                    args: [{ ref: ['UnitOfMeasure_Text'] }, { val: sSearch }] 
                },
                ')'
            ];
            delete req.query.SELECT.search;
            query.SELECT.where = searchFilter;
        } else if (sFilter) {
            query.SELECT.where = sFilter;
        }

        if (req.query.SELECT.limit) {
            query.SELECT.limit = req.query.SELECT.limit;
        }

        return await materialService2.tx(req).run(query);
    });

    /**
     * Handler for Vendor.
     * Retrieves Supplier details with support for search by ID and Name.
     */
    this.on('READ', Vendor, async (req) => {
        const sSearch = req.query.SELECT.search?.[0].val; 
        const sFilter = req.query.SELECT.where;

        const query = {
            SELECT: {
                from: { ref: ['A_Supplier'] },
                columns: [
                    { ref: ['Supplier'] },
                    { ref: ['SupplierFullName'] }, 
                    { ref: ['SupplierName'] }, 
                ]
            }
        };

        let searchFilter = null;
        if (sSearch !== undefined && sSearch !== null) {
            searchFilter = [
                '(',
                { 
                    func: 'contains', 
                    args: [{ ref: ['Supplier'] }, { val: sSearch }] 
                },
                'or',
                { 
                    func: 'contains', 
                    args: [{ ref: ['SupplierName'] }, { val: sSearch }] 
                },
                ')'
            ];
            delete req.query.SELECT.search;
            query.SELECT.where = searchFilter;
        } else if (sFilter) {
            query.SELECT.where = sFilter;
        }

        if (req.query.SELECT.limit) {
            query.SELECT.limit = req.query.SELECT.limit;
        }

        return await vendorService.tx(req).run(query);
    });

    // ------ MANAGE CHARACTERISTICS ---------------

    /**
     * Action handler to retrieve full details of all characteristics linked to a specific Class.
     * Combines remote S/4HANA metadata with local configuration settings.
     */
    this.on('getCharacteristicsDetails', async (req) => {
        const { classId } = req.data;

        // Identify which internal characteristic IDs belong to the given Class ID
        const classCharac = await classService.run(
            SELECT.from('A_ClfnClassCharcForKeyDate')
            .columns(['CharcInternalID', 'CharcPositionNumber']) 
            .where({ ClassInternalID: classId })
            .orderBy('CharcPositionNumber asc')
        );

        let aCharcIds = [];
        const positionMap = new Map();

        classCharac.forEach(item => {
            aCharcIds.push(item.CharcInternalID);
            positionMap.set(item.CharcInternalID, item.CharcPositionNumber);
        });

        if (aCharcIds.length === 0) return [];

        // Batch processing to stay within URI length limits for the remote service call
        const aCharcChunks = chunkArray(aCharcIds, CHUNK_SIZE);
        let aAllDetails = [];

        const query = {
            SELECT: {
                from: { ref: ['A_ClfnCharacteristicForKeyDate'] },
                columns: [
                    { ref: ['CharcInternalID'] },
                    { ref: ['Characteristic'] },
                    { ref: ['CharcValueUnit'] },
                    { ref: ['CharcDataType'] },
                    { ref: ['Currency'] },
                    { ref: ['CharcLength'] },
                    { ref: ['CharcDecimals'] },
                    { ref: ['AdditionalValueIsAllowed'] },
                    {
                        ref: ['to_CharacteristicDesc'],
                        expand: [
                            { ref: ['CharcDescription'] },
                            { ref: ['Language'] }
                        ]
                    }
                ]
            }
        };

        const aLocalConfigs = await SELECT.from('CharacteristicConfig')
            .where({ charcID_CharcInternalID: { in: aCharcIds } });

        const configMap = new Map(aLocalConfigs.map(cfg => [cfg.charcID_CharcInternalID, cfg]));
        
        for (const chunk of aCharcChunks) {
            
            const dynamicOrFilter = [];

            chunk.forEach((id, index) => {
                dynamicOrFilter.push({ ref: ['CharcInternalID'] }, '=', { val: id });
                
                if (index < chunk.length - 1) {
                    dynamicOrFilter.push('or');
                }
            });

            query.SELECT.where = ['(', ...dynamicOrFilter, ')'];

            const batchResults = await characteristicService.run(query);
            
            aAllDetails = aAllDetails.concat(batchResults);
        }

        return aAllDetails.map(charc => {
            const charId = charc.CharcInternalID;
            const localConfig = configMap.get(charId);
            const rawFlag = charc.AdditionalValueIsAllowed;

            const isRestricted = rawFlag === false || rawFlag === 'false';
            const additionalValueAllowed = !isRestricted;

            // Resolve description
            const charDesc = charc.to_CharacteristicDesc?.find(t => t.Language === 'EN')?.CharcDescription
                            || charId;

            const hasValueList = isRestricted ? true : (localConfig ? localConfig.useValueList : false);

            return {
                position               : positionMap.get(charId),
                charId                 : charId,
                name                   : charc.Characteristic,
                description            : charDesc,
                hasValueList           : hasValueList,
                additionalValueAllowed : additionalValueAllowed,
                unit                   : charc.CharcValueUnit || "",
                dataType               : charc.CharcDataType,
                currency               : charc.Currency || "",
                length                 : charc.CharcLength,
                decimals               : charc.CharcDecimals,
                selectedValue          : ""
            };
        });
    });

    /**
     * Action handler to fetch the allowed values for a specific characteristic.
     * Primarily used for populating dropdowns and value help dialogs.
     */
    this.on('getPossibleValues', async (req) => {
        
        const { charId } = req.data;

        const queryDataType = {
            SELECT: {
                from: { ref: ['A_ClfnCharacteristicForKeyDate'] },
                columns: [
                    { ref: ['CharcDataType'] },
                    { ref: ['CharcDecimals'] }
                ],
                where: [{ ref: ['CharcInternalID'] }, '=', { val: charId }]
            }
        };

        const aValueDataType = await characteristicService.run(queryDataType);

        const dataType = aValueDataType[0].CharcDataType;
        const decimals = aValueDataType[0].CharcDecimals;
        let columnValue;

        if (dataType === 'CHAR') {
            columnValue = 'CharcValue';
        } else {
            columnValue = 'CharcFromNumericValue';
        }

        const queryValues = {
            SELECT: {
                from: { ref: ['A_ClfnCharcValueForKeyDate'] },
                columns: [
                    { ref: [columnValue] }
                ],
                where: [{ ref: ['CharcInternalID'] }, '=', { val: charId }]
            }
        };

        const aValues = await characteristicService.run(queryValues);

        if ((dataType === 'NUM') || (dataType === 'CURR')) {
            return aValues.map(v => ({
                valueId: Number(v.CharcFromNumericValue).toFixed(decimals)
            }));
        } else {
            return aValues.map(v => ({
                valueId: v.CharcValue
            }));
        }
        
    });

    // ------ MANAGE PLANTS FOR MATERIAL ---------------

    /**
     * Action handler to retrieve the list of valid Plants for a specific Material.
     * It intersects the master list of configured Plants with the ones actually 
     * assigned to the Product in the remote system.
     */
    this.on('getPlantsForMaterial', async (req) => {
        const { productId, formType } = req.data;

        if (!productId) {
            return req.error(400, "The material ID is required.");
        }
        if (!formType) {
            return req.error(400, "The request type is required.");
        }

        // Only plants configured for THIS form type, so a plant that has no approval
        // hierarchy for the form type is never offered (e.g. 3040/3202 for NonToStock).
        const aConfiguredPlants = await SELECT.from('ConfiguredPlantsByType').where({ formType_code: formType });

        const aMaterialPlants = await materialService2.run(
            SELECT.from('I_ProductByPlantVH')
            .columns('Plant') 
            .where({ Product: productId })
        );

        const oMaterialPlantSet = new Set(aMaterialPlants.map(p => p.Plant));
        
        const aFilteredPlants = aConfiguredPlants.filter(cp => 
            oMaterialPlantSet.has(cp.plant_Plant)
        );

        return aFilteredPlants.map(p => ({
            plant: p.plant_Plant,
            plantName: p.PlantName
        }));
    });

    this._handleSAPImpact = async (formData, req) => {

        const sType = formData.formType_code;

        if (sType === 'NewStock' || sType === 'NonStock') {
            return await this._handleMaterialCreation(formData, req);
        } else if (sType === 'SafetyStock') {
            return await this._handleSafetyStockChange(formData, req);
        } else if (sType === 'NonToStock') {
            return await this._handleNonToStockConversion(formData, req);
        } else {
            return true;
        }

    };

    // LGPRO (Issue Storage Location) and FHORI (Scheduling Margin Key) are plant-level
    // MRP fields that cannot be written via the standard OData material service
    // (API_PRODUCT_SRV / A_Product). BAPI_MATERIAL_SAVEDATA is required to set them.
    this._updaterProdStorageAndSchedMargin = async (materialId, updateData) => {

        if (!updateData.prodStorageLocation && !updateData.schedMarginKey) {
            return;
        }

        const paddedMaterialId = materialId.padStart(18, '0');
        const saveResult = await saveMaterialDataBapiService.send('BAPI_MATERIAL_SAVEDATA', {
            HEADDATA: {
                MATERIAL : paddedMaterialId,
                MRP_VIEW : 'X'
            },
            PLANTDATA: {
                PLANT      : updateData.plant,
                ISS_ST_LOC : updateData.prodStorageLocation || '',
                SM_KEY     : updateData.schedMarginKey || ''
            },
            PLANTDATAX: {
                PLANT      : updateData.plant,
                ISS_ST_LOC : updateData.prodStorageLocation ? 'X' : '',
                SM_KEY     : updateData.schedMarginKey ? 'X' : ''
            },
            RETURNMESSAGES: []
        });

        const saveRet = saveResult?.RETURN;
        if (saveRet?.TYPE === 'E' || saveRet?.TYPE === 'A') {
            throw new Error(`BAPI_MATERIAL_SAVEDATA failed for material ${materialId}: ${saveRet.MESSAGE}`);
        }

        // Commit to release the enqueue lock before subsequent BAPI calls on the same object
        await saveMaterialDataBapiService.send('BAPI_TRANSACTION_COMMIT', { WAIT: 'X' });

        console.log(`[SAP] Prod. Storage Location and Scheduling Margin Key updated for material ${materialId}.`);
    };

    this._assignClassification = async (materialId, updateData) => {

        if (!updateData.class) {
            console.log(`[SAP] No class assigned for material ${materialId}, skipping classification.`);
            return;
        }

        // Resolve the human-readable Class number (CLASSNUM) from the internal ID
        const classRecord = await classService.run(
            SELECT.one.from('A_ClfnClassForKeyDate')
                .where({ ClassInternalID: updateData.class })
                .columns(['Class', 'ClassType'])
        );

        if (!classRecord) {
            throw new Error(`Class with InternalID '${updateData.class}' not found in the remote system.`);
        }

        // SAP OBJECTKEY must be 18 characters, zero-padded
        const paddedMaterialId = materialId.padStart(18, '0');

        const hasValue = (v) => v !== null && v !== undefined && String(v).trim() !== '';

        const ALLOCVALUESCHARNEW = (updateData.charCharacteristics || [])
            .filter(char => hasValue(char.value))
            .map(char => ({
                CHARACT: char.name,
                VALUE_CHAR: char.value
            }));

        const ALLOCVALUESNUMNEW = (updateData.numericCharacteristics || [])
            .filter(char => hasValue(char.valueFrom))
            .map(char => ({
                CHARACT: char.name,
                VALUE_FROM: toRfcFloat(char.valueFrom),
                VALUE_TO: toRfcFloat(char.valueTo || char.valueFrom)
            }));

        const ALLOCVALUESCURRNEW = (updateData.currCharacteristics || [])
            .filter(char => hasValue(char.value))
            .map(char => ({
                CHARACT: char.name,
                VALUE_FROM: toRfcFloat(char.value),
                CURRENCY_FROM: char.currency
            }));

        const result = await materialMasterBapiService.send('BAPI_OBJCL_CHANGE', {
            CLASSNUM    : classRecord.Class,
            CLASSTYPE   : classRecord.ClassType || (process.env.MATERIAL_CLASS_TYPE || '001'),
            OBJECTTABLE : 'MARA',
            OBJECTKEY   : paddedMaterialId,
            STATUS      : '1',
            ALLOCVALUESCHARNEW,
            ALLOCVALUESNUMNEW,
            ALLOCVALUESCURRNEW,
            RETURN      : []
        });

        const errors = (result?.RETURN || []).filter(r => r.TYPE === 'E' || r.TYPE === 'A');
        if (errors.length > 0) {
            const errorMsg = errors.map(e => e.MESSAGE).join('; ');
            throw new Error(`BAPI_OBJCL_CHANGE failed for material ${materialId}: ${errorMsg}`);
        }

        console.log(`[SAP] Class '${classRecord.Class}' and characteristics assigned to material ${materialId}.`);
    };

    this._handleMaterialCreation = async (formData, req) => {

        // 1. Prepare values for filtering the Configuration Table
        const sPlant = formData.plant_plant_Plant;
        const sType = formData.formType_code;
        const sRepairable = formData.isRepairable === null ? null : (formData.isRepairable ? 'Repairable' : 'Not Repairable');
        const nCost = Number(formData.estCostPerUnit) || 0;

        // 2. Select from Configuration Entity
        const aConfigs = await SELECT.from(MaterialCreationValues).where({
            requestPlant_plant_Plant: sPlant,
            formType_code: sType
        });

        // 3. Find the specific row that satisfies the Cost Threshold logic
        const oConfig = aConfigs.find(conf => {

            if (!conf.costOperator && !conf.repairableStatus) {
                return true; 
            }

            const bRepairableMatch = (conf.repairableStatus === sRepairable) || (!conf.repairableStatus && !sRepairable);

            if (!bRepairableMatch) return false;

            // If the row DOES have an operator, evaluate the numeric value
            const nThreshold = Number(conf.costThreshold);

            if (conf.costOperator === '<') return nCost < nThreshold;
            if (conf.costOperator === '>') return nCost >= nThreshold;

            return false;
        });

        if (!oConfig) {
            const sMsg = `No Material Creation defaults found for Plant ${sPlant}, Type ${sType}`;
            await UPDATE('RequestForm').set({ generalStatus: 'SAP_ERROR', sapError: sMsg }).where({ ID: formData.ID });
            if (req) req.warn(`Approved, but SAP creation was not triggered: ${sMsg}`);
            return false;
        }

        const oValuationEntry = {
            "ValuationArea": oConfig.plant_Plant,
            "ValuationClass": oConfig.valuationClass,
            "InventoryValuationProcedure": oConfig.priceControl,
            "PriceUnitQty": "1"
        };

        if (oConfig.priceControl === 'S') {
            oValuationEntry.StandardPrice = String(oConfig.standardPrice);

        } else if (oConfig.priceControl === 'V') {
            oValuationEntry.MovingAveragePrice = String(formData.estCostPerUnit);
        }

        // After approvals are complete, call the function to update material properties
        // Parse materialClassCharact JSON to extract characteristics
        let parsedCharacteristics = { numericCharacteristics: [], charCharacteristics: [], currCharacteristics: [] };

        if (formData.materialClassCharact) {
            try {
                const charactData = JSON.parse(formData.materialClassCharact);
                if (Array.isArray(charactData)) {
                    charactData.forEach(char => {
                        if (char.dataType === 'NUM') {
                            parsedCharacteristics.numericCharacteristics.push({
                                name: char.name,
                                valueFrom: char.selectedValue || char.valueFrom || '',
                                valueTo: char.valueTo || ''
                            });
                        } else if (char.dataType === 'CURR') {
                            parsedCharacteristics.currCharacteristics.push({
                                name: char.name,
                                value: char.selectedValue || '',
                                currency: char.currency || ''
                            });
                        } else {
                            parsedCharacteristics.charCharacteristics.push({
                                name: char.name,
                                value: char.selectedValue || ''
                            });
                        }
                    });
                }
            } catch (err) {
                console.error("Error parsing materialClassCharact:", err);
            }
        }
        
        // The fallback below bypasses the derivation, so the formatting is applied here as well.
        const sSapDescription = this._formatSapDescription(
            formData.materialDescription || parsedCharacteristics?.charCharacteristics?.slice(0, 3).map(c => c.value).join(', ') || '*'
        );

        // 4. Construct the Deep JSON for API_PRODUCT_SRV
        const oProductPayload = {
            "ProductType": oConfig.materialType,
            "CrossPlantStatus": oConfig.xPlantMatStatus,
            "ProductGroup": formData.materialGroupNumber_ProductGroup,
            "BaseUnit": formData.unitOfMeasure_UnitOfMeasure,
            "ProductManufacturerNumber": formData.manufacturerPartNumber,
            "IndustrySector": oConfig.industrySector,
            "to_Description": [
                {
                    "Language": "EN",
                    "ProductDescription": sSapDescription
                }
            ],
            "to_Plant": [
                {
                    "Plant": oConfig.plant_Plant, 
                    "PurchasingGroup": oConfig.purchasingGroup,
                    "ProfitCenter": oConfig.profitCenter,
                    "to_ProductSupplyPlanning": {
                        "Plant": oConfig.plant_Plant,
                        "MinimumLotSizeQuantity": String(formData.minimumLotSize),
                        "LotSizingProcedure": oConfig.lotSizeProcedure,
                        "MRPType": oConfig.mrpType,
                        "MRPResponsible": oConfig.mrpController,
                        "SafetyStockQuantity": String(oConfig.safetyStock),
                        "PlannedDeliveryDurationInDays": String(formData.estDeliveryTime),
                        "AvailabilityCheckType": oConfig.availabilityCheck,
                        "GoodsReceiptDuration": String(oConfig.grProcessingTime),
                        "MRPGroup": oConfig.mrpGroup
                    },
                    "to_StorageLocation": [
                        {
                            "Plant": oConfig.plant_Plant,
                            "StorageLocation": oConfig.storageLocation,
                            "WarehouseStorageBin": oConfig.storageBin
                        }
                    ]
                }
            ],
            "to_ProductProcurement": {
                "PurchasingAcknProfile": oConfig.purchasingValueKey
            },
            "to_Valuation": [oValuationEntry]
        };

        // Prepare update data for material
        const updateData = {
            class: formData.materialClass_ClassInternalID || null,
            numericCharacteristics: parsedCharacteristics.numericCharacteristics,
            charCharacteristics: parsedCharacteristics.charCharacteristics,
            currCharacteristics: parsedCharacteristics.currCharacteristics,
            plant: oConfig.plant_Plant,
            prodStorageLocation: oConfig.prodStorageLocation || null,
            schedMarginKey: oConfig.schedMarginKey || null
        };

        return await this._executeSAPMaterialCreate(oProductPayload, updateData, formData, req);
    };

    this._executeSAPMaterialCreate = async (payload, updateData, formData, req) => {
        try {
            const response = await materialService.create('A_Product', payload);
            if (response && response.Product) {
                await this._updaterProdStorageAndSchedMargin(response.Product, updateData); //TODO: UNCOMMENT THIS LINE WHEN BAPI_MATERIAL_SAVEDATA IS AVAILABLE
                await this._assignClassification(response.Product, updateData);

                const description = response.to_Description?.find(d => d.Language === 'EN')?.ProductDescription || response.Product;

                // Persist the created material so downstream notifications (N-5/N-9/N-10) can reference it.
                await UPDATE('RequestForm')
                    .set({ sapMaterialNumber_Product: response.Product, materialDescription: description })
                    .where({ ID: formData.ID });

                if (req) {
                    req.info(`The Material '${description}' (${response.Product}) was successfully created in SAP.`);
                }
            }

            return true;

        } catch (oError) {
            const sDetail = oError.innererror?.errordetails?.[0]?.message || oError.message;

            console.log("Error creating material in S/4HANA:", sDetail);

            await UPDATE('RequestForm').set({ generalStatus: 'SAP_ERROR', sapError: sDetail }).where({ ID: formData.ID });

            if (req) {
                req.warn(`Approved, but SAP creation failed: ${sDetail}`);
            } else {
                throw new Error(`S/4HANA Error: ${sDetail}`);
            }

            return false;
        }
    };

    this._handleSafetyStockChange = async (formData, req) => {
        const sProduct = formData.sapMaterialNumber_Product;
        const sPlant = formData.plant_plant_Plant;
        const nSafetyStock = formData.safetyStockReq;

        if (!sProduct || !sPlant || nSafetyStock === undefined || nSafetyStock === null) {
            throw new Error("Missing required fields for Safety Stock update (Product, Plant, or Requested Safety Stock).");
        }

        return await this._executeSAPSafetyStockUpdate(sProduct, sPlant, nSafetyStock, formData, req);
    };

    this._executeSAPSafetyStockUpdate = async (sProduct, sPlant, nSafetyStock, formData, req) => {
        try {
            await materialService.run(
                UPDATE('A_ProductSupplyPlanning')
                .set({ SafetyStockQuantity: String(nSafetyStock) })
                .where({ Product: sProduct, Plant: sPlant })
            );

            if (req) {
                const description = formData.materialDescription || sProduct;
                req.info(`Safety Stock for Material '${description}' (${sProduct}) was successfully updated to ${nSafetyStock} in SAP.`);
            }

            return true;
        } catch (oError) {
            console.log("Error updating Safety Stock in S/4HANA:", oError);

            const sDetail = oError.innererror?.errordetails?.[0]?.message || oError.message;
            await UPDATE('RequestForm').set({ generalStatus: 'SAP_ERROR', sapError: sDetail }).where({ ID: formData.ID });

            if (req) {
                req.warn(`Approved, but SAP Safety Stock assignment failed: ${sDetail}`);
            } else {
                throw new Error(`S/4HANA Error: ${sDetail}`);
            }

            return false;
        }
    };

    this._handleNonToStockConversion = async (formData, req) => {
        const sProduct = formData.sapMaterialNumber_Product;
        const sRequestPlant = formData.plant_plant_Plant;

        if (!sProduct) {
            throw new Error("Missing SAP material number for the Non-Stock to Stock conversion.");
        }

        const sRepairable = formData.isRepairable ? 'Repairable' : 'Not Repairable';
        const oConfig = await SELECT.one.from(MaterialCreationValues).where({
            requestPlant_plant_Plant: sRequestPlant,
            formType_code: 'NonToStock',
            repairableStatus: sRepairable
        });

        if (!oConfig) {
            const sMsg = `No Non-Stock to Stock defaults found for Plant ${sRequestPlant}, Repairable '${sRepairable}'`;
            await UPDATE('RequestForm').set({ generalStatus: 'SAP_ERROR', sapError: sMsg }).where({ ID: formData.ID });
            if (req) req.warn(`Approved, but SAP conversion was not triggered: ${sMsg}`);
            return false;
        }

        return await this._executeSAPNonToStockConversion(sProduct, oConfig, formData, req);
    };

    this._executeSAPNonToStockConversion = async (sProduct, oConfig, formData, req) => {
        const sPlant = oConfig.plant_Plant;
        const oPlantKey = { Product: sProduct, Plant: sPlant };
        try {
            // NonToStock is restricted to plants where the non-stock material already
            // exists, so the plant view is always present
            await materialService.run(
                UPDATE('A_Product').set({ CrossPlantStatus: oConfig.xPlantMatStatus }).where({ Product: sProduct })
            );
            await materialService.run(
                UPDATE('A_ProductPlant').set({ PurchasingGroup: oConfig.purchasingGroup }).where(oPlantKey)
            );
            await materialService.run(
                UPDATE('A_ProductSupplyPlanning')
                    .set({
                        MRPType: oConfig.mrpType,
                        MRPResponsible: oConfig.mrpController,
                        MRPGroup: oConfig.mrpGroup,
                        SafetyStockQuantity: String(formData.safetyStockReq)
                    })
                    .where(oPlantKey)
            );

            const oStorageKey = { Product: sProduct, Plant: sPlant, StorageLocation: oConfig.storageLocation };
            const oExistingSL = await materialService.run(SELECT.one.from('A_ProductStorageLocation').where(oStorageKey));
            if (oExistingSL) {
                await materialService.run(
                    UPDATE('A_ProductStorageLocation').set({ WarehouseStorageBin: oConfig.storageBin }).where(oStorageKey)
                );
            } else {
                await materialService.run(
                    INSERT.into('A_ProductStorageLocation').entries({ ...oStorageKey, WarehouseStorageBin: oConfig.storageBin })
                );
            }

            if (req) {
                const description = formData.materialDescription || sProduct;
                req.info(`Material '${description}' (${sProduct}) was converted to stock in SAP (plant ${sPlant}).`);
            }
            return true;
        } catch (oError) {
            const sDetail = oError.innererror?.errordetails?.[0]?.message || oError.message;
            console.log("Error converting material to stock in S/4HANA:", sDetail);

            await UPDATE('RequestForm').set({ generalStatus: 'SAP_ERROR', sapError: sDetail }).where({ ID: formData.ID });

            if (req) {
                req.warn(`Approved, but SAP Non-Stock to Stock conversion failed: ${sDetail}`);
            } else {
                throw new Error(`S/4HANA Error: ${sDetail}`);
            }
            return false;
        }
    };

    this.on('getUserInfo', req => {
        return {
            isReviewer: req.user.is('REVIEWER'),
            isRequestor: req.user.is('REQUESTOR')
        }
    });

    this._getUserTurnInfo = async (formID, userEmail) => {
        const formDoc = await SELECT.one.from(RequestForm)
            .where({ ID: formID })
            .columns('plant_plant_Plant', 'formType_code', 'generalStatus');

        if (!formDoc || ['Rejected', 'Approved'].includes(formDoc.generalStatus)) {
            return { isUserTurn: false, editable: false, currentStepNumber: null };
        }

        const stepCtx = await this._resolveApprovalStep(
            formDoc.plant_plant_Plant, formDoc.formType_code, formDoc.generalStatus, formID
        );

        if (!stepCtx) return { isUserTurn: false, editable: false, currentStepNumber: null };

        const { currentStepNumber, totalSteps, authorizedReviewers } = stepCtx;

        const isAuthorized = authorizedReviewers.some(r => r.reviewer === userEmail);

        const editable = isAuthorized && (
            currentStepNumber === 1 ||
            (currentStepNumber === totalSteps && formDoc.generalStatus === 'SAP_ERROR')
        );

        return { isUserTurn: isAuthorized, editable, currentStepNumber };
    };

    /**
     * Resolves the current approval step context for a given form.
     * Returns null if the form is in a terminal state or the config is missing.
     *
     * @returns {{ currentStepNumber, totalSteps, authorizedReviewers } | null}
     */
    this._resolveApprovalStep = async (plant, formTypeCode, generalStatus, formID) => {

        const existingSteps = await SELECT.from(FormApprovalSteps)
            .where({ parentForm_ID: formID });

        let currentStepNumber = existingSteps.length + 1;

        const maxStepConfig = await SELECT.one.from(ReviewHierarchy)
            .where({ plant_Plant: plant, formType_code: formTypeCode })
            .columns('max(step) as maxStep');

        const totalSteps = maxStepConfig?.maxStep || 0;

        if (currentStepNumber > totalSteps) {
            if (generalStatus === 'SAP_ERROR') {
                currentStepNumber = totalSteps; // Allow last approver to retry
            } else {
                return null; // Flow is complete or not configured
            }
        }

        const authorizedReviewers = await SELECT.from(ReviewHierarchy).where({
            plant_Plant: plant,
            formType_code: formTypeCode,
            step: currentStepNumber
        });

        return { currentStepNumber, totalSteps, authorizedReviewers };
    };
})

const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size));
    }
    return chunks;
};
