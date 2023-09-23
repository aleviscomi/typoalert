export function setDefault() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/blue/icon16.png",
            "48": "/images/icon/blue/icon48.png",
            "128": "/images/icon/blue/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/default/popup.html"
    });
}

export function setGreen() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/green/icon16.png",
            "48": "/images/icon/green/icon48.png",
            "128": "/images/icon/green/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/green/popup.html"
    });
}

export function setGreenYellow() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/green-yellow/icon16.png",
            "48": "/images/icon/green-yellow/icon48.png",
            "128": "/images/icon/green-yellow/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/green-yellow/popup.html"
    });
}

export function setYellow() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/yellow/icon16.png",
            "48": "/images/icon/yellow/icon48.png",
            "128": "/images/icon/yellow/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/yellow/popup.html"
    });
}

export function setRed() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/red/icon16.png",
            "48": "/images/icon/red/icon48.png",
            "128": "/images/icon/red/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/red/popup.html"
    });
}

export function setDarkRedPhishing() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/dark-red/icon16.png",
            "48": "/images/icon/dark-red/icon48.png",
            "128": "/images/icon/dark-red/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/dark-red-phishing/popup.html"
    });
}

export function setDarkRedMalware() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/dark-red/icon16.png",
            "48": "/images/icon/dark-red/icon48.png",
            "128": "/images/icon/dark-red/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/dark-red-malware/popup.html"
    });
}

export function setGrey() {
    chrome.action.setIcon({ 
        path: {
            "16": "/images/icon/grey/icon16.png",
            "48": "/images/icon/grey/icon48.png",
            "128": "/images/icon/grey/icon128.png"
        }
    });

    chrome.action.setPopup({ 
        popup: "/popup/grey/popup.html"
    });
}

export function showAlert(warningLevel, msg, color) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const tab = tabs[0];
        if (tab) {
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                func: (warningLevel, msg, color) => {
                    checkModal = document.getElementById("typoAlertModalWindow");
                    if(checkModal) {
                        return;
                    }
                    const modal = document.createElement("div");
                    modal.id = "typoAlertModalWindow"
                    modal.style.position = "fixed";
                    modal.style.zIndex = "10000";
                    modal.style.width = "100%";
                    modal.style.height = "100%";
                    modal.style.top = "0";
                    modal.style.left = "0";
                    modal.style.backgroundColor = "rgba(0,0,0,0.5)";

                    const window = document.createElement("div");
                    window.style.position = "fixed";
                    window.style.top = "50%";
                    window.style.left = "50%";
                    window.style.transform = "translate(-50%, -50%)";
                    window.style.background = "#fff";
                    window.style.padding = "50px";
                    window.style.borderRadius = "8px";
                    window.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.1)";
                    window.style.maxWidth = "500px";
                    window.style.minWidth = "400px";
                    window.style.textAlign = "center";

                    const windowTitle = document.createElement("h1");
                    windowTitle.textContent = warningLevel;
                    windowTitle.style.color = color;
                    windowTitle.style.textAlign = "center";
                    windowTitle.style.marginBottom = "50px";
                    windowTitle.style.fontSize = "48px";

                    const windowParagraph = document.createElement("p");
                    windowParagraph.innerHTML = `
                        It's TypoAlert speaking.<br>The analysis conducted on this website says:
                        <hr>
                        <b>${msg}</b>
                    `;
                    windowParagraph.style.fontSize = "20px";
                    windowParagraph.style.color = "black";

                    const button = document.createElement("button");
                    button.style.backgroundColor = "#007bff";
                    button.style.color = "#fff";
                    button.style.border = "none";
                    button.style.borderRadius = "3px";
                    button.style.cursor = "pointer";
                    button.style.padding = "8px 16px";
                    button.style.marginLeft = "10px";
                    button.style.marginTop = "20px";
                    button.style.fontSize = "20px";
                    button.style.fontFamily = "Arial, sans-serif";
                    button.addEventListener("mouseover", function() {
                        button.style.backgroundColor = "#0056b3";
                    });
                    button.addEventListener("mouseout", function() {
                        button.style.backgroundColor = "#007bff";
                    });
                    button.addEventListener("click", function() {
                        modal.remove();
                    });
                    button.textContent = "Close";
                    
                    window.appendChild(windowTitle);
                    window.appendChild(windowParagraph);
                    window.appendChild(button);
                    modal.appendChild(window);
                    document.body.appendChild(modal);
                },
                args: [ warningLevel, msg, color ]
            });
        }
    });
}

