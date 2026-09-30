using CatalogService as service from '../../srv/cat-service';
using from '../common';


annotate service.PlanningLead with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : type,
                Label : '{i18n>Type}',
            },
            {
                $Type : 'UI.DataField',
                Value : formType_code,
                Label : '{i18n>RequestType}',
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Plant}',
                Value : plant_plant_Plant,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Email}',
                Value : email,
            },
            {
                $Type : 'UI.DataField',
                Value : name,
                Label : '{i18n>Name}',
            }
        ]
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet',
            Label : '{i18n>GeneralInformation}',
            Target : '@UI.FieldGroup#GeneratedGroup',
        }
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : type,
            Label : '{i18n>Type}',
        },
        {
            $Type : 'UI.DataField',
            Value : formType_code,
            Label : '{i18n>RequestType}',
        },
        {
            $Type : 'UI.DataField',
            Value : plant_plant_Plant,
            Label : '{i18n>Plant}',
        },
        {
            $Type : 'UI.DataField',
            Value : email, 
            Label : '{i18n>Email}'
        },
        {
            $Type : 'UI.DataField',
            Value : name,
            Label : '{i18n>Name}',
        }
    ],
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : type,
        },
        TypeName : '',
        TypeNamePlural : '',
    }
);

annotate service.PlanningLead with {
    plant @Common.Text : plant.PlantName
};

annotate service.PlanningLead with @(
    UI.PresentationVariant : {
        $Type     : 'UI.PresentationVariantType',
        SortOrder : [
            {
                $Type      : 'Common.SortOrderType',
                Property   : type,
                Descending : false 
            }
        ],
        Visualizations : [
            '@UI.LineItem',
        ]
    }
);

annotate service.PlanningLead with @(
    Common.SideEffects #PlantChange : {
        SourceProperties : [
            plant_plant_Plant
        ],
        TargetProperties : [
            'plant_plant_Plant'
        ]
    },
    Common.SideEffects #FormTypeChange : {
        SourceProperties : [
            formType_code
        ],
        TargetProperties : [
            'formType_code'
        ]
    }
);
annotate service.PlanningLead with {
    type @Common.FieldControl : #Mandatory
};

annotate service.PlanningLead with {
    name @Common.FieldControl : #Mandatory
};

annotate service.PlanningLead with {
    email @Common.FieldControl : #Mandatory
};

annotate service.PlanningLead {
    ID @UI.Hidden : true;
};

annotate service.PlanningLead with {
    type              @Common.Label : '{i18n>Type}';
    formType          @(
        Common.Label : '{i18n>RequestType}',
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
            Label : '{i18n>FormType}',
        },
    );
    plant             @Common.Label : '{i18n>Plant}';
    email             @Common.Label : '{i18n>Email}';
    name              @Common.Label : '{i18n>Name}';
};
