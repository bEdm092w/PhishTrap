const URGENCY_PATTERNS = [
  /your computer (has been|is) locked/i,
  /call microsoft support immediately/i,
  /urgent:? your account (will be|has been) (suspended|locked|limited)/i,
  /unusual (sign.?in|login|activity) detected/i,
  /confirm your (password|details|information) to (avoid|prevent)/i,
  /click (here|below) (immediately|now|urgently)/i,
  /unauthorized transaction detected/i,
  /transfer funds to a secure wallet/i,
  /verify.{0,15}(account|identity).{0,15}(now|immediately)/i
];

function pageHasPasswordField() {
  return document.querySelectorAll('input[type="password"]').length > 0;
}

function countUrgencyMatches(text) {
  return URGENCY_PATTERNS.reduce((n, re) => n + (re.test(text) ? 1 : 0), 0);
}

function scanPage() {
  const bodyText = document.body ? document.body.innerText.slice(0, 20000) : "";
  const urgencyHits = countUrgencyMatches(bodyText);
  const hasPassword = pageHasPasswordField();

  // If high-pressure language AND a password input exist together
  if (urgencyHits >= 1) {
    chrome.runtime.sendMessage({ type: "CHECK_URL", url: location.href }, (finding) => {
      showCautionBanner(urgencyHits, hasPassword);
    });
  }
}

function showCautionBanner(urgencyHits, hasPassword) {
  if (document.getElementById("guardian-caution-banner")) return;

  const banner = document.createElement("div");
  banner.id = "guardian-caution-banner";
  banner.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 2147483647;
    background: #dc2626; color: white; font-family: system-ui, sans-serif;
    font-size: 17px; padding: 14px 20px; text-align: center;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-weight: 500;
  `;
  
  const msg = hasPassword 
    ? "⚠️ <strong>WARNING:</strong> This page asks for a password and uses high-pressure language common in scams." 
    : "⚠️ <strong>SCAM ALERT:</strong> This page uses high-pressure language commonly associated with financial fraud.";

  banner.innerHTML = `
    ${msg} Do not enter personal details.
    <button id="guardian-banner-dismiss" style="margin-left:16px; padding:6px 14px;
      border:none; border-radius:6px; background:white; color:#dc2626;
      font-weight:bold; cursor:pointer;">I Understand</button>
  `;

  document.documentElement.appendChild(banner);
  document.getElementById("guardian-banner-dismiss").onclick = () => banner.remove();
}

window.addEventListener("load", scanPage);

let debounce;
new MutationObserver(() => {
  clearTimeout(debounce);
  debounce = setTimeout(scanPage, 1200);
}).observe(document.documentElement, { childList: true, subtree: true });