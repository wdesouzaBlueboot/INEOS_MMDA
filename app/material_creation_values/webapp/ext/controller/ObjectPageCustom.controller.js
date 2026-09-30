sap.ui.define([
    'sap/ui/core/mvc/ControllerExtension'
], function (ControllerExtension) {
    'use strict';

    return ControllerExtension.extend('materialcreationvalues.ext.controller.ObjectPageCustom', {

        override: {
            /**
             * storageBin is uppercased server-side on save; re-read it after each change
             * so the field shows the persisted value instead of what was typed.
             */
            onInit: function () {
                let oView = this.base.getView();

                oView.attachModelContextChange(function () {
                    let oModel = oView.getModel();

                    if (oModel && !this._bAttached) {
                        oModel.attachPropertyChange(function (oEvent) {
                            let sPath = oEvent.getParameter('path');
                            let oCurrentContext = oView.getBindingContext();
                            let oEventContext = oEvent.getParameter('context');

                            if (sPath !== 'storageBin' || !oEventContext) return;
                            if (oCurrentContext && oEventContext.getPath() !== oCurrentContext.getPath()) return;

                            oEventContext.requestSideEffects([
                                { $PropertyPath: 'storageBin' }
                            ]).catch(function (oError) {
                                console.error('Error refreshing storageBin:', oError);
                            });
                        });

                        this._bAttached = true;
                    }
                }.bind(this));
            }
        }

    });
});
