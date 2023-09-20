chrome.storage.local.get('ctargetsAnalysis', function(result) {
    const ctargets = Object.keys(result.ctargetsAnalysis);
    const ctargetsList = document.getElementById('ctargets-sites');

    if(ctargetsList) {
        if (ctargets.length > 0) {
            const siteListItems = ctargets.map(site => `<a href="https://${site}" target="_blank">${site}</a>`).join(', ');
            ctargetsList.innerHTML += `${siteListItems}`;
        } else {
            ctargetsList.innerHTML += 'No alternative sites found.';
        }
    }
});
  