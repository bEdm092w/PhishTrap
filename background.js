importScripts("typosquat.js");

const SAFE_BROWSING_ENDPOINT = "https://safebrowsing.googleapis.com/v4/threatMatches:find";
let brandsData = { brands: [] };
let localBlocklist = new Set();
let apiKey = null;

async function loadConfig() {
  const stored = await chrome.storage.local.get(["apiKey", "localBlocklist"]);
  apiKey = stored.apiKey || null;
  if (Array.isArray(stored.localBlocklist)) {
    localBlocklist = new Set(stored.localBlocklist);
  }
  try {
    const res = await fetch(chrome.runtime.getURL("brands.json"));
    brandsData = await res.json();
  } catch (e) {
    console.error("Failed to load brands.json:", e);
  }
}

loadConfig();
chrome.storage.onChanged.addListener(loadConfig);

async function checkSafeBrowsing(url) {
  if (!apiKey) return null;
  const body = {
    client: { clientId: "guardian-phishguard", clientVersion: "1.0.0" },
    threatInfo: {
      threatTypes: ["SOCIAL_ENGINEERING", "MALWARE", "UNWANTED_SOFTWARE"],
      platformTypes: ["ANY_PLATFORM"],
      threatEntryTypes: ["URL"],
      threatEntries: [{ url }]
    }
  };

  try {
    const resp = await fetch(`${SAFE_BROWSING_ENDPOINT}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const data = await resp.json();
    if (data.matches && data.matches.length > 0) {
      return { 
        type: "safe-browsing", 
        reason: "Google Safe Browsing flagged this live link as a confirmed security threat." 
      };
    }
  } catch (e) {
    console.warn("Safe Browsing lookup failed:", e);
  }
  return null;
}

function checkLocalBlocklist(hostname) {
  if (localBlocklist.has(hostname)) {
    return { type: "local-blocklist", reason: "This website is on your custom blocklist." };
  }
  return null;
}

async function evaluateUrl(rawUrl) {
  let hostname;
  try {
    hostname = new URL(rawUrl).hostname;
  } catch {
    return null;
  }

  // Layer 1: Local Blocklist
  const local = checkLocalBlocklist(hostname);
  if (local) return local;

  // Layer 2: Offline Typosquat Engine
  const squat = checkTyposquat(hostname, brandsData.brands || []);
  if (squat) return squat;

  // Layer 3: Live Threat Intelligence API
  const sb = await checkSafeBrowsing(rawUrl);
  if (sb) return sb;

  return null;
}

// Navigation Interceptor
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  if (details.frameId !== 0) return; // Main frame only
  const finding = await evaluateUrl(details.url);
  if (!finding) return;

  const blockedUrl = chrome.runtime.getURL("blocked.html") +
    "?target=" + encodeURIComponent(details.url) +
    "&reason=" + encodeURIComponent(finding.reason || "Suspicious scam pattern detected.") +
    "&brand=" + encodeURIComponent(finding.brand || "");

  chrome.tabs.update(details.tabId, { url: blockedUrl });
});

// Listener for messages sent from content script
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "CHECK_URL") {
    evaluateUrl(msg.url).then(sendResponse);
    return true; // Async response
  }
});