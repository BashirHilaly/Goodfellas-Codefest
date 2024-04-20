(() => {
  console.log("Content script loaded and running");
  // Variables
  let contentList = [];
  let textList = [];

  // Recursive function to collect elements with non-empty innerHTML
  const collectContent = (node) => {
    // Check if the node is a header (h1 to h6) or a paragraph and has non-empty innerText
    if (
      (node.tagName.match(/^H[1-6]$/) || node.tagName === "P") &&
      node.innerText.trim() !== ""
    ) {
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

  // Loops through the contentList and creates a new textList that just contains innerText for each element
  const convertToInnerText = () => {
    textList = contentList.map((element) => {
      return element.innerText;
    });
  };

  // Sends textList to API and receives list of 1s and 0s
  const sendToAPI = async () => {
    /*
    try {
      const response = await fetch("https://", { //Finish the API Call here
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ texts: textList }),
      });
      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }
      const result = await response.json(); // assuming the server returns JSON
      console.log("Received response:", result);
      return result;
    } catch (error) {
      console.error("Error during fetch:", error);
    }*/

    // Create an array of random 0s and 1s of the same length as textList
    const simulatedResponse = textList.map(() => Math.round(Math.random()));

    return simulatedResponse;
  };

  // Function to log or use the collected elements
  const logContent = () => {
    console.log("Collected non-empty content:", contentList);
    console.log("Collected non-empty text:", textList);
  };

  const applyBlur = (blurList) => {
    // Ensure both lists are of the same length
    if (contentList.length !== blurList.length) {
      console.error("Error: contentList and blurList do not match in length.");
      return;
    }

    // Loop through contentList and blurList
    for (let i = 0; i < contentList.length; i++) {
      if (blurList[i] === 1) {
        // Check if the corresponding blurList element is 1
        contentList[i].classList.add("blur"); // Add the 'blur' class to the element
      }
    }
  };

  // Receives messages from the background and edits the content page
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { message } = obj;
    console.log(message); // This should log "Hello World!" when a new tab is loaded completely

    // Call the function on the document's body to start the collection process
    collectContent(document.body);

    convertToInnerText();

    // Call Log content to see collected elements
    logContent();

    // After collecting and converting text, send it to the API
    sendToAPI().then((apiResponse) => {
      console.log("API processing complete:", apiResponse);
      applyBlur(apiResponse);
    });
  });
})();

// Other Utility Functions
