// function that creates toggles the blur effect
document.addEventListener("DOMContentLoaded", () => {
  const checkbox = document.querySelector('input[type="checkbox"]');
  const passwordField = document.getElementById("passwordField");
  const switchUserButton = document.getElementById("switchUser");
  const changePasswordButton = document.getElementById("changePassword");
  const modeTitle = document.getElementById("modeTitle");
  const addWordButton = document.getElementById("addWord");
  const removeWordButton = document.getElementById("removeWord");

  chrome.storage.local.get(
    ["currentState", "userMode", "password"],
    function (result) {
      // Ensure default states
      const currentState = result.currentState || "unblur";
      const userMode = result.userMode || "child";
      const password = result.password || "";

      // Initialize if undefined
      if (result.currentState === undefined) {
        chrome.storage.local.set({ currentState: "unblur" });
      }
      if (result.userMode === undefined) {
        chrome.storage.local.set({ userMode: "child" });
      }
      if (result.password === undefined) {
        chrome.storage.local.set({ password: "" });
      }

      // Apply initial settings
      checkbox.checked = currentState === "blur";
      updateUIForUserMode(userMode); // Update all UI elements based on the user mode
    }
  );

  chrome.storage.local.get({ censoredWords: [] }, function (data) {
    updateWordList(data.censoredWords);
  });

  checkbox.addEventListener("change", () => {
    const newState = checkbox.checked ? "blur" : "unblur";
    chrome.storage.local.set({ currentState: newState }, () => {
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: newState });
      });
    });
  });

  // Switch user button to toggle between child and parent modes
  switchUserButton.addEventListener("click", () => {
    chrome.storage.local.get(["userMode", "password"], function (result) {
      const currentPassword = passwordField.value.trim();
      if (result.userMode === "child") {
        if (currentPassword === result.password || result.password === "") {
          chrome.storage.local.set({ userMode: "parent" }, () => {
            updateUIForUserMode("parent");
            alert("Switched to Parent mode");
          });
        } else {
          alert("Incorrect password");
        }
      } else {
        chrome.storage.local.set({ userMode: "child" }, () => {
          updateUIForUserMode("child");
          alert("Switched to Child mode");
        });
      }
    });
  });

  // Event listener for the change password button
  changePasswordButton.addEventListener("click", function () {
    const newPassword = passwordField.value.trim();

    // Set the new password in chrome.storage.local
    chrome.storage.local.set({ password: newPassword }, () => {
      // Clear the password field after setting the new password
      passwordField.value = "";

      // Alert the user that the password has been changed
      alert("Password has been successfully changed.");
    });
  });

  //Handles word addition
  addWordButton.addEventListener("click", function () {
    const word = document.getElementById("wordInput").value.trim();
    chrome.storage.local.get({ censoredWords: [] }, function (data) {
      const updatedWords = [...new Set([...data.censoredWords, word])];
      chrome.storage.local.set({ censoredWords: updatedWords });
      document.getElementById("wordInput").value = ""; // Clear input
      updateWordList(updatedWords); // Update UI
    });
  });

  // Handling word removal
  removeWordButton.addEventListener("click", function () {
    const word = document.getElementById("wordInput").value.trim();
    chrome.storage.local.get({ censoredWords: [] }, function (data) {
      const updatedWords = data.censoredWords.filter((w) => w !== word);
      chrome.storage.local.set({ censoredWords: updatedWords });
      updateWordList(updatedWords); // Update UI
    });
  });

  // Helper function to update UI based on user mode
  function updateUIForUserMode(userMode) {
    const isChildMode = userMode === "child";
    checkbox.disabled = isChildMode;
    changePasswordButton.disabled = isChildMode;
    addWordButton.disabled = isChildMode;
    removeWordButton.disabled = isChildMode;
    modeTitle.innerText = isChildMode ? "Child Mode" : "Parent Mode";
  }
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
