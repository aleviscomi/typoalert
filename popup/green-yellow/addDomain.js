import { setGreen } from "../../src/ui-controller.js"
import Analyzer from "../../src/analyzer.js";

document.addEventListener('DOMContentLoaded', function() {
    const addDomainButton = document.getElementById('add-domain');

    addDomainButton.addEventListener('click', function() {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            const currentTab = tabs[0];
            const newDomain = new URL(currentTab.url).hostname.replace(/^www\./, "");
            if (newDomain) {        
              // Save the updated domain list to storage
              chrome.storage.sync.get('userDomains', function(result) {
                const userDomains = result.userDomains || [];
                if(!userDomains.includes(newDomain)) {
                  userDomains.push(newDomain);
                  chrome.storage.sync.set({ userDomains: userDomains });
        
                  alert(newDomain + " added to user domains!");
                  setGreen();
                  
                  // remove newDomain from analysis cache
                  var analyzer = new Analyzer();
                  analyzer.domain = newDomain;
                  analyzer.removeDomainFromAnalysisCache();
                }
              });
            }
        });
      });
});