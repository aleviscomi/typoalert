chrome.storage.local.get('lastAnalysis', function(result) {
    var analysis = result.lastAnalysis;
    const targetSite = document.getElementById('target-site');
    const others = document.getElementById('others');

    if(analysis) {
        if (analysis.target !== "") {
            const targetSiteLink = `<a href="https://${analysis.target}" target="_blank">${analysis.target}</a>`;
            targetSite.innerHTML += `${targetSiteLink}`;
        } else {
            targetSite.innerHTML += 'No target site found.';
        }
    }
    if (others) {
        if (analysis.otherTargets.length > 0) {
            others.innerHTML += "Others similar domains: "
            var otherSiteLinks = analysis.otherTargets.map(site => `<a href="https://${site}" target="_blank">${site}</a>`).join(', ');

            others.innerHTML += otherSiteLinks;
        }
    }
});