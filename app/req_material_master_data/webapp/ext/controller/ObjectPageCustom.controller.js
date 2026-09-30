sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension', 'sap/m/BusyDialog', 'sap/m/MessageBox', "sap/m/library"
], function (ControllerExtension, BusyDialog, MessageBox, mLibrary) {
    'use strict';
    const { ButtonType } = mLibrary;

    return ControllerExtension.extend('reqmaterialmasterdata.ext.controller.ObjectPageCustom', {
        
        override: {
            /**
             * Component initialization.
             * Sets up local JSON models and attaches observers for data changes.
             */
            onInit: function () {
                let oView = this.base.getView();

                // Initialize a local model to manage UI state and custom table data
                let oCharacteristicsModel = new sap.ui.model.json.JSONModel({
                    items: []
                });
                oView.setModel(oCharacteristicsModel, "characteristics");
                
                // Monitor context changes to ensure visibility and property listeners are updated
                oView.attachModelContextChange(function () {
                    let oContext = oView.getBindingContext();
                    if (oContext) {
                        this._updateCharacteristicsVisibility();
                        this._updatePlantRequiredState();
                        this._updateNonToStockNote();

                        let oModel = oContext.getModel();
                        
                        // Prevent multiple attachments to the same model instance
                        if (oModel && !this._bAttached) {
                            oModel.attachPropertyChange(function (oEvent) {

                                let sPath = oEvent.getParameter("path");
                                let oCurrentContext = this.base.getView().getBindingContext();
                                let oEventContext = oEvent.getParameter("context");

                                // Verify that the change belongs to the entity the user is currently viewing
                                if (oEventContext && oCurrentContext && oEventContext.getPath() !== oCurrentContext.getPath()) {
                                    return;
                                }

                                // Handle UI visibility when form type changes
                                if (sPath === "formType_code") {
                                    this._updateCharacteristicsVisibility();
                                    this._updatePlantRequiredState();
                                    this._refreshPlantContent();
                                    this._updateNonToStockNote();

                                // Reset dependent fields (Plant) when Material changes
                                } else if (sPath === "sapMaterialNumber_Product") {
                                    this._triggerMaterialDescriptionRefresh();
                                    if (oCurrentContext) {
                                        oCurrentContext.setProperty("plant_plant_Plant", null);
                                    }

                                    let oPlantsModel = oView.getModel("plantsModel");
                                    if (oPlantsModel) {
                                        oPlantsModel.setProperty("/items", []);
                                    }

                                // Load new characteristics when the Material Class is updated
                                } else if (sPath === "materialClass_ClassInternalID") {
                                    let classId = oEvent.getParameter("value");

                                    if (classId) {
                                        this._onClassChange(classId);
                                    } else {
                                        // Reset local state if the class is cleared by the user
                                        this.base.getView().getModel("characteristics").setProperty("/items", []);
                                    }
                                }

                            }.bind(this));
                            
                            this._bAttached = true;
                        }
                    }
                }.bind(this));
            },

            routing: {
                /**
                 * Triggered by the Fiori Elements Router.
                 * Synchronizes the local JSON model with the data stored in the OData entity.
                 */
                onAfterBinding: function (oBindingContext) {
                    let oJSONModel = this.base.getView().getModel("characteristics");
                    oJSONModel.setProperty("/items", []);

                    if (oBindingContext) this._handleDataLoading(oBindingContext);
                }
            },

            editFlow: {
                /**
                 * Hook executed before the standard save action.
                 * Serializes the local JSON table data into a string for OData persistence.
                 */
                onBeforeSave: function () {
                    const oView = this.base.getView();
                    const oJSONModel = oView.getModel("characteristics");
                    const aItems = oJSONModel.getProperty("/items");
                    const oContext = oView.getBindingContext();

                    if (oContext && aItems) {
                        // Persist custom table items as a JSON string
                        const sJsonData = JSON.stringify(aItems);
                        oContext.setProperty("materialClassCharact", sJsonData);
                    }

                    return Promise.resolve();
                }
            }
        },

        _handleDataLoading: function (oBindingContext) {
            const oView = this.getView();

            if (!this._oBusyDialog) {
                this._oBusyDialog = new sap.m.BusyDialog();
                oView.addDependent(this._oBusyDialog);
            }
            this._oBusyDialog.open();

            // 1. First, we get the basic data to determine the flow
            oBindingContext.requestObject().then((oData) => {
                const sFormType = oData.formType_code;
                const bIsActive = oData.IsActiveEntity;

                let oPreloadPromise = Promise.resolve();

                // Preload Plant Model for Drafts so the Select control can display the saved value
                if (!bIsActive && oData.plant_plant_Plant) {
                    oPreloadPromise = oBindingContext.requestProperty("plant/PlantName").then((sPlantName) => {
                        let oPlantsModel = oView.getModel("plantsModel");
                        if (!oPlantsModel) {
                            oPlantsModel = new sap.ui.model.json.JSONModel();
                            oView.setModel(oPlantsModel, "plantsModel");
                        }
                        const currentItems = oPlantsModel.getProperty("/items") || [];
                        if (currentItems.length === 0) {
                            oPlantsModel.setProperty("/items", [{
                                plant: oData.plant_plant_Plant,
                                plantName: sPlantName || oData.plant_plant_Plant
                            }]);
                        }
                    }).catch(() => { /* Ignore errors on preload */ });
                }

                oPreloadPromise.then(() => {
                    // CASE A: Types that do not require heavy loading
                    if (sFormType === 'Deletion' || sFormType === 'SafetyStock') {
                        this._oBusyDialog.close();
                        return;
                    } else {
                        // CASE B: NewStock or NonStock (Require additional data)
                        let oLoadPromise;

                        if (bIsActive) {
                            // If it is an active entity, we force waiting for the plant
                            // requestProperty triggers the backend request if the data is missing
                            oLoadPromise = oBindingContext.requestProperty("plant_plant_Plant")
                                .then(() => this._syncCharacteristicsData(oBindingContext));
                        } else {
                            // If it is a Draft, we go straight to synchronization
                            oLoadPromise = this._syncCharacteristicsData(oBindingContext);
                        }

                        oLoadPromise
                            .catch((oError) => {
                                console.error("Error loading dependent data:", oError);
                                this._handleFatalError("Could not load the form data.");
                            })
                            .finally(() => {
                                this._oBusyDialog.close();
                            });
                    }
                });

            }).catch((oError) => {
                this._oBusyDialog.close();
                this._handleFatalError("Error retrieving the form.");
            });
        },

        _handleFatalError: function (sErrorMessage) {
            MessageBox.error(sErrorMessage, {
                title: "Error",
                onClose: function () {
                    window.history.back();
                }.bind(this)
            });
        },

        /**
         * Toggles the visibility of the Custom Section based on the Form Type.
         * Only visible for 'NewStock' or 'NonStock' scenarios.
         */
        _updateCharacteristicsVisibility: function() {
            let oView = this.base.getView();
            let oContext = oView.getBindingContext();
            
            // Standard ID pattern for Fiori Elements Custom Sections
            let sId = "reqmaterialmasterdata::FormObjectPage--fe::CustomSection::ClassCharacteristics";
            let oSection = oView.byId(sId) || oView.byId("ClassCharacteristics");

            if (oSection && oContext) {
                oContext.requestProperty("formType_code").then(function(sType) {
                    let bVisible = (sType === 'NewStock' || sType === 'NonStock');
                    oSection.setVisible(bVisible);
                }).catch(function(oError) {
                    console.error("Error retrieving formType_code:", oError);
                });
            }
        },

        _refreshPlantContent: function() {
            let oView = this.base.getView();
            let oContext = oView.getBindingContext();

            if (oContext) {
                oContext.requestProperty("formType_code").then(function(sType) {
                    let bRefresh = (sType === 'Deletion' || sType === 'SafetyStock');
                    if (bRefresh) {
                        oContext.setProperty("plant_plant_Plant", null);
                    }
                }).catch(function(oError) {
                    console.error("Error retrieving formType_code:", oError);
                });
            }
        },

        _updatePlantRequiredState: function() {
            let oView = this.base.getView();
            let oContext = oView.getBindingContext();
            
            if (!oContext) return;

            oContext.requestProperty("formType_code").then((sType) => {
                let bIsRequired = (sType === 'Deletion' || sType === 'SafetyStock' || sType === 'NonToStock');
                if (!bIsRequired) return;
                let oPlantVBox;

                let aControls = sap.ui.core.Element.registry.filter((oControl) => {
                    let sControlId = oControl.getId();
                    return (sControlId.endsWith("--idVBoxPlant") || sControlId.endsWith("idVBoxPlant")) 
                           && sControlId.includes("::" + sType + "::");
                });

                if (aControls.length > 0) {
                    oPlantVBox = aControls[0];
                }
                
                if (oPlantVBox) {
                    let oCurrentNode = oPlantVBox.getParent();
                    
                    while (oCurrentNode && !oCurrentNode.getId().includes("CustomFormElement::Plant")) {
                        oCurrentNode = oCurrentNode.getParent();
                    }
                    
                    if (oCurrentNode) {
                        let oLabelControl;

                        if (typeof oCurrentNode.getLabelControl === "function") {
                            oLabelControl = oCurrentNode.getLabelControl();
                        }
                        if (!oLabelControl) {
                            oLabelControl = sap.ui.getCore().byId(oCurrentNode.getId() + "-label");
                        }
                        if (!oLabelControl && oCurrentNode._oLabel) {
                            oLabelControl = oCurrentNode._oLabel;
                        }

                        if (oLabelControl && typeof oLabelControl.setRequired === "function") {
                            oLabelControl.setRequired(bIsRequired && oContext.getProperty("IsActiveEntity") === false);
                        }
                    }
                } else {
                    if (!this._bPlantRetry) {
                        this._bPlantRetry = true;
                        
                        setTimeout(() => {
                            this._updatePlantRequiredState();
                            this._bPlantRetry = false;
                        }, 500);
                        
                    }
                }

            }).catch((oError) => {
                console.error("Failed to update Plant state:", oError);
            });
        },

        /**
         * Triggers side effects to refresh material descriptions from the backend.
         */
        _triggerMaterialDescriptionRefresh: function() {
            let oView = this.base.getView();
            let oContext = oView.getBindingContext();
            let matDescription = "materialDescription";

            if (oContext) {
                // Request Fiori Elements to refresh specific properties
                oContext.requestSideEffects([
                    { $PropertyPath: matDescription }
                ]).catch(function(oError) {
                    console.error("Technical error during property synchronization:", oError);
                });
            }
        },

        /**
         * Orchestrates data synchronization between persisted OData and the UI's JSON model.
         */
        _syncCharacteristicsData: function (oContext) {
            if (!oContext) return;
            
            // Fetch both the persisted JSON and current Class ID
            return Promise.all([
                oContext.requestProperty("materialClassCharact"),
                oContext.requestProperty("materialClass_ClassInternalID")
            ]).then((aValues) => {
                const sSavedJson = aValues[0];
                const sClassId = aValues[1];

                if (sSavedJson) {
                    // Use previously saved values if available
                    let oJSONModel = this.base.getView().getModel("characteristics");
                    oJSONModel.setProperty("/items", this._sortCharacteristicsByPosition(JSON.parse(sSavedJson)));
                    return Promise.resolve();
                } else if (sClassId) {
                    // Fetch default characteristics from service for a new class selection
                    return this._onClassChange(sClassId);
                }
            });
        },

        /**
         * Executes a backend Action to retrieve characteristic details for a specific Class ID.
         */
        _onClassChange: function(sClassId) {
            let oModel = this.base.getExtensionAPI().getModel();
            let oJSONModel = this.base.getView().getModel("characteristics");

            // Bind to the custom OData function/action
            let oAction = oModel.bindContext("/getCharacteristicsDetails(...)");
            oAction.setParameter("classId", sClassId);

            return oAction.execute().then(function() {
                let aResults = oAction.getBoundContext().getObject().value;
                let aSortedResults = this._sortCharacteristicsByPosition(aResults);
                // Update local UI model with remote details
                oJSONModel.setProperty("/items", aSortedResults);
            }.bind(this)).catch(function(oError) {
                throw oError;
            });
        },

        _updateNonToStockNote: function () {
            const oContext = this.base.getView().getBindingContext();
            if (!oContext) return;

            const bShow = oContext.getProperty("IsActiveEntity") === false
                && oContext.getProperty("formType_code") === "NonToStock";

            const aStrips = sap.ui.core.Element.registry.filter(oCtrl =>
                typeof oCtrl.getId === "function" && oCtrl.getId().endsWith("msNonToStockPlantNote"));

            if (aStrips.length) {
                aStrips.forEach(oStrip => {
                    oStrip.setVisible(bShow);
                    let oNode = oStrip.getParent();
                    while (oNode && !(typeof oNode.getId === "function" && oNode.getId().includes("CustomFormElement::NonToStockNote"))) {
                        oNode = oNode.getParent();
                    }
                    if (oNode && typeof oNode.setVisible === "function") {
                        oNode.setVisible(bShow);
                    }
                });
            } else if (bShow && !this._bNoteRetry) {
                // The MessageStrip may not be rendered yet on the first context change — retry once.
                this._bNoteRetry = true;
                setTimeout(() => { this._bNoteRetry = false; this._updateNonToStockNote(); }, 500);
            }
        },

        _sortCharacteristicsByPosition: function (aItems) {
            return (aItems || []).slice().sort(function (oItemA, oItemB) {
                const iPositionA = Number.isFinite(Number(oItemA?.position)) ? Number(oItemA.position) : Number.MAX_SAFE_INTEGER;
                const iPositionB = Number.isFinite(Number(oItemB?.position)) ? Number(oItemB.position) : Number.MAX_SAFE_INTEGER;

                return iPositionA - iPositionB;
            });
        },

    });
});