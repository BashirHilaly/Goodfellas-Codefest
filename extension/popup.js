// function that creates toggles the blur effect
document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.querySelector('input[type="checkbox"]');

  // Get the current state or initialize it
  chrome.storage.local.get(["currentState"], function (result) {
    const currentState = result.currentState || "unblur"; // Ensure default state
    checkbox.checked = currentState === "blur";
    if (result.currentState === undefined) {
      chrome.storage.local.set({ currentState: "unblur" }); // Initialize if undefined
    }
  });

  checkbox.addEventListener("change", () => {
    const newState = checkbox.checked ? "blur" : "unblur";
    chrome.storage.local.set({ currentState: newState }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: newState });
      });
    });
  });
});
