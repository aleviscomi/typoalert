import * as utils from "./utils.js";
import ssdeep from "./ssdeep.js";

export async function evaluateTop10Alert(inputDomain, ctarget, search) {
    const results = search.searchResults;

    if (!results.includes(inputDomain) && results.includes(ctarget)) {
        return 1;
    } else if (results.includes(inputDomain) && !results.includes(ctarget)) {
        return -1;
    }

    return 0;

}   // evaluateTop10

export async function evaluateDymAlert(ctarget, search) {
    const dym = search.dym;

    if (dym === ctarget) {
        return 1;
    } 

    return 0;

}   // evaluateDym


export async function evaluatePhishingAlert(inputDomainHtml, ctargetHtml) {
    const inputDomainHash = ssdeep.digest(inputDomainHtml);
    const ctargetHash = ssdeep.digest(ctargetHtml);

    const similarityValue = ssdeep.similarity(inputDomainHash, ctargetHash);

    if (similarityValue >= 33) {
        return 1;
    }
    
    return 0;

}   // evaluatePhishingAlert


export async function evaluateParkingAlert(inputDomainHtml) {
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
