# TypoAlert
_Thesis project for the **Master's Degree in Computer Engineering (Cyber Security)** @ **University of Calabria**_

![Logo](images/logo_title.png)

TypoAlert is a Chrome extension to detect typosquatted domains. It constantly monitors the user's navigation to detect typosquatting attacks and promptly notify them. In practice, when the user lands on a typosquatted domain, TypoAlert immediately draws their attention. Additionally, it also allows for configuring specific preferences to adapt to the individual user's browsing habits.


## Key Components

- **BlackBook:** A continuously updated historical [blacklist](https://github.com/stamparm/blackbook) containing numerous domains known for their malicious nature.

- **Top Domains Repository (TDR):** An archive of reliable domains, consisting of the top 50 globally visited domains, as well as the top 50 domains in each individual nation.

- **User Domains Repository: (UDR):** Similar to the TDR, it represents an archive of reliable domains, but initially empty and can be customized by the user according to their preferences.

- **Edit-Distance Computation Module (ECM):** This module performs lexical analysis by calculating the Damearu-Levenshtein (DL) distance between the input domain and those present in the two repositories. If a domain in one of the repositories has a DL-distance of 1 from the input domain, a possible typosquatting situation is flagged, and that domain is considered as a potential target.

- **Alerts Verification Module (AVM):** This module is based on the analysis of four indicators to confirm or refute a potential typosquatting situation flagged by the ECM. These indicators encompass the ***Top 10 Alert***, which leverages search engine results (Google or Bing), the ***Did You Mean Alert***, utilizing search engine "DYM" mechanisms, the ***Phishing Alert***, employing fuzzy hashing (ssdeep), and the ***Parking Alert***, which identifies keyphrases commonly associated with parked pages.


## Installation

To install TypoAlert, follow these steps:

1. Download it using Git:
    ```bash
    git clone https://github.com/aleviscomi/typoalert.git
    ```
2. Open the extension page in Google Chrome and enter <code>chrome://extension</code> in the URL bar.

3. Activate developer mode by turning on the switch on the top right of the page that says "Developer mode".

4. Load unpacked extension by clicking on the button on the top left of the page that says "Load upacked". Then select the TypoAlert folder.
