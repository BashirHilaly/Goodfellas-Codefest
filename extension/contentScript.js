(() => {
  console.log("Content script loaded and running");
  // Variables
  let contentList = [];

  // Recursive function to collect elements with non-empty innerHTML
  const collectContent = (node) => {
    // Check if the node's innerHTML is not an empty string
    if (node.innerText && node.innerText.trim() !== "") {
      contentList.push(node);
    }

    // Recurse through each child node
    // Using node.childNodes to ensure that text nodes are not included as they do not have innerHTML
    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE) {
        // Ensure the child is an element
        collectContent(child);
      }
    });
  };

  // Function to log or use the collected elements
  const logContent = () => {
    console.log("Collected non-empty content elements:", contentList);
  };

  // Receives messages from the background and edits the content page
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { message } = obj;
    console.log(message); // This should log "Hello World!" when a new tab is loaded completely

    // Call the function on the document's body to start the collection process
    collectContent(document.body);

    // Call Log content to see collected elements
    logContent();
  });
})();

// Other Utility Functions
