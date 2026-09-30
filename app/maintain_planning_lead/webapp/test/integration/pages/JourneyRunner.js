sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"maintainplanninglead/test/integration/pages/PlanningLeadList",
	"maintainplanninglead/test/integration/pages/PlanningLeadObjectPage"
], function (JourneyRunner, PlanningLeadList, PlanningLeadObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('maintainplanninglead') + '/test/flp.html#app-preview',
        pages: {
			onThePlanningLeadList: PlanningLeadList,
			onThePlanningLeadObjectPage: PlanningLeadObjectPage
        },
        async: true
    });

    return runner;
});

