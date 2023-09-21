import Result from "../src/result.js";
import Analyzer from "../src/analyzer.js";
import * as ecm from "../src/ecm.js";

document.addEventListener('DOMContentLoaded', function() {
  const domainList = document.getElementById('user-domains');
  const newDomainInput = document.getElementById('new-domain');
  const addDomainButton = document.getElementById('add-domain');
  const errorBanner = document.getElementById('error-banner');
  const checkbox = document.querySelector('.switch input');
  const slider = document.getElementsByClassName('slider')[0];
  const clearAnalysisCacheButton = document.getElementById('clear-analysis-cache');

  // Load saved domains from storage and display them
  chrome.storage.sync.get('userDomains', function(result) {
    const userDomains = result.userDomains || [];
    for (const domain of userDomains) {
      const li = createDomainListItem(domain);
      domainList.appendChild(li);
    }
  });

  clearAnalysisCacheButton.addEventListener("click", function() {
    chrome.storage.sync.set({ "analysisCache": [] });
    alert("Analysis cache cleared");
  })

  checkbox.addEventListener('change', function() {
    if (this.checked) {
      setTimeout(function() {
        slider.style.display = 'none';
        document.getElementById('confirm-yes').removeAttribute("disabled");
      }, 300); // 400 milliseconds is the duration of the transition
    } else {
      slider.style.display = 'block';
    }
  });

  
  function showCustomConfirm(message) {
    return new Promise((resolve) => {
      document.getElementById('modal-confirm').style.display = 'block';
      document.getElementById('confirm-message').innerHTML = message;
      document.getElementById('confirm-window').style.display = 'block';
  
      document.getElementById('confirm-yes').addEventListener('click', function() {
        resolve(true);
        document.getElementById('confirm-window').style.display = 'none';
        document.getElementById('modal-confirm').style.display = 'none';
        document.getElementById('confirm-yes').setAttribute("disabled", "");
        slider.style.display = 'block';
        checkbox.checked = false;
      });
  
      document.getElementById('confirm-no').addEventListener('click', function() {
        resolve(false);
        document.getElementById('confirm-window').style.display = 'none';
        document.getElementById('modal-confirm').style.display = 'none';
        document.getElementById('confirm-yes').setAttribute("disabled", "");
        slider.style.display = 'block';
        checkbox.checked = false;
      });
    });
  }
  
  

  // Add a new domain to the list
  addDomainButton.addEventListener('click', async function() {
    const newDomain = newDomainInput.value.trim();
    if (newDomain) {
      const domainRegex = /^(?!www)([-a-zA-Z0-9@:%._\+~#=]+\.)+[a-z]{2,6}$/;

      if (domainRegex.test(newDomain)) {
        var analyzer = new Analyzer();
        analyzer.domain = newDomain;
        if (! await analyzer.isDomainInAnalysisCache()) {
          await analyzer.analyze();
        }
        await analyzer.updateAnalysisCache();

        const analysis = analyzer.finalAnalysis;
        if (analysis >= Result.ProbablyTypo) {
          var userConfirm;
          switch(analysis) {
            case Result.ProbablyTypo: {
              const message = `TypoAlert has classified <b>${newDomain}</b> as <b>ProbablyTypo</b>. Are you sure you want to proceed?`;
              userConfirm = await showCustomConfirm(message);
              break;
            }
            case Result.Typo: {
              const message = `TypoAlert has classified <b>${newDomain}</b> as <b>Typo</b>. Are you sure you want to proceed?`;
              userConfirm = await showCustomConfirm(message);
              break;
            }
            case Result.TypoPhishing: {
              const message = `TypoAlert has classified <b>${newDomain}</b> as <b>Typo/Phishing</b>. Are you sure you want to proceed?`;
              userConfirm = await showCustomConfirm(message);
              break;
            }
          }
          if (!userConfirm) {
            newDomainInput.value = '';
            return;
          }
        }

        errorBanner.textContent = '';
        errorBanner.style.display = 'none';

        const existingDomains = Array.from(domainList.getElementsByTagName('li')).map(li => li.textContent.replace("Remove", ""));
        if (!existingDomains.includes(newDomain)) {
          const li = createDomainListItem(newDomain);
          domainList.appendChild(li);
    
          // Save the updated domain list to storage
          chrome.storage.sync.get('userDomains', async function(result) {
            const userDomains = result.userDomains || [];
            userDomains.push(newDomain);
            chrome.storage.sync.set({ userDomains: userDomains });
            await analyzer.removeDomainFromAnalysisCache();
          });
        } else {
          errorBanner.textContent = 'Domain already exists.';
          errorBanner.style.display = 'block';
        }
      } else {
        errorBanner.textContent = 'Invalid domain format. Please follow the instructions and enter a valid domain name.';
        errorBanner.style.display = 'block';
      }
  
      newDomainInput.value = '';
    }
  });

  newDomainInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
      addDomainButton.click();
    }
  });

  // Create a list item for a domain
  function createDomainListItem(domain) {
    const li = document.createElement('li');
    li.textContent = domain;

    const removeButton = document.createElement('button');
    removeButton.textContent = 'Remove';
    removeButton.addEventListener('click', function() {
      li.remove();

      // Remove the domain from the saved list and update storage
      chrome.storage.sync.get('userDomains', function(result) {
        const userDomains = result.userDomains || [];
        const updatedDomains = userDomains.filter(d => d !== domain);
        chrome.storage.sync.set({ userDomains: updatedDomains });
      });

      // Clear domains in analysis cache with DL-1 from domain removed
      chrome.storage.sync.get('analysisCache', function(result) {
        const cache = result.analysisCache || [];
        const updatedCache = cache.filter(d => ecm.damerauLevenshteinDistance(d.domain, domain) > 1);
        chrome.storage.sync.set({ analysisCache: updatedCache });
      });
    });

    li.appendChild(removeButton);
    return li;
  }
});
