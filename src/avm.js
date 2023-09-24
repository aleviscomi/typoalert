import * as utils from "./utils.js";
import Result from "./result.js"

async function evaluateTop10Alert(inputDomain, ctarget, searchResults) {

    if (!searchResults.includes(inputDomain) && searchResults.includes(ctarget)) {
        return 1;
    } else if (searchResults.includes(inputDomain) && !searchResults.includes(ctarget)) {
        return -1;
    }

    return 0;

}   // evaluateTop10

async function evaluateDymAlert(ctarget, dym) {

    if (dym === ctarget) {
        return 1;
    } 

    return 0;

}   // evaluateDym


async function evaluatePhishingAlert(visitedDomainHtml, ctargetHtml, phishingDetector) {
    phishingDetector.evaluate(visitedDomainHtml, ctargetHtml);

    if (phishingDetector.similarityValue >= 33) {
        return 1;
    }
    
    return 0;

}   // evaluatePhishingAlert


async function evaluateParkingAlert(visitedDomainHtml) {
    if (! visitedDomainHtml) {
        return 0;
    }
    const keyphrases = await utils.getFromStorage("keyphrasesDomainParking", "local");

    var numKeyphrases = 0;
    var keyphrase;
    for (keyphrase of keyphrases) {
        if (visitedDomainHtml.toLowerCase().includes(keyphrase)) {
            numKeyphrases++;
        }
    }

    if (numKeyphrases > 0) {
        return 1;
    }

    return 0;

}   // evaluateParkedAlert

export async function analyzeAlerts(inputDomain, visitedDomain, ctargets, searcher, phishingDetector) {
    var target;                                 // ctarget with worst alert value
    var analysis = Number.NEGATIVE_INFINITY;    // target's alert value
    var otherTargets = [];                            // other ctargets with less alert value

    // do a search on web
    await searcher.search(inputDomain);

    // get visited domain html
    var visitedDomainHtml;
    try {
        visitedDomainHtml = await utils.getHtmlBodyFromActiveTab();
    } catch(error) {
        try {
            visitedDomainHtml = await utils.getHtmlBodyFromUrl(`https://${visitedDomain}`);
        } catch(error) {
            visitedDomainHtml = await utils.getHtmlBodyFromUrl(`http://${visitedDomain}`);
        }
    }

    // Parking Alert
    const parkingAlert = await evaluateParkingAlert(visitedDomainHtml);

    var ctarget;
    for (ctarget of ctargets) {
        var top10Alert = await evaluateTop10Alert(inputDomain, ctarget, searcher.searchResults);
        var dymAlert = await evaluateDymAlert(ctarget, searcher.dym);

        // get ctarget html
        var ctargetHtml;
        try {
            ctargetHtml = await utils.getHtmlBodyFromUrl(`https://${ctarget}`);
        } catch(error) {
            ctargetHtml = await utils.getHtmlBodyFromUrl(`http://${ctarget}`);
        }

        var phishingAlert = await evaluatePhishingAlert(visitedDomainHtml, ctargetHtml, phishingDetector);

        var alertValue = top10Alert + dymAlert + phishingAlert + parkingAlert;
        // console.log("top10Alert: " + top10Alert + ", dymAlert: " + dymAlert + ", phishingAlert: " + phishingAlert + ", parkingAlert: " + parkingAlert)

        var ctargetAlertValue;
        if (alertValue == -1) {
            ctargetAlertValue = Result.ProbablyNotTypo;
        } else if (alertValue == 0) {
            ctargetAlertValue = Result.ProbablyTypo;
        } else {    // alertValue >= 1
            if (phishingAlert == 1) {
                ctargetAlertValue = Result.TypoPhishing;
            } else {
                ctargetAlertValue = Result.Typo;
            }
        }

        if (ctargetAlertValue > analysis) {
            analysis = ctargetAlertValue;
            target = ctarget;
        }
    }

    otherTargets = ctargets.filter(ctarget => ctarget !== target);
    
    return { "target": target, "analysis": analysis, "otherTargets": otherTargets };

}   // getAlert