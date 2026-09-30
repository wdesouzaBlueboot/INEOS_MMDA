sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"materialcreationvalues/test/integration/pages/MaterialCreationValuesList",
	"materialcreationvalues/test/integration/pages/MaterialCreationValuesObjectPage"
], function (JourneyRunner, MaterialCreationValuesList, MaterialCreationValuesObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('materialcreationvalues') + '/test/flp.html#app-preview',
        pages: {
			onTheMaterialCreationValuesList: MaterialCreationValuesList,
			onTheMaterialCreationValuesObjectPage: MaterialCreationValuesObjectPage
        },
        async: true
    });

    return runner;
});

