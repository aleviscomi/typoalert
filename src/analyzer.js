import * as utils from "./utils.js"
import * as ecm from "./ecm.js"
import * as avm from "./avm.js"
import * as uiController from "/src/ui-controller.js"
import Result from "./result.js"

import GoogleSearcher from "./searcher/google-searcher.js"
import PhishingDetectorSsdeep from "./phishing-detector/phishing-detector-ssdeep.js"

export default class Analyzer {
    #ANALYSIS_CACHE_SIZE;

    #inputDomain;
    #visitedDomain;

    #target;    // ctarget with worst alert value
    #analysis;  // target's alert value
    #otherTargets;    // other ctargets with less alert value

    constructor() {
        this.#ANALYSIS_CACHE_SIZE = 100;

        this.#inputDomain = "";
        this.#visitedDomain = "";

        this.#target = "";
        this.#analysis = Result.Unknown;
        this.#otherTargets = [];
    }
  
    set inputDomain(inputDomain) {
        this.#inputDomain = inputDomain;
        this.#target = "";
        this.#analysis = Result.Unknown;
        this.#otherTargets = [];
    }
  
    set visitedDomain(visitedDomain) {
        this.#visitedDomain = visitedDomain;
    }

    get inputDomain() {
        return this.#inputDomain;
    }

    get visitedDomain() {
        return this.#visitedDomain;
    }
  
    get target() {
        return this.#target;
    }
  
    get analysis() {
        return this.#analysis;
    }
  
    get otherTargets() {
        return this.#otherTargets;
    }
  
    async #getDomainsList() {
        // get top domains list
        var topDomains = await utils.getFromStorage("topDomains", "local");
    
        // get user domains list
        var userDomains = await utils.getFromStorage("userDomains", "sync");
    
        var domainsList = topDomains.concat(userDomains);
    
        return domainsList;
    }   // getDomainsList

    async #isInputDomainInAnalysisCache() {
        // get cache of already analyzed domains
        var cache = await utils.getFromStorage("analysisCache", "sync");

        // check if domain is already in cache
        let indexDomain = cache.findIndex(element => element.domain === this.#inputDomain);

        if (indexDomain !== -1) {
            return true;
        } 

        return false;
        
    }   // isInputDomainInAnalysisCache


    async #updateAnalysisCache() {
        if(this.#analysis <= Result.NotTypo) {
            return;
        }

        // get cache of already analyzed domains
        var cache = await utils.getFromStorage("analysisCache", "sync");

        // check if domain is already in cache
        let indexDomain = cache.findIndex(element => element.domain === this.#inputDomain);

        if (indexDomain !== -1) {
            // push in last position
            var renewed = cache.splice(indexDomain, 1)[0];
            cache.push(renewed);
        } else {
            // add new domain with related analysis
            if(cache.length === this.#ANALYSIS_CACHE_SIZE) {
                // remove first element (the oldest)
                cache.splice(0, 1)[0];
            }
            cache.push({
                "domain": this.#inputDomain,
                "target": this.#target,
                "analysis": this.#analysis,
                "otherTargets": this.#otherTargets
            });
        }
        
        chrome.storage.sync.set({ "analysisCache": cache });
    }   // updateAnalysisCache

    async analyze() {
        if(this.#inputDomain === "") {
            throw new Error("Domains must be setted");
        }
        if(this.#visitedDomain === "") {
            this.#visitedDomain = this.#inputDomain;
        }
        if(await this.#isInputDomainInAnalysisCache()) {
            // load analysis from cache
            var cache = await utils.getFromStorage("analysisCache", "sync");
            let indexDomain = cache.findIndex(element => element.domain === this.#inputDomain);
            this.#target = cache[indexDomain].target;
            this.#analysis = cache[indexDomain].analysis;
            this.#otherTargets = cache[indexDomain].otherTargets;
            var lastAnalysis = {
                "domain": this.#inputDomain,
                "target": this.#target,
                "analysis": this.#analysis,
                "otherTargets": this.#otherTargets
            }
            chrome.storage.local.set({ "lastAnalysis": lastAnalysis });
            return;
        }

        this.#target = "";
        this.#analysis = Result.Unknown;
        this.#otherTargets = [];

        var domainsList = await this.#getDomainsList();
    
        // check if inputDomain is:
        // - in domains list;
        // - a typo (DL == 1) of some top domain
        var ctargets = [];
        var domain;
        for (domain of domainsList) {
            // if inputDomain is in domains list (DL = 0) then it is definitely not typo
            if (domain === this.#inputDomain || domain === this.#visitedDomain) {
                this.#analysis = Result.NotTypo;
                break;
            }
    
            // calculate DL between currentTopDomain and inputDomain
            var dlDistance = ecm.damerauLevenshteinDistance(domain, this.#inputDomain);
            if (dlDistance === 1) {
                this.#analysis = Result.ProbablyTypo;
                ctargets.push(domain);
            }
        }
    
        //check alert
        if (this.#analysis === Result.ProbablyTypo) {
            var alertAnalysis = await avm.analyzeAlerts(this.#inputDomain, this.#visitedDomain, ctargets, new GoogleSearcher(), new PhishingDetectorSsdeep());
            
            this.#target = alertAnalysis["target"]; 
            this.#analysis = alertAnalysis["analysis"]; 
            this.#otherTargets = alertAnalysis["otherTargets"]; 
        }

        await this.#updateAnalysisCache();
        var lastAnalysis = {
            "domain": this.#inputDomain,
            "target": this.#target,
            "analysis": this.#analysis,
            "otherTargets": this.#otherTargets
        }
        chrome.storage.local.set({ "lastAnalysis": lastAnalysis });
    
    }   // analyze

    showAnalysis() {
        switch(this.#analysis) {
            case Result.Unknown: {
                uiController.setGrey();
                break;
            }
            case Result.NotTypo: {
                uiController.setGreen();
                break;
            }
            case Result.ProbablyNotTypo: {
                uiController.setGreenYellow();
                
                const notificationOptions = { type: "basic", iconUrl: "images/info.png", title: "TypoAlert Note", message: "Did you mean another domain? Open extension popup for more info." };
                chrome.notifications.create("typoAlertNotification", notificationOptions);
                break;
            }
            case Result.ProbablyTypo: {
                uiController.setYellow();
                uiController.showAlert("Attention", "This domain might be a typo.<br>Open the extension popup to view more info.", "#ffbb00");
                break;
            }
            case Result.Typo: {
                uiController.setRed();
                uiController.showAlert("Warning", "It's highly possible that this domain is a typo.<br>Open the extension popup to view more info.", "#ff0000");
                break;
            }
            case Result.TypoPhishing: {
                uiController.setDarkRedPhishing();
                uiController.showAlert("Caution", "This domain is a typo and may be a phishing attempt.<br>Open the extension popup to view more info.", "#920000");
                break;
            }
        }
    }   // showAnalysis


    async removeInputDomainFromAnalysisCache() {
        // get cache of already analyzed domains
        var cache = await utils.getFromStorage("analysisCache", "sync");

        // check if domain is already in cache
        let indexDomain = cache.findIndex(element => element.domain === this.#inputDomain);

        if (indexDomain !== -1) {
            cache.splice(indexDomain, 1)[0];
            chrome.storage.sync.set({ "analysisCache": cache });
        }

        
    }   // removeInputDomainFromAnalysisCache
}
