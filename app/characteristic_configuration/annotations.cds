using CatalogService as service from '../../srv/cat-service';
annotate service.CharacteristicConfig with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Label : '{i18n>CharacteristicId}',
                Value : charcID_CharcInternalID,
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>UseValueList}',
                Value : useValueList,
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
            Label : '{i18n>CharcteristicId}',
            Value : charcID_CharcInternalID,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>CharcteristicDescription}',
            Value : charcDesc,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>UseValueList}',
            Value : useValueList,
        },
    ],
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : charcDesc,
        },
        TypeName : '',
        TypeNamePlural : '',
    },
);

annotate service.CharacteristicConfig with {
    charcID @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'ClassCharacteristic',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : charcID_CharcInternalID,
                    ValueListProperty : 'CharcInternalID',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'Characteristic',
                },
            ],
        },
        Common.ValueListWithFixedValues : false,
        Common.FieldControl : #Mandatory,
        )
};

annotate service.ClassCharacteristic with {
    CharcInternalID @(
        Common.Text : Characteristic,
        )
};


annotate service.CharacteristicConfig {
    ID @UI.Hidden : true;
};

annotate service.CharacteristicConfig with {
    charcID                 @Common.Label : '{i18n>CharcteristicId}';
    charcDesc               @Common.Label : '{i18n>CharcteristicDescription}';
    useValueList            @Common.Label : '{i18n>UseValueList}';
};
