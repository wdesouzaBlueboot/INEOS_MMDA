using CatalogService as service from '../srv/cat-service';

annotate service.RequestForm with {
    plant @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'ConfiguredPlantsByType',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : plant_plant_Plant,
                    ValueListProperty : 'plant_Plant',
                },
                {
                    // Filter the plant options by the selected form type, so only plants
                    // configured for that type in the approval hierarchy appear.
                    $Type : 'Common.ValueListParameterIn',
                    LocalDataProperty : formType_code,
                    ValueListProperty : 'formType_code',
                },
            ],
        },
        Common.ValueListWithFixedValues : true,
)};

annotate service.PlanningLead with {
    plant @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'ConfiguredPlantsWithAll',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : plant_plant_Plant,
                    ValueListProperty : 'plant_Plant',
                },
            ],
        },
        Common.ValueListWithFixedValues : true,
)};

annotate service.MaterialCreationValues with {
    requestPlant @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'ConfiguredPlants',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : requestPlant_plant_Plant,
                    ValueListProperty : 'plant_Plant',
                },
            ],
        },
        Common.ValueListWithFixedValues : true,
)};

annotate service.ConfiguredPlants with {
    plant @Common.Text : PlantName
};

annotate service.ConfiguredPlantsByType with {
    plant @Common.Text : PlantName
};

annotate service.ConfiguredPlantsWithAll with {
    plant_Plant @Common.Text : PlantName
};

annotate service.RequestForm with {
    formType @(
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
            Label : 'Form Type',
        },
        Common.ValueListWithFixedValues : true,
        Common.FieldControl : #Mandatory,
        Common.Text : formType.description,
        Common.Text.@UI.TextArrangement : #TextOnly,
)};

annotate service.PlanningLead with {
    formType @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'FormTypeWithAll',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : formType_code,
                    ValueListProperty : 'code',
                },
            ],
            Label : 'Form Type',
        },
        Common.ValueListWithFixedValues : true,
        Common.Text.@UI.TextArrangement : #TextOnly,
)};

annotate service.PlanningLead with {
    type @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'PlanningLeadType',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : type,
                    ValueListProperty : 'code',
                },
            ],
        },
        Common.ValueListWithFixedValues : true,
)};

annotate service.PlanningLeadType with {
    code @Common.Text : description
};

annotate service.FormTypeWithAll with {
    code @Common.Text : description
};

annotate service.MaterialCreationValues with {
    formType @(
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
            Label : 'Request Type',
        },
        Common.ValueListWithFixedValues : true,
        Common.Text.@UI.TextArrangement : #TextOnly,
)};

annotate service.ReviewHierarchy with {
    formType @(
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
            Label : 'Type',
        },
        Common.ValueListWithFixedValues : true,
        Common.Text.@UI.TextArrangement : #TextOnly,
)};

annotate service.ReviewHierarchy with {
    plant @(
        Common.Text : plant.PlantName,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Plant',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : plant_Plant,
                    ValueListProperty : 'Plant',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'PlantName',
                },
            ],
            Label : '{i18n>PlantLocation}',
        },
        Common.ValueListWithFixedValues : false,
        Common.FieldControl : #Mandatory,
    )
};

annotate service.MaterialCreationValues with {
    plant @(
        Common.Text : plant.PlantName,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Plant',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : plant_Plant,
                    ValueListProperty : 'Plant',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'PlantName',
                },
            ],
            Label : '{i18n>PlantLocation}',
        },
        Common.ValueListWithFixedValues : false,
        Common.FieldControl : #Mandatory,
    )
};
