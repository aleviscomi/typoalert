chrome.storage.local.get('lastAnalysis', function(result) {
    var analysis = result.lastAnalysis;
    const targetSite = document.getElementById('target-site');
    const searchedSite = document.getElementById('searched-site');
    const others = document.getElementById('others');
    const dateLastAnalysis = document.getElementById('date-last-analysis');

    if(analysis) {
        if(searchedSite) {
            searchedSite.innerHTML += `<i>${analysis.inputDomain}</i>`;
        }

        if(dateLastAnalysis) {
            dateLastAnalysis.innerHTML += `<i>${analysis.dateLastAnalysis}</i>`;
        }
        if(targetSite) {
            if (analysis.target !== "") {
                const targetSiteLink = `<a href="https://www.${analysis.target}" id="site-link">${analysis.target}</a>`;
                targetSite.innerHTML += `${targetSiteLink}`;
            } else {
                targetSite.innerHTML += 'No target site found.';
            }
        }
    }
    if (others) {
        if (analysis.otherTargets.length > 0) {
            others.innerHTML += "Others similar domains: "
            var otherSiteLinks = analysis.otherTargets.map(site => `<a href="https://www.${site}" id="site-link">${site}</a>`).join(', ');

            others.innerHTML += otherSiteLinks;
        }
    }

    const siteLink = document.getElementById('site-link');
    if (siteLink) {
        siteLink.addEventListener('click', function(event) {
            event.preventDefault();
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                var currentTabId = tabs[0].id;
                var url = new URL(event.target.href);
                chrome.storage.local.set({ "popupClick": true });
                
                chrome.tabs.create({ openerTabId: currentTabId, url: url.toString() });
                chrome.tabs.remove(currentTabId, function() { });
            });
        });
    }
});