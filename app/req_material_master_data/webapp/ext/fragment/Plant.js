sap.ui.define([
    "sap/m/MessageBox",
    "sap/ui/model/json/JSONModel"
], function(MessageBox, JSONModel) {
    'use strict';

    const PlantHandler = {
        onLoadPlants: async function(oEvent) {
            const oSelect = oEvent.getSource();
            const oContext = oSelect.getBindingContext();
            
            const sMaterial = oContext.getProperty("sapMaterialNumber_Product");
            const sFormType = oContext.getProperty("formType_code");

            if (['SafetyStock', 'Deletion', 'NonToStock'].includes(sFormType) && !sMaterial) {
                oSelect.close();
                
                if (oSelect.getModel("plantsModel")) {
                    oSelect.getModel("plantsModel").setProperty("/items", []);
                }

                oSelect.getBinding("items")?.refresh(true);

                MessageBox.warning("Please select a Material before choosing a Plant.");
                return; 
            }

            oSelect.setBusy(true);
            const oModel = oContext.getModel();

            let oFunction = oModel.bindContext("/getPlantsForMaterial(...)");
			oFunction.setParameter("productId", sMaterial);
			oFunction.setParameter("formType", sFormType);

            try {
                await oFunction.execute();
                const aPlants = oFunction.getBoundContext().getObject().value || [];

                let oPlantsModel = oSelect.getModel("plantsModel");
                if (!oPlantsModel) {
                    oPlantsModel = new JSONModel();
                    oSelect.setModel(oPlantsModel, "plantsModel");
                }
                oPlantsModel.setProperty("/items", aPlants);

            } catch (err) {
                console.error("Error while loading plants:", err);
            } finally {
                oSelect.setBusy(false);
            }
        }
    };

    return PlantHandler; 
});
