using CatalogService as service from '../../srv/cat-service';
using from '../common';


annotate service.RequestForm with {
    formNumber     @readonly;
    requestorName  @readonly;
    requestorEmail @readonly;
};

annotate service.RequestForm with @(
    UI.PresentationVariant : {
        $Type          : 'UI.PresentationVariantType',
        SortOrder      : [
            {
                $Type      : 'Common.SortOrderType',
                Property   : modifiedAt,
                Descending : true,
            },
        ],
        Visualizations : ['@UI.LineItem'],
    },
    UI.FieldGroup #NonToStock : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : isMdata48h,
            },
            {
                $Type : 'UI.DataField',
                Value : sapMaterialNumber_Product,
            },
            {
                $Type : 'UI.DataField',
                Value : materialDescription,
            },
            {
                $Type : 'UI.DataField',
                Value : justification,
                Label : '{i18n>JustifyTheChange}',
            },
            {
                $Type : 'UI.DataField',
                Value : isRepairable,
            },
            {
                $Type : 'UI.DataField',
                Value : estRepairTime,
                @UI.Hidden : { 
                    $edmJson: { 
                        $Not: { $Path: 'isRepairable' }
                    }
                },
            },
            {
                $Type : 'UI.DataField',
                Value : maxQtyPerUse,
            },
            {
                $Type : 'UI.DataField',
                Value : safetyStockReq,
            },
            {
                $Type : 'UI.DataField',
                Value : specialStorageReq,
            },
            {
                $Type : 'UI.DataField',
                Value : isPreventativeMaintReq,
            },
            {
                $Type : 'UI.DataField',
                Value : willReqSupplyStock,
            },
        ],
    },
);

annotate service.RequestForm with @(
    UI.FieldGroup #GeneratedGroup : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : formType_code,
                Label : '{i18n>FormType}',
            },
            {
                $Type : 'UI.DataField',
                Value : generalStatus,
                Label : '{i18n>GeneralStatus}',
                @UI.Hidden : {$edmJson: {$Not: {$Path: 'IsActiveEntity'}}},
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>RejectionComments}',
                Value : rejectionComments,
                @UI.Hidden           : { $edmJson: { $Or: [
                    { $Eq: [{ $Path: 'rejectionComments' }, null] },
                    { $Eq: [{ $Path: 'rejectionComments' }, ''] }
                ]}},
            },
            {
                $Type : 'UI.DataField',
                Label : '{i18n>SapError}',
                Value : sapError,
                @UI.Hidden           : { $edmJson: { $Or: [
                    { $Eq: [{ $Path: 'sapError' }, null] },
                    { $Eq: [{ $Path: 'sapError' }, ''] }
                ]}},
            },
            {
                $Type : 'UI.DataField',
                Value : sapMaterialNumber_Product,
                @UI.Hidden : { $edmJson: { $Or: [
                    { $Ne: [{ $Path: 'generalStatus' }, 'Approved'] },
                    { $And: [
                        { $Ne: [{ $Path: 'formType_code' }, 'NewStock'] },
                        { $Ne: [{ $Path: 'formType_code' }, 'NonStock'] }
                    ]}
                ]}},
            },
            {
                $Type : 'UI.DataField',
                Value : materialDescription,
                @UI.Hidden : { $edmJson: { $Or: [
                    { $Not: { $Path: 'IsActiveEntity' } },
                    { $And: [
                        { $Ne: [{ $Path: 'formType_code' }, 'NewStock'] },
                        { $Ne: [{ $Path: 'formType_code' }, 'NonStock'] }
                    ]}
                ]}},
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
        {
            $Type       : 'UI.CollectionFacet',
            ID          : 'ApprovalStatusCollection',
            Label       : '{i18n>ApprovalStatus}',
            Facets      : [
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'ApprovalStatusDetails',
                    Target : 'toApprovalFlow/@UI.LineItem#ApprovalStatusDetails',
                }
            ],
            @UI.Hidden : {$edmJson: {$Not: {$Path: 'IsActiveEntity'}}},
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>NewStock}',
            ID : 'NewStock',
            Target : '@UI.FieldGroup#NewStock',
            @UI.Hidden : { $edmJson : { $Not : { $Eq : [
                { $Path : 'formType_code' },
                'NewStock'
            ]}}}
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>NonStock}',
            ID : 'NonStock',
            Target : '@UI.FieldGroup#NonStock',
            @UI.Hidden : { $edmJson : { $Not : { $Eq : [
                { $Path : 'formType_code' },
                'NonStock'
            ]}}}
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>Deletion}',
            ID : 'Deletion',
            Target : '@UI.FieldGroup#Deletion',
            @UI.Hidden : { $edmJson : { $Not : { $Eq : [
                { $Path : 'formType_code' },
                'Deletion'
            ]}}}
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>SafetyStock}',
            ID : 'SafetyStock',
            Target : '@UI.FieldGroup#SafetyStock',
            @UI.Hidden : { $edmJson : { $Not : { $Eq : [
                { $Path : 'formType_code' },
                'SafetyStock'
            ]}}}
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>NonstockToNewStock}',
            ID : 'NonToStock',
            Target : '@UI.FieldGroup#NonToStock',
            @UI.Hidden : { $edmJson : { $Not : { $Eq : [
                { $Path : 'formType_code' },
                'NonToStock'
            ]}}}
        },
        {
            $Type       : 'UI.CollectionFacet',
            ID          : 'AttachmentsCollection',
            Label       : '{i18n>Attachments}',
            Target : 'attachments/@UI.LineItem',
            Facets      : [
                {
                    $Type  : 'UI.ReferenceFacet',
                    ID     : 'AttachmentsFacet',
                    Target : 'attachments/@UI.LineItem',
                }
            ],
            @UI.Hidden : { $edmJson : { $Not : { $Or: [
                { $Eq: [{ $Path: 'formType_code' }, 'NewStock'] },
                { $Eq: [{ $Path: 'formType_code' }, 'NonStock'] }
            ]}}}
        },
    ],
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Label : '{i18n>FormNumber}',
            Value : formNumber,
        },
        {
            $Type : 'UI.DataField',
            Label : '{i18n>RequestorName}',
            Value : requestorName,
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
            Value : generalStatus,
            Label : '{i18n>Status}',
        },
        {
            $Type : 'UI.DataField',
            Value : vendor_Supplier,
            Label : '{i18n>Vendor}',
        },
        {
            $Type : 'UI.DataField',
            Value : materialClass_ClassInternalID,
            Label : '{i18n>MaterialClass}',
        },
    ],
    UI.FieldGroup #NewStock : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : isMdata48h,
                Label : '{i18n>IsMasterDataRequest}',
            },
            {
                $Type : 'UI.DataField',
                Value : isResultOfMOC,
                Label : '{i18n>IsThisRequestThe}',
            },
            {
                $Type : 'UI.DataField',
                Value : mocNumber,
                Label : '{i18n>MocNumber}',
                @UI.Hidden : { 
                    $edmJson: { 
                        $Not: { $Path: 'isResultOfMOC' }
                    }
                },
            },
            {
                $Type : 'UI.DataField',
                Value : plant_plant_Plant,
                Label : '{i18n>Plant}',
            },
            {
                $Type : 'UI.DataField',
                Value : functionalLocation,
                Label : '{i18n>FunctionalLocation}',
            },
            {
                $Type : 'UI.DataField',
                Value : equipmentNumber,
                Label : '{i18n>EquipmentSerialNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : chemicalApproval_code,
                Label : '{i18n>IfItemIsA}',
            },
            {
                $Type : 'UI.DataField',
                Value : isPartOfBOM,
                Label : '{i18n>WillItBeIncluded}',
            },
            {
                $Type : 'UI.DataField',
                Value : justification,
                Label : '{i18n>SummarizeTheJustificationFor}',
            },
            {
                $Type : 'UI.DataField',
                Value : vendor_Supplier,
                Label : '{i18n>Vendor}',
            },
            {
                $Type : 'UI.DataField',
                Value : vendorPartNumber,
                Label : '{i18n>VendorPartNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : manufacturer,
                Label : '{i18n>Manufacturer}',
            },
            {
                $Type : 'UI.DataField',
                Value : manufacturerPartNumber,
                Label : '{i18n>ManufacturerPartNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : materialClass_ClassInternalID,
                Label : '{i18n>MaterialClassDefineCharacteristic}',
            },
            {
                $Type : 'UI.DataField',
                Value : materialGroupNumber_ProductGroup,
                Label : '{i18n>MaterialGroupNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : estCostPerUnit,
                Label : '{i18n>EstimatedCostPerUnit}',
            },
            {
                $Type : 'UI.DataField',
                Value : unitOfMeasure_UnitOfMeasure,
                Label : '{i18n>UnitOfMeasure}',
            },
            {
                $Type : 'UI.DataField',
                Value : estUsagePerYear,
                Label : '{i18n>EstimatedUsagePerYear}',
            },
            {
                $Type : 'UI.DataField',
                Value : estDeliveryTime,
                Label : '{i18n>EstimatedDeliveryTime}',
            },
            {
                $Type : 'UI.DataField',
                Value : isRepairable,
                Label : '{i18n>IsItemRepairable}',
            },
            {
                $Type : 'UI.DataField',
                Value : estRepairTime,
                Label : '{i18n>RepairTimeEstimate}',
                @UI.Hidden : { 
                    $edmJson: { 
                        $Not: { $Path: 'isRepairable' }
                    }
                },
            },
            {
                $Type : 'UI.DataField',
                Value : maxQtyPerUse,
                Label : '{i18n>MaxQuantityPerSingle}',
            },
            {
                $Type : 'UI.DataField',
                Value : safetyStockReq,
                Label : '{i18n>SafetyStockRequested}',
            },
            {
                $Type : 'UI.DataField',
                Value : specialStorageReq,
                Label : '{i18n>AreThereSpecialStorage}',
            },
            {
                $Type : 'UI.DataField',
                Value : isPreventativeMaintReq,
                Label : '{i18n>IsPreventativeMaintReq}',
            },
            {
                $Type : 'UI.DataField',
                Value : willReqSupplyStock,
                Label : '{i18n>WillRequestorSupplyInitial}',
            },
            {
                $Type : 'UI.DataField',
                Value : minimumLotSize,
                Label : '{i18n>MinimumLotSize}',
            },
        ],
    },
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : formNumber,
        },
        TypeName : '',
        TypeNamePlural : '',
    },
    UI.FieldGroup #NonStock : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : isMdata48h,
                Label : '{i18n>IsMasterDataRequest}',
            },
            {
                $Type : 'UI.DataField',
                Value : isResultOfMOC,
                Label : '{i18n>IsThisRequestThe}',
            },
            {
                $Type : 'UI.DataField',
                Value : mocNumber,
                Label : '{i18n>MocNumber}',
                @UI.Hidden : { 
                    $edmJson: { 
                        $Not: { $Path: 'isResultOfMOC' }
                    }
                },
            },
            {
                $Type : 'UI.DataField',
                Value : plant_plant_Plant,
                Label : '{i18n>Plant}',
            },
            {
                $Type : 'UI.DataField',
                Value : equipmentNumber,
                Label : '{i18n>EquipmentSerialNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : chemicalApproval_code,
                Label : '{i18n>IfItemIsA}',
            },
            {
                $Type : 'UI.DataField',
                Value : isPartOfBOM,
                Label : '{i18n>WillItBeIncluded}',
            },
            {
                $Type : 'UI.DataField',
                Value : vendor_Supplier,
                Label : '{i18n>Vendor}',
            },
            {
                $Type : 'UI.DataField',
                Value : vendorPartNumber,
                Label : '{i18n>VendorPartNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : manufacturer,
                Label : '{i18n>Manufacturer}',
            },
            {
                $Type : 'UI.DataField',
                Value : manufacturerPartNumber,
                Label : '{i18n>ManufacturerPartNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : materialClass_ClassInternalID,
                Label : '{i18n>MaterialClassDefineCharacteristic}',
            },
            {
                $Type : 'UI.DataField',
                Value : materialGroupNumber_ProductGroup,
                Label : '{i18n>MaterialGroupNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : estCostPerUnit,
                Label : '{i18n>EstimatedCostPerUnit}',
            },
            {
                $Type : 'UI.DataField',
                Value : unitOfMeasure_UnitOfMeasure,
                Label : '{i18n>UnitOfMeasure1}',
            },
            {
                $Type : 'UI.DataField',
                Value : estDeliveryTime,
                Label : '{i18n>EstimatedDeliveryTime}',
            },
            {
                $Type : 'UI.DataField',
                Value : minimumLotSize,
                Label : '{i18n>MinimumLotSize}',
            },
        ],
    },
    UI.FieldGroup #Deletion : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : sapMaterialNumber_Product,
                Label : '{i18n>MaterialNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : materialDescription,
                Label : '{i18n>MaterialDescription}',
            },
        ],
    },
    UI.FieldGroup #SafetyStock : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : sapMaterialNumber_Product,
                Label : '{i18n>MaterialNumber}',
            },
            {
                $Type : 'UI.DataField',
                Value : materialDescription,
                Label : '{i18n>MaterialDescription}',
            },
            {
                $Type : 'UI.DataField',
                Value : safetyStockReq,
                Label : '{i18n>SafetyStockRequested}',
            },
        ],
    },
    UI.Identification : [
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'CatalogService.approveRequest',
            Label : '{i18n>Approve}',
            Determining : true,
            Criticality : #Positive,
            @UI.Hidden : {
                $edmJson: {
                    $Or: [
                        { $Not: { $Path: 'IsActiveEntity' } },
                        { $Not: { $Path: 'isReviewPending' } }
                    ]
                }
            },
        },
        {
            $Type : 'UI.DataFieldForAction',
            Action : 'CatalogService.rejectRequest',
            Label : '{i18n>Reject}',
            Determining : true,
            Criticality : #Negative,
            @UI.Hidden : {
                $edmJson: {
                    $Or: [
                        { $Not: { $Path: 'IsActiveEntity' } },
                        { $Not: { $Path: 'isReviewPending' } }
                    ]
                }
            },
        },
    ],
    UI.UpdateHidden : {
        $edmJson: { $Not: { $Path: 'isFormEditable' } }
    },
    UI.DeleteHidden : true,
    UI.SelectionFields : [
        actionRequiredOnly,
    ],
);

annotate service.FormType with {
    code @(
        Common.Text : description,
        Common.Text.@UI.TextArrangement : #TextFirst,
)};


annotate service.RequestForm with {
    rejectionComments @Common.FieldControl : #ReadOnly
};

annotate service.RequestForm with {
    sapError @Common.FieldControl : #ReadOnly
};

annotate service.RequestForm with 
    @UI.CreateHidden: {
        $edmJson: { $Not: { $Path: 'userContext>/isRequestor' } }
    };

annotate service.RequestForm with {
    materialClassCharact @Common.ExternalID : materialClass.ClassInternalID
};


annotate service.ApprovalFlow with @(
    UI.LineItem #ApprovalStatusDetails : [
        {
            $Type : 'UI.DataField',
            Value : step,
            Label : '{i18n>Step}',
        },
        {
            $Type : 'UI.DataField',
            Value : reviewer,
            Label : '{i18n>Reviewer}',
        },
        {
            $Type : 'UI.DataField',
            Value : status,
            Label : '{i18n>Status}',
        },
        {
            $Type : 'UI.DataField',
            Value : reviewedAt,
            Label : '{i18n>ReviewedAt}',
        },
    ],
);

annotate service.RequestForm with {
    sapMaterialNumber @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Material2',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : sapMaterialNumber_Product,
                    ValueListProperty : 'Product',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'Product_Text',
                },
            ],
        },
        Common.ValueListWithFixedValues : false,
        )};

annotate service.RequestForm with {
    materialClass @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'MaterialClass',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : materialClass_ClassInternalID,
                    ValueListProperty : 'ClassInternalID',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'Class',
                },
            ],
            Label : '{i18n>MaterialClass}',
        },
        Common.ValueListWithFixedValues : false,
        Common.Text : materialClass.Class,
        Common.Text.@UI.TextArrangement : #TextFirst,
    )
};

annotate service.RequestForm with {
    plant @(
        Common.Text : plant.PlantName,
        Common.FieldControl : #Mandatory,
    )
};

annotate service.RequestForm with {
    materialDescription @Common.FieldControl : #ReadOnly
};

annotate service.RequestForm with {
    justification @UI.MultiLineText : true
};

annotate service.RequestForm with {
    vendor @(
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'Vendor',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : vendor_Supplier,
                    ValueListProperty : 'Supplier',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'SupplierName',
                },
            ],
        },
        Common.ValueListWithFixedValues : false,
        Common.Text : vendor.SupplierName,
)};

annotate service.Vendor with {
    Supplier @Common.Text : SupplierName
};

annotate service.MaterialClass with {
    ClassInternalID @Common.Text : Class
};

annotate service.RequestForm with {
    materialGroupNumber @(
        Common.Text : materialGroupNumber.ProductGroup_Text,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'MaterialGroup',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : materialGroupNumber_ProductGroup,
                    ValueListProperty : 'ProductGroup',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'ProductGroup_Text',
                },
            ],
        },
        Common.ValueListWithFixedValues : false,
    )
};

annotate service.MaterialGroup with {
    ProductGroup @Common.Text : ProductGroup_Text
};

annotate service.RequestForm with {
    unitOfMeasure @(
        Common.Text : unitOfMeasure.UnitOfMeasure_Text,
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'UnitOfMeasure',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : unitOfMeasure_UnitOfMeasure,
                    ValueListProperty : 'UnitOfMeasure',
                },
                {
                    $Type : 'Common.ValueListParameterDisplayOnly',
                    ValueListProperty : 'UnitOfMeasure_Text',
                },
            ],
        },
        Common.ValueListWithFixedValues : false,
    )
};

annotate service.UnitOfMeasure with {
    UnitOfMeasure @Common.Text : UnitOfMeasure_Text
};

annotate service.RequestForm.attachments with @(
    UI.HeaderInfo: {
        TypeName: 'Attachment',
        TypeNamePlural: 'Attach a Vendor Quote or Manufacturer Specification sheet',
    }
);

annotate service.ApprovalFlow with @(
    UI.HeaderInfo: {
        TypeName: 'ApprovalFlow',
        TypeNamePlural: 'Details',
    },
);

annotate service.RequestForm with {
    actionRequiredOnly 
        @Common.Label : '{i18n>ActionRequired}'
        @Common.FilterDefaultValue : true
};

annotate service.RequestForm with {
    formNumber @Common.Label : '{i18n>FormNumber}';
    formType @Common.Label : '{i18n>FormType}';
    generalStatus @Common.Label : '{i18n>GeneralStatus}';
    materialClass @Common.Label : '{i18n>MaterialClass}';
    plant @Common.Label : '{i18n>Plant}';
    requestorName @Common.Label : '{i18n>RequestorName}';
    vendor @Common.Label : '{i18n>Vendor}';
    requestorEmail @Common.Label : '{i18n>Email}';
    rejectionComments @Common.Label : '{i18n>RejectionComments}';
    sapError @Common.Label : '{i18n>SapError}';
    isMdata48h @Common.Label : '{i18n>IsMasterDataRequest}';
    isResultOfMOC @Common.Label : '{i18n>IsThisRequestThe}';
    mocNumber @Common.Label : '{i18n>MocNumber}';
    functionalLocation @Common.Label : '{i18n>FunctionalLocation}';
    equipmentNumber @Common.Label : '{i18n>EquipmentSerialNumber}';
    chemicalApproval @(
        Common.Label : '{i18n>IfItemIsA}',
        Common.ValueList : {
            $Type : 'Common.ValueListType',
            CollectionPath : 'ChemicalApproval',
            Parameters : [
                {
                    $Type : 'Common.ValueListParameterInOut',
                    LocalDataProperty : chemicalApproval_code,
                    ValueListProperty : 'code',
                },
            ],
            PresentationVariantQualifier : 'vh_RequestForm_chemicalApproval',
        },
        Common.ValueListWithFixedValues : true,
        Common.Text : chemicalApproval.description,
        Common.Text.@UI.TextArrangement : #TextOnly,
    );
    isPartOfBOM @Common.Label : '{i18n>WillItBeIncluded}';
    justification @Common.Label : '{i18n>SummarizeTheJustificationFor}';
    vendorPartNumber @Common.Label : '{i18n>VendorPartNumber}';
    manufacturer @Common.Label : '{i18n>Manufacturer}';
    manufacturerPartNumber @Common.Label : '{i18n>ManufacturerPartNumber}';
    materialClassCharact @Common.Label : '{i18n>MaterialClassDefineCharacteristic}';
    materialGroupNumber @Common.Label : '{i18n>MaterialGroupNumber}';
    estCostPerUnit @Common.Label : '{i18n>EstimatedCostPerUnit}';
    unitOfMeasure @Common.Label : '{i18n>UnitOfMeasure}';
    estUsagePerYear @Common.Label : '{i18n>EstimatedUsagePerYear}';
    estDeliveryTime @Common.Label : '{i18n>EstimatedDeliveryTime}';
    isRepairable @Common.Label : '{i18n>IsItemRepairable}';
    estRepairTime @Common.Label : '{i18n>RepairTimeEstimate}';
    maxQtyPerUse @Common.Label : '{i18n>MaxQuantityPerSingle}';
    safetyStockReq @Common.Label : '{i18n>SafetyStockRequested}';
    specialStorageReq @Common.Label : '{i18n>AreThereSpecialStorage}';
    isPreventativeMaintReq @Common.Label : '{i18n>IsPreventativeMaintReq}';
    willReqSupplyStock @Common.Label : '{i18n>WillRequestorSupplyInitial}';
    minimumLotSize @Common.Label : '{i18n>MinimumLotSize}';
    sapMaterialNumber @Common.Label : '{i18n>MaterialNumber}';
    materialDescription @Common.Label : '{i18n>MaterialDescription}';
};


annotate service.RequestForm with @(
    Capabilities : {
        FilterRestrictions : {
            $Type : 'Capabilities.FilterRestrictionsType',
            RequiredProperties : [
                actionRequiredOnly
            ]
        }
    }
);

annotate service.RequestForm with actions {
    approveRequest @(
        Common.SideEffects : {
            TargetProperties : [
                'in/generalStatus',
                'in/isReviewPending',
                'in/isFormEditable',
                'in/sapError',
                'in/sapMaterialNumber_Product',
                'in/materialDescription'    
            ],
            TargetEntities : [
                'in/toApprovalFlow'
            ]
        }
    );
    rejectRequest @(
        Common.SideEffects : {
            TargetProperties : [
                'in/generalStatus',
                'in/isReviewPending',
                'in/isFormEditable',
                'in/sapError',
                'in/rejectionComments'
            ],
            TargetEntities : [
                'in/toApprovalFlow'
            ]
        }
    );
};

annotate service.RequestForm with {
    mocNumber @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $And : [
                        {
                            $Or : [
                                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                                { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                            ]
                        },
                        { $Eq : [ { $Path : 'isResultOfMOC' }, true ] }
                    ]
                },
                7,
                1 
            ]
        }
    }
};
annotate service.RequestForm with {
    functionalLocation @Common.FieldControl : {
        $edmJson : {
            $If : [
                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                7, // mandatory (7)
                1  // optional (1)  
            ]
        }
    }
};
annotate service.RequestForm with {
    equipmentNumber @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                    ]
                },
                7,
                1 
            ]
        }
    }
};
annotate service.RequestForm with {
    chemicalApproval @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};

annotate service.RequestForm with {
    justification @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    vendor @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    vendorPartNumber @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    manufacturer @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    manufacturerPartNumber @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    materialClass @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    materialGroupNumber @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $And : [
                        {
                            $Or : [
                                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                                { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                            ]
                        },
                        { $Eq : [ { $Path : 'areFieldsEditable' }, true ] }
                    ]
                },
                7,
                1
            ]
        }
    }
};
annotate service.RequestForm with {
    estCostPerUnit @(
        Common.FieldControl : {
            $edmJson : {
                $If : [
                    {
                        $Or : [
                            { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                            { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                        ]
                    },
                    7,
                    1  
                ]
            }
        },
        Measures.ISOCurrency : 'USD',
    )
};
annotate service.RequestForm with {
    unitOfMeasure @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $And : [
                        {
                            $Or : [
                                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                                { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                            ]
                        },
                        { $Eq : [ { $Path : 'areFieldsEditable' }, true ] }
                    ]
                },
                7,
                1 
            ]
        }
    }
};
annotate service.RequestForm with {
    estUsagePerYear @Common.FieldControl : {
        $edmJson : {
            $If : [
                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    estDeliveryTime @(
        Common.FieldControl : {
            $edmJson : {
                $If : [
                    {
                        $Or : [
                            { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                            { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                        ]
                    },
                    7,
                    1  
                ]
            }
        },
        Measures.Unit : 'Days',
    )
};
annotate service.RequestForm with {
    estRepairTime @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $And : [
                        {
                            $Or : [
                                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                                { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }
                            ]
                        },
                        { $Eq : [ { $Path : 'isRepairable' }, true ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    maxQtyPerUse @Common.FieldControl : {
        $edmJson : {
            $If : [
                { $Or : 
                    [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    safetyStockReq @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'SafetyStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    specialStorageReq @(
        Common.FieldControl : {
            $edmJson : {
                $If : [
                    { $Or : 
                        [
                            { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                            { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }
                        ]
                    },
                    7,
                    1  
                ]
            }
        },
        UI.MultiLineText : true,
    )
};
annotate service.RequestForm with {
    isPreventativeMaintReq @(
        Common.FieldControl : {
            $edmJson : {
                $If : [
                    { $Or : 
                        [
                            { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                            { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }
                        ]
                    },
                    7,
                    1  
                ]
            }
        },
        UI.MultiLineText : true,
    )
};
annotate service.RequestForm with {
    minimumLotSize @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $And : [
                        {
                            $Or : [
                                { $Eq : [ { $Path : 'formType_code' }, 'NewStock' ] },
                                { $Eq : [ { $Path : 'formType_code' }, 'NonStock' ] }
                            ]
                        },
                        { $Eq : [ { $Path : 'areFieldsEditable' }, true ] }
                    ]
                },
                7,
                1 
            ]
        }
    }
};
annotate service.RequestForm with {
    sapMaterialNumber @Common.FieldControl : {
        $edmJson : {
            $If : [
                {
                    $Or : [
                        { $Eq : [ { $Path : 'formType_code' }, 'SafetyStock' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'Deletion' ] },
                        { $Eq : [ { $Path : 'formType_code' }, 'NonToStock' ] }
                    ]
                },
                7,
                1  
            ]
        }
    }
};
annotate service.RequestForm with {
    formType @Common.ValueList : {
        $Type : 'Common.ValueListType',
        CollectionPath : 'FormType',
        Parameters : [
            {
                $Type : 'Common.ValueListParameterInOut',
                LocalDataProperty : formType_code,
                ValueListProperty : 'code',
            },
        ],
        Label : '{i18n>FormType}',
    }
};

annotate service.RequestForm {
    ID                      @UI.Hidden : true;
    isFormEditable          @UI.Hidden : true;
    isReviewPending         @UI.Hidden : true;
    areFieldsEditable      @UI.Hidden : true;
    requestorEmail          @UI.HiddenFilter : true;
    isMdata48h              @UI.HiddenFilter : true;
    isResultOfMOC           @UI.HiddenFilter : true;
    mocNumber               @UI.HiddenFilter : true;
    functionalLocation      @UI.HiddenFilter : true;
    equipmentNumber         @UI.HiddenFilter : true;
    chemicalApproval        @UI.HiddenFilter : true;
    isPartOfBOM             @UI.HiddenFilter : true;
    justification           @UI.HiddenFilter : true;
    vendorPartNumber        @UI.HiddenFilter : true;
    manufacturer            @UI.HiddenFilter : true;
    manufacturerPartNumber  @UI.HiddenFilter : true;
    materialClassCharact    @UI.HiddenFilter : true;
    materialGroupNumber     @UI.HiddenFilter : true;
    estCostPerUnit          @UI.HiddenFilter : true;
    unitOfMeasure           @UI.HiddenFilter : true;
    estUsagePerYear         @UI.HiddenFilter : true;
    estDeliveryTime         @UI.HiddenFilter : true;
    isRepairable            @UI.HiddenFilter : true;
    estRepairTime           @UI.HiddenFilter : true;
    maxQtyPerUse            @UI.HiddenFilter : true;
    safetyStockReq          @UI.HiddenFilter : true;
    specialStorageReq       @UI.HiddenFilter : true;
    isPreventativeMaintReq  @UI.HiddenFilter : true;
    willReqSupplyStock      @UI.HiddenFilter : true;
    minimumLotSize          @UI.HiddenFilter : true;
    sapMaterialNumber       @UI.HiddenFilter : true;
    materialDescription     @UI.HiddenFilter : true;
    rejectionComments       @UI.HiddenFilter : true;
    sapError                @UI.HiddenFilter : true;
};

annotate service.Material2 with {
    Product      @Common.Label : '{i18n>MaterialNumber}';
    Product_Text @Common.Label : '{i18n>MaterialDescription}';
};

annotate service.MaterialClass with {
    ClassInternalID @Common.Label : '{i18n>MaterialClass}';
    Class           @Common.Label : '{i18n>Description}';
};

annotate service.Vendor with {
    Supplier     @Common.Label : '{i18n>Vendor}';
    SupplierName @Common.Label : '{i18n>VendorName}';
};

annotate service.MaterialGroup with {
    ProductGroup      @Common.Label : '{i18n>MaterialGroupNumber}';
    ProductGroup_Text @Common.Label : '{i18n>Description}';
};

annotate service.UnitOfMeasure with {
    UnitOfMeasure      @Common.Label : '{i18n>UnitOfMeasure}';
    UnitOfMeasure_Text @Common.Label : '{i18n>Description}';
};
annotate service.ChemicalApproval with {
    code @(
        Common.Text : description,
        Common.Text.@UI.TextArrangement : #TextOnly,
)};

annotate service.ChemicalApproval with @(
    UI.PresentationVariant #vh_RequestForm_chemicalApproval : {
        $Type : 'UI.PresentationVariantType',
        SortOrder : [
            {
                $Type : 'Common.SortOrderType',
                Property : code,
                Descending : true,
            },
        ],
    }
);

