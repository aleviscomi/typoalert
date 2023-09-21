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


async function evaluatePhishingAlert(inputDomainHtml, ctargetHtml, phishingDetector) {
    phishingDetector.evaluate(inputDomainHtml, ctargetHtml);

    if (phishingDetector.similarityValue >= 33) {
        return 1;
    }
    
    return 0;

}   // evaluatePhishingAlert


async function evaluateParkingAlert(inputDomainHtml) {
    const keyphrases = await utils.getFromStorage("keyphrasesDomainParking", "local");

    var numKeyphrases = 0;
    var keyphrase;
    for (keyphrase of keyphrases) {
        if (inputDomainHtml.toLowerCase().includes(keyphrase)) {
            numKeyphrases++;
        }
    }

    if (numKeyphrases > 0) {
        return 1;
    }

    return 0;

}   // evaluateParkedAlert

export async function analyzeAlerts(inputDomain, ctargets, searcher, phishingDetector) {
    var ctargetsAnalysis = {};
    var worstAnalysis = Number.NEGATIVE_INFINITY;

    // do a search on web
    await searcher.search(inputDomain);
    
    // get input domain html
    var inputDomainHtml;
    try {
        inputDomainHtml = await utils.getHtmlBodyFromActiveTab();
    } catch(error) {
        try {
            inputDomainHtml = await utils.getHtmlBodyFromUrl(`https://${inputDomain}`);
        } catch(error) {
            inputDomainHtml = await utils.getHtmlBodyFromUrl(`http://${inputDomain}`);
        }
    }

    // Parking Alert
    const parkingAlert = await evaluateParkingAlert(inputDomainHtml);

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

        var phishingAlert = await evaluatePhishingAlert(inputDomainHtml, ctargetHtml, phishingDetector);

        var alertValue = top10Alert + dymAlert + phishingAlert + parkingAlert;

        if (alertValue == -1) {
            ctargetsAnalysis[ctarget] = Result.ProbablyNotTypo;
        } else if (alertValue == 0) {
            ctargetsAnalysis[ctarget] = Result.ProbablyTypo;
        } else {    // alertValue >= 1
            if (phishingAlert == 1) {
                ctargetsAnalysis[ctarget] = Result.TypoPhishing;
            } else {
                ctargetsAnalysis[ctarget] = Result.Typo;
            }
        }

        if (ctargetsAnalysis[ctarget] > worstAnalysis) {
            worstAnalysis = ctargetsAnalysis[ctarget];
        }
    }

    return { "worstAnalysis": worstAnalysis, "ctargetsAnalysis": ctargetsAnalysis };

}   // getAlert