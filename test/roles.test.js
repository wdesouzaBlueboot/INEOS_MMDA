const { describe, it, mock } = require('node:test');
const assert = require('node:assert');
const cds = require('@sap/cds');

const { GET, POST, PATCH, DELETE } = cds.test(__dirname + '/..');

describe('Role-Based Access Control (RBAC) Tests', () => {

    const requestorAuth = { username: 'requestor', password: 'requestor' };
    const requestor1Auth = { username: 'requestor1', password: 'requestor1' };
    const reviewerAuth = { username: 'reviewer', password: 'revrevrev' };
    const reviewer1Auth = { username: 'reviewer1', password: 'reviewer1' };
    const reviewer1_1Auth = { username: 'reviewer1_1', password: 'reviewer1_1' };
    const reviewer1_2Auth = { username: 'reviewer1_2', password: 'reviewer1_2' };
    const reviewer2Auth = { username: 'reviewer2', password: 'reviewer2' };
    const reviewer3Auth = { username: 'reviewer3', password: 'reviewer3' };
    const reviewer4Auth = { username: 'reviewer4', password: 'reviewer4' };
    const rev1_3030Auth = { username: 'rev1_3030', password: 'rev1_3030' };
    const rev2_3030Auth = { username: 'rev2_3030', password: 'rev2_3030' };
    const rev3_3030Auth = { username: 'rev3_3030', password: 'rev3_3030' };
    const rev4_3030Auth = { username: 'rev4_3030', password: 'rev4_3030' };
    const rev5_3030Auth = { username: 'rev5_3030', password: 'rev5_3030' };
    const rev1_3333Auth = { username: 'rev1_3333Auth', password: 'rev1_3333Auth' };
    const reqrevAuth = { username: 'reqrev', password: 'reqrev' };
    const unassignedReviewerAuth = { username: 'unassignedReviewer', password: 'unassignedReviewer' };
    const adminAuth = { username: 'admin', password: 'admin' };
    const unauthorizedAuth = { username: 'unauthorized', password: 'unauthorized' };

    async function checkStatus(method, path, auth, expectedStatus, data = undefined) {
        let status;
        try {
            let res;
            if (method === 'GET') {
                res = await GET(path, { auth });
            } else if (method === 'POST') {
                res = await POST(path, data, { auth });
            } else if (method === 'PATCH') {
                res = await PATCH(path, data, { auth });
            } else if (method === 'DELETE') {
                res = await DELETE(path, { auth });
            }
            status = res.status;
        } catch (err) {
            status = err.response?.status || 500;
        }
        assert.strictEqual(status, expectedStatus, `${method} ${path} with ${auth?.username} should return ${expectedStatus}, but got ${status}`);
    }

    async function setupFormToStep(step, formType = 'NewStock', plant = '3080', customReviewers = null, draftPayload = null, ownerAuth = requestorAuth) {
        const createRes = await POST('/odata/v4/catalog/RequestForm', { formType_code: formType, plant_plant_Plant: plant }, { auth: ownerAuth });
        const formID = createRes.data.ID;
        
        let payloadToPatch = {};

        if (formType === 'NewStock' || formType === 'NonStock') {
            payloadToPatch = {
                isMdata48h: false,
                isResultOfMOC: false,
                equipmentNumber: 'EQ-001',
                chemicalApproval_code: 'Yes',
                isPartOfBOM: false,
                vendor_Supplier: 'VEND-001',
                vendorPartNumber: 'VPN-001',
                manufacturer: 'MANUF-001',
                manufacturerPartNumber: 'MPN-001',
                materialClass_ClassInternalID: 'CLASS-001',
                materialClassCharact: JSON.stringify([{ name: 'DUMMY_CHAR', selectedValue: 'DUMMY_VAL' }]),
                estCostPerUnit: 100,
                estDeliveryTime: 10,
                materialGroupNumber_ProductGroup: 'MG-001',
                unitOfMeasure_UnitOfMeasure: 'EA',
                minimumLotSize: 1
            };
            if (formType === 'NewStock') {
                Object.assign(payloadToPatch, {
                    functionalLocation: 'FL-001',
                    justification: 'Stock Justification',
                    estUsagePerYear: 100,
                    isRepairable: false,
                    maxQtyPerUse: 10,
                    safetyStockReq: '10',
                    specialStorageReq: 'N/A',
                    isPreventativeMaintReq: 'No',
                    willReqSupplyStock: true
                });
            }
            
            // Bypass the attachment validation by creating a mock attachment draft
            await POST(`/odata/v4/catalog/RequestForm(ID=${formID},IsActiveEntity=false)/attachments`, { note: 'dummy' }, { auth: ownerAuth });
        } else if (formType === 'SafetyStock') {
            payloadToPatch = {
                sapMaterialNumber_Product: 'PROD-123',
                safetyStockReq: '50'
            };
        } else if (formType === 'Deletion') {
            payloadToPatch = {
                sapMaterialNumber_Product: 'PROD-123'
            };
        }

        if (draftPayload) {
            Object.assign(payloadToPatch, draftPayload);
        }

        if (Object.keys(payloadToPatch).length > 0) {
            await PATCH(`/odata/v4/catalog/RequestForm(ID=${formID},IsActiveEntity=false)`, payloadToPatch, { auth: ownerAuth });
        }

        await POST(`/odata/v4/catalog/RequestForm(ID=${formID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth: ownerAuth });

        const reviewers = customReviewers || [reviewer1Auth, reviewer2Auth, reviewer3Auth, reviewer4Auth];
        for (let i = 0; i < step; i++) {
            await POST(`/odata/v4/catalog/RequestForm(ID=${formID},IsActiveEntity=true)/CatalogService.approveRequest`, {}, { auth: reviewers[i] });
        }
        return formID;
    }

    async function insertSubmittedFormNoHierarchy(formType, plant) {
        const ID = cds.utils.uuid();
        await cds.db.run(INSERT.into('my.MaterialMasterData.RequestForm').entries({
            ID,
            formType_code: formType,
            plant_plant_Plant: plant,
            formNumber: `NOHIER-${plant}`,
            requestorName: 'Test Requestor',
            requestorEmail: 'requestor@test.com',
            generalStatus: 'Submitted'
        }));
        return ID;
    }

    async function assertActionStatus(action, formID, auth, expectedStatus, errorMessage, payload = {}, expectedErrorMsg = null) {
        let status, actualErrorMsg;
        try {
            const res = await POST(`/odata/v4/catalog/RequestForm(ID=${formID},IsActiveEntity=true)/CatalogService.${action}`, payload, { auth });
            status = res.status;
        } catch (err) {
            status = err.response?.status || 500;
            actualErrorMsg = err.response?.data?.error?.message;
        }
        if (Array.isArray(expectedStatus)) {
            assert.ok(expectedStatus.includes(status), `${errorMessage} (expected one of ${expectedStatus}, but got ${status})`);
        } else {
            assert.strictEqual(status, expectedStatus, errorMessage);
        }
        if (expectedErrorMsg) {
            assert.ok(actualErrorMsg?.includes(expectedErrorMsg), `Expected error message to include '${expectedErrorMsg}', but got: ${actualErrorMsg}`);
        }
    }

    before(async () => {
        const hierarchySteps = [
            { ID: cds.utils.uuid(), plant_Plant: '3080', formType_code: 'NewStock', step: 1, reviewer: 'reviewer1@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3080', formType_code: 'NewStock', step: 1, reviewer: 'reviewer1_1@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3080', formType_code: 'NewStock', step: 1, reviewer: 'reviewer1_2@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3080', formType_code: 'NewStock', step: 2, reviewer: 'reviewer2@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3080', formType_code: 'NewStock', step: 3, reviewer: 'reviewer3@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3080', formType_code: 'NewStock', step: 4, reviewer: 'reviewer4@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3030', formType_code: 'NonStock', step: 1, reviewer: 'rev1_3030@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3030', formType_code: 'NonStock', step: 2, reviewer: 'rev2_3030@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3030', formType_code: 'NonStock', step: 3, reviewer: 'rev3_3030@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3030', formType_code: 'NonStock', step: 4, reviewer: 'rev4_3030@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3030', formType_code: 'NonStock', step: 5, reviewer: 'rev5_3030@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '3333', formType_code: 'NonStock', step: 1, reviewer: 'rev1_3333Auth@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '4444', formType_code: 'SafetyStock', step: 1, reviewer: 'reviewer1@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '4444', formType_code: 'SafetyStock', step: 2, reviewer: 'reviewer2@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '4444', formType_code: 'SafetyStock', step: 3, reviewer: 'reviewer3@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '5555', formType_code: 'Deletion', step: 1, reviewer: 'reviewer1@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '5555', formType_code: 'Deletion', step: 2, reviewer: 'reviewer2@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '7777', formType_code: 'NewStock', step: 1, reviewer: 'reviewer1@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '8888', formType_code: 'NewStock', step: 1, reviewer: 'reviewer1@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '9999', formType_code: 'NonStock', step: 1, reviewer: 'rev1_3030@test.com' },
            // Plant 6060: the dual-role user (localreqrev@test.com) is the step-1 reviewer,
            // used to verify their REVIEWER capability is preserved alongside REQUESTOR rights.
            { ID: cds.utils.uuid(), plant_Plant: '6060', formType_code: 'NewStock', step: 1, reviewer: 'localreqrev@test.com' },
            { ID: cds.utils.uuid(), plant_Plant: '6060', formType_code: 'NewStock', step: 2, reviewer: 'reviewer2@test.com' },
        ];

        const materialCreationValues = [
            { 
                ID: cds.utils.uuid(), requestPlant_plant_Plant: '3333', formType_code: 'NonStock', repairableStatus: '', costOperator: '', costThreshold: 0, plant_Plant: '3333', materialType: 'ERSA', priceControl: 'V', industrySector: 'C', category: 'Nonstock', purchasingGroup: '245', xPlantMatStatus: '07', purchasingValueKey: '0011', grProcessingTime: '1', mrpGroup: '0002', mrpType: 'ND', mrpController: '010', lotSizeProcedure: 'EX', prodStorageLocation: '0100', schedMarginKey: '001', safetyStock: 0, availabilityCheck: '02', storageLocation: '0100', storageBin: 'Nonstock', profitCenter: '28100021', valuationClass: '3040', standardPrice: 0.0 
            },
            { 
                ID: cds.utils.uuid(), requestPlant_plant_Plant: '7777', formType_code: 'NewStock', repairableStatus: 'Not Repairable', costOperator: '<', costThreshold: 5000, plant_Plant: '7777', materialType: 'ERSA', priceControl: 'V', industrySector: 'C', category: 'Stock', purchasingGroup: '140', xPlantMatStatus: '06', purchasingValueKey: '0011', grProcessingTime: '1', mrpGroup: '0002', mrpType: 'PD', mrpController: '001', lotSizeProcedure: 'EX', prodStorageLocation: '0100', schedMarginKey: '001', safetyStock: 0, availabilityCheck: '02', storageLocation: '0100', storageBin: 'Newstock', profitCenter: '28100021', valuationClass: '3040', standardPrice: 0.0 
            },
            { 
                ID: cds.utils.uuid(), requestPlant_plant_Plant: '7777', formType_code: 'NewStock', repairableStatus: 'Not Repairable', costOperator: '>', costThreshold: 5000, plant_Plant: '7777', materialType: 'ERSA', priceControl: 'S', standardPrice: 1.0, industrySector: 'C', category: 'Capital Spare', purchasingGroup: '245', xPlantMatStatus: '04', purchasingValueKey: '0011', grProcessingTime: '1', mrpGroup: 'Z001', mrpType: 'PD', mrpController: '011', lotSizeProcedure: 'EX', prodStorageLocation: '0100', schedMarginKey: '001', safetyStock: 0, availabilityCheck: '02', storageLocation: '0100', storageBin: 'Newstock', profitCenter: '28100021', valuationClass: '3040' 
            },
        ];

        try {
            await cds.db.run(INSERT.into('my.MaterialMasterData.ReviewHierarchy').entries(hierarchySteps));
            await cds.db.run(INSERT.into('my.MaterialMasterData.MaterialCreationValues').entries(materialCreationValues));
        } catch (err) {
            assert.fail(`Setup failed. Error: ${err.message}`);
        }

        const service = cds.services.CatalogService;
        mock.method(service, '_executeSAPMaterialCreate', async () => true);
        mock.method(service, '_executeSAPSafetyStockUpdate', async () => true);

        // Mock the notification handlers so tests never send real emails / Teams cards.
        // (DB state — status, rejection comments — is set in _manageRequestForm before these run.)
        mock.method(service, '_requestorNotification', async () => {});            // N-1
        mock.method(service, '_handlePendingActionNotification', async () => {});  // N-2 / N-3
        mock.method(service, '_handleRejectionNotifications', async () => {});     // N-4
        mock.method(service, '_handleFinalApprovalNotification', async () => {});  // N-5 (+ N-9 / N-10)
        mock.method(service, '_handleSAPErrorNotification', async () => {});       // N-6
        mock.method(service, '_handleInfoRecordBOMNotifications', async () => {}); // N-9 / N-10
    });

    describe('RequestForm Entity - Basic Authorization Checks', () => {

        let generatedFormID;

        it('REQUESTOR can READ', () => checkStatus('GET', '/odata/v4/catalog/RequestForm', requestorAuth, 200));
        it('REVIEWER can READ', () => checkStatus('GET', '/odata/v4/catalog/RequestForm', reviewerAuth, 200));
        it('MANAGER can READ', () => checkStatus('GET', '/odata/v4/catalog/RequestForm', adminAuth, 200));
        it('UNAUTHORIZED cannot READ', () => checkStatus('GET', '/odata/v4/catalog/RequestForm', unauthorizedAuth, 403));
        
        const testRequestPayload = {
            "formType_code": "NewStock",
            "plant_plant_Plant": "3030"
        };
        
        it('REQUESTOR can CREATE', async () => {
            let status;
            try {
                const res = await POST('/odata/v4/catalog/RequestForm', testRequestPayload, { auth: requestorAuth });
                status = res.status;
                
                generatedFormID = res.data?.ID; 
            } catch (err) {
                status = err.response?.status || 500;
            }
            
            assert.strictEqual(status, 201, 'Requestor should be authorized to create RequestForm');
            assert.ok(generatedFormID, 'The RequestForm ID should have been generated');
        });
        it('REVIEWER cannot CREATE', () => checkStatus('POST', '/odata/v4/catalog/RequestForm', reviewerAuth, 403, testRequestPayload));
        it('MANAGER cannot CREATE', () => checkStatus('POST', '/odata/v4/catalog/RequestForm', adminAuth, 403, testRequestPayload));
        it('UNAUTHORIZED cannot CREATE', () => checkStatus('POST', '/odata/v4/catalog/RequestForm', unauthorizedAuth, 403, testRequestPayload));

        it('REQUESTOR can UPDATE', () => checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=false)`, requestorAuth, 200, { safetyStockReq: '28' }));
        it('MANAGER cannot UPDATE', () => checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=false)`, adminAuth, 403, { safetyStockReq: '28' }));
        it('UNAUTHORIZED cannot UPDATE', () => checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=false)`, unauthorizedAuth, 403, { safetyStockReq: '28' }));

        it('MANAGER cannot EDIT', () => checkStatus('POST', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)/CatalogService.draftEdit`, adminAuth, 403, { PreserveChanges: true }));

        it('REQUESTOR cannot DELETE', () => checkStatus('DELETE', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)`, requestorAuth, 403));
        it('REVIEWER cannot DELETE', () => checkStatus('DELETE', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)`, reviewerAuth, 403));
        it('MANAGER cannot DELETE', () => checkStatus('DELETE', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)`, adminAuth, 403));
        it('UNAUTHORIZED cannot DELETE', () => checkStatus('DELETE', `/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)`, unauthorizedAuth, 403));
    });

    describe('Base Approval Process', () => {

        let generatedFormID;
        
        const testRequestPayload = {
            "formType_code": "NewStock",
            "plant_plant_Plant": "3080"
        };

        it('Step 1: REVIEWER 1 can APPROVE', async () => {
            // Setup: Create and activate the form
            generatedFormID = await setupFormToStep(0, 'NewStock', '3080');

            let status;
            try {
                const res = await POST(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)/CatalogService.approveRequest`, {}, { auth: reviewer1Auth });
                status = res.status;
            } catch (err) {
                status = err.response?.status || 500;
            }
            assert.strictEqual(status, 204, 'Reviewer 1 should be authorized to execute the initial approve action');
        });

        it('Step 2: REVIEWER 2 can APPROVE', async () => {
            let status;
            try {
                const res = await POST(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)/CatalogService.approveRequest`, {}, { auth: reviewer2Auth });
                status = res.status;
            } catch (err) {
                status = err.response?.status || 500;
            }
            assert.strictEqual(status, 204, 'Reviewer 2 should be authorized to execute the initial approve action');
        });

        it('Step 3: REVIEWER 3 can APPROVE', async () => {
            let status;
            try {
                const res = await POST(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)/CatalogService.approveRequest`, {}, { auth: reviewer3Auth });
                status = res.status;
            } catch (err) {
                status = err.response?.status || 500;
            }
            assert.strictEqual(status, 204, 'Reviewer 3 should be authorized to execute the initial approve action');
        });

        it('Step 4: REVIEWER 4 can APPROVE', async () => {
            let status;
            try {
                const res = await POST(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)/CatalogService.approveRequest`, {}, { auth: reviewer4Auth });
                status = res.status;
            } catch (err) {
                status = err.response?.status || 500;
            }
            assert.strictEqual(status, 204, 'Reviewer 4 should be authorized to execute the initial approve action');
        });
    });

    describe('Approval Process with 1 Approver (Plant 3333, NonStock)', () => {

        let generatedFormID;

        it('Step 1: REVIEWER 1 (3333) can APPROVE and complete the flow', async () => {
            generatedFormID = await setupFormToStep(0, 'NonStock', '3333');
            await assertActionStatus('approveRequest', generatedFormID, rev1_3333Auth, 204, 'Reviewer 1 (3333) should be authorized to approve');
        });

        it('Form should have generalStatus "Approved" after final approval', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(res.data.generalStatus, 'Approved', `Expected generalStatus to be 'Approved', but got ${res.data.generalStatus}`);
        });

        it('Step 1: REVIEWER 1 (3333) cannot APPROVE again (Fully Approved)', async () => {
            await assertActionStatus('approveRequest', generatedFormID, rev1_3333Auth, 403, 'Reviewer 1 (3333) should NOT be authorized to approve again after final approval');
        });
    });

    describe('Approval Process with 5 Approvers (Plant 3030, NonStock)', () => {

        let generatedFormID;

        it('Setup: Create and activate form for 5 approvers', async () => {
            generatedFormID = await setupFormToStep(0, 'NonStock', '3030');
        });

        it('Step 1: REVIEWER 1 (3030) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, rev1_3030Auth, 204, 'Reviewer 1 (3030) should be authorized to approve');
        });

        it('Step 2: REVIEWER 2 (3030) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, rev2_3030Auth, 204, 'Reviewer 2 (3030) should be authorized to approve');
        });

        it('Step 3: REVIEWER 3 (3030) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, rev3_3030Auth, 204, 'Reviewer 3 (3030) should be authorized to approve');
        });

        it('Step 4: REVIEWER 4 (3030) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, rev4_3030Auth, 204, 'Reviewer 4 (3030) should be authorized to approve');
        });

        it('Step 5: REVIEWER 5 (3030) can APPROVE and complete the flow', async () => {
            await assertActionStatus('approveRequest', generatedFormID, rev5_3030Auth, 204, 'Reviewer 5 (3030) should be authorized to approve');
        });

        it('Form should have generalStatus "Approved" after final approval', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(res.data.generalStatus, 'Approved', `Expected generalStatus to be 'Approved', but got ${res.data.generalStatus}`);
        });
    });

    describe('Approval Process for SafetyStock (Plant 4444)', () => {

        let generatedFormID;

        it('Setup: Create with required fields and activate SafetyStock form', async () => {
            const createRes = await POST('/odata/v4/catalog/RequestForm', { 
                formType_code: 'SafetyStock', 
                plant_plant_Plant: '4444',
                sapMaterialNumber_Product: 'PROD-123',
                safetyStockReq: '50'
            }, { auth: requestorAuth });
            
            generatedFormID = createRes.data.ID;
            
            await POST(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth: requestorAuth });
        });

        it('Step 1: REVIEWER 1 (4444) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, reviewer1Auth, 204, 'Reviewer 1 should be authorized to approve');
        });

        it('Step 2: REVIEWER 2 (4444) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, reviewer2Auth, 204, 'Reviewer 2 should be authorized to approve');
        });

        it('Step 3: REVIEWER 3 (4444) can APPROVE and complete the flow', async () => {
            await assertActionStatus('approveRequest', generatedFormID, reviewer3Auth, 204, 'Reviewer 3 should be authorized to approve final step');
        });
    });

    describe('Approval Process for Deletion (Plant 5555)', () => {

        let generatedFormID;

        it('Setup: Create with required fields and activate Deletion form', async () => {
            const createRes = await POST('/odata/v4/catalog/RequestForm', { 
                formType_code: 'Deletion', 
                plant_plant_Plant: '5555',
                sapMaterialNumber_Product: 'PROD-123'
            }, { auth: requestorAuth });
            
            generatedFormID = createRes.data.ID;
            
            await POST(`/odata/v4/catalog/RequestForm(ID=${generatedFormID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth: requestorAuth });
        });

        it('Step 1: REVIEWER 1 (5555) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, reviewer1Auth, 204, 'Reviewer 1 should be authorized to approve');
        });

        it('Step 2: REVIEWER 2 (5555) can APPROVE', async () => {
            await assertActionStatus('approveRequest', generatedFormID, reviewer2Auth, 204, 'Reviewer 2 should be authorized to approve');
        });
    });

    describe('Approval Process with Rejection', () => {

        it('Step 1: REVIEWER 1 can REJECT pending form', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 204, 'Reviewer 1 should be authorized to execute the initial reject action');
        });

        it('Step 1: REVIEWER 1 can REJECT pending form with comments and save them', async () => {
            const newFormID = await setupFormToStep(0);
            const rejectionReason = 'Missing information on justification field';
            
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 204, 'Reviewer 1 should be authorized to execute reject action with comments', { comments: rejectionReason });

            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(res.data.rejectionComments, rejectionReason, 'Rejection comments should be saved in the database');
        });

        it('Step 2: REVIEWER 2 can REJECT after Step 1 approval', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('rejectRequest', newFormID, reviewer2Auth, 204, 'Reviewer 2 should be authorized to execute reject action after approval by reviewer 1');
        });

        it('Step 3: REVIEWER 3 can REJECT after Step 2 approval', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('rejectRequest', newFormID, reviewer3Auth, 204, 'Reviewer 3 should be authorized to execute reject action after approval by reviewer 2');
        });

        it('Step 4: REVIEWER 4 can REJECT after Step 3 approval', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('rejectRequest', newFormID, reviewer4Auth, 204, 'Reviewer 4 should be authorized to execute reject action after approval by reviewer 3');
        });
    });

    describe('Forbidden REJECT Attempts', () => {

        it('REVIEWER 1 cannot REJECT when form is at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute reject action after approval by reviewer 1');
        });

        it('REVIEWER 1 cannot REJECT when form is at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute reject action after approval by reviewer 2');
        });

        it('REVIEWER 1 cannot REJECT when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute reject action after approval by reviewer 3');
        });

        it('REVIEWER 1 cannot REJECT when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute reject action after approval by reviewer 4');
        });

        it('REVIEWER 2 cannot REJECT before their turn (at Step 1)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('rejectRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute reject action before approval by reviewer 1');
        });

        it('REVIEWER 2 cannot REJECT when form is at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('rejectRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute reject action after approval by reviewer 2');
        });

        it('REVIEWER 2 cannot REJECT when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('rejectRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute reject action after approval by reviewer 3');
        });

        it('REVIEWER 2 cannot REJECT when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('rejectRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute reject action after approval by reviewer 4');
        });

        it('REVIEWER 3 cannot REJECT before their turn (at Step 1)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('rejectRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute reject action before approval by reviewer 1');
        });

        it('REVIEWER 3 cannot REJECT before their turn (at Step 2)', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('rejectRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute reject action before approval by reviewer 2');
        });

        it('REVIEWER 3 cannot REJECT when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('rejectRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute reject action after approval by reviewer 3');
        });

        it('REVIEWER 3 cannot REJECT when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('rejectRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute reject action after approval by reviewer 4');
        });

        it('REVIEWER 4 cannot REJECT before their turn (at Step 1)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('rejectRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute reject action before approval by reviewer 1');
        });

        it('REVIEWER 4 cannot REJECT before their turn (at Step 2)', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('rejectRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute reject action before approval by reviewer 2');
        });

        it('REVIEWER 4 cannot REJECT before their turn (at Step 3)', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('rejectRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute reject action before approval by reviewer 3');
        });

        it('REVIEWER 4 cannot REJECT when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('rejectRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute reject action after approval by reviewer 4');
        });
    });

    describe('Forbidden APPROVE Attempts', () => {

        it('REVIEWER 1 cannot APPROVE when form is at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('approveRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute approve action after approval by reviewer 1');
        });

        it('REVIEWER 1 cannot APPROVE when form is at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('approveRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute approve action after approval by reviewer 2');
        });

        it('REVIEWER 1 cannot APPROVE when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('approveRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute approve action after approval by reviewer 3');
        });

        it('REVIEWER 1 cannot APPROVE when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('approveRequest', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be authorized to execute approve action after approval by reviewer 4');
        });

        it('REVIEWER 2 cannot APPROVE before their turn (at Step 1)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('approveRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute approve action before approval by reviewer 1');
        });

        it('REVIEWER 2 cannot APPROVE when form is at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('approveRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute approve action after approval by reviewer 2');
        });

        it('REVIEWER 2 cannot APPROVE when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('approveRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute approve action after approval by reviewer 3');
        });

        it('REVIEWER 2 cannot APPROVE when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('approveRequest', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be authorized to execute approve action after approval by reviewer 4');
        });

        it('REVIEWER 3 cannot APPROVE before their turn (at Step 1)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('approveRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute approve action before approval by reviewer 1');
        });

        it('REVIEWER 3 cannot APPROVE before their turn (at Step 2)', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('approveRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute approve action before approval by reviewer 2');
        });

        it('REVIEWER 3 cannot APPROVE when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('approveRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute approve action after approval by reviewer 3');
        });

        it('REVIEWER 3 cannot APPROVE when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('approveRequest', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be authorized to execute approve action after approval by reviewer 4');
        });

        it('REVIEWER 4 cannot APPROVE before their turn (at Step 1)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('approveRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute approve action before approval by reviewer 1');
        });

        it('REVIEWER 4 cannot APPROVE before their turn (at Step 2)', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('approveRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute approve action before approval by reviewer 2');
        });

        it('REVIEWER 4 cannot APPROVE before their turn (at Step 3)', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('approveRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute approve action before approval by reviewer 3');
        });

        it('REVIEWER 4 cannot APPROVE when form is Fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('approveRequest', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be authorized to execute approve action after approval by reviewer 4');
        });
    });

    describe('Unassigned Reviewer Attempts', () => {

        it('UNASSIGNED REVIEWER cannot APPROVE at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('approveRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute approve action');
        });

        it('UNASSIGNED REVIEWER cannot APPROVE at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('approveRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute approve action');
        });

        it('UNASSIGNED REVIEWER cannot APPROVE at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('approveRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute approve action');
        });

        it('UNASSIGNED REVIEWER cannot APPROVE at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('approveRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute approve action');
        });

        it('UNASSIGNED REVIEWER cannot REJECT at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('rejectRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute reject action');
        });

        it('UNASSIGNED REVIEWER cannot REJECT at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('rejectRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute reject action');
        });

        it('UNASSIGNED REVIEWER cannot REJECT at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('rejectRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute reject action');
        });

        it('UNASSIGNED REVIEWER cannot REJECT at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('rejectRequest', newFormID, unassignedReviewerAuth, 403, 'Unassigned reviewer should NOT be authorized to execute reject action');
        });
        
    });

    describe('RequestForm Entity - Allowed EDIT and UPDATE Attempts by Reviewer', () => {

        it('REVIEWER 1 can EDIT when form is at Step 0 (Sumitted)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, [200, 201], 'Reviewer 1 should be able to start an edit session on a new form', { PreserveChanges: true });
        });

        it('REVIEWER 1 can UPDATE when form is at Step 0 (Sumitted)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, [200, 201], 'Reviewer 1 should be able to start an edit session on a new form', { PreserveChanges: true });
            await checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=false)`, reviewer1Auth, 200, { materialGroupNumber_ProductGroup: 'ICT1002' });
        });

        it('REVIEWER 4 can EDIT when form has SAP_ERROR', async () => {
            const newFormID = await setupFormToStep(4); // Fully approved
            await cds.db.run(UPDATE('my.MaterialMasterData.RequestForm').set({ generalStatus: 'SAP_ERROR' }).where({ ID: newFormID }));
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, [200, 201], 'Reviewer 4 should be able to edit a form with SAP_ERROR status', { PreserveChanges: true });
        });

        it('REVIEWER 4 can UPDATE when form has SAP_ERROR', async () => {
            const newFormID = await setupFormToStep(4); // Fully approved
            await cds.db.run(UPDATE('my.MaterialMasterData.RequestForm').set({ generalStatus: 'SAP_ERROR' }).where({ ID: newFormID }));
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, [200, 201], 'Reviewer 4 should be able to edit a form with SAP_ERROR status', { PreserveChanges: true });
            await checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=false)`, reviewer4Auth, 200, { materialGroupNumber_ProductGroup: 'ICT1002' });
        });

    });
    
    describe('RequestForm Entity - Forbidden EDIT Attempts by Reviewer', () => {

        it('REVIEWER 1 cannot EDIT when form is at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit at step 2', { PreserveChanges: true });
        });

        it('REVIEWER 1 cannot EDIT when form is at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit at step 3', { PreserveChanges: true });
        });

        it('REVIEWER 1 cannot EDIT when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit at step 4', { PreserveChanges: true });
        });

        it('REVIEWER 1 cannot EDIT when form is fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit after final approval', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit at step 1', { PreserveChanges: true });
        });
        
        it('REVIEWER 2 cannot EDIT when form is at Step 2 (their turn)', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit at step 2', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit at step 3', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit at step 4', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit after final approval', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit at step 1', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit at step 2', { PreserveChanges: true });
        });
        
        it('REVIEWER 3 cannot EDIT when form is at Step 3 (their turn)', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit at step 3', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit at step 4', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is fully Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit after final approval', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form is at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit at step 1', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form is at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit at step 2', { PreserveChanges: true });
        });
        
        it('REVIEWER 4 cannot EDIT when form is at Step 3 (their turn)', async () => {
            const newFormID = await setupFormToStep(2);
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit at step 3', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form is at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit at step 4', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form has generalStatus Approved', async () => {
            const newFormID = await setupFormToStep(4);
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit after final approval', { PreserveChanges: true });
        });

        it('REVIEWER 1 cannot EDIT when form has SAP_ERROR', async () => {
            const newFormID = await setupFormToStep(4); // Fully approved
            await cds.db.run(UPDATE('my.MaterialMasterData.RequestForm').set({ generalStatus: 'SAP_ERROR' }).where({ ID: newFormID }));
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit a form with SAP_ERROR status', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form has SAP_ERROR', async () => {
            const newFormID = await setupFormToStep(4); // Fully approved
            await cds.db.run(UPDATE('my.MaterialMasterData.RequestForm').set({ generalStatus: 'SAP_ERROR' }).where({ ID: newFormID }));
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit a form with SAP_ERROR status', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form has SAP_ERROR', async () => {
            const newFormID = await setupFormToStep(4); // Fully approved
            await cds.db.run(UPDATE('my.MaterialMasterData.RequestForm').set({ generalStatus: 'SAP_ERROR' }).where({ ID: newFormID }));
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit a form with SAP_ERROR status', { PreserveChanges: true });
        });

    });

    describe('RequestForm Entity - Forbidden UPDATE Attempts by Reviewer', () => {

        it('REVIEWER 2 cannot UPDATE when form is at Step 0 (Submitted)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, requestorAuth, [200, 201], 'Requestor should be able to start an edit session on a new form', { PreserveChanges: true });
            await checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=false)`, reviewer2Auth, 403, { materialGroupNumber_ProductGroup: 'ICT1002' });
        });

        it('REVIEWER 3 cannot UPDATE when form is at Step 0 (Submitted)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, requestorAuth, [200, 201], 'Requestor should be able to start an edit session on a new form', { PreserveChanges: true });
            await checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=false)`, reviewer3Auth, 403, { materialGroupNumber_ProductGroup: 'ICT1002' });
        });

        it('REVIEWER 4 cannot UPDATE when form is at Step 0 (Submitted)', async () => {
            const newFormID = await setupFormToStep(0);
            await assertActionStatus('draftEdit', newFormID, requestorAuth, [200, 201], 'Requestor should be able to start an edit session on a new form', { PreserveChanges: true });
            await checkStatus('PATCH', `/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=false)`, reviewer4Auth, 403, { materialGroupNumber_ProductGroup: 'ICT1002' });
        });

    });

    describe('RequestForm Entity - Forbidden EDIT Attempts by Reviewer after rejection', () => {

        it('REVIEWER 1 cannot EDIT when form is rejected at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer1Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is rejected at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer1Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is rejected at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer1Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form is rejected at Step 1', async () => {
            const newFormID = await setupFormToStep(0);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer1Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 1 cannot EDIT when form is rejected at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer2Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is rejected at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer2Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is rejected at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer2Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form is rejected at Step 2', async () => {
            const newFormID = await setupFormToStep(1);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer2Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 1 cannot EDIT when form is rejected at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer3Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is rejected at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer3Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is rejected at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer3Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form is rejected at Step 3', async () => {
            const newFormID = await setupFormToStep(2);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer3Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 1 cannot EDIT when form is rejected at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer4Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer1Auth, 403, 'Reviewer 1 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 2 cannot EDIT when form is rejected at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer4Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer2Auth, 403, 'Reviewer 2 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 3 cannot EDIT when form is rejected at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer4Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer3Auth, 403, 'Reviewer 3 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

        it('REVIEWER 4 cannot EDIT when form is rejected at Step 4', async () => {
            const newFormID = await setupFormToStep(3);
            await POST(`/odata/v4/catalog/RequestForm(ID=${newFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer4Auth });
            await assertActionStatus('draftEdit', newFormID, reviewer4Auth, 403, 'Reviewer 4 should NOT be able to edit a rejected form', { PreserveChanges: true });
        });

    });

    describe('Approval Process - Hierarchy Configuration NOT Found', () => {

        it('REVIEWER should receive 403 when APPROVING and hierarchy is missing - formType not registered', async () => {
            const newFormID = await insertSubmittedFormNoHierarchy('NoHierarchy', '3080');
            await assertActionStatus('approveRequest', newFormID, reviewer1Auth, 403, 'Should return 403 when hierarchy configuration is missing', {}, 'not authorized to edit the form at this stage');
        });

        it('REVIEWER should receive 403 when APPROVING and hierarchy is missing - plant not registered', async () => {
            const newFormID = await insertSubmittedFormNoHierarchy('NewStock', '1111');
            await assertActionStatus('approveRequest', newFormID, reviewer1Auth, 403, 'Should return 403 when hierarchy configuration is missing', {}, 'not authorized to edit the form at this stage');
        });

        it('REVIEWER should receive 403 when REJECTING and hierarchy is missing - formType not registered', async () => {
            const newFormID = await insertSubmittedFormNoHierarchy('NoHierarchy', '3080');
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 403, 'Should return 403 when hierarchy configuration is missing', {}, 'not authorized to edit the form at this stage');
        });

        it('REVIEWER should receive 403 when REJECTING and hierarchy is missing - plant not registered', async () => {
            const newFormID = await insertSubmittedFormNoHierarchy('NewStock', '1111');
            await assertActionStatus('rejectRequest', newFormID, reviewer1Auth, 403, 'Should return 403 when hierarchy configuration is missing', {}, 'not authorized to edit the form at this stage');
        });

        it('REQUESTOR cannot SUBMIT a form whose plant/type has no hierarchy (400)', async () => {
            // plant 1111 has no approval hierarchy — activation (submission) must be blocked.
            // setupFormToStep fills a full NewStock payload and calls draftActivate, which now throws.
            let status, msg;
            try {
                await setupFormToStep(0, 'NewStock', '1111');
            } catch (err) {
                status = err.response?.status || err.status;
                msg = err.response?.data?.error?.message || err.message;
            }
            assert.strictEqual(status, 400, 'Submitting a plant/type combination with no hierarchy should be blocked');
            assert.match(msg || '', /No approval hierarchy is configured/, 'Error should point the user to configure/select a valid plant');
        });

    });

    describe('Resubmission of Rejected Form by Requestor - RequestForm Entity', () => {
        let rejectedFormID;

        it('Setup: Form is rejected by Reviewer 1', async () => {
            rejectedFormID = await setupFormToStep(0, 'NewStock', '3080');
            await POST(`/odata/v4/catalog/RequestForm(ID=${rejectedFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, {}, { auth: reviewer1Auth });
        });

        it('REQUESTOR can Edit and Save (Resubmit) the rejected form', async () => {
            await assertActionStatus('draftEdit', rejectedFormID, requestorAuth, [200, 201], 'Requestor should edit rejected form', { PreserveChanges: true });
            
            await PATCH(`/odata/v4/catalog/RequestForm(ID=${rejectedFormID},IsActiveEntity=false)`, { safetyStockReq: '99' }, { auth: requestorAuth });
            await POST(`/odata/v4/catalog/RequestForm(ID=${rejectedFormID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth: requestorAuth });

            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${rejectedFormID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(res.data.generalStatus, 'Submitted', `Expected status to be reset to 'Submitted'`);
        });

        it('REVIEWER 1 can APPROVE again after resubmission', async () => {
            await assertActionStatus('approveRequest', rejectedFormID, reviewer1Auth, 204, 'Reviewer 1 should be able to approve the resubmitted form');
        });
    });

    // A user may hold BOTH the REQUESTOR and REVIEWER roles (user `reqrev`,
    // localreqrev@test.com). This suite guards the after('READ') editability logic:
    // the REVIEWER branch must not shadow the REQUESTOR branch, so a dual-role user
    // can still edit/resubmit their OWN rejected form — while ownership is enforced
    // and their reviewer capability is preserved.
    describe('Dual-Role User (REQUESTOR + REVIEWER) - Edit & Resubmit of a Rejected Form', () => {

        let ownFormID;     // form OWNED by the dual-role user (reqrev)
        let othersFormID;  // rejected form owned by a plain requestor

        it('Setup: reqrev-owned form and requestor-owned form are both rejected at Step 1', async () => {
            // NOTE: because `reqrev` also holds the REVIEWER role, _validateMandatoryFields
            // treats their submission as a "procurement approval" and additionally requires
            // materialGroupNumber / unitOfMeasure / minimumLotSize. Supply them here.
            ownFormID = await setupFormToStep(0, 'NewStock', '3080', null, {
                materialGroupNumber_ProductGroup: 'ICT1002',
                unitOfMeasure_UnitOfMeasure: 'EA',
                minimumLotSize: '1'
            }, reqrevAuth);
            await POST(`/odata/v4/catalog/RequestForm(ID=${ownFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, { comments: 'Please revise the justification' }, { auth: reviewer1Auth });

            // Owned by `requestor`, at plant 6060 where reqrev is the step-1 reviewer — so
            // reqrev can READ it (it is in their hierarchy) but does NOT own it. reqrev
            // rejects it in their reviewer capacity.
            othersFormID = await setupFormToStep(0, 'NewStock', '6060');
            await POST(`/odata/v4/catalog/RequestForm(ID=${othersFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, { comments: 'Rejected by reviewer' }, { auth: reqrevAuth });
        });

        it('DUAL-ROLE user sees isFormEditable=true on their OWN rejected form', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${ownFormID},IsActiveEntity=true)`, { auth: reqrevAuth });
            assert.strictEqual(res.data.generalStatus, 'Rejected', 'Precondition: the form should be Rejected');
            assert.strictEqual(res.data.isFormEditable, true, 'Dual-role user (as requestor/owner) should be able to edit their own rejected form');
            assert.strictEqual(res.data.isReviewPending, false, 'Dual-role user is not a reviewer of this form, so no review is pending');
        });

        it('DUAL-ROLE user can EDIT, SAVE and RESUBMIT their OWN rejected form', async () => {
            await assertActionStatus('draftEdit', ownFormID, reqrevAuth, [200, 201], 'Dual-role user should be able to start an edit session on their rejected form', { PreserveChanges: true });

            await PATCH(`/odata/v4/catalog/RequestForm(ID=${ownFormID},IsActiveEntity=false)`, { safetyStockReq: '77' }, { auth: reqrevAuth });
            await POST(`/odata/v4/catalog/RequestForm(ID=${ownFormID},IsActiveEntity=false)/CatalogService.draftActivate`, {}, { auth: reqrevAuth });

            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${ownFormID},IsActiveEntity=true)`, { auth: reqrevAuth });
            assert.strictEqual(res.data.generalStatus, 'Submitted', 'Resubmission should reset the status to Submitted');
        });

        it('REVIEWER 1 can APPROVE the dual-role user\'s resubmitted form', async () => {
            await assertActionStatus('approveRequest', ownFormID, reviewer1Auth, 204, 'Reviewer 1 should be able to approve the resubmitted form');
        });

        it('DUAL-ROLE user sees isFormEditable=false on a rejected form owned by SOMEONE ELSE', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${othersFormID},IsActiveEntity=true)`, { auth: reqrevAuth });
            assert.strictEqual(res.data.isFormEditable, false, 'Dual-role user must NOT be able to edit a rejected form they do not own');
        });

        it('Plain REQUESTOR (owner) still sees isFormEditable=true on their own rejected form (no regression)', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${othersFormID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(res.data.isFormEditable, true, 'The owning requestor should still be able to edit their rejected form');
        });
    });

    // The dual-role user's REVIEWER side must keep working: on plant 6060 they are the
    // configured step-1 reviewer of a form owned by someone else.
    describe('Dual-Role User (REQUESTOR + REVIEWER) - Reviewer Capability Preserved', () => {

        let reviewFormID;

        it('Setup: `requestor` creates a form at plant 6060 (reqrev is the step-1 reviewer)', async () => {
            reviewFormID = await setupFormToStep(0, 'NewStock', '6060', [reqrevAuth, reviewer2Auth]);
        });

        it('DUAL-ROLE user sees isReviewPending=true and isFormEditable=true when it is their review turn', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${reviewFormID},IsActiveEntity=true)`, { auth: reqrevAuth });
            assert.strictEqual(res.data.isReviewPending, true, 'Dual-role user should have a pending review at step 1');
            assert.strictEqual(res.data.isFormEditable, true, 'Dual-role user (as reviewer) can edit at step 1');
        });

        it('DUAL-ROLE user can APPROVE as the step-1 reviewer', async () => {
            await assertActionStatus('approveRequest', reviewFormID, reqrevAuth, 204, 'Dual-role user should be able to approve as the assigned step-1 reviewer');
        });

        it('Form advances to "Partially Approved" after the dual-role user approves', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${reviewFormID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(res.data.generalStatus, 'Partially Approved', 'Form should advance to the next step');
        });
    });

    describe('Multiple Approvers in the Same Step', () => {
        let parallelFormID;

        it('Setup: Create form', async () => {
            parallelFormID = await setupFormToStep(0, 'NewStock', '3080');
        });

        it('REVIEWER 1_1 can APPROVE, moving flow to Step 2', async () => {
            await assertActionStatus('approveRequest', parallelFormID, reviewer1_1Auth, 204, 'Reviewer 1_1 should be able to approve the form');
        });

        it('REVIEWER 1 cannot APPROVE anymore because step 1 is done', async () => {
            await assertActionStatus('approveRequest', parallelFormID, reviewer1Auth, 403, 'Reviewer 1 should not be able to approve after a peer already approved');
        });

        it('REVIEWER 1 cannot REJECT anymore because step 1 is done', async () => {
            await assertActionStatus('rejectRequest', parallelFormID, reviewer1Auth, 403, 'Reviewer 1 should not be able to reject after a peer already approved');
        });
    });

    describe('SAP_ERROR Retry Flow - RequestForm Entity', () => {
        let errorFormID;

        it('Setup: Fully approved form gets SAP_ERROR', async () => {
            errorFormID = await setupFormToStep(4, 'NewStock', '3080');
            await cds.db.run(UPDATE('my.MaterialMasterData.RequestForm').set({ generalStatus: 'SAP_ERROR' }).where({ ID: errorFormID }));
        });

        it('REVIEWER 4 (Last Approver) can APPROVE again to retry', async () => {
            await assertActionStatus('approveRequest', errorFormID, reviewer4Auth, 204, 'Reviewer 4 should be able to re-approve a form with SAP_ERROR');
        });

        it('Form status should be "Approved" after successful retry', async () => {
            const res = await GET(`/odata/v4/catalog/RequestForm(ID=${errorFormID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(res.data.generalStatus, 'Approved', `Expected generalStatus to be 'Approved' after retry`);
        });
    });

    describe('Material Creation Values - Configuration Logic Evaluation', () => {

        async function triggerMaterialCreation(plant, formType, isRepairable, estCostPerUnit, reviewerAuthParam = reviewer1Auth) {
            const draftPayload = {
                isRepairable: isRepairable,
                estCostPerUnit: estCostPerUnit
            };
            
            if (isRepairable) draftPayload.estRepairTime = '10';

            const formID = await setupFormToStep(0, formType, plant, null, draftPayload);

            try {
                const res = await POST(`/odata/v4/catalog/RequestForm(ID=${formID},IsActiveEntity=true)/CatalogService.approveRequest`, {}, { auth: reviewerAuthParam });
                return { status: res.status, data: res.data, formID: formID };
            } catch (err) {
                return { status: err.response?.status || 500, error: err.response?.data?.error?.message || err.message, formID: formID };
            }
        }

        it('Should flag the form as SAP_ERROR if NO material creation configuration exists for the Plant and Type', async () => {
            // Plant 8888 has a configured hierarchy, but NO entry in MaterialCreationValues
            const result = await triggerMaterialCreation('8888', 'NewStock', false, 1000);
            assert.strictEqual(result.status, 204, 'Approval should still succeed; SAP creation failure is non-fatal');
            const form = await GET(`/odata/v4/catalog/RequestForm(ID=${result.formID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(form.data.generalStatus, 'SAP_ERROR', 'Form should be flagged SAP_ERROR due to missing base configuration');
            assert.ok(form.data.sapError.includes('No Material Creation defaults found for Plant 8888, Type NewStock'), 'The sapError should indicate the missing defaults');
        });

        it('Should flag the form as SAP_ERROR if input data does not match configuration requirements', async () => {
            const result = await triggerMaterialCreation('7777', 'NewStock', true, 1000);
            assert.strictEqual(result.status, 204, 'Approval should still succeed; SAP creation failure is non-fatal');
            const form = await GET(`/odata/v4/catalog/RequestForm(ID=${result.formID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(form.data.generalStatus, 'SAP_ERROR', 'Form should be flagged SAP_ERROR due to no matching config row');
            assert.ok(form.data.sapError.includes('No Material Creation defaults found for Plant 7777, Type NewStock'), 'The sapError should indicate the missing defaults');
        });

        it('Should be successful (204) when RequestForm conditions perfectly match a row (< 5000)', async () => {
            const result = await triggerMaterialCreation('7777', 'NewStock', false, 4000);
            assert.strictEqual(result.status, 204, 'Approval and data assignment should execute without issues');
        });

        it('Should be successful (204) when RequestForm conditions perfectly match another row (> 5000)', async () => {
            const result = await triggerMaterialCreation('7777', 'NewStock', false, 6000);
            assert.strictEqual(result.status, 204, 'Approval and data assignment should execute without issues');
        });

        it('Should be successful (204) when RequestForm conditions match the row with > operator (exactly 5000)', async () => {
            const result = await triggerMaterialCreation('7777', 'NewStock', false, 5000);
            assert.strictEqual(result.status, 204, 'Approval and data assignment should execute without issues for exact threshold match');
        });

        it('Should flag the form as SAP_ERROR if NO material creation configuration exists for the Plant and Type (NonStock)', async () => {
            // Plant 9999 has a configured hierarchy for NonStock, but NO entry in MaterialCreationValues
            const result = await triggerMaterialCreation('9999', 'NonStock', null, 1000, rev1_3030Auth);
            assert.strictEqual(result.status, 204, 'Approval should still succeed; SAP creation failure is non-fatal');
            const form = await GET(`/odata/v4/catalog/RequestForm(ID=${result.formID},IsActiveEntity=true)`, { auth: requestorAuth });
            assert.strictEqual(form.data.generalStatus, 'SAP_ERROR', 'Form should be flagged SAP_ERROR due to missing base configuration for NonStock');
            assert.ok(form.data.sapError.includes('No Material Creation defaults found for Plant 9999, Type NonStock'), 'The sapError should indicate the missing defaults');
        });

        it('Should be successful (204) when RequestForm conditions perfectly match a row for NonStock', async () => {
            // Plant 3333 has configuration for NonStock
            const result = await triggerMaterialCreation('3333', 'NonStock', null, 1000, rev1_3333Auth);
            assert.strictEqual(result.status, 204, 'Approval and data assignment should execute without issues for NonStock');
        });
    });


    describe('1. MANAGER Role', () => {
        let managerFormID;

        it('Setup: Create form for MANAGER tests', async () => {
            managerFormID = await setupFormToStep(0);
        });

        it('should READ ReviewHierarchy', () => checkStatus('GET', '/odata/v4/catalog/ReviewHierarchy', adminAuth, 200));
        it('should READ PlanningLead', () => checkStatus('GET', '/odata/v4/catalog/PlanningLead', adminAuth, 200));
        it('should READ CharacteristicConfig', () => checkStatus('GET', '/odata/v4/catalog/CharacteristicConfig', adminAuth, 200));
        it('should READ MaterialCreationValues', () => checkStatus('GET', '/odata/v4/catalog/MaterialCreationValues', adminAuth, 200));
        it('should READ FormApprovalSteps', () => checkStatus('GET', '/odata/v4/catalog/FormApprovalSteps', adminAuth, 200));
        
        it('should not execute approveRequest action', () => checkStatus('POST', `/odata/v4/catalog/RequestForm(ID=${managerFormID},IsActiveEntity=true)/CatalogService.approveRequest`, adminAuth, 403, {}));
        it('should not execute rejectRequest action', () => checkStatus('POST', `/odata/v4/catalog/RequestForm(ID=${managerFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, adminAuth, 403, {}));

        it('should CREATE PlanningLead', () => checkStatus('POST', '/odata/v4/catalog/PlanningLead', adminAuth, 201, { type: 'BOM', email: 'planner@test.com' }));
        it('should CREATE CharacteristicConfig', () => checkStatus('POST', '/odata/v4/catalog/CharacteristicConfig', adminAuth, 201, { charcDesc: 'Test', useValueList: true }));
        it('should CREATE MaterialCreationValues', () => checkStatus('POST', '/odata/v4/catalog/MaterialCreationValues', adminAuth, 201, { category: 'Test', plant_Plant: '3080' }));
        it('should CREATE ReviewHierarchy', () => checkStatus('POST', '/odata/v4/catalog/ReviewHierarchy', adminAuth, 201, { PlantName: 'Test Plant', step: 1, reviewer: 'test@test.com' }));
        
        let leadToDeleteID;
        
        it('should CREATE a PlanningLead to be deleted', async () => {
            const res = await POST('/odata/v4/catalog/PlanningLead', { type: 'InfoRecord', email: 'to_delete@test.com' }, { auth: adminAuth });
            assert.strictEqual(res.status, 201, 'Should create PlanningLead successfully');
            leadToDeleteID = res.data.ID;
        });
        it('should DELETE PlanningLead', () => checkStatus('DELETE', `/odata/v4/catalog/PlanningLead(ID=${leadToDeleteID},IsActiveEntity=false)`, adminAuth, 204));
    });

    describe('2. REQUESTOR Role', () => {
        let requestorFormID;

        it('Setup: Create form for REQUESTOR tests', async () => {
            requestorFormID = await setupFormToStep(0);
        });

        it('should READ FormApprovalSteps', () => checkStatus('GET', '/odata/v4/catalog/FormApprovalSteps', requestorAuth, 200));

        it('should not READ ReviewHierarchy', () => checkStatus('GET', '/odata/v4/catalog/ReviewHierarchy', requestorAuth, 403));
        it('should not READ PlanningLead', () => checkStatus('GET', '/odata/v4/catalog/PlanningLead', requestorAuth, 403));
        it('should not READ CharacteristicConfig', () => checkStatus('GET', '/odata/v4/catalog/CharacteristicConfig', requestorAuth, 403));
        it('should not READ MaterialCreationValues', () => checkStatus('GET', '/odata/v4/catalog/MaterialCreationValues', requestorAuth, 403));
        
        it('should not execute approveRequest action', () => checkStatus('POST', `/odata/v4/catalog/RequestForm(ID=${requestorFormID},IsActiveEntity=true)/CatalogService.approveRequest`, requestorAuth, 403, {}));
        it('should not execute rejectRequest action', () => checkStatus('POST', `/odata/v4/catalog/RequestForm(ID=${requestorFormID},IsActiveEntity=true)/CatalogService.rejectRequest`, requestorAuth, 403, {}));
    });

    describe('3. REVIEWER Role', () => {

        it('should READ ReviewHierarchy', () => checkStatus('GET', '/odata/v4/catalog/ReviewHierarchy', reviewerAuth, 200));
        it('should READ MaterialCreationValues', () => checkStatus('GET', '/odata/v4/catalog/MaterialCreationValues', reviewerAuth, 200));
        it('should READ FormApprovalSteps', () => checkStatus('GET', '/odata/v4/catalog/FormApprovalSteps', reviewerAuth, 200));

        it('should not READ PlanningLead', () => checkStatus('GET', '/odata/v4/catalog/PlanningLead', reviewerAuth, 403));
        it('should not READ CharacteristicConfig', () => checkStatus('GET', '/odata/v4/catalog/CharacteristicConfig', reviewerAuth, 403));

        it('should not CREATE ReviewHierarchy', () => checkStatus('POST', '/odata/v4/catalog/ReviewHierarchy', reviewerAuth, 403, { step: 1 }));
        it('should not CREATE MaterialCreationValues', () => checkStatus('POST', '/odata/v4/catalog/MaterialCreationValues', reviewerAuth, 403, { category: 'Test' }));
    });

    describe('4. Unauthorized User', () => {
        it('should not READ RequestForm', () => checkStatus('GET', '/odata/v4/catalog/RequestForm', unauthorizedAuth, 403));
        it('should not READ ReviewHierarchy', () => checkStatus('GET', '/odata/v4/catalog/ReviewHierarchy', unauthorizedAuth, 403));
        it('should not READ PlanningLead', () => checkStatus('GET', '/odata/v4/catalog/PlanningLead', unauthorizedAuth, 403));
        it('should not READ CharacteristicConfig', () => checkStatus('GET', '/odata/v4/catalog/CharacteristicConfig', unauthorizedAuth, 403));
        it('should not READ MaterialCreationValues', () => checkStatus('GET', '/odata/v4/catalog/MaterialCreationValues', unauthorizedAuth, 403));
        it('should not READ FormApprovalSteps', () => checkStatus('GET', '/odata/v4/catalog/FormApprovalSteps', unauthorizedAuth, 403));
    });
});