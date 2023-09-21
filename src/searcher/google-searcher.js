import Searcher from "./searcher.js"

export default class GoogleSearcher extends Searcher {
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

    async search(query) {
        try {
            var response = await fetch(`https://www.google.com/search?q=${query}&num=10`);
            var data = await response.text();

            // get URLs of results
            var divs = data.split(/>(http(s)?:\/\/)/);
            var div, url;
            for (div of divs) {
                if (div !== undefined && !div.includes("doctype")) {
                if (div.includes("cite")) {
                    url = div.split("</cite")[0].replace(/^www\./, "").replace(/\/.*/, "");
                    if (!url.includes("<") && !url.includes(">") && !this.#searchResults.includes(url)) {
                    this.#searchResults.push(url);
                    }
                }
                if (div.includes("span")) {
                    url = div.split("<span")[0].replace(/^www\./, "").replace(/\/.*/, "");
                    if (!url.includes("<") && !url.includes(">") && !this.#searchResults.includes(url)) {
                    this.#searchResults.push(url);
                    }
                }
                }
            }

            // get DYM
            if (data.includes("Forse cercavi:")) {
                this.#dym = data.split(/Forse cercavi:.*?q=/)[1].split("&amp")[0];
            }
            else if (data.includes("Risultati relativi a")) {
                this.#dym = data.split(/Risultati relativi a.*?q=/)[1].split("&amp")[0];
            }
            else if (data.includes("Did you mean:")) {
                this.#dym = data.split(/Did you mean:.*?q=/)[1].split("&amp")[0];
            }
            else if (data.includes("Showing results for")) {
                this.#dym = data.split(/Showing results for.*?q=/)[1].split("&amp")[0];
            }

        } catch (error) {
            throw error;
        }
    }
}