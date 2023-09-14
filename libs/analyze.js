function damerauLevenshteinDistance(str1, str2) {
    const lenStr1 = str1.length;
    const lenStr2 = str2.length;

    const d = new Array(lenStr1 + 1).fill(null).map(() => new Array(lenStr2 + 1).fill(0));

    for (let i = 0; i <= lenStr1; i++) {
        d[i][0] = i;
    }
    for (let j = 0; j <= lenStr2; j++) {
        d[0][j] = j;
    }

    for (let i = 1; i <= lenStr1; i++) {
        for (let j = 1; j <= lenStr2; j++) {
            let cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            d[i][j] = Math.min(
                d[i - 1][j] + 1,            // insertion
                d[i][j - 1] + 1,            // deletion
                d[i - 1][j - 1] + cost      // substitution
            );

            if (i > 1 && j > 1 && str1[i - 1] === str2[j - 2] && str1[i - 2] === str2[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);    // transposition
            }
        }
    }

    return d[lenStr1][lenStr2];

}   // damerauLevenshteinDistance


function provideResults(res, ctargetsResult) {
    switch(res) {
        case EnumResult.Unknown: {
            chrome.runtime.sendMessage({ action: "changeIconColor", color: "grey" });
            chrome.runtime.sendMessage({ action: "changePopup", color: "grey" });
            break;
        }
        case EnumResult.NotTypo: {
            chrome.runtime.sendMessage({ action: "changeIconColor", color: "green" });
            chrome.runtime.sendMessage({ action: "changePopup", color: "green" });
            break;
        }
        case EnumResult.ProbablyNotTypo: {
            chrome.storage.local.set({ "ctargets": ctargetsResult });
            chrome.runtime.sendMessage({ action: "changeIconColor", color: "greenGrey" });
            chrome.runtime.sendMessage({ action: "changePopup", color: "greenGrey" });
            chrome.runtime.sendMessage({ action: "showNotification" }, (response) => {});
            break;
        }
        case EnumResult.ProbablyTypo: {
            chrome.storage.local.set({ "ctargets": ctargetsResult });
            chrome.runtime.sendMessage({ action: "changeIconColor", color: "yellow" });
            chrome.runtime.sendMessage({ action: "changePopup", color: "yellow" });
            alert("Attention: This domain might be a typo.\nOpen the extension popup to view more info.");
            break;
        }
        case EnumResult.Typo: {
            chrome.storage.local.set({ "ctargets": ctargetsResult });
            chrome.runtime.sendMessage({ action: "changeIconColor", color: "red" });
            chrome.runtime.sendMessage({ action: "changePopup", color: "red" });
            alert("Warning: It's highly possible that this domain is a typo.\nOpen the extension popup to view more info.");
            break;
        }
        case EnumResult.TypoPhishing: {
            chrome.storage.local.set({ "ctargets": ctargetsResult });
            chrome.runtime.sendMessage({ action: "changeIconColor", color: "dark_red_phishing" });
            chrome.runtime.sendMessage({ action: "changePopup", color: "dark_red_phishing" });
            alert("Caution: This domain is a typo and may be a phishing attempt.\nOpen the extension popup to view more info.");
            break;
        }
    }

}   // provideResults


async function analyze(inputDomain, provideResultsFlag) {

    var result = EnumResult.Unknown;
    var ctargetsResult = {};
    
    // get top domains list
    const topDomainsData = await new Promise((resolve) => {
        chrome.storage.local.get("topDomains", resolve);
    });
    const topDomains = topDomainsData.topDomains;

    // get user domains list
    const userDomainsData = await new Promise((resolve) => {
        chrome.storage.sync.get("userDomains", resolve);
    });
    const userDomains = userDomainsData.userDomains || [];

    const domainsList = topDomains.concat(userDomains);

    // check if inputDomain is:
    // - in domains list;
    // - a typo (DL == 1) of some top domain
    var ctargets = [];
    for (let i = 0; i < domainsList.length; i++) {
        const currentTopDomain = domainsList[i];

        // if inputDomain is in domains list (DL = 0) then it is definitely not typo
        if (currentTopDomain === inputDomain) {
            result = EnumResult.NotTypo;
            break;
        }

        // calculate DL between currentTopDomain and inputDomain
        const dl = damerauLevenshteinDistance(currentTopDomain, inputDomain);
        if (dl == 1) {
            result = EnumResult.ProbablyTypo;
            ctargets.push(currentTopDomain);
        }

    }

    // check alerts
    if(result == EnumResult.ProbablyTypo) {
        const alerts = await checkAlerts(inputDomain, ctargets);

        result = alerts["worstCtargetResult"];     // worst result found in ctargets
        ctargetsResult = alerts["ctargetsResult"];
    }


    // provide results
    if (provideResultsFlag) {
        provideResults(result, ctargetsResult);
    }

    return result;

}   // analyze