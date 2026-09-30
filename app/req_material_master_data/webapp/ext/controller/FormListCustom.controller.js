sap.ui.define(['sap/ui/core/mvc/ControllerExtension'], function (ControllerExtension) {
	'use strict';

	return ControllerExtension.extend('reqmaterialmasterdata.ext.controller.FormListCustom', {
		// this section allows to extend lifecycle hooks or hooks provided by Fiori elements
		override: {
			/**
             * Called when a controller is instantiated and its View controls (if available) are already created.
             * Can be used to modify the View before it is displayed, to bind event handlers and do other one-time initialization.
             * @memberOf reqmaterialmasterdata.ext.controller.FormListCustom
             */
			onInit: function () {
				// you can access the Fiori elements extensionAPI via this.base.getExtensionAPI
				var oModel = this.base.getExtensionAPI().getModel();
			}, 

			onAfterRendering: function () {
                let oView = this.getView();
                
                let sFilterId = "fe::FilterBar::RequestForm::FilterField::actionRequiredOnly";
                
                let applyVisibilityLogic = function(oField) {
                    if (oField && !oField._bIsPatchedForActionRequired) {
                        oField._bIsPatchedForActionRequired = true;
                        
                        oField.bindProperty("visible", "userContext>/isReviewer");
                        
                        let fnSetVisible = oField.setVisible;
                        oField.setVisible = function (bVisible) {
                            let res = fnSetVisible.apply(this, arguments);
                            // If the binding was lost due to adaptation, we reapply it
                            if (!this.getBinding("visible")) {
                                this.bindProperty("visible", "userContext>/isReviewer");
                            }
                            return res;
                        };
                    }
                };

                applyVisibilityLogic(oView.byId(sFilterId));

                let oFilterBar = oView.byId("fe::FilterBar::RequestForm");
                if (oFilterBar && !oFilterBar._bFilterBarPatchedForActionRequired) {
                    oFilterBar._bFilterBarPatchedForActionRequired = true;
                    
                    let fnInsertFilterItem = oFilterBar.insertFilterItem;
                    if (fnInsertFilterItem) {
                        oFilterBar.insertFilterItem = function (oFilterItem, iIndex) {
                            let res = fnInsertFilterItem.apply(this, arguments);
                            if (oFilterItem && typeof oFilterItem.getId === "function" && oFilterItem.getId().includes("actionRequiredOnly")) {
                                applyVisibilityLogic(oFilterItem);
                            }
                            return res;
                        };
                    }
                    
                    let fnAddFilterItem = oFilterBar.addFilterItem;
                    if (fnAddFilterItem) {
                        oFilterBar.addFilterItem = function (oFilterItem) {
                            let res = fnAddFilterItem.apply(this, arguments);
                            if (oFilterItem && typeof oFilterItem.getId === "function" && oFilterItem.getId().includes("actionRequiredOnly")) {
                                applyVisibilityLogic(oFilterItem);
                            }
                            return res;
                        };
                    }
                }
            }
		}
	});
});
