async function evaluateTop10AndDymAlerts(inputDomain, ctarget, searchResults) {
    const results = searchResults["searchResults"];
    const dym = searchResults["dym"];

    var t10a, dyma;
    if ( (results.includes(inputDomain) && results.includes(ctarget)) ||
            (!results.includes(inputDomain) && !results.includes(ctarget)) ) {
        t10a = 0;            
    } else if (!results.includes(inputDomain) && results.includes(ctarget)) {
        t10a = 1;
    } else if (results.includes(inputDomain) && !results.includes(ctarget)) {
        t10a = -1;
    }

    if (dym === ctarget) {
        dyma = 1;
    } else {
        dyma = 0;
    }
    
    return { "T10A": t10a, "DYMA": dyma };

}   // evaluateTop10AndDymAlerts


async function evaluatePhishingAlert(inputDomainHtml, ctargetHtml) {
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


async function checkAlerts(inputDomain, ctargets, port) {
    // search inputDomain on browser
    const searchResults = await new Promise((resolve) => {
        port.onMessage.addListener((response) => {
            resolve(response);
        });

        // port.postMessage({ action: "googleSearch", inputDomain });
        port.postMessage({ action: "bingSearch", inputDomain });
    });
    console.log(searchResults);

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
        const t10DymA = await evaluateTop10AndDymAlerts(inputDomain, ctarget, searchResults);

        // Phishing Alert
        const ctargetHtml = await new Promise((resolve) => {
            port.onMessage.addListener((response) => {
                resolve(response);
            });
    
            port.postMessage({ action: "getCtargetHtml", ctargetUrl: "https://" + ctarget });
        });
        const phA = await evaluatePhishingAlert(inputDomainHtml, ctargetHtml);

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
