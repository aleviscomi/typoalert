import * as utils from "/src/utils.js"
import * as uiController from "/src/ui-controller.js"
import Analyzer from "/src/analyzer.js"
import Result from "./src/result.js"

// EVENTS

chrome.runtime.onInstalled.addListener(() => {
  // load top domains list
  utils.loadTopDomainRepository();

  // load blacklist blackbook
  utils.loadBlacklist();

  // load keyphrases for domain parking analysis
  utils.loadKeyphrasesDomainParking();
});

var inputUrl = "";
var analyzer = new Analyzer();

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  try {
    if (details.documentLifecycle === "active" && details.frameId === 0) {
      inputUrl = new URL(details.url);
      var inputDomain = inputUrl.hostname.replace(/^www\./, "");
      if (await utils.isDomainInBlacklist(inputDomain)) {
        chrome.tabs.create({ openerTabId: details.tabId, url: "blocked/redirect/blocked.html" });
        chrome.tabs.remove(details.tabId, function() { });
        // chrome.tabs.update(details.tabId, { url: "blocked/malware/blocked.html" });
        uiController.setDarkRedMalware();
      }
    }
  } catch(error) {
    console.log(error);
  }
});

chrome.webNavigation.onCommitted.addListener(async (details) => {
  try {
    if (  (!details.url.startsWith("chrome-extension://") && !details.url.includes("blocked/redirect/blocked.html"))
          && (details.transitionQualifiers.includes("client_redirect") || (details.transitionQualifiers.length == 0 && details.transitionType == "link")) 
          && analyzer.analysis >= Result.ProbablyTypo) {

      chrome.tabs.create({ openerTabId: details.tabId, url: "blocked/redirect/blocked.html" });
      chrome.tabs.remove(details.tabId, function() { });
      // chrome.tabs.update(details.tabId, { url: "blocked/redirect/blocked.html" });
      return;
    }

    if (details.documentLifecycle === "active" && details.frameId === 0) {
      var visitedUrl = new URL(details.url);
      await main(inputUrl, visitedUrl);
    }
  } catch(error) {
    console.log(error);
  }
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, async function(tab){
    if(tab.url) {
      var url = new URL(tab.url);
      main(url, url);
    }
  });
});


// FUNCTIONS

async function main(inputUrl, visitedUrl) {
  if (visitedUrl.toString().includes("chrome-extension://") || visitedUrl.toString().includes("chrome://")) {
    if (visitedUrl.toString().includes("blocked/malware/blocked.html")) {
      uiController.setDarkRedMalware();
    } else if (visitedUrl.toString().includes("blocked/redirect/blocked.html")) {
      uiController.setRed();
    } else {
      uiController.setDefault();
    }
  } else if (visitedUrl.toString().startsWith("http")) {
    var inputDomain = inputUrl.hostname.replace(/^www\./, "");
    var visitedDomain = visitedUrl.hostname.replace(/^www\./, "");

    // console.log("input: " + inputDomain, "visited: " + visitedDomain);

    analyzer.inputDomain = inputDomain;
    analyzer.visitedDomain = visitedDomain;

    await analyzer.analyze();
    analyzer.showAnalysis();
  }
}