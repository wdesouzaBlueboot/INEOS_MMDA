/* checksum : 8fae2e39f0beaa8415b7832692337691 */
@cds.external : true
@protocol : 'rfc'
service materialMasterBAPI {
  action BAPI_OBJCL_CHANGE(
    /** Change Number */
    @RFCParameterType : 'Import'
    CHANGENUMBER : String(12),
    /** Class Number */
    @RFCParameterType : 'Import'
    CLASSNUM : String(18) not null,
    /** Class Type */
    @RFCParameterType : 'Import'
    CLASSTYPE : String(3) not null,
    /** Receive Same Default Values */
    @RFCParameterType : 'Import'
    KEEP_SAME_DEFAULTS : String(1) default 'SPACE',
    /** Date */
    @RFCParameterType : 'Import'
    KEYDATE : Date,
    /** Default Values */
    @RFCParameterType : 'Import'
    NO_DEFAULT_VALUES : String(1) default 'SPACE',
    /** Object Key, Concatenated */
    @RFCParameterType : 'Import'
    OBJECTKEY : String(50),
    @RFCParameterType : 'Import'
    OBJECTKEY_LONG : String(90),
    /** Object Table */
    @RFCParameterType : 'Import'
    OBJECTTABLE : String(30) not null,
    /** Indicator: Standard Class */
    @RFCParameterType : 'Import'
    STANDARDCLASS : String(1),
    /** Classification Status */
    @RFCParameterType : 'Import'
    STATUS : String(1) default '1',
    /** New Assigned CHAR and BOOL Values */
    @RFCParameterType : 'Table'
    ALLOCVALUESCHARNEW : many DDIC.BAPI1003_ALLOC_VALUES_CHAR,
    /** New Assigned CURR Values */
    @RFCParameterType : 'Table'
    ALLOCVALUESCURRNEW : many DDIC.BAPI1003_ALLOC_VALUES_CURR,
    /** New NUM, DATE, and TIME Values */
    @RFCParameterType : 'Table'
    ALLOCVALUESNUMNEW : many DDIC.BAPI1003_ALLOC_VALUES_NUM,
    /** Error Messages */
    @RFCParameterType : 'Table'
    RETURN : many DDIC.BAPIRET2
  ) returns BAPI_OBJCL_CHANGE.ResultType;

  type BAPI_OBJCL_CHANGE.ResultType {
    /** Classification Status */
    @RFCParameterType : 'Export'
    CLASSIF_STATUS : String(1);
    /** New Assigned CHAR and BOOL Values */
    @RFCParameterType : 'Table'
    ALLOCVALUESCHARNEW : many DDIC.BAPI1003_ALLOC_VALUES_CHAR;
    /** New Assigned CURR Values */
    @RFCParameterType : 'Table'
    ALLOCVALUESCURRNEW : many DDIC.BAPI1003_ALLOC_VALUES_CURR;
    /** New NUM, DATE, and TIME Values */
    @RFCParameterType : 'Table'
    ALLOCVALUESNUMNEW : many DDIC.BAPI1003_ALLOC_VALUES_NUM;
    /** Error Messages */
    @RFCParameterType : 'Table'
    RETURN : many DDIC.BAPIRET2;
  };

  type DDIC.BAPI1003_ALLOC_VALUES_CHAR {
    CHARACT : String(30);
    VALUE_CHAR : String(30);
    INHERITED : String(1);
    @RFCAbapType : 'N'
    INSTANCE : String(3);
    VALUE_NEUTRAL : String(30);
    CHARACT_DESCR : String(30);
    VALUE_CHAR_LONG : String(70);
    VALUE_NEUTRAL_LONG : String(70);
  };

  type DDIC.BAPI1003_ALLOC_VALUES_CURR {
    CHARACT : String(30);
    VALUE_FROM : Double;
    VALUE_TO : Double;
    VALUE_RELATION : String(1);
    CURRENCY_FROM : String(5);
    CURRENCY_TO : String(5);
    CURRENCY_FROM_ISO : String(3);
    CURRENCY_TO_ISO : String(3);
    INHERITED : String(1);
    @RFCAbapType : 'N'
    INSTANCE : String(3);
    CHARACT_DESCR : String(30);
  };

  type DDIC.BAPI1003_ALLOC_VALUES_NUM {
    CHARACT : String(30);
    VALUE_FROM : String(16);
    VALUE_TO : String(16);
    VALUE_RELATION : String(1);
    UNIT_FROM : String(3);
    UNIT_TO : String(3);
    UNIT_FROM_ISO : String(3);
    UNIT_TO_ISO : String(3);
    INHERITED : String(1);
    @RFCAbapType : 'N'
    INSTANCE : String(3);
    CHARACT_DESCR : String(30);
  };

  type DDIC.BAPIRET2 {
    TYPE : String(1);
    ID : String(20);
    @RFCAbapType : 'N'
    NUMBER : String(3);
    MESSAGE : String(220);
    LOG_NO : String(20);
    @RFCAbapType : 'N'
    LOG_MSG_NO : String(6);
    MESSAGE_V1 : String(50);
    MESSAGE_V2 : String(50);
    MESSAGE_V3 : String(50);
    MESSAGE_V4 : String(50);
    PARAMETER : String(32);
    ROW : Integer;
    FIELD : String(30);
    SYSTEM : String(10);
  };
};

