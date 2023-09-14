chrome.runtime.onInstalled.addListener(() => {
  // load top domains list
  chrome.storage.local.set({ "topDomains": [] });
  fetch(chrome.runtime.getURL("utils/top_domains.txt"))
    .then(response => response.text())
    .then(text => {
      const topDomainsArray = text.split("\n");
      chrome.storage.local.set({ "topDomains": topDomainsArray });
    });

  // load blacklist (blackbook)
  chrome.storage.local.set({ "blacklist": [] });
  fetch(chrome.runtime.getURL("utils/blackbook.txt"))
    .then(response => response.text())
    .then(text => {
      const blacklistArray = text.split("\n");
      chrome.storage.local.set({ "blacklist": blacklistArray });
    });

  // load keyphrases for domain parking analysis
  chrome.storage.local.set({ "keyphrasesDomainParking": [] });
  fetch(chrome.runtime.getURL("utils/keyphrases_domain_parking.txt"))
    .then(response => response.text())
    .then(text => {
      const keyphrasesDomainParkingArray = text.split("\n");
      chrome.storage.local.set({ "keyphrasesDomainParking": keyphrasesDomainParkingArray });
    });
});


chrome.webNavigation.onBeforeNavigate.addListener(details => {
  const domain = new URL(details.url).hostname.replace(/^www\./, "");
  if (domain) {
    chrome.storage.local.get("blacklist", function (result) {
      const blacklist = result.blacklist;
  
      if (blacklist.includes(domain)) {
        chrome.tabs.update(details.tabId, { url: "blocked/blocked.html" });
        chrome.action.setIcon({ 
          path: {
                "16": "/images/icon/dark_red_malware/icon16.png",
                "48": "/images/icon/dark_red_malware/icon48.png",
                "128": "/images/icon/dark_red_malware/icon128.png"
            }
        });
        chrome.action.setPopup({ 
          popup: "/popup/dark_red_malware/popup.html"
        });
      }
    });
  }
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    if (changeInfo.url.startsWith("chrome-extension") && changeInfo.url.includes("blocked/blocked.html")) {
      chrome.action.setIcon({ 
        path: {
              "16": "/images/icon/dark_red_malware/icon16.png",
              "48": "/images/icon/dark_red_malware/icon48.png",
              "128": "/images/icon/dark_red_malware/icon128.png"
          }
      });
      chrome.action.setPopup({ 
        popup: "/popup/dark_red_malware/popup.html"
      });
    }
    else if (!changeInfo.url.startsWith("chrome-extension") && !changeInfo.url.includes("blocked/blocked.html")) {
      if (!changeInfo.url.startsWith("http")) {
        chrome.action.setIcon({ 
          path: {
                "16": "/images/icon/green/icon16.png",
                "48": "/images/icon/green/icon48.png",
                "128": "/images/icon/green/icon128.png"
            }
        });
        chrome.action.setPopup({ 
          popup: "/popup/default/popup.html"
        });
      }
      else {
        chrome.scripting.executeScript(
          {
            target: { tabId: tabId },
            files: ["libs/ssdeep.js", "libs/alerts.js", "libs/enumResult.js", "libs/analyze.js", "mainScript.js"],
          }
        );
      }
    }
  }
});


chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, function(tab){
    url = tab.url;

    if (url.includes("chrome-extension://") && url.includes("blocked/blocked.html")) {
      chrome.action.setIcon({ 
        path: {
              "16": "/images/icon/dark_red_malware/icon16.png",
              "48": "/images/icon/dark_red_malware/icon48.png",
              "128": "/images/icon/dark_red_malware/icon128.png"
          }
      });
      chrome.action.setPopup({ 
        popup: "/popup/dark_red_malware/popup.html"
      });
    }
    else if (! url.startsWith("http")) {
      chrome.action.setIcon({ 
        path: {
              "16": "/images/icon/green/icon16.png",
              "48": "/images/icon/green/icon48.png",
              "128": "/images/icon/green/icon128.png"
          }
      });
      chrome.action.setPopup({ 
        popup: "/popup/default/popup.html"
      });
    }
    else {
      chrome.scripting.executeScript(
        {
          target: { tabId: activeInfo.tabId },
          files: ["libs/ssdeep.js", "libs/alerts.js", "libs/enumResult.js", "libs/analyze.js", "mainScript.js"],
        }
      );
    }
  });
});


chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.action === "changeIconColor") {
    chrome.action.setIcon({ 
      path: {
            "16": "/images/icon/" + message.color + "/icon16.png",
            "48": "/images/icon/" + message.color + "/icon48.png",
            "128": "/images/icon/" + message.color + "/icon128.png"
        }
    });
  }
  if (message.action === "changePopup") {
    chrome.action.setPopup({ 
      popup: "/popup/" + message.color + "/popup.html"
    });
  }
  if (message.action === "getGoogleResultsAndDym") {
    getGoogleResultsAndDym(message.inputDomain)
      .then(data => {
        sendResponse(data);
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    
    return true;
  }
  if (message.action === "getCtargetHtml") {
    getCtargetHtml(message.ctargetUrl)
      .then(data => {
        sendResponse(data);
      })
      .catch(error => {
        sendResponse({ error: error.message });
      });
    
    return true;
  }
  if (message.action === "showNotification") {
    const notificationOptions = {
      type: "basic",
      iconUrl: "images/info.png",
      title: "TypoAlert Note",
      message: "Did you mean another domain? Open extension popup for more info."
    };
  
    chrome.notifications.create("typoAlertNotification", notificationOptions);
  }
});


async function getGoogleResultsAndDym(inputDomain) {
  try {
    const response = await fetch('https://www.google.com/search?q=' + inputDomain + '&num=10');
    const data = await response.text();
    const searchResults = [];

    // get URLs of results
    const divs = data.split(/>(http(s)?:\/\/)/);
    for (let i = 0; i < divs.length; i++) {
      const div = divs[i];
      if (div !== undefined && !div.includes("doctype")) {
        if (div.includes("cite")) {
          const url = div.split("</cite")[0].replace(/^www\./, "").replace(/\/.*/, "");
          if (!url.includes("<") && !url.includes(">") && !searchResults.includes(url)) {
            searchResults.push(url);
          }
        }
        if (div.includes("span")) {
          const url = div.split("<span")[0].replace(/^www\./, "").replace(/\/.*/, "");
          if (!url.includes("<") && !url.includes(">") && !searchResults.includes(url)) {
            searchResults.push(url);
          }
        }
      }
    }

    // get DYM
    dym = "";
    if (data.includes("Forse cercavi:")) {
      dym = data.split(/Forse cercavi:.*?q=/)[1].split("&amp")[0];
    }
    else if (data.includes("Risultati relativi a")) {
      dym = data.split(/Risultati relativi a.*?q=/)[1].split("&amp")[0];
    }
    else if (data.includes("Did you mean:")) {
      dym = data.split(/Did you mean:.*?q=/)[1].split("&amp")[0];
    }
    else if (data.includes("Showing results for")) {
      dym = data.split(/Showing results for.*?q=/)[1].split("&amp")[0];
    }


    return { "searchResults" : searchResults, "dym": dym };
  } catch (error) {
    throw 'ERROR: ' + error;
  }
}

async function getCtargetHtml(ctargetUrl) {
  try {
    const response = await fetch(ctargetUrl);
    const data = await response.text();
    const result = "<body>" + data.split("<body>")[1].split("</body>")[0] + "</body>";
    return result;
  } catch (error) {
    throw 'ERROR: ' + error;
  }
}
