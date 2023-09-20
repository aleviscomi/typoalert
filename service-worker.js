import * as utils from "/src/utils.js"
import * as uiController from "/src/ui-controller.js"
import * as analyzer from "/src/analyzer.js"

// EVENTS

chrome.runtime.onInstalled.addListener(() => {
  // load top domains list
  utils.loadTopDomainRepository();

  // load blacklist blackbook
  utils.loadBlacklist();

  // load keyphrases for domain parking analysis
  utils.loadKeyphrasesDomainParking();
});


chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  var url = new URL(details.url);
  var domain = url.hostname.replace(/^www\./, "");

  if (domain && url.toString().startsWith("http")) {
    if (await utils.isDomainInBlacklist(domain)) {
      chrome.tabs.update(details.tabId, { url: "blocked/blocked.html" });

      uiController.setDarkRedMalware();
    }
  }
});


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    var url = changeInfo.url;
    main(url);
  }
});


chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, async function(tab){
    var url = tab.url;
    main(url);
  });
});

// FUNCTIONS

async function main(url) {
  if (url.includes("chrome-extension://") && url.includes("blocked/blocked.html")) {
    uiController.setDarkRedMalware();
  }
  else if (! url.startsWith("http")) {
    uiController.setDefault();
  }
  else {
    var rawUrl = new URL(url);
    var domain = rawUrl.hostname.replace(/^www\./, "");
    var analysis = await analyzer.analyzeDomain(domain);
    analyzer.showAnalysis(analysis)
  }
}