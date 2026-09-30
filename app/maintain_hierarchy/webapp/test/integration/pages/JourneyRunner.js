sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"maintainhierarchy/test/integration/pages/ReviewHierarchyList",
	"maintainhierarchy/test/integration/pages/ReviewHierarchyObjectPage"
], function (JourneyRunner, ReviewHierarchyList, ReviewHierarchyObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('maintainhierarchy') + '/test/flp.html#app-preview',
        pages: {
			onTheReviewHierarchyList: ReviewHierarchyList,
			onTheReviewHierarchyObjectPage: ReviewHierarchyObjectPage
        },
        async: true
    });

    return runner;
});

