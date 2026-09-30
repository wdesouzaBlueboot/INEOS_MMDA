sap.ui.define([
    "sap/m/MessageToast",
    "sap/ui/model/Filter",          
    "sap/ui/model/FilterOperator"  
], function(MessageToast, Filter, FilterOperator) {
    'use strict';

    const ClassCharacteristics = {

        /**
         * Event handler for Value Help requests on characteristic inputs.
         * Fetches possible values from the backend and determines the display mode.
         */
        onValueHelpRequest: async function (oEvent) {
            const oInput = oEvent.getSource();

            // Bubble up to find the XMLView to access the controller and extensionAPI
            let oView = oInput;
            while (oView && oView.getMetadata().getName() !== "sap.ui.core.mvc.XMLView") {
                oView = oView.getParent();
            }

            if (!oView) return;

            const oController = oView.getController();
            const oExtensionAPI = oController.getExtensionAPI(); 
            const oModel = oExtensionAPI.getModel();

            // Get context from the 'characteristics' local model
            const oContext = oInput.getBindingContext("characteristics");
            const sCharId = oContext.getProperty("charId");

            try {
                oInput.setBusy(true);

                let oFunction = oModel.bindContext("/getPossibleValues(...)");
                oFunction.setParameter("charId", sCharId);
                await oFunction.execute(); 

                const oData = oFunction.getBoundContext().getObject();
                const aValues = oData.value || []; 
                
                oContext.getModel().setProperty(oContext.getPath() + "/possibleValues", aValues);
                
                oInput.setBusy(false);
                ClassCharacteristics._openValueHelp(oInput, oContext);

            } catch (oError) {
                oInput.setBusy(false);
                console.error("Backend call error:", oError);
                MessageToast.show("Error fetching possible values.");
            }
        },

        /**
         * Decides whether to show a Popover (few items) or a Search Dialog (many items).
         */
        _openValueHelp: function (oInput, oContext) {
            const aValues = oContext.getProperty("possibleValues") || [];

            if (aValues.length < 6) {
                // --- DROPDOWN (Using a Popover with List) ---
                this._showAsDropdown(oInput, aValues);
            } else {
                // --- TABLE (Using a SelectDialog) ---
                this._showAsTable(oInput, aValues);
            }
        },

        /**
         * Renders a lightweight ResponsivePopover for quick selection.
         */
        _showAsDropdown: function (oInput, aValues) {
            if (this._oPopover) {
                this._oPopover.destroy();
            }

            const oContext = oInput.getBindingContext("characteristics");
            const oModel = oContext.getModel();

            const oList = new sap.m.List({
                mode: "SingleSelectMaster",
                selectionChange: function (oEvt) {
                    const oItem = oEvt.getParameter("listItem");
                    const sSelectedId = oItem.getBindingContext("temp").getProperty("valueId");
                    oModel.setProperty(oContext.getPath() + "/selectedValue", sSelectedId);
                    oInput.setValueState("None");
                    ClassCharacteristics._oPopover.close();
                }
            });

            // Use a temporary model for the list items
            oList.setModel(new sap.ui.model.json.JSONModel(aValues), "temp");
            oList.bindItems({
                path: "temp>/",
                template: new sap.m.StandardListItem({
                    title: "{temp>valueId}" 
                })
            });

            this._oPopover = new sap.m.ResponsivePopover({
                title: "Select Value",
                placement: sap.m.PlacementType.VerticalPreferredBottom,
                contentWidth: "300px",
                content: [oList],
                afterClose: function() {
                    this._oPopover.destroy();
                    this._oPopover = null;
                }.bind(this)
            });

            this._oPopover.openBy(oInput);
        },

        /**
         * Renders a SelectDialog for larger datasets with search capabilities.
         */
        _showAsTable: function (oInput, aValues) {
            const oContext = oInput.getBindingContext("characteristics");
            const oModel = oContext.getModel();

            const oSelectDialog = new sap.m.SelectDialog({
                title: "Select Value",
                items: {
                    path: "temp>/", 
                    template: new sap.m.StandardListItem({
                        title: "{temp>valueId}",
                        type: "Active"
                    })
                },
                confirm: function (oEvt) {
                    const oSelectedItem = oEvt.getParameter("selectedItem");
                    if (oSelectedItem) {
                        const sSelectedId = oSelectedItem.getBindingContext("temp").getProperty("valueId");
                        oModel.setProperty(oContext.getPath() + "/selectedValue", sSelectedId);
                        oInput.setValueState("None");
                    }
                    oEvt.getSource().destroy();
                },
                search: function (oEvt) {
                    // Local filtering for the dialog items
                    const sValue = oEvt.getParameter("value");
                    const oFilter = new Filter("valueId", FilterOperator.Contains, sValue);
                    oEvt.getSource().getBinding("items").filter([oFilter]);
                },
                cancel: function (oEvt) {
                    oEvt.getSource().destroy();
                }
            });

            oSelectDialog.setModel(new sap.ui.model.json.JSONModel(aValues), "temp");
            oSelectDialog.open();
        },

        /**
         * Filters the main Characteristics table based on ID, Name, or Description.
         */
        onFilterCharacteristics: function (oEvent) {
            const sQuery = oEvent.getParameter("query");
            
            // Navigate the UI tree to find the table and its binding
            const oTable = oEvent.getSource().getParent().getParent();
            const oBinding = oTable.getBinding("items");

            const aFilters = [];

            if (sQuery && sQuery.length > 0) {
                const oFilterId = new Filter("charId", FilterOperator.Contains, sQuery);
                const oFilterName = new Filter("name", FilterOperator.Contains, sQuery);
                const oFilterDesc = new Filter("description", FilterOperator.Contains, sQuery);

                const oCombinedFilter = new Filter({
                    filters: [oFilterId, oFilterName, oFilterDesc],
                    and: false
                });

                aFilters.push(oCombinedFilter);
            }

            oBinding.filter(aFilters);
        },

        onCharLiveChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const oContext = oInput.getBindingContext("characteristics");
            if (!oContext) return;
            const { hasValueList, additionalValueAllowed, selectedValue } = oContext.getObject();

            // Allow clearing the value (back to null) even for restricted value-help characteristics
            if (!oEvent.getParameter("value")) {
                oContext.setProperty("selectedValue", null);
                oInput.setValueState("None");
                return;
            }

            if (hasValueList && !additionalValueAllowed) {
                oInput.setValue(selectedValue || "");
                oInput.setValueState("Error");
                oInput.setValueStateText("This field only accepts values from the value help.");
            } else {
                oInput.setValueState("None");
            }
        },

        onNumericChange: function (oEvent) {
            const oInput = oEvent.getSource();
            const sNewValue = oEvent.getParameter("value");
            const oContext = oInput.getBindingContext("characteristics");
            const { hasValueList, additionalValueAllowed, selectedValue } = oContext.getObject();

            let sCleanValue = (sNewValue || "").replace(',', '.');

            // Allow clearing the value (back to null) even for restricted value-help characteristics
            if (!sCleanValue) {
                oInput.setValueState("None");
                oContext.setProperty("selectedValue", null);
                return;
            }

            if (hasValueList && !additionalValueAllowed) {
                oInput.setValue(selectedValue || "");
                oInput.setValueState("Error");
                oInput.setValueStateText("This field only accepts values from the value help.");
                return;
            }

            let iMaxLength = oContext.getProperty("length");
            let iMaxDecimals = oContext.getProperty("decimals");

            if (isNaN(sCleanValue)) {
                oInput.setValueState("Error");
                oInput.setValueStateText("Please enter a valid number.");
                oContext.setProperty("selectedValue", null);
                return;
            }

            let aParts = sCleanValue.split('.');
            let sIntegerPart = aParts[0].replace('-', '');
            let sDecimalPart = aParts[1] || "";

            // VALIDATIONS
            let bError = false;
            let sErrorMsg = "";

            if (sDecimalPart.length > iMaxDecimals) {
                bError = true;
                sErrorMsg = "Maximum of " + iMaxDecimals + " decimal places allowed.";
            }

            let iAllowedIntegerLength = iMaxLength - iMaxDecimals;
            if (sIntegerPart.length > iAllowedIntegerLength) {
                bError = true;
                sErrorMsg = "Integer part exceeds the limit of " + iAllowedIntegerLength + " digits.";
            }

            if (bError) {
                oInput.setValueState("Error");
                oInput.setValueStateText(sErrorMsg);
            } else {
                oInput.setValueState("None");
                oContext.setProperty("selectedValue", sCleanValue);
            }
        }
    };

    return ClassCharacteristics;
});