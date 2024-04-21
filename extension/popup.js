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

  chrome.storage.local.get({ censoredWords: [] }, function (data) {
    updateWordList(data.censoredWords);
  });
});

//Handles word addition
document.getElementById("addWord").addEventListener("click", function () {
  const word = document.getElementById("wordInput").value.trim();
  chrome.storage.local.get({ censoredWords: [] }, function (data) {
    const updatedWords = [...new Set([...data.censoredWords, word])];
    chrome.storage.local.set({ censoredWords: updatedWords });
    document.getElementById("wordInput").value = ""; // Clear input
    updateWordList(updatedWords); // Update UI
  });
});

// Handling word removal
document.getElementById("removeWord").addEventListener("click", function () {
  const word = document.getElementById("wordInput").value.trim();
  chrome.storage.local.get({ censoredWords: [] }, function (data) {
    const updatedWords = data.censoredWords.filter((w) => w !== word);
    chrome.storage.local.set({ censoredWords: updatedWords });
    updateWordList(updatedWords); // Update UI
  });
});

// Function to update the word list display
function updateWordList(words) {
  const list = document.getElementById("wordList");
  list.innerHTML = "";
  words.forEach((word) => {
    let item = document.createElement("li");
    item.textContent = word;
    list.appendChild(item);
  });
}
