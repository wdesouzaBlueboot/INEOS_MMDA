using my.MaterialMasterData as my from '../db/schema';
using { plant as externalPlant } from './external/plant';
using { class as externalClass } from './external/class';
using { characteristic as externalCharact } from './external/characteristic';
using { material as externalMaterial } from './external/material';
using { material2 as externalMaterial2 } from './external/material2';
using { vendor as externalVendor } from './external/vendor';

service CatalogService {
    
    // ---- EXTERNAL SERVICES PROJECTIONS ----
    @readonly
    entity Plant                        as projection on externalPlant.A_Plant;
    @readonly
    entity Vendor                       as projection on externalVendor.A_Supplier {
        Supplier,
        SupplierFullName,
        SupplierName
    };

    @readonly
    entity MaterialGroup as projection on externalMaterial2.I_ProductGroup_2;

    @readonly
    entity Material2                    as projection on externalMaterial2.I_Product {
        Product,
        ProductType,
        Product_Text
    };
    @readonly
    entity MaterialClass                as projection on externalClass.A_ClfnClassForKeyDate {
        ClassInternalID,
        ClassType,
        Class,
    };

    @readonly
    entity ClassCharacteristic as projection on externalCharact.A_ClfnCharacteristicForKeyDate {
        key CharcInternalID,
        Characteristic,
    };

    @readonly
    entity UnitOfMeasure as projection on externalMaterial2.I_UnitOfMeasure {
        UnitOfMeasure,
        UnitOfMeasure_Text
    };

    // ---- FIORI APPLICATIONS ENTRY POINTS ---- 
    
    @odata.draft.enabled
    @cds.redirection.target
    entity ReviewHierarchy @(restrict: [
        { 
            grant: '*', 
            to: 'MANAGER'
        },
        { 
            grant: 'READ', 
            to: 'REVIEWER'
        }
    ]) as projection on my.ReviewHierarchy;

    @odata.draft.enabled
    entity PlanningLead @(restrict: [
        { 
            grant: '*', 
            to: 'MANAGER'
        }
    ]) as projection on my.PlanningLead;

    @odata.draft.enabled
    @odata.draft.bypass
    entity CharacteristicConfig @(restrict: [
        { 
            grant: '*', 
            to: 'MANAGER'
        }
    ]) as projection on my.CharacteristicConfig;

    @odata.draft.enabled
    @odata.draft.bypass
    entity MaterialCreationValues @(restrict: [
        { 
            grant: 'READ', 
            to: 'REVIEWER'
        },
        { 
            grant: '*', 
            to: 'MANAGER'
        }
    ]) as projection on my.MaterialCreationValues;

    @odata.draft.enabled
    entity RequestForm @(restrict: [
        // Requestors can only manage their own records
        { 
            grant: ['READ', 'CREATE'], 
            to: 'REQUESTOR',
            where: 'createdBy = $user'
        },
        { 
            grant: 'UPDATE', 
            to: 'REQUESTOR', 
            where: 'createdBy = $user and (generalStatus = ''Draft'' or generalStatus = ''Submitted'' or generalStatus = ''Rejected'' or generalStatus is null)'
        },
        { 
            grant: ['READ', 'UPDATE'], // create permission is needed in order to upload attachments
            to: 'REVIEWER',
            where: ((exists toReviewHierarchy[reviewer = $user.email]) or (exists toFormApprovalSteps[reviewedBy = $user.email]))
        },
        { 
            grant: 'READ', 
            to: 'MANAGER'
        }
    ]) as projection on my.RequestForm {
        *, 
        virtual isReviewPending: Boolean @readonly,
        virtual isFormEditable: Boolean @readonly,
        virtual areFieldsEditable: Boolean @readonly,
        toApprovalFlow : Association to many ApprovalFlow on toApprovalFlow.parentFormID = ID,
        true as actionRequiredOnly: Boolean, // is true so the filter is not applied by default
    
    } actions {
        action approveRequest @(restrict: [
            { 
                grant: '*', 
                to: 'REVIEWER'
            }
        ])();
        action rejectRequest @(restrict: [
            { 
                grant: '*', 
                to: 'REVIEWER'
            }
        ])(
            @Common.Label: 'Rejection Comments'
            @UI.MultiLineText: true
            comments: String(1000)
        );
    };

    annotate RequestForm.attachments with @(restrict: [
        { 
            grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], 
            to: 'REVIEWER',
            where: ((exists up_.toReviewHierarchy[reviewer = $user.email]) or (exists up_.toFormApprovalSteps[reviewedBy = $user.email]))
        },
        { 
            grant: ['READ', 'CREATE', 'UPDATE', 'DELETE'], 
            to: 'REQUESTOR', 
            where: 'up_.createdBy = $user and (up_.generalStatus = ''Draft'' or up_.generalStatus = ''Submitted'' or up_.generalStatus = ''Rejected'' or up_.generalStatus is null)' 
        }
    ]);
    
    // ---- Request and Approval Process Entities ----

    entity FormApprovalSteps @(restrict: [
        { 
            grant: 'READ', 
            to: ['REQUESTOR', 'MANAGER']
        },
        { 
            grant: 'DELETE', // while resubmitting the form, the existing approval steps will be deleted
            to: 'REQUESTOR'
        },
        { 
            grant: ['READ', 'CREATE', 'UPDATE'],
            to: 'REVIEWER' 
        }
    ]) as projection on my.FormApprovalSteps;

    @readonly
    entity ConfiguredPlants             as projection on my.ConfiguredPlants;
    entity ConfiguredPlantsByType       as projection on my.ConfiguredPlantsByType;

    @readonly
    entity FormType                     as projection on my.FormType;

    @readonly
    entity ChemicalApproval             as projection on my.ChemicalApproval;

    @readonly
    entity PlanningLeadType             as projection on my.PlanningLeadType;

    @readonly
    entity FormTypeWithAll              as projection on my.FormTypeWithAll;

    @readonly
    entity ConfiguredPlantsWithAll      as projection on my.ConfiguredPlantsWithAll;

    @readonly
    @cds.persistence.skip
    entity ApprovalFlow {
        key ID          : UUID;
        parentFormID    : UUID; 
        step            : Integer;
        reviewer        : String(100);
        status          : String(20); // 'PENDING', 'APPROVED', 'REJECTED'
        reviewedAt      : DateTime;
    };

    // ---- Custom Actions, Functions & Types ----

    function getCharacteristicsDetails(classId: String) returns many CharacteristicValue;

    function getPossibleValues(charId: String) returns many {
        valueId     : String(70);
    };

    function getPlantsForMaterial(productId: String, formType: String) returns many {
        plant     : String(4);
        plantName : String(30);
    };

    function getUserInfo() returns {
        isReviewer: Boolean;
        isRequestor: Boolean;
    };

    type CharacteristicValue {
        charId         : String(10);
        name           : String(30);
        description    : String(30);
        hasValueList   : Boolean;
        unit           : String(3);
        dataType       : String(4);
        currency       : String(3);
        length         : Integer;
        decimals       : Integer;
        selectedValue  : String(70);
    }
}