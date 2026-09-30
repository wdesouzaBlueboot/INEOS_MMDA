using { managed, cuid } from '@sap/cds/common';

using { plant as externalPlant } from '../srv/external/plant';
using { class as externalClass } from '../srv/external/class';
using { characteristic as externalCharact } from '../srv/external/characteristic';
using { material as externalMaterial } from '../srv/external/material';
using { material2 as externalMaterial2 } from '../srv/external/material2';
using { vendor as externalVendor } from '../srv/external/vendor';

using {Attachments} from '@cap-js/attachments';

namespace my.MaterialMasterData;

entity FormApprovalSteps : cuid {
    parentForm   : Association to RequestForm not null;

    step         : Integer not null;
    status       : String(20) enum {
        APPROVED = 'APPROVED';
        REJECTED = 'REJECTED';
    } not null;  
    
    reviewedBy   : String(100) not null;
    reviewedAt   : DateTime not null;
}

entity ReviewHierarchy: cuid {
    plant          : Association to externalPlant.A_Plant not null;
    PlantName      : String(30);
    formType       : Association to FormType not null;
    step           : Integer not null;
    reviewer       : String(100) not null;
}

view ConfiguredPlants as select from ReviewHierarchy {
    key plant,
    PlantName
} group by plant, PlantName;

// Distinct plants per form type — drives the plant value help so it only offers plants
// that actually have an approval hierarchy for the selected form type.
view ConfiguredPlantsByType as select from ReviewHierarchy {
    key plant,
    key formType,
    PlantName
} group by plant, formType, PlantName;

entity PlanningLead: cuid {
    @assert.range
    type        : String(20) enum {
        BOM        = 'BOM';
        InfoRecord = 'InfoRecord';
    } not null;
    formType    : Association to FormType default '*' not null;
    plant       : Association to ConfiguredPlants default '*' not null;
    email       : String(100) not null;
    name        : String(50) not null;
}

@assert.unique: { charcID: [ charcID ] }
entity CharacteristicConfig: cuid {
    charcID          : Association to externalCharact.A_ClfnCharacteristicForKeyDate not null;
    charcDesc        : String(100);
    useValueList     : Boolean default false; 
}

entity FormType {
    key code : String(12); 
    description : String(35);
}

entity ChemicalApproval {
    key code        : String(20);
    description     : String(30);
}

// Must stay in sync with the enum on PlanningLead.type.
entity PlanningLeadType {
    key code        : String(20);
    description     : String(30);
}

// PlanningLead accepts '*' (see the SAVE rules in cat-service.js), and a fixed-value help
// rejects any code missing from its collection before those rules ever run.
view SingleRow as select from FormType { count(*) as n : Integer }; // one row even when FormType is empty

view FormTypeWithAll as
        select from FormType { key code, description }
    union
        select from SingleRow { '*' as code : String(12), null as description : String(35) };

view ConfiguredPlantsWithAll as
        select from ReviewHierarchy { key plant.Plant as plant_Plant, PlantName }
        group by plant.Plant, PlantName
    union
        select from SingleRow { '*' as plant_Plant : String(4), null as PlantName : String(30) };

entity RequestForm : managed, cuid {
    formType                : Association to FormType not null;
    formNumber              : String(20) not null;
    requestorName           : String(30) not null;
    requestorEmail          : String(50) not null;
    generalStatus           : String(20);

    plant                   : Association to ConfiguredPlants;
    toFormApprovalSteps     : Association to many FormApprovalSteps on toFormApprovalSteps.parentForm = $self; 
    toReviewHierarchy       : Association to many ReviewHierarchy on toReviewHierarchy.plant.Plant = plant.plant.Plant and toReviewHierarchy.formType.code = formType.code;

    // ------ NewStock & NonStock ----------

    isMdata48h              : Boolean default false; 
    isResultOfMOC           : Boolean default false; 
    mocNumber               : String(50);
    
    functionalLocation      : String(100);              // NewStock
    equipmentNumber         : String(100);

    chemicalApproval       : Association to ChemicalApproval;
    isPartOfBOM             : Boolean default false;
    justification           : String(1000);             // NewStock

    vendor                  : Association to externalVendor.A_Supplier;
    vendorPartNumber        : String(100);
    manufacturer            : String(100);
    manufacturerPartNumber  : String(100);

    attachments             : Composition of many Attachments;

    materialClass           : Association to externalClass.A_ClfnClassForKeyDate; 
    materialClassCharact    : LargeString;
    materialGroupNumber     : Association to externalMaterial2.I_ProductGroup_2;
    estCostPerUnit          : Decimal(12, 3);  
    unitOfMeasure           : Association to externalMaterial2.I_UnitOfMeasure;
    
    estUsagePerYear         : Integer;                  // NewStock
    @assert.range: [0, 999]                             // limited to 3 digits
    estDeliveryTime         : Integer;

    isRepairable            : Boolean default false;    // NewStock
    estRepairTime           : String(100);              // NewStock
    maxQtyPerUse            : Integer;                  // NewStock
    @assert.format: '^[0-9]+$'
    @assert.format.message: 'Enter numeric values only.'
    safetyStockReq          : String(100);              // NewStock

    specialStorageReq       : String(1000);             // NewStock
    isPreventativeMaintReq  : String(1000);             // NewStock
    willReqSupplyStock      : Boolean default false;    // NewStock
    minimumLotSize          : Integer; 

    // ------ Deletion & SafetyStock ----------

    sapMaterialNumber       : Association to externalMaterial2.I_Product;
    materialDescription     : String(100);

    // ------ General Final Data ----------

    rejectionComments       : String(1000) default '';
    sapError                : String(1000) default '';
}

@assert.unique: { filters: [ requestPlant, formType, repairableStatus, costOperator, costThreshold] }
entity MaterialCreationValues: cuid {
    // Entry Filters
    requestPlant          : Association to ConfiguredPlants not null;
    formType              : Association to FormType not null; // request Type
    @assert.range
    repairableStatus      : String(20) enum {
        Repairable = 'Repairable';
        NotRepairable = 'Not Repairable';
    };
    @assert.range
    costOperator          : String(1) enum {
        lessThan = '<';
        greaterThan = '>';
    };
    costThreshold         : Decimal(12, 3);
    category              : String(40);

    industrySector        : String(1);
    materialType          : String(4);
    plant                 : Association to externalPlant.A_Plant not null;
    purchasingGroup       : String(3) not null;
    xPlantMatStatus       : String(2) not null;
    purchasingValueKey    : String(4);
    grProcessingTime      : Integer;

    mrpGroup              : String(4) not null;
    mrpType               : String(2) not null;
    mrpController         : String(3) not null;
    lotSizeProcedure      : String(2);
    prodStorageLocation   : String(4);
    schedMarginKey        : String(3);
    safetyStock           : Integer;
    availabilityCheck     : String(2);

    storageLocation       : String(4);
    storageBin            : String(20) not null;
    profitCenter          : String(10);
    valuationClass        : String(4);
    standardPrice         : Decimal(12, 3);
    @assert.range
    priceControl          : String(1) enum {
        standard = 'S';
        variable = 'V';
    };
}