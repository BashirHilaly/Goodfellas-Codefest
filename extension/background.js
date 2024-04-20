chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Check if the tab is completely loaded before sending the message
  if (changeInfo.status === "complete" && !tab.incognito) {
    chrome.tabs.sendMessage(tabId, { action: "init" }, (response) => {
      if (chrome.runtime.lastError) {
        console.log(
          "Could not send message: ",
          chrome.runtime.lastError.message
        );
      } else {
        console.log("Message sent: ", response);
      }
    });
  }
});
