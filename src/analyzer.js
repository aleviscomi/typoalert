import * as utils from "./utils.js"
import * as ecm from "./ecm.js"
import * as avm from "./avm.js"
import * as uiController from "/src/ui-controller.js"
import Result from "./result.js"

import GoogleSearcher from "./searcher/google-searcher.js"
import PhishingDetectorSsdeep from "./phishing-detector/phishing-detector-ssdeep.js"

export default class Analyzer {
    #domain;
    #finalAnalysis;
    #ctargetsAnalysis;
    #ANALYSIS_CACHE_SIZE;

    constructor() {
      this.#domain = "";
      this.#finalAnalysis = Result.Unknown;
      this.#ctargetsAnalysis = {};
      this.#ANALYSIS_CACHE_SIZE = 100;
    }
  
    set domain(domain) {
        this.#domain = domain;
        this.#finalAnalysis = Result.Unknown;
        this.#ctargetsAnalysis = {};
    }

    get domain() {
        return this.#domain
    }
  
    get finalAnalysis() {
        return this.#finalAnalysis;
    }
  
    get ctargetsAnalysis() {
        return this.#ctargetsAnalysis;
    }
  
    async #getDomainsList() {
        // get top domains list
        var topDomains = await utils.getFromStorage("topDomains", "local");
    
        // get user domains list
        var userDomains = await utils.getFromStorage("userDomains", "sync");
    
        var domainsList = topDomains.concat(userDomains);
    
        return domainsList;
    }

    async analyze() {
        if(domain === "") {
            throw new Error("Domain must be setted");
        }
        this.#finalAnalysis = Result.Unknown;
        this.#ctargetsAnalysis = {};
        var domainsList = await this.#getDomainsList();
    
        // check if inputDomain is:
        // - in domains list;
        // - a typo (DL == 1) of some top domain
        var ctargets = [];
        var domain;
        for (domain of domainsList) {
            // if inputDomain is in domains list (DL = 0) then it is definitely not typo
            if (domain === this.#domain) {
                this.#finalAnalysis = Result.NotTypo;
                break;
            }
    
            // calculate DL between currentTopDomain and inputDomain
            var dlDistance = ecm.damerauLevenshteinDistance(domain, this.#domain);
            if (dlDistance === 1) {
                this.#finalAnalysis = Result.ProbablyTypo;
                ctargets.push(domain);
            }
        }
    
        //check alert
        if (this.#finalAnalysis === Result.ProbablyTypo) {
            var alertAnalysis = await avm.analyzeAlerts(this.#domain, ctargets, new GoogleSearcher(), new PhishingDetectorSsdeep());
            
            this.#finalAnalysis = alertAnalysis["worstAnalysis"];     // worst result found in ctargets
            this.#ctargetsAnalysis = alertAnalysis["ctargetsAnalysis"];
        }
    
    }   // analyze

    showAnalysis() {
        switch(this.#finalAnalysis) {
            case Result.Unknown: {
                uiController.setGrey();
                break;
            }
            case Result.NotTypo: {
                uiController.setGreen();
                break;
            }
            case Result.ProbablyNotTypo: {
                chrome.storage.local.set({ "ctargetsAnalysis": this.#ctargetsAnalysis });
                uiController.setGreenYellow();
                
                const notificationOptions = { type: "basic", iconUrl: "images/info.png", title: "TypoAlert Note", message: "Did you mean another domain? Open extension popup for more info." };
                chrome.notifications.create("typoAlertNotification", notificationOptions);
                break;
            }
            case Result.ProbablyTypo: {
                chrome.storage.local.set({ "ctargetsAnalysis": this.#ctargetsAnalysis });
                uiController.setYellow();
                uiController.showAlert("Attention", "This domain might be a typo.<br>Open the extension popup to view more info.", "#ffbb00");
                break;
            }
            case Result.Typo: {
                chrome.storage.local.set({ "ctargetsAnalysis": this.#ctargetsAnalysis });
                uiController.setRed();
                uiController.showAlert("Warning", "It's highly possible that this domain is a typo.<br>Open the extension popup to view more info.", "#ff0000");
                break;
            }
            case Result.TypoPhishing: {
                chrome.storage.local.set({ "ctargetsAnalysis": this.#ctargetsAnalysis });
                uiController.setDarkRedPhishing();
                uiController.showAlert("Caution", "This domain is a typo and may be a phishing attempt.<br>Open the extension popup to view more info.", "#920000");
                break;
            }
        }
    }   // showAnalysis


    async updateAnalysisCache() {
        if(this.#domain === "") {
            throw new Error("Domain must be setted");
        }

        if(this.#finalAnalysis <= Result.NotTypo) {
            return;
        }

        // get cache of already analyzed domains
        var cache = await utils.getFromStorage("analysisCache", "sync");

        // check if domain is already in cache
        let indexDomain = cache.findIndex(element => element.domain === this.#domain);

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
                "domain": this.#domain,
                "finalAnalysis": this.#finalAnalysis,
                "ctargetsAnalysis": this.#ctargetsAnalysis,
            });
        }
        
        chrome.storage.sync.set({ "analysisCache": cache });
    }   // updateAnalysisCache


    async isDomainInAnalysisCache() {
        if(this.#domain === "") {
            throw new Error("Domain must be setted");
        }

        // get cache of already analyzed domains
        var cache = await utils.getFromStorage("analysisCache", "sync");

        // check if domain is already in cache
        let indexDomain = cache.findIndex(element => element.domain === this.#domain);

        if (indexDomain !== -1) {
            var domainObj = cache[indexDomain];
            this.#finalAnalysis = domainObj.finalAnalysis;
            this.#ctargetsAnalysis = domainObj.ctargetsAnalysis;
            return true;
        } 

        return false;
        
    }   // isDomainInAnalysisCache


    async removeDomainFromAnalysisCache() {
        // get cache of already analyzed domains
        var cache = await utils.getFromStorage("analysisCache", "sync");

        // check if domain is already in cache
        let indexDomain = cache.findIndex(element => element.domain === this.#domain);

        if (indexDomain !== -1) {
            cache.splice(indexDomain, 1)[0];
            chrome.storage.sync.set({ "analysisCache": cache });
        }

        
    }   // isDomainInAnalysisCache
}
