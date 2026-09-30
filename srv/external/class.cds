/* checksum : c8e0bc7803926bb157478368c77df806 */
@cds.external : true
@m.IsDefaultEntityContainer : 'true'
@sap.message.scope.supported : 'true'
@sap.supported.formats : 'atom json xlsx'
service class {
  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  @sap.deletable.path : 'Delete_mc'
  @sap.updatable.path : 'Update_mc'
  @sap.label : 'Class Characteristics'
  entity A_ClfnClassCharcForKeyDate {
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal class no.'
    @sap.quickinfo : 'Internal Class Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.value.list : 'standard'
    key ClassInternalID : String(10) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Characteristic Internal ID'
    key CharcInternalID : String(10) not null;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Delete_mc : Boolean;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Update_mc : Boolean;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CharcPositionNumber : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Characteristic Name'
    Characteristic : String(30);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal class no.'
    @sap.quickinfo : 'Internal Class Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    AncestorClassInternalID : String(10);
    @sap.display.format : 'NonNegative'
    @sap.label : 'Characteristic Internal ID'
    OriginalCharcInternalID : String(10);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Change Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ChangeNumber : String(12);
    CharcIsPrintRelevant : String(1);
    CharcIsSearchRelevant : String(1);
    CharcIsDisplayRelevant : String(1);
    @sap.display.format : 'Date'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ValidityStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Valid to'
    @sap.quickinfo : 'Valid-to date'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ValidityEndDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Proposal Rel.'
    @sap.quickinfo : 'Proposal Relevant'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CharcIsProposalRelevant : Boolean;
    @sap.display.format : 'Date'
    @sap.label : 'Date data element for SYST'
    @sap.heading : ''
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    KeyDate : Date;
    @odata.Type : 'Edm.DateTimeOffset'
    @odata.Precision : 7
    @sap.label : 'Time Stamp'
    @sap.quickinfo : 'UTC Time Stamp in Long Form (YYYYMMDDhhmmssmmmuuun)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassLastChangedDateTime : Timestamp;
    to_Class : Association to A_ClfnClassForKeyDate {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.deletable : 'false'
  @sap.content.version : '1'
  @sap.updatable.path : 'Update_mc'
  @sap.label : 'Class Descriptions'
  entity A_ClfnClassDescForKeyDate {
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal class no.'
    @sap.quickinfo : 'Internal Class Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key ClassInternalID : String(10) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Update_mc : Boolean;
    @sap.label : 'Description'
    @sap.quickinfo : 'Class Description'
    ClassDescription : String(40);
    @sap.display.format : 'Date'
    @sap.label : 'Date data element for SYST'
    @sap.heading : ''
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    KeyDate : Date;
    @odata.Type : 'Edm.DateTimeOffset'
    @odata.Precision : 7
    @sap.label : 'Time Stamp'
    @sap.quickinfo : 'UTC Time Stamp in Long Form (YYYYMMDDhhmmssmmmuuun)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassLastChangedDateTime : Timestamp;
    to_Class : Association to A_ClfnClassForKeyDate {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  @sap.deletable.path : 'Delete_mc'
  @sap.updatable.path : 'Update_mc'
  @sap.label : 'Class Header Data'
  entity A_ClfnClassForKeyDate {
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal class no.'
    @sap.quickinfo : 'Internal Class Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key ClassInternalID : String(10) not null;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Delete_mc : Boolean;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Update_mc : Boolean;
    @sap.label : 'Dynamic CbA-Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    to_ClassCharacteristic_oc : Boolean;
    @sap.label : 'Dynamic CbA-Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    to_ClassDescription_oc : Boolean;
    @sap.label : 'Dynamic CbA-Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    to_ClassKeyword_oc : Boolean;
    @sap.label : 'Dynamic CbA-Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    to_ClassText_oc : Boolean;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Class Type'
    ClassType : String(3);
    @sap.label : 'Description'
    @sap.quickinfo : 'Text describing class type'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassTypeName : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Class'
    @sap.quickinfo : 'Class number'
    Class : String(18);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Status'
    @sap.quickinfo : 'Class status'
    ClassStatus : String(1);
    @sap.label : 'Text'
    @sap.quickinfo : 'Text for a table entry'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassStatusName : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Class group'
    @sap.quickinfo : 'Class Group'
    ClassGroup : String(10);
    @sap.label : 'Class Group'
    @sap.quickinfo : 'Class Group Description'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassGroupName : String(40);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Find objects'
    @sap.quickinfo : 'Authorization group for finding objects'
    ClassSearchAuthGrp : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Classification'
    @sap.quickinfo : 'Classification authorization group'
    ClassClassfctnAuthGrp : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Class maintenance'
    @sap.quickinfo : 'Class maintenance authorization group'
    ClassMaintAuthGrp : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document'
    @sap.quickinfo : 'Document number'
    DocNumber : String(25);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Type'
    DocumentType : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Part'
    DocumentPart : String(3);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Document Version'
    DocumentVersion : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Single-Character Flag'
    @sap.heading : ''
    SameClassfctnReaction : String(1);
    @sap.label : 'Standard'
    @sap.quickinfo : 'Name of standards organization'
    ClassStandardOrgName : String(10);
    @sap.label : 'Standard number'
    @sap.quickinfo : 'Standard Number'
    ClassStandardNumber : String(20);
    @sap.display.format : 'Date'
    @sap.label : 'Issue date'
    ClassStandardStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Version date'
    ClassStandardVersionStartDate : Date;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Version Number'
    ClassStandardVersion : String(2);
    @sap.display.format : 'UpperCase'
    @sap.label : 'Chars table'
    @sap.quickinfo : 'Characteristics table'
    ClassStandardCharcTable : String(20);
    @sap.display.format : 'Date'
    @sap.label : 'Created On'
    @sap.quickinfo : 'Record Created On'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    CreationDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Changed On'
    @sap.quickinfo : 'Last Changed On'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    LastChangeDate : Date;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Local class'
    ClassIsLocal : Boolean;
    @sap.display.format : 'Date'
    @sap.label : 'Valid From'
    @sap.quickinfo : 'Valid-From Date'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ValidityStartDate : Date;
    @sap.display.format : 'Date'
    @sap.label : 'Valid to'
    @sap.quickinfo : 'Valid-to date'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ValidityEndDate : Date;
    @odata.Type : 'Edm.DateTimeOffset'
    @odata.Precision : 7
    @sap.label : 'Time Stamp'
    @sap.quickinfo : 'UTC Time Stamp in Long Form (YYYYMMDDhhmmssmmmuuun)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassLastChangedDateTime : Timestamp;
    @sap.display.format : 'Date'
    @sap.label : 'Date data element for SYST'
    @sap.heading : ''
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    KeyDate : Date;
    to_ClassCharacteristic : Composition of many A_ClfnClassCharcForKeyDate {  };
    to_ClassDescription : Composition of many A_ClfnClassDescForKeyDate {  };
    to_ClassKeyword : Composition of many A_ClfnClassKeywordForKeyDate {  };
    to_ClassText : Composition of many A_ClfnClassTextForKeyDate {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  @sap.deletable.path : 'Delete_mc'
  @sap.updatable.path : 'Update_mc'
  @sap.label : 'Class Keywords'
  entity A_ClfnClassKeywordForKeyDate {
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal class no.'
    @sap.quickinfo : 'Internal Class Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.value.list : 'standard'
    key ClassInternalID : String(10) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'NonNegative'
    @sap.label : 'Item number'
    @sap.quickinfo : 'Item Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key ClassKeywordPositionNumber : String(2) not null;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Delete_mc : Boolean;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Update_mc : Boolean;
    @sap.label : 'Keyword'
    @sap.quickinfo : 'Keywords'
    ClassKeywordText : String(40);
    @sap.display.format : 'Date'
    @sap.label : 'Date data element for SYST'
    @sap.heading : ''
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    KeyDate : Date;
    @odata.Type : 'Edm.DateTimeOffset'
    @odata.Precision : 7
    @sap.label : 'Time Stamp'
    @sap.quickinfo : 'UTC Time Stamp in Long Form (YYYYMMDDhhmmssmmmuuun)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassLastChangedDateTime : Timestamp;
    to_Class : Association to A_ClfnClassForKeyDate {  };
  };

  @cds.external : true
  @cds.persistence.skip : true
  @sap.content.version : '1'
  @sap.deletable.path : 'Delete_mc'
  @sap.updatable.path : 'Update_mc'
  @sap.label : 'Class Texts'
  entity A_ClfnClassTextForKeyDate {
    @sap.display.format : 'NonNegative'
    @sap.label : 'Internal class no.'
    @sap.quickinfo : 'Internal Class Number'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    key ClassInternalID : String(10) not null;
    @sap.label : 'Language Key'
    key Language : String(2) not null;
    @sap.display.format : 'UpperCase'
    @sap.label : 'Text ID'
    key LongTextID : String(4) not null;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Delete_mc : Boolean;
    @sap.label : 'Dyn. Method Control'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    @sap.sortable : 'false'
    @sap.filterable : 'false'
    Update_mc : Boolean;
    @sap.label : 'Description'
    @sap.quickinfo : 'Long Text Description'
    ClassText : String(40);
    @sap.display.format : 'Date'
    @sap.label : 'Date data element for SYST'
    @sap.heading : ''
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    KeyDate : Date;
    @odata.Type : 'Edm.DateTimeOffset'
    @odata.Precision : 7
    @sap.label : 'Time Stamp'
    @sap.quickinfo : 'UTC Time Stamp in Long Form (YYYYMMDDhhmmssmmmuuun)'
    @sap.creatable : 'false'
    @sap.updatable : 'false'
    ClassLastChangedDateTime : Timestamp;
    to_Class : Association to A_ClfnClassForKeyDate {  };
  };
};

