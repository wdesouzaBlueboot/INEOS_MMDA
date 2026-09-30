using CatalogService as service from '../../srv/cat-service';
using from '../common';

annotate service.ReviewHierarchy with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : plant_Plant,
                Label : '{i18n>Plant}',
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>Step}',
                Value : step,
            },
            {
                $Type : 'UI.DataField',
                Value : formType_code,
                Label : '{i18n>Type}',
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>ReviewerEmail}',
                Value : reviewer,
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
            Value : plant_Plant,
            Label : '{i18n>Plant}',
        },
        {
            $Type : 'UI.DataField',
            Value : PlantName,
            Label : '{i18n>PlantName}',
        },
        {
            $Type : 'UI.DataField',
            Value : formType_code,
            Label : '{i18n>Type}',
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>Step}',
            Value : step,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>Reviewer}',
            Value : reviewer,
        },
    ],
    UI.HeaderInfo : {
        TypeName : '',
        TypeNamePlural : '',
    },
);

annotate service.Plant with {
    Plant @Common.Text : PlantName
};

annotate service.ReviewHierarchy with {
    reviewer @Common.FieldControl : #Mandatory
};

annotate service.ReviewHierarchy with {
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
            Label : '{i18n>Type}',
        },
    )
};

annotate service.ReviewHierarchy with {
    step @Common.FieldControl : #Mandatory
};

annotate service.ReviewHierarchy {
    ID @UI.Hidden : true;
};

annotate service.ReviewHierarchy with {
    plant         @Common.Label : '{i18n>Plant}';
    PlantName     @Common.Label : '{i18n>PlantName}';
    formType      @Common.Label : '{i18n>Type}';
    step          @Common.Label : '{i18n>Step}';
    reviewer      @Common.Label : '{i18n>Reviewer}';
};
