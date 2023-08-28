document.addEventListener("DOMContentLoaded", function() {
    var closeButton = document.getElementById("close-button");
    closeButton.addEventListener("click", function() {
        window.close();
    });

    var optionsButton = document.getElementById("options-button");
    optionsButton.addEventListener("click", function() {
        chrome.runtime.openOptionsPage();
    });
});
