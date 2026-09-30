sap.ui.define([
    "sap/ui/core/format/NumberFormat"
], function (NumberFormat) {
    "use strict";

    return {
        /**
         * Formats a numeric value based on the characteristic decimals
         * @param {string|number} sValue Entered value
         * @param {number} iLength Total length defined in SAP
         * @param {number} iDecimals Number of decimals defined in SAP
         */
        formatNUM: function (sValue, iLength, iDecimals) {
            if (sValue === undefined || sValue === null || sValue === "") {
                return "";
            }
            
            let sRawValue = sValue.toString().replace(',', '.');
            let iMaxIntegerDigits = iLength - iDecimals;
            let sIntegerPart = sRawValue.split('.')[0].replace('-', '');

            // Length verification
            if (sIntegerPart.length > iMaxIntegerDigits) {
                console.error("Value exceeds max integer length of " + iMaxIntegerDigits);
            }

            let oFloatFormat = NumberFormat.getFloatInstance({
                minFractionDigits: iDecimals,
                maxFractionDigits: iDecimals,
                groupingEnabled: true
            });

            return oFloatFormat.format(sValue);
        }
    };
});