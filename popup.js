document.addEventListener("DOMContentLoaded", async () => {
  const { apiKey, trustedContact } = await chrome.storage.local.get(["apiKey", "trustedContact"]);
  if (apiKey) document.getElementById("apiKey").value = apiKey;
  if (trustedContact) document.getElementById("trustedContact").value = trustedContact;
});

document.getElementById("save").addEventListener("click", async () => {
  const apiKey = document.getElementById("apiKey").value.trim();
  const trustedContact = document.getElementById("trustedContact").value.trim();

  await chrome.storage.local.set({ apiKey, trustedContact });

  const status = document.getElementById("status");
  status.textContent = "Settings saved successfully!";
  setTimeout(() => (status.textContent = ""), 2000);
});