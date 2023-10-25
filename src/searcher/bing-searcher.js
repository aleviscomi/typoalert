import Searcher from "./searcher.js"

export default class BingSearcher extends Searcher {
    #searchResults;
    #dym;
    
    constructor() {
        super();
        this.#searchResults = [];
        this.#dym = "";
    }

    get searchResults() {
        return this.#searchResults;
    }

    get dym() {
        return this.#dym;
    }

    async search(query, CLIfetch) {
        try {
            const API_KEY = '***';
            var url = `https://api.bing.microsoft.com/v7.0/search?q=${query}&count=10`;
        
            var response;
            if(CLIfetch != null) {
                response = await CLIfetch(url, { headers: { 'Ocp-Apim-Subscription-Key': API_KEY } });
            } else {
                response = await fetch(url);
            }
            var data = await response.json();
        
            // get URLs of results
            this.#searchResults = data.webPages.value.map(item => {
                let url = new URL(item.url);
                return url.hostname.replace(/^www\./, '');
            });
        
            // get DYM
            this.#dym = data.queryContext.alteredQuery !== undefined ? data.queryContext.alteredQuery : "";
            
        } catch (error) {
            throw error;
        }
    }
}