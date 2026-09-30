sap.ui.define([
    "sap/fe/test/JourneyRunner",
	"characteristicconfiguration/test/integration/pages/CharacteristicConfigList",
	"characteristicconfiguration/test/integration/pages/CharacteristicConfigObjectPage"
], function (JourneyRunner, CharacteristicConfigList, CharacteristicConfigObjectPage) {
    'use strict';

    var runner = new JourneyRunner({
        launchUrl: sap.ui.require.toUrl('characteristicconfiguration') + '/test/flp.html#app-preview',
        pages: {
			onTheCharacteristicConfigList: CharacteristicConfigList,
			onTheCharacteristicConfigObjectPage: CharacteristicConfigObjectPage
        },
        async: true
    });

    return runner;
});

