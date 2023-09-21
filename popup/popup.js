import Analyzer from "../../src/analyzer.js";

document.addEventListener("DOMContentLoaded", function() {
    var closeButton = document.getElementById("close-button");
    closeButton.addEventListener("click", function() {
        window.close();
    });

    var optionsButton = document.getElementById("options-button");
    optionsButton.addEventListener("click", function() {
        chrome.runtime.openOptionsPage();
    });

    var redoButton = document.getElementById("redo-button");
    if (redoButton) {
        redoButton.addEventListener("click", async function() {
            var domain = await new Promise((resolve) => {
                chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                    var url = tabs[0].url;
                    var domain = new URL(url).hostname.replace(/^www\./, "");
                    resolve(domain);
                });
            });
            
            var analyzer = new Analyzer();
            analyzer.domain = domain;
    
            await analyzer.removeDomainFromAnalysisCache();
    
            await analyzer.analyze();
            analyzer.showAnalysis();
    
            await analyzer.updateAnalysisCache();
        });
    }
});
