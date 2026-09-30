sap.ui.define(
    ["sap/fe/core/AppComponent", "sap/ui/model/json/JSONModel"],
    function (Component, JSONModel) {
        "use strict";

        return Component.extend("reqmaterialmasterdata.Component", {
            metadata: {
                manifest: "json"
            },

            /**
             * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
             * @public
             * @override
             */
            init: function () {
                Component.prototype.init.apply(this, arguments);

                let oUserContextModel = this.getModel("userContext");
                let oModel = this.getModel();

                let oFunctionContext = oModel.bindContext("/getUserInfo(...)");

                oFunctionContext.execute().then(function () {
                    let data = oFunctionContext.getBoundContext().getObject();
                    
                    oUserContextModel.setData({
                        isReviewer: data.isReviewer,
                        isRequestor: data.isRequestor
                    });
                }).catch(function (err) {
                    console.error("Failed to load user roles:", err);
                });
            }
        });
    }
);