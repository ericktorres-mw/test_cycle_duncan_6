/**
 * @author Midware
 * @developer Ignacio A.
 * @contact contact@midware.net
 */

import * as https from "N/https";
import * as search from "N/search";

const queriesCache = {};

export function getCustomerMinimumOrderAmount(customerId: number) {
    if (queriesCache[`${customerId}-custentity_mw_minimum_order_amount`]) {
        const { executionTime, value } = queriesCache[`${customerId}-custentity_mw_minimum_order_amount`];

        const currentTime = Date.now();
        const cacheExpirationTime = 0; //2 * 60 * 1000; // 2 minutes in milliseconds

        if (currentTime - executionTime < cacheExpirationTime) {
            return value;
        }
    }

    const customerLookup = search.lookupFields({
        type: search.Type.CUSTOMER,
        id: customerId,
        columns: ["custentity_mw_minimum_order_amount"],
    });

    const minimumOrderQuantity =
        customerLookup && customerLookup.custentity_mw_minimum_order_amount
            ? Number(customerLookup.custentity_mw_minimum_order_amount)
            : getGlobalCustomerMinimumOrderAmount();

    queriesCache[`${customerId}-custentity_mw_minimum_order_amount`] = {
        executionTime: Date.now(),
        value: minimumOrderQuantity,
    };

    return minimumOrderQuantity;
}

function getGlobalCustomerMinimumOrderAmount() {
    const response = https.requestSuitelet({
        scriptId: "customscript_mw_comp_info_st",
        deploymentId: "customdeploy_mw_comp_info_st_d",
    });

    if (response) {
        return Number(response.body);
    }

    return 0;
}

export function calculateMinimumOrderAmount(subTotal: number, customerMinimumOrderAmount: number, surchangePercentage: number) {
    return Math.round((customerMinimumOrderAmount / (1 + surchangePercentage / 100) - subTotal) * 100) / 100;
}

export function getESurchargePercentageOfTotal() {
    const searchObj = search.create({
        type: search.Type.SHIP_ITEM,
        columns: ["shippingrateaspercentoftotal"],
        filters: [["itemid", search.Operator.CONTAINS, "E-Surcharge"]],
    });

    const results = searchObj.run().getRange({ start: 0, end: 1 });

    if (results && results.length > 0) {
        return Number(results[0].getValue("shippingrateaspercentoftotal"));
    }

    return 0;
}
