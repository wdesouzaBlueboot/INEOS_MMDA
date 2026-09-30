using CatalogService as service from '../../srv/cat-service';
using from '../common';

annotate service.MaterialCreationValues with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : '{i18n>PlantOfRequest}',
                Value : requestPlant_plant_Plant,
            },
            {
                $Type : 'UI.DataField',
                Value : formType_code,
                Label : '{i18n>RequestType}',
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>RepairableStatus}',
                Value : repairableStatus,
                @UI.Hidden : { $edmJson :  { $Eq : [
                    { $Path : 'formType_code' },
                    'NonStock'
                ]}},
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>CostOperator}',
                Value : costOperator,
                @UI.Hidden : { $edmJson : { $Not : { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] } } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>CostThreshold}',
                Value : costThreshold,
                @UI.Hidden : { $edmJson : { $Not : { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] } } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Category}',
                Value : category,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>IndustrySector}',
                Value : industrySector,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>MaterialType}',
                Value : materialType,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Plant}',
                Value : plant_Plant,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>PurchasingGroup}',
                Value : purchasingGroup,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>XplantMatStatus}',
                Value : xPlantMatStatus,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>PurchasingValueKey}',
                Value : purchasingValueKey,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>GrProcessingTime}',
                Value : grProcessingTime,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>MrpGroup}',
                Value : mrpGroup,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>MrpType}',
                Value : mrpType,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>MrpController}',
                Value : mrpController,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>LotSizeProcedure}',
                Value : lotSizeProcedure,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>ProdStorageLocation}',
                Value : prodStorageLocation,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>SchedMarginKey1}',
                Value : schedMarginKey,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>SafetyStock}',
                Value : safetyStock,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>AvailabilityCheck}',
                Value : availabilityCheck,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>StorageLocation}',
                Value : storageLocation,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>StorageBin}',
                Value : storageBin,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>ProfitCenter}',
                Value : profitCenter,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>ValuationClass}',
                Value : valuationClass,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>PriceCtrl}',
                Value : priceControl,
                @UI.Hidden : { $edmJson : { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] } },
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>StandardPrice}',
                Value : standardPrice,
                @UI.Hidden : { $edmJson : { $Not : { $Eq : [
                    { $Path : 'priceControl' },
                    'S'
                ]}}},
            },
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : '{i18n>GeneralInformation}',
            Target : '@UI.FieldGroup#GeneratedGroup',
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : '{i18n>RequestPlant}',
            Value : requestPlant_plant_Plant,
        },
        {
            $Type : 'UI.DataField',
            Value : formType_code,
            Label : '{i18n>RequestType}',
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>RepairableStatus}',
            Value : repairableStatus,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>CostOperator}',
            Value : costOperator,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>CostThreshold}',
            Value : costThreshold,
        },
        {
            $Type : 'UI.DataField',
            Value : category,
            Label : '{i18n>Category}',
        },
        {
            $Type : 'UI.DataField',
            Value : industrySector,
            Label : '{i18n>IndustrySector}',
        },
        {
            $Type : 'UI.DataField',
            Value : materialType,
            Label : '{i18n>MaterialType}',
        },
        {
            $Type : 'UI.DataField',
            Value : plant_Plant,
            Label : '{i18n>Plant}',
        },
        {
            $Type : 'UI.DataField',
            Value : purchasingGroup,
            Label : '{i18n>PurchasingGroup}',
        },
        {
            $Type : 'UI.DataField',
            Value : xPlantMatStatus,
            Label : '{i18n>XplantMatStatus}',
        },
        {
            $Type : 'UI.DataField',
            Value : purchasingValueKey,
            Label : '{i18n>PurchasingValueKey}',
        },
        {
            $Type : 'UI.DataField',
            Value : grProcessingTime,
            Label : '{i18n>GrProcessingTime}',
        },
        {
            $Type : 'UI.DataField',
            Value : mrpGroup,
            Label : '{i18n>MrpGroup}',
        },
        {
            $Type : 'UI.DataField',
            Value : mrpType,
            Label : '{i18n>MrpType}',
        },
        {
            $Type : 'UI.DataField',
            Value : mrpController,
            Label : '{i18n>MrpController}',
        },
        {
            $Type : 'UI.DataField',
            Value : lotSizeProcedure,
            Label : '{i18n>LotSizeProcedure}',
        },
        {
            $Type : 'UI.DataField',
            Value : prodStorageLocation,
            Label : '{i18n>ProdStorageLocation}',
        },
        {
            $Type : 'UI.DataField',
            Value : schedMarginKey,
            Label : '{i18n>SchedMarginKey}',
        },
        {
            $Type : 'UI.DataField',
            Value : safetyStock,
            Label : '{i18n>SafetyStock}',
        },
        {
            $Type : 'UI.DataField',
            Value : availabilityCheck,
            Label : '{i18n>AvailabilityCheck}',
        },
        {
            $Type : 'UI.DataField',
            Value : storageLocation,
            Label : '{i18n>StorageLocation}',
        },
        {
            $Type : 'UI.DataField',
            Value : storageBin,
            Label : '{i18n>StorageBin}',
        },
        {
            $Type : 'UI.DataField',
            Value : profitCenter,
            Label : '{i18n>ProfitCenter}',
        },
        {
            $Type : 'UI.DataField',
            Value : valuationClass,
            Label : '{i18n>ValuationClass}',
        },
        {
            $Type : 'UI.DataField',
            Value : priceControl,
            Label : '{i18n>PriceCtrl}',
        },
        {
            $Type : 'UI.DataField',
            Value : standardPrice,
            Label : '{i18n>StandardPrice}',
        },
    ],
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : requestPlant_plant_Plant,
        },
        TypeName : '',
        TypeNamePlural : '',
    },
    UI.SelectionPresentationVariant #tableView : {
        $Type : 'UI.SelectionPresentationVariantType',
        PresentationVariant : {
            $Type : 'UI.PresentationVariantType',
            Visualizations : [
                '@UI.LineItem',
            ],
        },
        SelectionVariant : {
            $Type : 'UI.SelectionVariantType',
            SelectOptions : [
            ],
        },
        Text : '{i18n>TableView}',
    },
);

annotate service.MaterialCreationValues with {
    requestPlant @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    formType @(
        Common.FieldControl : #Mandatory,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'FormType',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : formType_code,
                    ValueListProperty : 'code',
                },
            ],
            Label : '{i18n>RequestType}',
        },
    )
};

annotate service.MaterialCreationValues with {
    repairableStatus @Common.FieldControl : {
        $edmJson : {
            $If : [
                { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }},
                7,
                1
            ]
        }
    }
};

annotate service.MaterialCreationValues with {
    costOperator @Common.FieldControl : {
        $edmJson : {
            $If : [
                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                7,
                1
            ]
        }
    }
};

annotate service.MaterialCreationValues with {
    costThreshold @Common.FieldControl : {
        $edmJson : {
            $If : [
                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                7,
                1
            ]
        }
    }
};

annotate service.MaterialCreationValues with {
    industrySector @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    materialType @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    plant @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    xPlantMatStatus @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    purchasingValueKey @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    mrpGroup @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    mrpType @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    mrpController @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    lotSizeProcedure @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    prodStorageLocation @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    safetyStock @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    availabilityCheck @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    storageBin @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    profitCenter @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    valuationClass @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    priceControl @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    standardPrice @Common.FieldControl : {
        $edmJson : {
            $If : [
                { $Eq : [ { $Path : 'priceControl' }, 'S' ] },
                7,
                1
            ]
        }
    }
};
annotate service.MaterialCreationValues with {
    purchasingGroup @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    grProcessingTime @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    schedMarginKey @Common.FieldControl : { $edmJson : { $If : [ { $Not: { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }}, 7, 1 ] } }
};

annotate service.MaterialCreationValues with {
    storageLocation @Common.FieldControl : #Mandatory
};

annotate service.MaterialCreationValues with {
    requestPlant        @Common.Label : '{i18n>RequestPlant}';
    formType            @Common.Label : '{i18n>RequestType}';
    repairableStatus    @Common.Label : '{i18n>RepairableStatus}';
    costOperator        @Common.Label : '{i18n>CostOperator}';
    costThreshold       @Common.Label : '{i18n>CostThreshold}';
    category            @Common.Label : '{i18n>Category}';
    industrySector      @Common.Label : '{i18n>IndustrySector}';
    materialType        @Common.Label : '{i18n>MaterialType}';
    plant               @Common.Label : '{i18n>Plant}';
    purchasingGroup     @Common.Label : '{i18n>PurchasingGroup}';
    xPlantMatStatus     @Common.Label : '{i18n>XplantMatStatus}';
    purchasingValueKey  @Common.Label : '{i18n>PurchasingValueKey}';
    grProcessingTime    @Common.Label : '{i18n>GrProcessingTime}';
    mrpGroup            @Common.Label : '{i18n>MrpGroup}';
    mrpType             @Common.Label : '{i18n>MrpType}';
    mrpController       @Common.Label : '{i18n>MrpController}';
    lotSizeProcedure    @Common.Label : '{i18n>LotSizeProcedure}';
    prodStorageLocation @Common.Label : '{i18n>ProdStorageLocation}';
    schedMarginKey      @Common.Label : '{i18n>SchedMarginKey}';
    safetyStock         @Common.Label : '{i18n>SafetyStock}';
    availabilityCheck   @Common.Label : '{i18n>AvailabilityCheck}';
    storageLocation     @Common.Label : '{i18n>StorageLocation}';
    storageBin          @Common.Label : '{i18n>StorageBin}';
    profitCenter        @Common.Label : '{i18n>ProfitCenter}';
    valuationClass      @Common.Label : '{i18n>ValuationClass}';
    priceControl        @Common.Label : '{i18n>PriceCtrl}';
    standardPrice       @Common.Label : '{i18n>StandardPrice}';
};

annotate service.MaterialCreationValues {
    ID @UI.Hidden : true;
};