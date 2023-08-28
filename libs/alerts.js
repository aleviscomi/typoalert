async function evaluateTop10AndDymAlerts(inputDomain, ctarget, googleSearch) {
    const googleResults = googleSearch["searchResults"];
    const dym = googleSearch["dym"];

    var t10a, dyma;
    if ( (googleResults.includes(inputDomain) && googleResults.includes(ctarget)) ||
            (!googleResults.includes(inputDomain) && !googleResults.includes(ctarget)) ) {
        t10a = 0;            
    } else if (!googleResults.includes(inputDomain) && googleResults.includes(ctarget)) {
        t10a = 1;
    } else if (googleResults.includes(inputDomain) && !googleResults.includes(ctarget)) {
        t10a = -1;
    }

    if (dym === ctarget) {
        dyma = 1;
    } else {
        dyma = 0;
    }
    
    return { "T10A": t10a, "DYMA": dyma };

}   // evaluateTop10AndDymAlerts


async function evaluatePhishingAlert(inputDomainHtml, ctarget) {
    // get html of ctarget domain
    const ctargetHtml = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getCtargetHtml", ctargetUrl: "https://" + ctarget }, resolve);
    });
    
    const inputDomainHash = ssdeep.digest(inputDomainHtml);
    const ctargetHash = ssdeep.digest(ctargetHtml);

    const similarityValue = ssdeep.similarity(inputDomainHash, ctargetHash);

    if (similarityValue >= 33) {
        return 1;
    }
    
    return 0;

}   // evaluatePhishingAlert


async function evaluateParkedAlert(keyphrases, inputDomainHtml) {
    var numKeyphrases = 0;

    keyphrases.forEach((keyphrase) => {
        if (inputDomainHtml.toLowerCase().includes(keyphrase)) {
            numKeyphrases++;
        }
    });

    if (numKeyphrases > 0) {
        return 1;
    }

    return 0;

}   // evaluateParkedAlert


async function checkAlerts(inputDomain, ctargets) {
    // search inputDomain on Google
    const googleSearch = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: "getGoogleResultsAndDym", inputDomain: inputDomain }, resolve);
    });

    // get keyphrases for domain parking
    const keyphrasesDomainParkingData = await new Promise((resolve) => {
        chrome.storage.local.get("keyphrasesDomainParking", resolve);
    });

    const keyphrases = keyphrasesDomainParkingData.keyphrasesDomainParking;
    const inputDomainHtml = document.body.outerHTML;   // input domain html


    // Parked Alert
    const parkA = await evaluateParkedAlert(keyphrases, inputDomainHtml);

    var ctargetsResult = {};
    var worstCtargetResult = -1;     // worst result found in ctargets
    for (const ctarget of ctargets) {
        // Top10 Alert & DYM Alert
        const t10DymA = await evaluateTop10AndDymAlerts(inputDomain, ctarget, googleSearch);

        // Phishing Alert
        const phA = await evaluatePhishingAlert(inputDomainHtml, ctarget);

        const alertValue = t10DymA["T10A"] + t10DymA["DYMA"] + phA + parkA;

        if (alertValue == -1) {
            ctargetsResult[ctarget] = EnumResult.ProbablyNotTypo;
        } else if (alertValue == 0) {
            ctargetsResult[ctarget] = EnumResult.ProbablyTypo;
        } else {    // alertValue >= 1
            if (phA == 1) {
                ctargetsResult[ctarget] = EnumResult.TypoPhishing;
            } else {
                ctargetsResult[ctarget] = EnumResult.Typo;
            }
        }

        if (ctargetsResult[ctarget] > worstCtargetResult) {
            worstCtargetResult = ctargetsResult[ctarget];
        }
    }

    return { "worstCtargetResult": worstCtargetResult, "ctargetsResult": ctargetsResult};

}   // checkAlerts
