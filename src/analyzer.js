import * as utils from "./utils.js"
import * as ecm from "./ecm.js"
import * as avm from "./avm.js"
import * as searcher from "./searcher.js"
import * as uiController from "/src/ui-controller.js"
import Result from "./result.js"

async function getDomainsList() {
    // get top domains list
    var topDomains = await utils.getFromStorage("topDomains", "local");

    // get user domains list
    var userDomains = await utils.getFromStorage("userDomains", "sync");

    var domainsList = topDomains.concat(userDomains);

    return domainsList;
}

async function getAlertAnalysis(inputDomain, ctargets) {
    var ctargetsAnalysis = {};
    var worstAnalysis = Number.NEGATIVE_INFINITY;

    var search = await searcher.googleSearch(inputDomain);
    
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
    const parkingAlert = await avm.evaluateParkingAlert(inputDomainHtml);

    var ctarget;
    for (ctarget of ctargets) {
        var top10Alert = await avm.evaluateTop10Alert(inputDomain, ctarget, search);
        var dymAlert = await avm.evaluateDymAlert(ctarget, search);

        // get ctarget html
        var ctargetHtml;
        try {
            ctargetHtml = await utils.getHtmlBodyFromUrl(`https://${ctarget}`);
        } catch(error) {
            ctargetHtml = await utils.getHtmlBodyFromUrl(`http://${ctarget}`);
        }

        var phishingAlert = await avm.evaluatePhishingAlert(inputDomainHtml, ctargetHtml);

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

export async function analyzeDomain(inputDomain) {
    var finalAnalysis = Result.Unknown;
    var ctargetsAnalysis = {};

    var domainsList = await getDomainsList();

    // check if inputDomain is:
    // - in domains list;
    // - a typo (DL == 1) of some top domain
    var ctargets = [];
    var domain;
    for (domain of domainsList) {
        // if inputDomain is in domains list (DL = 0) then it is definitely not typo
        if (domain === inputDomain) {
            finalAnalysis = Result.NotTypo;
            break;
        }

        // calculate DL between currentTopDomain and inputDomain
        var dlDistance = ecm.damerauLevenshteinDistance(domain, inputDomain);
        if (dlDistance === 1) {
            finalAnalysis = Result.ProbablyTypo;
            ctargets.push(domain);
        }
    }

    //check alert
    if (finalAnalysis === Result.ProbablyTypo) {
        var alertAnalysis = await getAlertAnalysis(inputDomain, ctargets);
        
        finalAnalysis = alertAnalysis["worstAnalysis"];     // worst result found in ctargets
        ctargetsAnalysis = alertAnalysis["ctargetsAnalysis"];
    }

    return { "finalAnalysis": finalAnalysis, "ctargetsAnalysis": ctargetsAnalysis};

}   // analyze


export function showAnalysis(analysis) {
    switch(analysis.finalAnalysis) {
        case Result.Unknown: {
            uiController.setGrey();
            break;
        }
        case Result.NotTypo: {
            uiController.setGreen();
            break;
        }
        case Result.ProbablyNotTypo: {
            chrome.storage.local.set({ "ctargetsAnalysis": analysis.ctargetsAnalysis });
            uiController.setGreenYellow();
            
            const notificationOptions = { type: "basic", iconUrl: "images/info.png", title: "TypoAlert Note", message: "Did you mean another domain? Open extension popup for more info." };
            chrome.notifications.create("typoAlertNotification", notificationOptions);
            break;
        }
        case Result.ProbablyTypo: {
            chrome.storage.local.set({ "ctargetsAnalysis": analysis.ctargetsAnalysis });
            uiController.setYellow();
            uiController.showAlert("Attention", "This domain might be a typo.<br>Open the extension popup to view more info.", "#ffbb00");
            break;
        }
        case Result.Typo: {
            chrome.storage.local.set({ "ctargetsAnalysis": analysis.ctargetsAnalysis });
            uiController.setRed();
            uiController.showAlert("Warning", "It's highly possible that this domain is a typo.<br>Open the extension popup to view more info.", "#ff0000");
            break;
        }
        case Result.TypoPhishing: {
            chrome.storage.local.set({ "ctargetsAnalysis": analysis.ctargetsAnalysis });
            uiController.setDarkRedPhishing();
            uiController.showAlert("Caution", "This domain is a typo and may be a phishing attempt.<br>Open the extension popup to view more info.", "#920000");
            break;
        }
    }
}