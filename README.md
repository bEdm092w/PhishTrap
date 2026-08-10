#  Guardian PhishGuard

Guardian PhishGuard is a lightweight, multi-layered Chrome extension engineered to protect vulnerable and non-technical populations (such as the elderly) from digital fraud, phishing, and tech-support scams. 

By combining offline heuristic analysis with live threat intelligence, PhishGuard actively intercepts dangerous navigation and high-pressure credential harvesting attempts before the user can be compromised.

##  Core Features

*   **Offline Typosquatting Engine:** Detects lookalike domains (e.g., `paypa1.com` or Cyrillic character swaps) locally using Levenshtein distance and homoglyph normalization, catching zero-day threats without relying on external databases.
*   **Live Threat Intelligence:** Integrates the Google Safe Browsing API v4 via Chrome's `webNavigation` API to block globally recognized malware and phishing links before the page even loads.
*   **Behavioral Content Scanning:** Runs in-page regex heuristics to detect the dangerous combination of high-pressure urgency language (e.g., "Call support immediately") and sensitive input fields (e.g., `<input type="password">`).
*   **Elder-Friendly Redirection:** Replaces intercepted tabs with a full-screen, plain-language warning modal.
*   **Trusted Contact Integration:** Includes a one-click `tel:` link on the block screen, allowing users to immediately dial a pre-configured family member or trusted contact for help.

##  Architecture Layers

1.  **Layer 1 (`typosquat.js` & `brands.json`):** A locally executed algorithm that calculates the edit distance of the current URL against a customizable JSON list of high-value target brands (e.g., banking, shipping, and government portals).
2.  **Layer 2 (`background.js`):** The service worker that orchestrates API calls to Google Safe Browsing and handles tab redirection via Chrome's extension APIs.
3.  **Layer 3 (`content.js`):** A DOM-scanning script that analyzes visible page text and HTML structure in real-time.
4.  **Layer 4 (`popup.html` & `blocked.html`):** The user interface layer, built with accessibility in mind, utilizing `chrome.storage.local` to securely save user configurations.

##  Installation & Setup (Developer Mode)

To install and run Guardian PhishGuard locally:

1. Clone this repository to your local machine:
   ```bash
   git clone [https://github.com/yourusername/guardian-phishguard.git](https://github.com/yourusername/guardian-phishguard.git)
