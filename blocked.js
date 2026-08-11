const params = new URLSearchParams(location.search);
const target = params.get("target") || "";
const reason = params.get("reason") || "";
const brand = params.get("brand") || "";

if (brand) {
  document.getElementById("lead-text").textContent = `This page is pretending to be ${brand.toUpperCase()}.`;
}

if (reason) {
  document.getElementById("detail-text").textContent = reason;
}

document.getElementById("proceed-anyway").addEventListener("click", () => {
  if (target) location.href = target;
});

document.getElementById("call-contact").addEventListener("click", async () => {
  const { trustedContact } = await chrome.storage.local.get(["trustedContact"]);
  if (trustedContact) {
    location.href = `tel:${trustedContact}`;
  } else {
    alert("No trusted contact phone number has been configured. Open the Guardian SafeStep extension icon in your toolbar to add one.");
  }
});
