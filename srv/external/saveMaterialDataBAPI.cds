/* checksum : 7a9049cc396ffffe2dc745aa1cea48b0 */
@cds.external : true
@protocol : 'rfc'
service saveMaterialDataBAPI {
  action BAPI_MATERIAL_SAVEDATA(
    /** Client-specific material data */
    @RFCParameterType : 'Import'
    CLIENTDATA : DDIC.BAPI_MARA,
    /** Structure BAPI_MARA for CWM specific fields */
    @RFCParameterType : 'Import'
    CLIENTDATACWM : DDIC.![/CWM/BAPI_MARA],
    /** Structure BAPI_MARA for CWM specific fields */
    @RFCParameterType : 'Import'
    CLIENTDATACWMX : DDIC.![/CWM/BAPI_MARAX],
    /** Information on update for CLIENTDATA */
    @RFCParameterType : 'Import'
    CLIENTDATAX : DDIC.BAPI_MARAX,
    /** Call From CAD System */
    @RFCParameterType : 'Import'
    FLAG_CAD_CALL : String(1) default 'SPACE',
    /** No ALE Field Selection */
    @RFCParameterType : 'Import'
    FLAG_ONLINE : String(1) default 'SPACE',
    /** Forecast Parameters */
    @RFCParameterType : 'Import'
    FORECASTPARAMETERS : DDIC.BAPI_MPOP,
    /** Information on update for FORECASTDATA */
    @RFCParameterType : 'Import'
    FORECASTPARAMETERSX : DDIC.BAPI_MPOPX,
    /** Header segment with control information */
    @RFCParameterType : 'Import'
    HEADDATA : DDIC.BAPIMATHEAD not null,
    /** Enhancement of MARC for Advance Planning Data */
    @RFCParameterType : 'Import'
    MARC_APS_EXTDATA : DDIC.BAPI_MARC_APS_EXT,
    /** Checkbox Structure for BAPI_MARC_APS_EXT */
    @RFCParameterType : 'Import'
    MARC_APS_EXTDATAX : DDIC.BAPI_MARC_APS_EXTX,
    /** Material Specific Planning Status per Application */
    @RFCParameterType : 'Import'
    MATPLSTADATA : DDIC.BAPI_MATPLSTA,
    /** Information on update for BAPI_MATPLSTA */
    @RFCParameterType : 'Import'
    MATPLSTADATAX : DDIC.BAPI_MATPLSTAX,
    /** Screens, display user entry */
    @RFCParameterType : 'Import'
    NO_DEQUEUE : String(1) default 'SPACE',
    /** Override rollback if error occurs */
    @RFCParameterType : 'Import'
    NO_ROLLBACK_WORK : String(1) default 'SPACE',
    /** Planning data */
    @RFCParameterType : 'Import'
    PLANNINGDATA : DDIC.BAPI_MPGD,
    /** Information on update for PLANNINGDATA */
    @RFCParameterType : 'Import'
    PLANNINGDATAX : DDIC.BAPI_MPGDX,
    /** Plant-specific material data */
    @RFCParameterType : 'Import'
    PLANTDATA : DDIC.BAPI_MARC,
    /** Information on update for PLANTDATA */
    @RFCParameterType : 'Import'
    PLANTDATAX : DDIC.BAPI_MARCX,
    /** Sales data */
    @RFCParameterType : 'Import'
    SALESDATA : DDIC.BAPI_MVKE,
    /** Information on update for SALESDATA */
    @RFCParameterType : 'Import'
    SALESDATAX : DDIC.BAPI_MVKEX,
    /** Storage-location-specific material data */
    @RFCParameterType : 'Import'
    STORAGELOCATIONDATA : DDIC.BAPI_MARD,
    /** Information on update for STORAGELOCATIONDATA */
    @RFCParameterType : 'Import'
    STORAGELOCATIONDATAX : DDIC.BAPI_MARDX,
    /** Storage-type-specific material data */
    @RFCParameterType : 'Import'
    STORAGETYPEDATA : DDIC.BAPI_MLGT,
    /** Information on update for STORAGETYPEDATA */
    @RFCParameterType : 'Import'
    STORAGETYPEDATAX : DDIC.BAPI_MLGTX,
    /** Valuation data */
    @RFCParameterType : 'Import'
    VALUATIONDATA : DDIC.BAPI_MBEW,
    /** obsolete */
    @RFCParameterType : 'Import'
    VALUATIONDATACWM : DDIC.![/CWM/BAPI_MBEW],
    /** obsolete */
    @RFCParameterType : 'Import'
    VALUATIONDATACWMX : DDIC.![/CWM/BAPI_MBEWX],
    /** Information on update for VALUATIONDATA */
    @RFCParameterType : 'Import'
    VALUATIONDATAX : DDIC.BAPI_MBEWX,
    /** Warehouse-number-specific material data */
    @RFCParameterType : 'Import'
    WAREHOUSENUMBERDATA : DDIC.BAPI_MLGN,
    /** Information on update for WAREHOUSEDATA */
    @RFCParameterType : 'Import'
    WAREHOUSENUMBERDATAX : DDIC.BAPI_MLGNX,
    /** Material Penalties : Standard Demand Classes Data */
    @RFCParameterType : 'Table'
    DEMAND_PENALTYDATA : many DDIC.BAPI_PPO_DMND_PENALTY,
    /** Checkbox Structure for BAPI_PPO_DMND_PENALTY */
    @RFCParameterType : 'Table'
    DEMAND_PENALTYDATAX : many DDIC.BAPI_PPO_DMND_PENALTYX,
    /** Reference Structure for BAPI Parameters EXTENSIONIN/EXTENSIONOUT */
    @RFCParameterType : 'Table'
    EXTENSIONIN : many DDIC.BAPIPAREX,
    /** Reference Structure for BAPI Parameters EXTENSIONIN/EXTENSIONOUT */
    @RFCParameterType : 'Table'
    EXTENSIONINX : many DDIC.BAPIPAREXX,
    /** International Article Numbers (EANs) */
    @RFCParameterType : 'Table'
    INTERNATIONALARTNOS : many DDIC.BAPI_MEAN,
    /** Material descriptions */
    @RFCParameterType : 'Table'
    MATERIALDESCRIPTION : many DDIC.BAPI_MAKT,
    /** Long texts */
    @RFCParameterType : 'Table'
    MATERIALLONGTEXT : many DDIC.BAPI_MLTX,
    @RFCParameterType : 'Table'
    NFMCHARGEWEIGHTS : many DDIC.![/NFM/BAPITVGW],
    @RFCParameterType : 'Table'
    NFMCHARGEWEIGHTSX : many DDIC.![/NFM/BAPITVGWX],
    @RFCParameterType : 'Table'
    NFMSTRUCTURALWEIGHTS : many DDIC.![/NFM/BAPITKGW],
    @RFCParameterType : 'Table'
    NFMSTRUCTURALWEIGHTSX : many DDIC.![/NFM/BAPITKGWX],
    /** Production resource/tool (PRT) fields in the material master */
    @RFCParameterType : 'Table'
    PRTDATA : many DDIC.BAPI_MFHM,
    /** Information on update for PRTDATAX */
    @RFCParameterType : 'Table'
    PRTDATAX : many DDIC.BAPI_MFHMX,
    /** All messages */
    @RFCParameterType : 'Table'
    RETURNMESSAGES : many DDIC.BAPI_MATRETURN2,
    /** Plant MRP General Data at Segment Level */
    @RFCParameterType : 'Table'
    SEGMRPGENERALDATA : many DDIC.BAPI_SGT_MRP_GN,
    /** Checkbox Structure for BAPI_SGT_MRP_GN */
    @RFCParameterType : 'Table'
    SEGMRPGENERALDATAX : many DDIC.BAPI_SGT_MRP_GNX,
    /** Plant MRP Quantity Based Data at Segment Level */
    @RFCParameterType : 'Table'
    SEGMRPQUANTITYDATA : many DDIC.BAPI_SGT_MRP,
    /** Checkbox Structure for BAPI_SGT_MRP */
    @RFCParameterType : 'Table'
    SEGMRPQUANTITYDATAX : many DDIC.BAPI_SGT_MRPX,
    /** Segmentation | Sales Status */
    @RFCParameterType : 'Table'
    SEGSALESSTATUS : many DDIC.BAPI_SGT_MVKE,
    /** Checkbox Structure for BAPI_SGT_MVKE */
    @RFCParameterType : 'Table'
    SEGSALESSTATUSX : many DDIC.BAPI_SGT_MVKEX,
    /** Plant Valuation Data at Segment Level */
    @RFCParameterType : 'Table'
    SEGVALUATIONTYPE : many DDIC.BAPI_SGT_MADKA,
    /** Checkbox Structure for BAPI_SGT_MADKA */
    @RFCParameterType : 'Table'
    SEGVALUATIONTYPEX : many DDIC.BAPI_SGT_MADKAX,
    /** Segmentation | Weights and Volumes */
    @RFCParameterType : 'Table'
    SEGWEIGHTVOLUME : many DDIC.BAPI_SGT_MARM,
    /** Checkbox Structure for BAPI_SGT_MARM */
    @RFCParameterType : 'Table'
    SEGWEIGHTVOLUMEX : many DDIC.BAPI_SGT_MARMX,
    /** Tax classifications */
    @RFCParameterType : 'Table'
    TAXCLASSIFICATIONS : many DDIC.BAPI_MLAN,
    /** Units of measure */
    @RFCParameterType : 'Table'
    UNITSOFMEASURE : many DDIC.BAPI_MARM,
    /** obsolete */
    @RFCParameterType : 'Table'
    UNITSOFMEASURECWM : many DDIC.![/CWM/BAPI_MARM],
    /** obsolete */
    @RFCParameterType : 'Table'
    UNITSOFMEASURECWMX : many DDIC.![/CWM/BAPI_MARMX],
    /** Information on update for UNITSOFMEASURE */
    @RFCParameterType : 'Table'
    UNITSOFMEASUREX : many DDIC.BAPI_MARMX
  ) returns BAPI_MATERIAL_SAVEDATA.ResultType;

  action BAPI_TRANSACTION_COMMIT(
    @RFCParameterType : 'Import'
    WAIT : String(1)
  ) returns BAPI_TRANSACTION_COMMIT.ResultType;

  type BAPI_TRANSACTION_COMMIT.ResultType {
    @RFCParameterType : 'Export'
    RETURN : DDIC.BAPIRET2;
  };

  type BAPI_MATERIAL_SAVEDATA.ResultType {
    /** Return parameters */
    @RFCParameterType : 'Export'
    RETURN : DDIC.BAPIRET2;
    /** Material Penalties : Standard Demand Classes Data */
    @RFCParameterType : 'Table'
    DEMAND_PENALTYDATA : many DDIC.BAPI_PPO_DMND_PENALTY;
    /** Checkbox Structure for BAPI_PPO_DMND_PENALTY */
    @RFCParameterType : 'Table'
    DEMAND_PENALTYDATAX : many DDIC.BAPI_PPO_DMND_PENALTYX;
    /** Reference Structure for BAPI Parameters EXTENSIONIN/EXTENSIONOUT */
    @RFCParameterType : 'Table'
    EXTENSIONIN : many DDIC.BAPIPAREX;
    /** Reference Structure for BAPI Parameters EXTENSIONIN/EXTENSIONOUT */
    @RFCParameterType : 'Table'
    EXTENSIONINX : many DDIC.BAPIPAREXX;
    /** International Article Numbers (EANs) */
    @RFCParameterType : 'Table'
    INTERNATIONALARTNOS : many DDIC.BAPI_MEAN;
    /** Material descriptions */
    @RFCParameterType : 'Table'
    MATERIALDESCRIPTION : many DDIC.BAPI_MAKT;
    /** Long texts */
    @RFCParameterType : 'Table'
    MATERIALLONGTEXT : many DDIC.BAPI_MLTX;
    @RFCParameterType : 'Table'
    NFMCHARGEWEIGHTS : many DDIC.![/NFM/BAPITVGW];
    @RFCParameterType : 'Table'
    NFMCHARGEWEIGHTSX : many DDIC.![/NFM/BAPITVGWX];
    @RFCParameterType : 'Table'
    NFMSTRUCTURALWEIGHTS : many DDIC.![/NFM/BAPITKGW];
    @RFCParameterType : 'Table'
    NFMSTRUCTURALWEIGHTSX : many DDIC.![/NFM/BAPITKGWX];
    /** Production resource/tool (PRT) fields in the material master */
    @RFCParameterType : 'Table'
    PRTDATA : many DDIC.BAPI_MFHM;
    /** Information on update for PRTDATAX */
    @RFCParameterType : 'Table'
    PRTDATAX : many DDIC.BAPI_MFHMX;
    /** All messages */
    @RFCParameterType : 'Table'
    RETURNMESSAGES : many DDIC.BAPI_MATRETURN2;
    /** Plant MRP General Data at Segment Level */
    @RFCParameterType : 'Table'
    SEGMRPGENERALDATA : many DDIC.BAPI_SGT_MRP_GN;
    /** Checkbox Structure for BAPI_SGT_MRP_GN */
    @RFCParameterType : 'Table'
    SEGMRPGENERALDATAX : many DDIC.BAPI_SGT_MRP_GNX;
    /** Plant MRP Quantity Based Data at Segment Level */
    @RFCParameterType : 'Table'
    SEGMRPQUANTITYDATA : many DDIC.BAPI_SGT_MRP;
    /** Checkbox Structure for BAPI_SGT_MRP */
    @RFCParameterType : 'Table'
    SEGMRPQUANTITYDATAX : many DDIC.BAPI_SGT_MRPX;
    /** Segmentation | Sales Status */
    @RFCParameterType : 'Table'
    SEGSALESSTATUS : many DDIC.BAPI_SGT_MVKE;
    /** Checkbox Structure for BAPI_SGT_MVKE */
    @RFCParameterType : 'Table'
    SEGSALESSTATUSX : many DDIC.BAPI_SGT_MVKEX;
    /** Plant Valuation Data at Segment Level */
    @RFCParameterType : 'Table'
    SEGVALUATIONTYPE : many DDIC.BAPI_SGT_MADKA;
    /** Checkbox Structure for BAPI_SGT_MADKA */
    @RFCParameterType : 'Table'
    SEGVALUATIONTYPEX : many DDIC.BAPI_SGT_MADKAX;
    /** Segmentation | Weights and Volumes */
    @RFCParameterType : 'Table'
    SEGWEIGHTVOLUME : many DDIC.BAPI_SGT_MARM;
    /** Checkbox Structure for BAPI_SGT_MARM */
    @RFCParameterType : 'Table'
    SEGWEIGHTVOLUMEX : many DDIC.BAPI_SGT_MARMX;
    /** Tax classifications */
    @RFCParameterType : 'Table'
    TAXCLASSIFICATIONS : many DDIC.BAPI_MLAN;
    /** Units of measure */
    @RFCParameterType : 'Table'
    UNITSOFMEASURE : many DDIC.BAPI_MARM;
    /** obsolete */
    @RFCParameterType : 'Table'
    UNITSOFMEASURECWM : many DDIC.![/CWM/BAPI_MARM];
    /** obsolete */
    @RFCParameterType : 'Table'
    UNITSOFMEASURECWMX : many DDIC.![/CWM/BAPI_MARMX];
    /** Information on update for UNITSOFMEASURE */
    @RFCParameterType : 'Table'
    UNITSOFMEASUREX : many DDIC.BAPI_MARMX;
  };

  type DDIC.BAPI_MARA {
    DEL_FLAG : String(1);
    MATL_GROUP : String(9);
    OLD_MAT_NO : String(18);
    BASE_UOM : String(3);
    BASE_UOM_ISO : String(3);
    PO_UNIT : String(3);
    PO_UNIT_ISO : String(3);
    DOCUMENT : String(22);
    DOC_TYPE : String(3);
    DOC_VERS : String(2);
    DOC_FORMAT : String(4);
    DOC_CHG_NO : String(6);
    PAGE_NO : String(3);
    @RFCAbapType : 'N'
    NO_SHEETS : String(3);
    PROD_MEMO : String(18);
    PAGEFORMAT : String(4);
    SIZE_DIM : String(32);
    BASIC_MATL : String(48);
    STD_DESCR : String(18);
    DSN_OFFICE : String(3);
    PUR_VALKEY : String(4);
    NET_WEIGHT : Decimal;
    UNIT_OF_WT : String(3);
    UNIT_OF_WT_ISO : String(3);
    CONTAINER : String(2);
    STOR_CONDS : String(2);
    TEMP_CONDS : String(2);
    TRANS_GRP : String(4);
    HAZ_MAT_NO : String(18);
    DIVISION : String(2);
    COMPETITOR : String(10);
    QTY_GR_GI : Decimal;
    PROC_RULE : String(1);
    SUP_SOURCE : String(1);
    SEASON : String(4);
    LABEL_TYPE : String(2);
    LABEL_FORM : String(2);
    PROD_HIER : String(18);
    CAD_ID : String(1);
    ALLOWED_WT : Decimal;
    PACK_WT_UN : String(3);
    PACK_WT_UN_ISO : String(3);
    ALLWD_VOL : Decimal;
    PACK_VO_UN : String(3);
    PACK_VO_UN_ISO : String(3);
    WT_TOL_LT : Decimal;
    VOL_TOL_LT : Decimal;
    VAR_ORD_UN : String(1);
    BATCH_MGMT : String(1);
    SH_MAT_TYP : String(4);
    FILL_LEVEL : Decimal;
    STACK_FACT : Integer;
    MAT_GRP_SM : String(4);
    AUTHORITYGROUP : String(4);
    QM_PROCMNT : String(1);
    CATPROFILE : String(9);
    MINREMLIFE : Decimal;
    SHELF_LIFE : Decimal;
    STOR_PCT : Decimal;
    PUR_STATUS : String(2);
    SAL_STATUS : String(2);
    PVALIDFROM : Date;
    SVALIDFROM : Date;
    ENVT_RLVT : String(1);
    PROD_ALLOC : String(18);
    QUAL_DIK : String(1);
    MANU_MAT : String(40);
    MFR_NO : String(10);
    INV_MAT_NO : String(18);
    MANUF_PROF : String(4);
    HAZMATPROF : String(3);
    HIGH_VISC : String(1);
    LOOSEORLIQ : String(1);
    CLOSED_BOX : String(1);
    APPD_B_REC : String(1);
    @RFCAbapType : 'N'
    MATCMPLLVL : String(2);
    PAR_EFF : String(1);
    ROUND_UP_RULE_EXPIRATION_DATE : String(1);
    PERIOD_IND_EXPIRATION_DATE : String(1);
    PROD_COMPOSITION_ON_PACKAGING : String(1);
    ITEM_CAT : String(4);
    HAZ_MAT_NO_EXTERNAL : String(40);
    HAZ_MAT_NO_GUID : String(32);
    HAZ_MAT_NO_VERSION : String(10);
    INV_MAT_NO_EXTERNAL : String(40);
    INV_MAT_NO_GUID : String(32);
    INV_MAT_NO_VERSION : String(10);
    MATERIAL_FIXED : String(1);
    CM_RELEVANCE_FLAG : String(1);
    SLED_BBD : String(1);
    GTIN_VARIANT : String(2);
    SERIALIZATION_LEVEL : String(1);
    PL_REF_MAT : String(18);
    EXTMATLGRP : String(18);
    UOMUSAGE : String(1);
    GDS_RELEVANT : String(1);
    PL_REF_MAT_EXTERNAL : String(40);
    PL_REF_MAT_GUID : String(32);
    PL_REF_MAT_VERSION : String(10);
    WE_ORIGIN_ACCEPTANCE : String(1);
    STD_HU_TYPE : String(4);
    PILFERABLE : String(1);
    WHSE_STORAGE_CONDITION : String(2);
    WHSE_MATERIAL_GROUP : String(4);
    HANDLING_INDICATOR : String(4);
    HAZ_MAT_RELEVANT : String(1);
    HU_TYPE : String(4);
    VARIABLE_TARE_WEIGHT : String(1);
    MAX_ALLOWED_CAPACITY : Decimal;
    OVERCAPACITY_TOLERANCE : Decimal;
    MAX_ALLOWED_LENGTH : Decimal;
    MAX_ALLOWED_WIDTH : Decimal;
    MAX_ALLOWED_HEIGTH : Decimal;
    MAX_DIMENSION_UN : String(3);
    MAX_DIMENSION_UN_ISO : String(3);
    COUNTRYORI : String(3);
    COUNTRYORI_ISO : String(2);
    MATFRGTGRP : String(8);
    QUARANTINE_PERIOD : Decimal;
    QUARANTINE_PERIOD_UN : String(3);
    QUARANTINE_PERIOD_UN_ISO : String(3);
    QUALITY_INSP_GRP : String(4);
    SERIAL_NUMBER_PROFILE : String(4);
    EWM_CW_TOLERANCE_GROUP : String(9);
    EWM_CW_INPUT_CONTROL : String(2);
    PCKGING_SMARTFORM : String(30);
    PACOD : String(10);
    DG_PCKGING_STATUS : String(10);
    ADJUST_PROFILE : String(3);
    IPMIPPRODUCT : String(40);
    MEDIUM : String(6);
    NSNID : String(9);
    PHYSICAL_COMMODITY : String(18);
    SEGMENTATION_STRUCTURE : String(4);
    SEGMENTATION_STRATEGY : String(8);
    SEGMENTATION_RELEVANCE : String(1);
    @RFCAbapType : 'N'
    ANP : String(9);
    OLD_MAT_NO_LONG : String(40);
    HAZ_MAT_NO_LONG : String(40);
    INV_MAT_NO_LONG : String(40);
    PL_REF_MAT_LONG : String(40);
    MATURITY_DUR : Decimal;
    SHELF_LIFE_REQ_MIN : Decimal;
    SHELF_LIFE_REQ_MAX : Decimal;
    PUOM : String(3);
    PUOM_ISO : String(3);
    CONFIGURABLE_MATERIAL : String(1);
    KIT_PRODUCT_FLAG : String(1);
    PRODUCT_PROC_ORDER_FLAG : String(1);
    SECOND_LEVEL_DEPLMNT_FLAG : String(1);
    NO_INVENTURY_BALANCING_FLAG : String(1);
    DRP_GLOBAL_STOCK_ON_ENTRY_LOC : String(1);
    EXCLUDE_EXPRESS_SHPT_FLAG : String(1);
  };

  type DDIC.![/CWM/BAPI_MARA] {
    TOLERANCE_GROUP : String(9);
    TARA_UOM : String(3);
    TARA_UOM_ISO : String(3);
    TARA_FIX : String(1);
  };

  type DDIC.![/CWM/BAPI_MARAX] {
    TOLERANCE_GROUP : String(1);
    TARA_UOM : String(1);
    TARA_UOM_ISO : String(1);
    TARA_FIX : String(1);
  };

  type DDIC.BAPI_MARAX {
    DEL_FLAG : String(1);
    MATL_GROUP : String(1);
    OLD_MAT_NO : String(1);
    BASE_UOM : String(1);
    BASE_UOM_ISO : String(1);
    PO_UNIT : String(1);
    PO_UNIT_ISO : String(1);
    DOCUMENT : String(1);
    DOC_TYPE : String(1);
    DOC_VERS : String(1);
    DOC_FORMAT : String(1);
    DOC_CHG_NO : String(1);
    PAGE_NO : String(1);
    NO_SHEETS : String(1);
    PROD_MEMO : String(1);
    PAGEFORMAT : String(1);
    SIZE_DIM : String(1);
    BASIC_MATL : String(1);
    STD_DESCR : String(1);
    DSN_OFFICE : String(1);
    PUR_VALKEY : String(1);
    NET_WEIGHT : String(1);
    UNIT_OF_WT : String(1);
    UNIT_OF_WT_ISO : String(1);
    CONTAINER : String(1);
    STOR_CONDS : String(1);
    TEMP_CONDS : String(1);
    TRANS_GRP : String(1);
    HAZ_MAT_NO : String(1);
    DIVISION : String(1);
    COMPETITOR : String(1);
    QTY_GR_GI : String(1);
    PROC_RULE : String(1);
    SUP_SOURCE : String(1);
    SEASON : String(1);
    LABEL_TYPE : String(1);
    LABEL_FORM : String(1);
    PROD_HIER : String(1);
    CAD_ID : String(1);
    ALLOWED_WT : String(1);
    PACK_WT_UN : String(1);
    PACK_WT_UN_ISO : String(1);
    ALLWD_VOL : String(1);
    PACK_VO_UN : String(1);
    PACK_VO_UN_ISO : String(1);
    WT_TOL_LT : String(1);
    VOL_TOL_LT : String(1);
    VAR_ORD_UN : String(1);
    BATCH_MGMT : String(1);
    SH_MAT_TYP : String(1);
    FILL_LEVEL : String(1);
    STACK_FACT : String(1);
    MAT_GRP_SM : String(1);
    AUTHORITYGROUP : String(1);
    QM_PROCMNT : String(1);
    CATPROFILE : String(1);
    MINREMLIFE : String(1);
    SHELF_LIFE : String(1);
    STOR_PCT : String(1);
    PUR_STATUS : String(1);
    SAL_STATUS : String(1);
    PVALIDFROM : String(1);
    SVALIDFROM : String(1);
    ENVT_RLVT : String(1);
    PROD_ALLOC : String(1);
    QUAL_DIK : String(1);
    MANU_MAT : String(1);
    MFR_NO : String(1);
    INV_MAT_NO : String(1);
    MANUF_PROF : String(1);
    HAZMATPROF : String(1);
    HIGH_VISC : String(1);
    LOOSEORLIQ : String(1);
    CLOSED_BOX : String(1);
    APPD_B_REC : String(1);
    MATCMPLLVL : String(1);
    PAR_EFF : String(1);
    ROUND_UP_RULE_EXPIRATION_DATE : String(1);
    PERIOD_IND_EXPIRATION_DATE : String(1);
    PROD_COMPOSITION_ON_PACKAGING : String(1);
    ITEM_CAT : String(1);
    HAZ_MAT_NO_EXTERNAL : String(1);
    HAZ_MAT_NO_GUID : String(1);
    HAZ_MAT_NO_VERSION : String(1);
    INV_MAT_NO_EXTERNAL : String(1);
    INV_MAT_NO_GUID : String(1);
    INV_MAT_NO_VERSION : String(1);
    MATERIAL_FIXED : String(1);
    CM_RELEVANCE_FLAG : String(1);
    SLED_BBD : String(1);
    GTIN_VARIANT : String(1);
    SERIALIZATION_LEVEL : String(1);
    PL_REF_MAT : String(1);
    EXTMATLGRP : String(1);
    UOMUSAGE : String(1);
    GDS_RELEVANT : String(1);
    PL_REF_MAT_EXTERNAL : String(1);
    PL_REF_MAT_GUID : String(1);
    PL_REF_MAT_VERSION : String(1);
    WE_ORIGIN_ACCEPTANCE : String(1);
    STD_HU_TYPE : String(1);
    PILFERABLE : String(1);
    WHSE_STORAGE_CONDITION : String(1);
    WHSE_MATERIAL_GROUP : String(1);
    HANDLING_INDICATOR : String(1);
    HAZ_MAT_RELEVANT : String(1);
    HU_TYPE : String(1);
    VARIABLE_TARE_WEIGHT : String(1);
    MAX_ALLOWED_CAPACITY : String(1);
    OVERCAPACITY_TOLERANCE : String(1);
    MAX_ALLOWED_LENGTH : String(1);
    MAX_ALLOWED_WIDTH : String(1);
    MAX_ALLOWED_HEIGTH : String(1);
    MAX_DIMENSION_UN : String(1);
    MAX_DIMENSION_UN_ISO : String(1);
    COUNTRYORI : String(1);
    COUNTRYORI_ISO : String(1);
    MATFRGTGRP : String(1);
    QUARANTINE_PERIOD : String(1);
    QUARANTINE_PERIOD_UN : String(1);
    QUARANTINE_PERIOD_UN_ISO : String(1);
    QUALITY_INSP_GRP : String(1);
    SERIAL_NUMBER_PROFILE : String(1);
    EWM_CW_TOLERANCE_GROUP : String(1);
    EWM_CW_INPUT_CONTROL : String(1);
    PCKGING_SMARTFORM : String(1);
    PACOD : String(1);
    DG_PCKGING_STATUS : String(1);
    ADJUST_PROFILE : String(1);
    IPMIPPRODUCT : String(1);
    MEDIUM : String(1);
    NSNID : String(1);
    PHYSICAL_COMMODITY : String(1);
    SEGMENTATION_STRUCTURE : String(1);
    SEGMENTATION_STRATEGY : String(1);
    SEGMENTATION_RELEVANCE : String(1);
    ANP : String(1);
    OLD_MAT_NO_LONG : String(1);
    HAZ_MAT_NO_LONG : String(1);
    INV_MAT_NO_LONG : String(1);
    PL_REF_MAT_LONG : String(1);
    MATURITY_DUR : String(1);
    SHELF_LIFE_REQ_MIN : String(1);
    SHELF_LIFE_REQ_MAX : String(1);
    PUOM : String(1);
    PUOM_ISO : String(1);
    CONFIGURABLE_MATERIAL : String(1);
    KIT_PRODUCT_FLAG : String(1);
    PRODUCT_PROC_ORDER_FLAG : String(1);
    SECOND_LEVEL_DEPLMNT_FLAG : String(1);
    NO_INVENTURY_BALANCING_FLAG : String(1);
    DRP_GLOBAL_STOCK_ON_ENTRY_LOC : String(1);
    EXCLUDE_EXPRESS_SHPT_FLAG : String(1);
  };

  type DDIC.BAPI_MPOP {
    PLANT : String(4);
    FORE_PROF : String(4);
    MODEL_SI : String(1);
    MODEL_SP : String(1);
    PARAM_OPT : String(1);
    OPTIM_LEV : String(1);
    INITIALIZE : String(1);
    FORE_MODEL : String(1);
    ALPHA_FACT : Decimal;
    BETA_FACT : Decimal;
    GAMMA_FACT : Decimal;
    DELTA_FACT : Decimal;
    TRACKLIMIT : Decimal;
    FORE_DATE : Date;
    HIST_VALS : Decimal;
    INIT_PDS : Decimal;
    SEASON_PDS : Decimal;
    EXPOST_PDS : Decimal;
    FORE_PDS : Decimal;
    FIXED_PDS : Decimal;
    WTG_GROUP : String(2);
  };

  type DDIC.BAPI_MPOPX {
    PLANT : String(4);
    FORE_PROF : String(1);
    MODEL_SI : String(1);
    MODEL_SP : String(1);
    PARAM_OPT : String(1);
    OPTIM_LEV : String(1);
    INITIALIZE : String(1);
    FORE_MODEL : String(1);
    ALPHA_FACT : String(1);
    BETA_FACT : String(1);
    GAMMA_FACT : String(1);
    DELTA_FACT : String(1);
    TRACKLIMIT : String(1);
    FORE_DATE : String(1);
    HIST_VALS : String(1);
    INIT_PDS : String(1);
    SEASON_PDS : String(1);
    EXPOST_PDS : String(1);
    FORE_PDS : String(1);
    FIXED_PDS : String(1);
    WTG_GROUP : String(1);
  };

  type DDIC.BAPIMATHEAD {
    MATERIAL : String(18);
    IND_SECTOR : String(1);
    MATL_TYPE : String(4);
    BASIC_VIEW : String(1);
    SALES_VIEW : String(1);
    PURCHASE_VIEW : String(1);
    MRP_VIEW : String(1);
    FORECAST_VIEW : String(1);
    WORK_SCHED_VIEW : String(1);
    PRT_VIEW : String(1);
    STORAGE_VIEW : String(1);
    WAREHOUSE_VIEW : String(1);
    QUALITY_VIEW : String(1);
    ACCOUNT_VIEW : String(1);
    COST_VIEW : String(1);
    INP_FLD_CHECK : String(1);
    MATERIAL_EXTERNAL : String(40);
    MATERIAL_GUID : String(32);
    MATERIAL_VERSION : String(10);
    MATERIAL_LONG : String(40);
  };

  type DDIC.BAPI_MARC_APS_EXT {
    PLANT : String(4);
    DEL_FLAG : String(1);
    MAX_DAYSOFSUPPLY_PENALTYAMOUNT : Decimal;
    MAX_DAYSOFSUPPLY_IS_ACTIVE : String(1);
    SAFTYSTOCK_METHOD : String(2);
    TARGET_STOCK_LEVEL_METH : String(1);
    AUTO_DET_SFTYSTK_METH : String(1);
    USE_PERIOD_FACTOR : String(1);
    PERIOD_FACTOR_VALUE : Decimal;
    PERIOD_FACTOR_TDS : Decimal;
    CONVH : Decimal;
  };

  type DDIC.BAPI_MARC_APS_EXTX {
    PLANT : String(4);
    DEL_FLAG : String(1);
    MAX_DAYSOFSUPPLY_PENALTYAMOUNT : String(1);
    MAX_DAYSOFSUPPLY_IS_ACTIVE : String(1);
    SAFTYSTOCK_METHOD : String(1);
    TARGET_STOCK_LEVEL_METH : String(1);
    AUTO_DET_SFTYSTK_METH : String(1);
    USE_PERIOD_FACTOR : String(1);
    PERIOD_FACTOR_VALUE : String(1);
    PERIOD_FACTOR_TDS : String(1);
    CONVH : String(1);
  };

  type DDIC.BAPI_MATPLSTA {
    PLANT : String(4);
    DEL_FLAG : String(1);
    SCOPE : String(2);
    SCOPEPRFLID : String(10);
  };

  type DDIC.BAPI_MATPLSTAX {
    PLANT : String(4);
    DEL_FLAG : String(1);
    SCOPE : String(1);
    SCOPEPRFLID : String(1);
  };

  type DDIC.BAPI_MPGD {
    PLANT : String(4);
    PLNG_MATL : String(18);
    PLNG_PLANT : String(4);
    CONVFACTOR : String(10);
    PLNG_MATL_EXTERNAL : String(40);
    PLNG_MATL_GUID : String(32);
    PLNG_MATL_VERSION : String(10);
    PLNG_MATL_LONG : String(40);
  };

  type DDIC.BAPI_MPGDX {
    PLANT : String(4);
    PLNG_MATL : String(1);
    PLNG_PLANT : String(1);
    CONVFACTOR : String(1);
    PLNG_MATL_EXTERNAL : String(1);
    PLNG_MATL_GUID : String(1);
    PLNG_MATL_VERSION : String(1);
    PLNG_MATL_LONG : String(1);
  };

  type DDIC.BAPI_MARC {
    PLANT : String(4);
    DEL_FLAG : String(1);
    ABC_ID : String(1);
    CRIT_PART : String(1);
    PUR_GROUP : String(3);
    ISSUE_UNIT : String(3);
    ISSUE_UNIT_ISO : String(3);
    MRPPROFILE : String(4);
    MRP_TYPE : String(2);
    MRP_CTRLER : String(3);
    PLND_DELRY : Decimal;
    GR_PR_TIME : Decimal;
    PERIOD_IND : String(1);
    ASSY_SCRAP : Decimal;
    LOTSIZEKEY : String(2);
    PROC_TYPE : String(1);
    SPPROCTYPE : String(2);
    REORDER_PT : Decimal;
    SAFETY_STK : Decimal;
    MINLOTSIZE : Decimal;
    MAXLOTSIZE : Decimal;
    FIXED_LOT : Decimal;
    ROUND_VAL : Decimal;
    MAX_STOCK : Decimal;
    ORD_COSTS : Decimal;
    DEP_REQ_ID : String(1);
    STOR_COSTS : String(1);
    ALT_BOM_ID : String(1);
    DISCONTINU : String(1);
    EFF_O_DAY : Date;
    FOLLOW_UP : String(18);
    GRP_REQMTS : String(1);
    MIXED_MRP : String(1);
    SM_KEY : String(3);
    BACKFLUSH : String(1);
    PRODUCTION_SCHEDULER : String(3);
    PROC_TIME : Decimal;
    SETUPTIME : Decimal;
    INTEROP : Decimal;
    BASE_QTY : Decimal;
    INHSEPRODT : Decimal;
    STGEPERIOD : Decimal;
    STGE_PD_UN : String(3);
    STGE_PD_UN_ISO : String(3);
    OVER_TOL : Decimal;
    UNLIMITED : String(1);
    UNDER_TOL : Decimal;
    REPLENTIME : Decimal;
    REPLACE_PT : String(1);
    IND_POST_TO_INSP_STOCK : String(1);
    CTRL_KEY : String(8);
    DOC_REQD : String(1);
    LOADINGGRP : String(4);
    BATCH_MGMT : String(1);
    QUOTAUSAGE : String(1);
    SERV_LEVEL : Decimal;
    SPLIT_IND : String(1);
    AVAILCHECK : String(2);
    FY_VARIANT : String(2);
    CORR_FACT : String(1);
    SETUP_TIME : Decimal;
    BASE_QTY_PLAN : Decimal;
    SHIP_PROC_TIME : Decimal;
    SUP_SOURCE : String(1);
    AUTO_P_ORD : String(1);
    SOURCELIST : String(1);
    COMM_CODE : String(17);
    COUNTRYORI : String(3);
    COUNTRYORI_ISO : String(2);
    REGIONORIG : String(3);
    COMM_CO_UN : String(3);
    COMM_CO_UN_ISO : String(3);
    EXPIMPGRP : String(4);
    PROFIT_CTR : String(10);
    PPC_PL_CAL : String(3);
    REP_MANUF : String(1);
    @RFCAbapType : 'N'
    PL_TI_FNCE : String(3);
    CONSUMMODE : String(1);
    @RFCAbapType : 'N'
    BWD_CONS : String(3);
    @RFCAbapType : 'N'
    FWD_CONS : String(3);
    ALTERNATIVE_BOM : String(2);
    BOM_USAGE : String(1);
    PLANLISTGRP : String(8);
    PLANLISTCNT : String(2);
    LOT_SIZE : Decimal;
    SPECPROCTY : String(2);
    PROD_UNIT : String(3);
    PROD_UNIT_ISO : String(3);
    ISS_ST_LOC : String(4);
    MRP_GROUP : String(4);
    COMP_SCRAP : Decimal;
    CERT_TYPE : String(4);
    CYCLE_TIME : Decimal;
    COVPROFILE : String(3);
    CC_PH_INV : String(1);
    VARIANCE_KEY : String(6);
    SERNO_PROF : String(4);
    REPMANPROF : String(4);
    NEG_STOCKS : String(1);
    QM_RGMTS : String(4);
    PLNG_CYCLE : String(3);
    ROUND_PROF : String(4);
    REFMATCONS : String(18);
    D_TO_REF_M : Date;
    MULT_REF_M : Decimal;
    AUTO_RESET : String(1);
    EX_CERT_ID : String(1);
    EX_CERT_NO_NEW : String(8);
    EX_CERT_DT : Date;
    MILIT_ID : String(1);
    INSP_INT : Decimal;
    CO_PRODUCT : String(1);
    PLAN_STRGP : String(2);
    SLOC_EXPRC : String(4);
    BULK_MAT : String(1);
    CC_FIXED : String(1);
    DETERM_GRP : String(4);
    QM_AUTHGRP : String(6);
    TASK_LIST_TYPE : String(1);
    PUR_STATUS : String(2);
    PRODPROF : String(6);
    SAFTY_T_ID : String(1);
    @RFCAbapType : 'N'
    SAFETYTIME : String(2);
    PLORD_CTRL : String(2);
    BATCHENTRY : String(1);
    PVALIDFROM : Date;
    MATFRGTGRP : String(8);
    PRODVERSCS : String(4);
    MAT_CFOP : String(2);
    EU_LIST_NO : String(12);
    EU_MAT_GRP : String(6);
    CAS_NO : String(15);
    PRODCOM_NO : String(9);
    CTRL_CODE : String(16);
    JIT_RELVT : String(1);
    MAT_GRP_TRANS : String(20);
    HANDLG_GRP : String(4);
    SUPPLY_AREA : String(10);
    FAIR_SHARE_RULE : String(2);
    PUSH_DISTRIB : String(1);
    DEPLOY_HORIZ : Decimal;
    MIN_LOT_SIZE : Decimal;
    MAX_LOT_SIZE : Decimal;
    FIX_LOT_SIZE : Decimal;
    LOT_INCREMENT : Decimal;
    PROD_CONV_TYPE : String(2);
    DISTR_PROF : String(3);
    PERIOD_PROFILE_SAFETY_TIME : String(3);
    FXD_PRICE : String(1);
    AVAIL_CHECK_ALL_PROJ_SEGMENTS : String(1);
    OVERALLPRF : String(6);
    MRP_RELEVANCY_DEP_REQUIREMENTS : String(1);
    MIN_SAFETY_STK : Decimal;
    NO_COSTING : String(1);
    UNIT_GROUP : String(4);
    FOLLOW_UP_EXTERNAL : String(40);
    FOLLOW_UP_GUID : String(32);
    FOLLOW_UP_VERSION : String(10);
    REFMATCONS_EXTERNAL : String(40);
    REFMATCONS_GUID : String(32);
    REFMATCONS_VERSION : String(10);
    ROTATION_DATE : String(1);
    ORIGINAL_BATCH_FLAG : String(1);
    ORIGINAL_BATCH_REF_MATERIAL : String(18);
    ORIGINAL_BATCH_REF_MATERIAL_E : String(40);
    ORIGINAL_BATCH_REF_MATERIAL_V : String(10);
    ORIGINAL_BATCH_REF_MATERIAL_G : String(32);
    IUID_RELEVANT : String(1);
    IUID_TYPE : String(10);
    UID_IEA : String(1);
    SEGMENTATION_STRATEGY : String(8);
    SEGMENTATION_STATUS : String(1);
    CONSUMPTION_PRIORITY : String(1);
    DISCRETE_BATCH_FLAG : String(1);
    STOCK_PROTECTION_IND : String(1);
    DEFAULT_STOCK_SEGMENT : String(16);
    ADV_PLNG_IND : String(1);
    FOLLOW_UP_LONG : String(40);
    REFMATCONS_LONG : String(40);
    ORIGINAL_BATCH_REF_MATERIAL_L : String(40);
    DEF_SEG_LONG : String(40);
    ORDER_ALLOCATION_REQ : String(1);
    FIX_BATCH_IN_ARUN : String(1);
    GR_PROC_TIME : Decimal;
    GI_PROC_TIME : Decimal;
    STORAGE_COST : Decimal;
    REPLENISHMENT_LEAD_TIME : Decimal;
    RRP_PLANNING_TYPE : String(1);
    HEURISTIC_ID : String(12);
    HEURISTIC_PACKAGE_ID : String(12);
    PENALTY_COSTS : Decimal;
    GET_ALERTS : String(1);
    RESOURCE_NETWORK : String(40);
    CONS_HANDL_CAP : Decimal;
    GR_HNDL_CAP_CONS_UOM : String(3);
    GR_HNDL_CAP_CONS_UOM_ISO : String(3);
    HANDL_CAP_OUT : Decimal;
    HANDL_CAP_OUT_UOM : String(3);
    HANDL_CAP_OUT_UOM_ISO : String(3);
    SHELF_LIFE_FLAG : String(1);
    SHELF_LIFE : Decimal;
    MATURATION_TIME : Decimal;
    REQ_MIN_SHELF_LIFE : Decimal;
    REQ_MAX_SHELF_LIFE : Decimal;
    LOT_SIZE_UOM : String(3);
    LOT_SIZE_UOM_ISO : String(3);
    REORDER_DURATION : Decimal;
    TARGET_DAYS_SUPPLY : Decimal;
    TSTRID : String(10);
    PLANNING_STRATEGY : String(2);
    PEGGING_PAST_ALERT : Decimal;
    PEGGING_FUTURE_ALERT : Decimal;
    @RFCAbapType : 'N'
    PEGGING_STRATEGY : String(2);
    PEG_ALERT_FLG : String(1);
    FIXED_PEGGING_INDICATOR : String(1);
    WHERE_BOM_FLG : String(1);
    PLANNING_GROUP : String(2);
    INTERACTIVE_SOURCING_PROFILE : String(10);
    PRODUCT_PRIORITY : Integer;
    MINIMUM_PASSING_AMOUNT : Decimal;
    CONVERSION_RULE : String(12);
    USE_ENTIRE_RECEIPT_FLAG : String(1);
    USE_ENTIRE_STOCK_FLAG : String(1);
    SORT_STOCK_BASED_ON_SEGMENT : String(1);
    LEAD_TIME : Decimal;
    TPOP : String(2);
    VCP_SFTY_STK : Decimal;
    PARENT_SFTY_STK : Decimal;
    VCP_PARENT_SFTY_STK : Decimal;
    REPAIR_SAFETY_STOCK : Decimal;
    REPAIR_SAFETY_STOCK_VCL : Decimal;
    VCL_REORDER_POINT : Decimal;
    VCL_MAX_STK_LEVEL : Decimal;
    STOCKHOLDING_COSTS : Decimal;
    PROCUREMENT_COSTS : Decimal;
    NDCOSTWE : Decimal;
    NDCOSTWA : Decimal;
    EXT_SERVICE_PARTS_PLANNING_FLG : String(1);
  };

  type DDIC.BAPI_MARCX {
    PLANT : String(4);
    DEL_FLAG : String(1);
    ABC_ID : String(1);
    CRIT_PART : String(1);
    PUR_GROUP : String(1);
    ISSUE_UNIT : String(1);
    ISSUE_UNIT_ISO : String(1);
    MRPPROFILE : String(1);
    MRP_TYPE : String(1);
    MRP_CTRLER : String(1);
    PLND_DELRY : String(1);
    GR_PR_TIME : String(1);
    PERIOD_IND : String(1);
    ASSY_SCRAP : String(1);
    LOTSIZEKEY : String(1);
    PROC_TYPE : String(1);
    SPPROCTYPE : String(1);
    REORDER_PT : String(1);
    SAFETY_STK : String(1);
    MINLOTSIZE : String(1);
    MAXLOTSIZE : String(1);
    FIXED_LOT : String(1);
    ROUND_VAL : String(1);
    MAX_STOCK : String(1);
    ORD_COSTS : String(1);
    DEP_REQ_ID : String(1);
    STOR_COSTS : String(1);
    ALT_BOM_ID : String(1);
    DISCONTINU : String(1);
    EFF_O_DAY : String(1);
    FOLLOW_UP : String(1);
    GRP_REQMTS : String(1);
    MIXED_MRP : String(1);
    SM_KEY : String(1);
    BACKFLUSH : String(1);
    PRODUCTION_SCHEDULER : String(1);
    PROC_TIME : String(1);
    SETUPTIME : String(1);
    INTEROP : String(1);
    BASE_QTY : String(1);
    INHSEPRODT : String(1);
    STGEPERIOD : String(1);
    STGE_PD_UN : String(1);
    STGE_PD_UN_ISO : String(1);
    OVER_TOL : String(1);
    UNLIMITED : String(1);
    UNDER_TOL : String(1);
    REPLENTIME : String(1);
    REPLACE_PT : String(1);
    IND_POST_TO_INSP_STOCK : String(1);
    CTRL_KEY : String(1);
    DOC_REQD : String(1);
    LOADINGGRP : String(1);
    BATCH_MGMT : String(1);
    QUOTAUSAGE : String(1);
    SERV_LEVEL : String(1);
    SPLIT_IND : String(1);
    AVAILCHECK : String(1);
    FY_VARIANT : String(1);
    CORR_FACT : String(1);
    SETUP_TIME : String(1);
    BASE_QTY_PLAN : String(1);
    SHIP_PROC_TIME : String(1);
    SUP_SOURCE : String(1);
    AUTO_P_ORD : String(1);
    SOURCELIST : String(1);
    COMM_CODE : String(1);
    COUNTRYORI : String(1);
    COUNTRYORI_ISO : String(1);
    REGIONORIG : String(1);
    COMM_CO_UN : String(1);
    COMM_CO_UN_ISO : String(1);
    EXPIMPGRP : String(1);
    PROFIT_CTR : String(1);
    PPC_PL_CAL : String(1);
    REP_MANUF : String(1);
    PL_TI_FNCE : String(1);
    CONSUMMODE : String(1);
    BWD_CONS : String(1);
    FWD_CONS : String(1);
    ALTERNATIVE_BOM : String(1);
    BOM_USAGE : String(1);
    PLANLISTGRP : String(1);
    PLANLISTCNT : String(1);
    LOT_SIZE : String(1);
    SPECPROCTY : String(1);
    PROD_UNIT : String(1);
    PROD_UNIT_ISO : String(1);
    ISS_ST_LOC : String(1);
    MRP_GROUP : String(1);
    COMP_SCRAP : String(1);
    CERT_TYPE : String(1);
    CYCLE_TIME : String(1);
    COVPROFILE : String(1);
    CC_PH_INV : String(1);
    VARIANCE_KEY : String(1);
    SERNO_PROF : String(1);
    REPMANPROF : String(1);
    NEG_STOCKS : String(1);
    QM_RGMTS : String(1);
    PLNG_CYCLE : String(1);
    ROUND_PROF : String(1);
    REFMATCONS : String(1);
    D_TO_REF_M : String(1);
    MULT_REF_M : String(1);
    AUTO_RESET : String(1);
    EX_CERT_ID : String(1);
    EX_CERT_NO_NEW : String(1);
    EX_CERT_DT : String(1);
    MILIT_ID : String(1);
    INSP_INT : String(1);
    CO_PRODUCT : String(1);
    PLAN_STRGP : String(1);
    SLOC_EXPRC : String(1);
    BULK_MAT : String(1);
    CC_FIXED : String(1);
    DETERM_GRP : String(1);
    QM_AUTHGRP : String(1);
    TASK_LIST_TYPE : String(1);
    PUR_STATUS : String(1);
    PRODPROF : String(1);
    SAFTY_T_ID : String(1);
    SAFETYTIME : String(1);
    PLORD_CTRL : String(1);
    BATCHENTRY : String(1);
    PVALIDFROM : String(1);
    MATFRGTGRP : String(1);
    PRODVERSCS : String(1);
    MAT_CFOP : String(1);
    EU_LIST_NO : String(1);
    EU_MAT_GRP : String(1);
    CAS_NO : String(1);
    PRODCOM_NO : String(1);
    CTRL_CODE : String(1);
    JIT_RELVT : String(1);
    MAT_GRP_TRANS : String(1);
    HANDLG_GRP : String(1);
    SUPPLY_AREA : String(1);
    FAIR_SHARE_RULE : String(1);
    PUSH_DISTRIB : String(1);
    DEPLOY_HORIZ : String(1);
    MIN_LOT_SIZE : String(1);
    MAX_LOT_SIZE : String(1);
    FIX_LOT_SIZE : String(1);
    LOT_INCREMENT : String(1);
    PROD_CONV_TYPE : String(1);
    DISTR_PROF : String(1);
    PERIOD_PROFILE_SAFETY_TIME : String(1);
    FXD_PRICE : String(1);
    AVAIL_CHECK_ALL_PROJ_SEGMENTS : String(1);
    OVERALLPRF : String(1);
    MRP_RELEVANCY_DEP_REQUIREMENTS : String(1);
    MIN_SAFETY_STK : String(1);
    NO_COSTING : String(1);
    UNIT_GROUP : String(1);
    FOLLOW_UP_EXTERNAL : String(1);
    FOLLOW_UP_GUID : String(1);
    FOLLOW_UP_VERSION : String(1);
    REFMATCONS_EXTERNAL : String(1);
    REFMATCONS_GUID : String(1);
    REFMATCONS_VERSION : String(1);
    ROTATION_DATE : String(1);
    ORIGINAL_BATCH_FLAG : String(1);
    ORIGINAL_BATCH_REF_MATERIAL : String(1);
    ORIGINAL_BATCH_REF_MATERIAL_E : String(1);
    ORIGINAL_BATCH_REF_MATERIAL_V : String(1);
    ORIGINAL_BATCH_REF_MATERIAL_G : String(1);
    IUID_RELEVANT : String(1);
    IUID_TYPE : String(1);
    UID_IEA : String(1);
    SEGMENTATION_STRATEGY : String(1);
    SEGMENTATION_STATUS : String(1);
    CONSUMPTION_PRIORITY : String(1);
    DISCRETE_BATCH_FLAG : String(1);
    STOCK_PROTECTION_IND : String(1);
    DEFAULT_STOCK_SEGMENT : String(1);
    ADV_PLNG_IND : String(1);
    FOLLOW_UP_LONG : String(1);
    REFMATCONS_LONG : String(1);
    ORIGINAL_BATCH_REF_MATERIAL_L : String(1);
    DEF_SEG_LONG : String(1);
    ORDER_ALLOCATION_REQ : String(1);
    FIX_BATCH_IN_ARUN : String(1);
    GR_PROC_TIME : String(1);
    GI_PROC_TIME : String(1);
    STORAGE_COST : String(1);
    REPLENISHMENT_LEAD_TIME : String(1);
    RRP_PLANNING_TYPE : String(1);
    HEURISTIC_ID : String(1);
    HEURISTIC_PACKAGE_ID : String(1);
    PENALTY_COSTS : String(1);
    GET_ALERTS : String(1);
    RESOURCE_NETWORK : String(1);
    CONS_HANDL_CAP : String(1);
    GR_HNDL_CAP_CONS_UOM : String(1);
    GR_HNDL_CAP_CONS_UOM_ISO : String(1);
    HANDL_CAP_OUT : String(1);
    HANDL_CAP_OUT_UOM : String(1);
    HANDL_CAP_OUT_UOM_ISO : String(1);
    SHELF_LIFE_FLAG : String(1);
    SHELF_LIFE : String(1);
    MATURATION_TIME : String(1);
    REQ_MIN_SHELF_LIFE : String(1);
    REQ_MAX_SHELF_LIFE : String(1);
    LOT_SIZE_UOM : String(1);
    LOT_SIZE_UOM_ISO : String(1);
    REORDER_DURATION : String(1);
    TARGET_DAYS_SUPPLY : String(1);
    TSTRID : String(1);
    PLANNING_STRATEGY : String(1);
    PEGGING_PAST_ALERT : String(1);
    PEGGING_FUTURE_ALERT : String(1);
    PEGGING_STRATEGY : String(1);
    PEG_ALERT_FLG : String(1);
    FIXED_PEGGING_INDICATOR : String(1);
    WHERE_BOM_FLG : String(1);
    PLANNING_GROUP : String(1);
    INTERACTIVE_SOURCING_PROFILE : String(1);
    PRODUCT_PRIORITY : String(1);
    MINIMUM_PASSING_AMOUNT : String(1);
    CONVERSION_RULE : String(1);
    USE_ENTIRE_RECEIPT_FLAG : String(1);
    USE_ENTIRE_STOCK_FLAG : String(1);
    SORT_STOCK_BASED_ON_SEGMENT : String(1);
    LEAD_TIME : String(1);
    TPOP : String(1);
    VCP_SFTY_STK : String(1);
    PARENT_SFTY_STK : String(1);
    VCP_PARENT_SFTY_STK : String(1);
    REPAIR_SAFETY_STOCK : String(1);
    REPAIR_SAFETY_STOCK_VCL : String(1);
    VCL_REORDER_POINT : String(1);
    VCL_MAX_STK_LEVEL : String(1);
    STOCKHOLDING_COSTS : String(1);
    PROCUREMENT_COSTS : String(1);
    NDCOSTWE : String(1);
    NDCOSTWA : String(1);
    EXT_SERVICE_PARTS_PLANNING_FLG : String(1);
  };

  type DDIC.BAPI_MVKE {
    SALES_ORG : String(4);
    DISTR_CHAN : String(2);
    DEL_FLAG : String(1);
    MATL_STATS : String(1);
    REBATE_GRP : String(2);
    COMM_GROUP : String(2);
    CASH_DISC : String(1);
    SAL_STATUS : String(2);
    VALID_FROM : Date;
    MIN_ORDER : Decimal;
    MIN_DELY : Decimal;
    MIN_MTO : Decimal;
    DELY_UNIT : Decimal;
    DELY_UOM : String(3);
    DELY_UOM_ISO : String(3);
    SALES_UNIT : String(3);
    SALES_UNIT_ISO : String(3);
    ITEM_CAT : String(4);
    DELYG_PLNT : String(4);
    PROD_HIER : String(18);
    PR_REF_MAT : String(18);
    MAT_PR_GRP : String(2);
    ACCT_ASSGT : String(2);
    MATL_GRP_1 : String(3);
    MATL_GRP_2 : String(3);
    MATL_GRP_3 : String(3);
    MATL_GRP_4 : String(3);
    MATL_GRP_5 : String(3);
    PROD_ATT_1 : String(1);
    PROD_ATT_2 : String(1);
    PROD_ATT_3 : String(1);
    PROD_ATT_4 : String(1);
    PROD_ATT_5 : String(1);
    PROD_ATT_6 : String(1);
    PROD_ATT_7 : String(1);
    PROD_ATT_8 : String(1);
    PROD_ATT_9 : String(1);
    PROD_ATT10 : String(1);
    ROUND_PROF : String(4);
    VAR_SALES_UN : String(1);
    UNIT_GROUP : String(4);
    PR_REF_MAT_EXTERNAL : String(40);
    PR_REF_MAT_GUID : String(32);
    PR_REF_MAT_VERSION : String(10);
    PR_REF_MAT_LONG : String(40);
  };

  type DDIC.BAPI_MVKEX {
    SALES_ORG : String(4);
    DISTR_CHAN : String(2);
    DEL_FLAG : String(1);
    MATL_STATS : String(1);
    REBATE_GRP : String(1);
    COMM_GROUP : String(1);
    CASH_DISC : String(1);
    SAL_STATUS : String(1);
    VALID_FROM : String(1);
    MIN_ORDER : String(1);
    MIN_DELY : String(1);
    MIN_MTO : String(1);
    DELY_UNIT : String(1);
    DELY_UOM : String(1);
    DELY_UOM_ISO : String(1);
    SALES_UNIT : String(1);
    SALES_UNIT_ISO : String(1);
    ITEM_CAT : String(1);
    DELYG_PLNT : String(1);
    PROD_HIER : String(1);
    PR_REF_MAT : String(1);
    MAT_PR_GRP : String(1);
    ACCT_ASSGT : String(1);
    MATL_GRP_1 : String(1);
    MATL_GRP_2 : String(1);
    MATL_GRP_3 : String(1);
    MATL_GRP_4 : String(1);
    MATL_GRP_5 : String(1);
    PROD_ATT_1 : String(1);
    PROD_ATT_2 : String(1);
    PROD_ATT_3 : String(1);
    PROD_ATT_4 : String(1);
    PROD_ATT_5 : String(1);
    PROD_ATT_6 : String(1);
    PROD_ATT_7 : String(1);
    PROD_ATT_8 : String(1);
    PROD_ATT_9 : String(1);
    PROD_ATT10 : String(1);
    ROUND_PROF : String(1);
    VAR_SALES_UN : String(1);
    UNIT_GROUP : String(1);
    PR_REF_MAT_EXTERNAL : String(1);
    PR_REF_MAT_GUID : String(1);
    PR_REF_MAT_VERSION : String(1);
    PR_REF_MAT_LONG : String(1);
  };

  type DDIC.BAPI_MARD {
    PLANT : String(4);
    STGE_LOC : String(4);
    DEL_FLAG : String(1);
    MRP_IND : String(1);
    SPEC_PROC : String(2);
    REORDER_PT : Decimal;
    REPL_QTY : Decimal;
    STGE_BIN : String(10);
    PICKG_AREA : String(3);
    INV_CORR_FAC : Double;
  };

  type DDIC.BAPI_MARDX {
    PLANT : String(4);
    STGE_LOC : String(4);
    DEL_FLAG : String(1);
    MRP_IND : String(1);
    SPEC_PROC : String(1);
    REORDER_PT : String(1);
    REPL_QTY : String(1);
    STGE_BIN : String(1);
    PICKG_AREA : String(1);
    INV_CORR_FAC : String(1);
  };

  type DDIC.BAPI_MLGT {
    WHSE_NO : String(3);
    STGE_TYPE : String(3);
    DEL_FLAG : String(1);
    STGE_BIN : String(10);
    MAX_SB_QTY : Decimal;
    MIN_SB_QTY : Decimal;
    CTRL_QTY : Decimal;
    REPLEN_QTY : Decimal;
    PICK_AREA : String(3);
    ROUND_QTY : Decimal;
  };

  type DDIC.BAPI_MLGTX {
    WHSE_NO : String(3);
    STGE_TYPE : String(3);
    DEL_FLAG : String(1);
    STGE_BIN : String(1);
    MAX_SB_QTY : String(1);
    MIN_SB_QTY : String(1);
    CTRL_QTY : String(1);
    REPLEN_QTY : String(1);
    PICK_AREA : String(1);
    ROUND_QTY : String(1);
  };

  type DDIC.BAPI_MBEW {
    VAL_AREA : String(4);
    VAL_TYPE : String(10);
    DEL_FLAG : String(1);
    PRICE_CTRL : String(1);
    MOVING_PR : Decimal;
    STD_PRICE : Decimal;
    PRICE_UNIT : Decimal;
    VAL_CLASS : String(4);
    PR_CTRL_PP : String(1);
    MOV_PR_PP : Decimal;
    STD_PR_PP : Decimal;
    PR_UNIT_PP : Decimal;
    VCLASS_PP : String(4);
    PR_CTRL_PY : String(1);
    MOV_PR_PY : Decimal;
    STD_PR_PY : Decimal;
    VCLASS_PY : String(4);
    PR_UNIT_PY : Decimal;
    VAL_CAT : String(1);
    FUTURE_PR : Decimal;
    VALID_FROM : Date;
    TAXPRICE_1 : Decimal;
    COMMPRICE1 : Decimal;
    TAXPRICE_3 : Decimal;
    COMMPRICE3 : Decimal;
    PLND_PRICE : Decimal;
    PLNDPRICE1 : Decimal;
    PLNDPRICE2 : Decimal;
    PLNDPRICE3 : Decimal;
    PLNDPRDATE1 : Date;
    PLNDPRDATE2 : Date;
    PLNDPRDATE3 : Date;
    LIFO_FIFO : String(1);
    POOLNUMBER : String(4);
    TAXPRICE_2 : Decimal;
    COMMPRICE2 : Decimal;
    @RFCAbapType : 'N'
    DEVAL_IND : String(2);
    ORIG_GROUP : String(4);
    OVERHEAD_GRP : String(10);
    QTY_STRUCT : String(1);
    ML_ACTIVE : String(1);
    ML_SETTLE : String(1);
    ORIG_MAT : String(1);
    VM_SO_STK : String(4);
    VM_P_STOCK : String(4);
    MATL_USAGE : String(1);
    MAT_ORIGIN : String(1);
    IN_HOUSE : String(1);
    TAX_CML_UN : Decimal;
  };

  type DDIC.![/CWM/BAPI_MBEW] {
    VAL_AREA : String(4);
    VAL_TYPE : String(10);
    CON_FIN_VALLEVEL : String(3);
    CON_FIN_VALPROC : String(3);
  };

  type DDIC.![/CWM/BAPI_MBEWX] {
    VAL_AREA : String(4);
    VAL_TYPE : String(10);
    CON_FIN_VALLEVEL : String(1);
    CON_FIN_VALPROC : String(1);
  };

  type DDIC.BAPI_MBEWX {
    VAL_AREA : String(4);
    VAL_TYPE : String(10);
    DEL_FLAG : String(1);
    PRICE_CTRL : String(1);
    MOVING_PR : String(1);
    STD_PRICE : String(1);
    PRICE_UNIT : String(1);
    VAL_CLASS : String(1);
    PR_CTRL_PP : String(1);
    MOV_PR_PP : String(1);
    STD_PR_PP : String(1);
    PR_UNIT_PP : String(1);
    VCLASS_PP : String(1);
    PR_CTRL_PY : String(1);
    MOV_PR_PY : String(1);
    STD_PR_PY : String(1);
    VCLASS_PY : String(1);
    PR_UNIT_PY : String(1);
    VAL_CAT : String(1);
    FUTURE_PR : String(1);
    VALID_FROM : String(1);
    TAXPRICE_1 : String(1);
    COMMPRICE1 : String(1);
    TAXPRICE_3 : String(1);
    COMMPRICE3 : String(1);
    PLND_PRICE : String(1);
    PLNDPRICE1 : String(1);
    PLNDPRICE2 : String(1);
    PLNDPRICE3 : String(1);
    PLNDPRDATE1 : String(1);
    PLNDPRDATE2 : String(1);
    PLNDPRDATE3 : String(1);
    LIFO_FIFO : String(1);
    POOLNUMBER : String(1);
    TAXPRICE_2 : String(1);
    COMMPRICE2 : String(1);
    DEVAL_IND : String(1);
    ORIG_GROUP : String(1);
    OVERHEAD_GRP : String(1);
    QTY_STRUCT : String(1);
    ML_ACTIVE : String(1);
    ML_SETTLE : String(1);
    ORIG_MAT : String(1);
    VM_SO_STK : String(1);
    VM_P_STOCK : String(1);
    MATL_USAGE : String(1);
    MAT_ORIGIN : String(1);
    IN_HOUSE : String(1);
    TAX_CML_UN : String(1);
  };

  type DDIC.BAPI_MLGN {
    WHSE_NO : String(3);
    DEL_FLAG : String(1);
    STGESECTOR : String(3);
    PLACEMENT : String(3);
    WITHDRAWAL : String(3);
    L_EQUIP_1 : Decimal;
    L_EQUIP_2 : Decimal;
    L_EQUIP_3 : Decimal;
    LEQ_UNIT_1 : String(3);
    LEQ_UNIT_1_ISO : String(3);
    LEQ_UNIT_2 : String(3);
    LEQ_UNIT_2_ISO : String(3);
    LEQ_UNIT_3 : String(3);
    LEQ_UNIT_3_ISO : String(3);
    UNITTYPE_1 : String(3);
    UNITTYPE_2 : String(3);
    UNITTYPE_3 : String(3);
    WM_UNIT : String(3);
    WM_UNIT_ISO : String(3);
    ADD_TO_STK : String(1);
    BLOCK_STGE : String(2);
    MSG_TO_IM : String(1);
    SPEC_MVMT : String(1);
    CAPY_USAGE : Decimal;
    PROCURE_UN : String(3);
    PROCURE_UN_ISO : String(3);
    STGE_TYPE : String(3);
    REF_UNIT : String(1);
    ![2STEP_PICK] : String(1);
  };

  type DDIC.BAPI_MLGNX {
    WHSE_NO : String(3);
    DEL_FLAG : String(1);
    STGESECTOR : String(1);
    PLACEMENT : String(1);
    WITHDRAWAL : String(1);
    L_EQUIP_1 : String(1);
    L_EQUIP_2 : String(1);
    L_EQUIP_3 : String(1);
    LEQ_UNIT_1 : String(1);
    LEQ_UNIT_1_ISO : String(1);
    LEQ_UNIT_2 : String(1);
    LEQ_UNIT_2_ISO : String(1);
    LEQ_UNIT_3 : String(1);
    LEQ_UNIT_3_ISO : String(1);
    UNITTYPE_1 : String(1);
    UNITTYPE_2 : String(1);
    UNITTYPE_3 : String(1);
    WM_UNIT : String(1);
    WM_UNIT_ISO : String(1);
    ADD_TO_STK : String(1);
    BLOCK_STGE : String(1);
    MSG_TO_IM : String(1);
    SPEC_MVMT : String(1);
    CAPY_USAGE : String(1);
    PROCURE_UN : String(1);
    PROCURE_UN_ISO : String(1);
    STGE_TYPE : String(1);
    REF_UNIT : String(1);
    ![2STEP_PICK] : String(1);
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

  type DDIC.BAPI_PPO_DMND_PENALTY {
    PLANT : String(4);
    DEMAND_TYPE : Integer;
    DEL_FLAG : String(1);
    DELAY_PENALTY_AMOUNT : Decimal;
    MAXIMUM_DELAY_IN_DAYS : Decimal;
    NONDELIVERY_PENALTY_AMOUNT : Decimal;
  };

  type DDIC.BAPI_PPO_DMND_PENALTYX {
    PLANT : String(4);
    DEMAND_TYPE : Integer;
    DEL_FLAG : String(1);
    DELAY_PENALTY_AMOUNT : String(1);
    MAXIMUM_DELAY_IN_DAYS : String(1);
    NONDELIVERY_PENALTY_AMOUNT : String(1);
  };

  type DDIC.BAPIPAREX {
    STRUCTURE : String(30);
    VALUEPART1 : String(240);
    VALUEPART2 : String(240);
    VALUEPART3 : String(240);
    VALUEPART4 : String(240);
  };

  type DDIC.BAPIPAREXX {
    STRUCTURE : String(30);
    VALUEPART1 : String(240);
    VALUEPART2 : String(240);
    VALUEPART3 : String(240);
    VALUEPART4 : String(240);
  };

  type DDIC.BAPI_MEAN {
    UNIT : String(3);
    UNIT_ISO : String(3);
    EAN_UPC : String(18);
    EAN_CAT : String(2);
    DEL_FLAG : String(1);
    SEGMENT : String(16);
    SEG_LONG : String(40);
  };

  type DDIC.BAPI_MAKT {
    LANGU : String(1);
    LANGU_ISO : String(2);
    MATL_DESC : String(40);
    DEL_FLAG : String(1);
  };

  type DDIC.BAPI_MLTX {
    APPLOBJECT : String(10);
    TEXT_NAME : String(70);
    TEXT_ID : String(4);
    LANGU : String(1);
    LANGU_ISO : String(2);
    FORMAT_COL : String(2);
    TEXT_LINE : String(132);
    DEL_FLAG : String(1);
    TEXT_NAME_S4 : String(70);
  };

  type DDIC.![/NFM/BAPITVGW] {
    PLANT : String(4);
    ORGA : String(4);
    DISTR_CHAN : String(2);
    NFMKEY : String(3);
    CHARGEWE : Decimal;
    REFQNTY : Decimal;
    BASEKEY : String(2);
  };

  type DDIC.![/NFM/BAPITVGWX] {
    PLANT : String(4);
    ORGA : String(4);
    DISTR_CHAN : String(2);
    NFMKEY : String(3);
    CHARGEWE : String(1);
    REFQNTY : String(1);
    BASEKEY : String(1);
  };

  type DDIC.![/NFM/BAPITKGW] {
    PLANT : String(4);
    NFMKEY : String(3);
    STRUCWE : Decimal;
    REFQNTY : Decimal;
    BASEUOM : String(3);
    BASEUOMISO : String(3);
  };

  type DDIC.![/NFM/BAPITKGWX] {
    PLANT : String(4);
    NFMKEY : String(3);
    STRUCWE : String(1);
    REFQNTY : String(1);
    BASEUOM : String(1);
  };

  type DDIC.BAPI_MFHM {
    PLANT : String(4);
    CREATE_LOAD_RECS : String(1);
    CTRL_KEY : String(4);
    CTRL_KEY_NO_CHG : String(1);
    GRP_KEY_1 : String(4);
    GRP_KEY_2 : String(4);
    PRT_USAGE : String(3);
    STD_TEXT_KEY : String(7);
    REF_KEY_NO_CHG : String(1);
    START_REF_DATE : String(2);
    ST_REF_DATE_NO_CHG : String(1);
    START_OFFSET : Decimal;
    START_OFFSET_UNIT : String(3);
    START_OFFSET_UNIT_ISO : String(3);
    START_OFFSET_NO_CHG : String(1);
    END_REF_DATE : String(2);
    END_REF_DATE_NO_CHG : String(1);
    END_OFFSET : Decimal;
    END_OFFSET_UNIT : String(3);
    END_OFFSET_UNIT_ISO : String(3);
    END_OFFSET_NO_CHG : String(1);
    FORMULA_TOT_QTY : String(6);
    FORMULA_TOT_QTY_NO_CHG : String(1);
    FORMULA_TOT_USAGE : String(6);
    FORMULA_TOT_USAGE_NO_CHG : String(1);
  };

  type DDIC.BAPI_MFHMX {
    PLANT : String(4);
    CREATE_LOAD_RECS : String(1);
    CTRL_KEY : String(1);
    CTRL_KEY_NO_CHG : String(1);
    GRP_KEY_1 : String(1);
    GRP_KEY_2 : String(1);
    PRT_USAGE : String(1);
    STD_TEXT_KEY : String(1);
    REF_KEY_NO_CHG : String(1);
    START_REF_DATE : String(1);
    ST_REF_DATE_NO_CHG : String(1);
    START_OFFSET : String(1);
    START_OFFSET_UNIT : String(1);
    START_OFFSET_UNIT_ISO : String(1);
    START_OFFSET_NO_CHG : String(1);
    END_REF_DATE : String(1);
    END_REF_DATE_NO_CHG : String(1);
    END_OFFSET : String(1);
    END_OFFSET_UNIT : String(1);
    END_OFFSET_UNIT_ISO : String(1);
    END_OFFSET_NO_CHG : String(1);
    FORMULA_TOT_QTY : String(1);
    FORMULA_TOT_QTY_NO_CHG : String(1);
    FORMULA_TOT_USAGE : String(1);
    FORMULA_TOT_USAGE_NO_CHG : String(1);
  };

  type DDIC.BAPI_MATRETURN2 {
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

  type DDIC.BAPI_SGT_MRP_GN {
    PLANT : String(4);
    STOCK_SEGMENT : String(16);
    INHSEPRODT : Decimal;
    PUR_GROUP : String(3);
    PLND_DELRY : Decimal;
    SAFTY_T_ID : String(1);
    @RFCAbapType : 'N'
    SAFETYTIME : String(2);
    REPLENTIME : Decimal;
    ATP_MRP_STATUS : String(2);
    SEGMENTATION_VALIDFROM : Date;
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MRP_GNX {
    PLANT : String(4);
    STOCK_SEGMENT : String(16);
    INHSEPRODT : String(1);
    PUR_GROUP : String(1);
    PLND_DELRY : String(1);
    SAFTY_T_ID : String(1);
    SAFETYTIME : String(1);
    REPLENTIME : String(1);
    PVALIDFROM : String(1);
    ATP_MRP_STATUS : String(1);
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MRP {
    PLANT : String(4);
    STOCK_SEGMENT : String(16);
    SAFETY_STK : Decimal;
    MINLOTSIZE : Decimal;
    ROUND_VAL : Decimal;
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MRPX {
    PLANT : String(4);
    STOCK_SEGMENT : String(16);
    SAFETY_STK : String(1);
    MINLOTSIZE : String(1);
    ROUND_VAL : String(1);
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MVKE {
    SALESORG : String(4);
    DISTR_CHAN : String(2);
    REQ_SEGMENT : String(16);
    SAL_STATUS : String(2);
    VALID_FROM : Date;
    REQ_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MVKEX {
    SALESORG : String(4);
    DISTR_CHAN : String(2);
    REQ_SEGMENT : String(16);
    SAL_STATUS : String(1);
    VALID_FROM : String(1);
    REQ_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MADKA {
    PLANT : String(4);
    STOCK_SEGMENT : String(16);
    PREFERENCE_SEGMENT : String(1);
    VALUATION_TYPE : String(10);
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MADKAX {
    PLANT : String(4);
    STOCK_SEGMENT : String(16);
    PREFERENCE_SEGMENT : String(1);
    VALUATION_TYPE : String(1);
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MARM {
    ALT_UNIT : String(3);
    ALT_UNIT_ISO : String(3);
    STOCK_SEGMENT : String(16);
    VOLUME : Decimal;
    GROSS_WT : Decimal;
    NET_WEIGHT : Decimal;
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_SGT_MARMX {
    ALT_UNIT : String(3);
    ALT_UNIT_ISO : String(3);
    STOCK_SEGMENT : String(16);
    VOLUME : String(1);
    GROSS_WT : String(1);
    NET_WEIGHT : String(1);
    STK_SEG_LONG : String(40);
  };

  type DDIC.BAPI_MLAN {
    DEPCOUNTRY : String(3);
    DEPCOUNTRY_ISO : String(2);
    TAX_TYPE_1 : String(4);
    TAXCLASS_1 : String(1);
    TAX_TYPE_2 : String(4);
    TAXCLASS_2 : String(1);
    TAX_TYPE_3 : String(4);
    TAXCLASS_3 : String(1);
    TAX_TYPE_4 : String(4);
    TAXCLASS_4 : String(1);
    TAX_TYPE_5 : String(4);
    TAXCLASS_5 : String(1);
    TAX_TYPE_6 : String(4);
    TAXCLASS_6 : String(1);
    TAX_TYPE_7 : String(4);
    TAXCLASS_7 : String(1);
    TAX_TYPE_8 : String(4);
    TAXCLASS_8 : String(1);
    TAX_TYPE_9 : String(4);
    TAXCLASS_9 : String(1);
    TAX_IND : String(1);
  };

  type DDIC.BAPI_MARM {
    ALT_UNIT : String(3);
    ALT_UNIT_ISO : String(3);
    NUMERATOR : Decimal;
    DENOMINATR : Decimal;
    EAN_UPC : String(18);
    EAN_CAT : String(2);
    LENGTH : Decimal;
    WIDTH : Decimal;
    HEIGHT : Decimal;
    UNIT_DIM : String(3);
    UNIT_DIM_ISO : String(3);
    VOLUME : Decimal;
    VOLUMEUNIT : String(3);
    VOLUMEUNIT_ISO : String(3);
    GROSS_WT : Decimal;
    UNIT_OF_WT : String(3);
    UNIT_OF_WT_ISO : String(3);
    DEL_FLAG : String(1);
    SUB_UOM : String(3);
    SUB_UOM_ISO : String(3);
    GTIN_VARIANT : String(2);
    NESTING_FACTOR : Decimal;
    MAXIMUM_STACKING : Integer;
    CAPACITY_USAGE : Decimal;
    EWM_CW_UOM_TYPE : String(1);
  };

  type DDIC.![/CWM/BAPI_MARM] {
    ALT_UNIT : String(3);
    ALT_UNIT_ISO : String(3);
    UNIT_TYPE_CWM : String(1);
  };

  type DDIC.![/CWM/BAPI_MARMX] {
    ALT_UNIT : String(3);
    ALT_UNIT_ISO : String(3);
    UNIT_TYPE_CWM : String(1);
  };

  type DDIC.BAPI_MARMX {
    ALT_UNIT : String(3);
    ALT_UNIT_ISO : String(3);
    NUMERATOR : String(1);
    DENOMINATR : String(1);
    EAN_UPC : String(1);
    EAN_CAT : String(1);
    LENGTH : String(1);
    WIDTH : String(1);
    HEIGHT : String(1);
    UNIT_DIM : String(1);
    UNIT_DIM_ISO : String(1);
    VOLUME : String(1);
    VOLUMEUNIT : String(1);
    VOLUMEUNIT_ISO : String(1);
    GROSS_WT : String(1);
    UNIT_OF_WT : String(1);
    UNIT_OF_WT_ISO : String(1);
    SUB_UOM : String(1);
    SUB_UOM_ISO : String(1);
    GTIN_VARIANT : String(1);
    NESTING_FACTOR : String(1);
    MAXIMUM_STACKING : String(1);
    CAPACITY_USAGE : String(1);
    EWM_CW_UOM_TYPE : String(1);
  };
};

