import * as utils from "../src/utils.js"
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
            var lastAnalysis = await utils.getFromStorage("lastAnalysis", "local");
            console.log(lastAnalysis);
            var analyzer = new Analyzer();
            analyzer.inputDomain = lastAnalysis.domain;
            await analyzer.removeInputDomainFromAnalysisCache();
            await analyzer.analyze();
            analyzer.showAnalysis();
            alert("Analysis Redone");
        });
    }
});
