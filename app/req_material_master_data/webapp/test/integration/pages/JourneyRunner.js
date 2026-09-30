sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"reqmaterialmasterdata/test/integration/pages/FormList",
	"reqmaterialmasterdata/test/integration/pages/FormObjectPage"
], function (JourneyRunner, FormList, FormObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('reqmaterialmasterdata') + '/test/flp.html#app-preview',
        pages: {
			onTheFormList: FormList,
			onTheFormObjectPage: FormObjectPage
        },
        async: true
    });

    return runner;
});

