export function loadTopDomainRepository() {
    fetch(chrome.runtime.getURL("/resources/top_domains.txt"))
        .then(response => response.text())
        .then(text => {
            const topDomainsArray = text.split("\n");
            chrome.storage.local.set({ "topDomains": topDomainsArray });
        }
    );
}

export function loadBlacklist() {
    fetch(chrome.runtime.getURL("/resources/blackbook.txt"))
        .then(response => response.text())
        .then(text => {
            const blacklistArray = text.split("\n");
            chrome.storage.local.set({ "blacklist": blacklistArray });
        }
    );
}

export function loadKeyphrasesDomainParking() {
    fetch(chrome.runtime.getURL("/resources/keyphrases_domain_parking.txt"))
        .then(response => response.text())
        .then(text => {
            const keyphrasesDomainParkingArray = text.split("\n");
            chrome.storage.local.set({ "keyphrasesDomainParking": keyphrasesDomainParkingArray });
        }
    );
}

export async function getFromStorage(key, storageType) {
    var data = await new Promise((resolve) => {
        if (storageType === "sync") {
            chrome.storage.sync.get(key, resolve);
        } else {
            chrome.storage.local.get(key, resolve);
        }
    });
    var result = data[key] || [];

    return result;
}

export async function isDomainInBlacklist(domain) {
    var blacklist = await getFromStorage("blacklist", "local");

    return blacklist.includes(domain);
}

export async function getHtmlBodyFromActiveTab() {
    var html = await new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const tab = tabs[0];
            if (tab && tab.url.startsWith("http")) {
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => document.body.outerHTML,
                }).then((result) => {
                    const html = result[0].result;
                    resolve(html);
                });
            } else {
                reject(new Error('No active tab found'));
            }
        });
    });

    return html;
}

export async function getHtmlBodyFromUrl(url) {
    try {
        const response = await fetch(url);
        const data = await response.text();
        const result = "<body" + data.split("<body")[1].split("</body>")[0] + "</body>";
        return result;
    } catch (error) {
        throw 'ERROR: ' + error;
    }
}

