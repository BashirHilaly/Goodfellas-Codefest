(() => {
  console.log("Content script loaded and running");
  // Variables
  let contentList = [];
  let textList = [];
  let blurList = [];

  // Recursive function to collect elements with non-empty innerHTML
  const collectContent = (node) => {
    // Check if the node is a header (h1 to h6) or a paragraph and has non-empty innerText
    if (
      (node.tagName.match(/^H[1-6]$/) ||
        node.tagName === "P" ||
        node.tagName === "SPAN") &&
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
  const processToxicity = async () => {
    const url = "http://127.0.0.1:8000/check-toxicity-fake/";
    try {
      const response = await fetch(url, {
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
      console.log("Received response:", result.text_toxicity);
      return result.text_toxicity;
    } catch (error) {
      console.error("Error during fetch:", error);
    }

    // Create an array of random 0s and 1s of the same length as textList
    // const simulatedResponse = textList.map(() => Math.round(Math.random()));

    // return simulatedResponse;
  };

  // Function to log or use the collected elements
  const logContent = () => {
    console.log("Collected non-empty content:", contentList);
    console.log("Collected non-empty text:", textList);
  };

  const applyBlur = () => {
    // Ensure both lists are of the same length
    if (contentList.length !== blurList.length) {
      console.error("Error: contentList and blurList do not match in length.");
      return;
    }

    // Loop through contentList and blurList
    for (let i = 0; i < contentList.length; i++) {
      if (blurList[i] === 1 && !contentList[i].classList.contains("blur")) {
        // Check if the corresponding blurList element is 1
        contentList[i].classList.add("blur"); // Add the 'blur' class to the element
      }
    }

    // Loop through content list and checks if innerText has a censoredWord
    chrome.storage.local.get({ censoredWords: [] }, function (data) {
      console.log("CENSORED WORDS: ", data.censoredWords);
      contentList.forEach((element) => {
        let modifiedHTML = element.innerHTML;

        data.censoredWords.forEach((censoredWord) => {
          // Create a regular expression to find all occurrences of the censored word
          const regex = new RegExp(censoredWord, "gi");
          // Replace censored words with a span containing the word, applying the blur class to the span
          modifiedHTML = modifiedHTML.replace(
            regex,
            '<span class="blur">$&</span>'
          );
        });

        // Update the innerHTML only if changes have been made to avoid unnecessary DOM updates
        if (modifiedHTML !== element.innerHTML) {
          element.innerHTML = modifiedHTML;
        }
      });
    });
  };

  const removeBlur = () => {
    // Loop through contentList
    for (let i = 0; i < contentList.length; i++) {
      if (contentList[i].classList.contains("blur")) {
        // Check if the element has the 'blur' class
        contentList[i].classList.remove("blur"); // Remove the 'blur' class from the element
      }
    }
  };

  const initializeBlur = () => {
    collectContent(document.body);
    convertToInnerText();
    logContent();

    processToxicity().then((apiResponse) => {
      console.log("API processing complete:", apiResponse);
      blurList = apiResponse;
      // When the script finishes initalization
      chrome.storage.local.get(["currentState"], function (result) {
        if (result.currentState) {
          updateBlur(result.currentState);
        }
      });
    });
  };

  const updateBlur = async (state) => {
    if (state === "blur" || state === "unblur") {
      chrome.storage.local.set({ currentState: state }, () => {
        // Apply or remove blur based on the state
        if (state === "blur") {
          applyBlur();
        } else if (state === "unblur") {
          removeBlur();
        }
      });
    } else {
      console.error("Incorrect State Provided!");
    }
  };

  // Receives messages from the background and edits the content page
  chrome.runtime.onMessage.addListener((obj, sender, response) => {
    const { action } = obj;

    if (action === "blur" || action === "unblur") {
      updateBlur(action);
    } else if (action === "init") {
      initializeBlur();
    } else {
      console.log("Incorrect Action Given!", action);
    }
  });

  // Receives messages from the popup that the state has changed, applies to open tabs
  chrome.storage.onChanged.addListener(function (changes, namespace) {
    for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
      if (
        key === "currentState" &&
        (newValue === "blur" || newValue === "unblur")
      ) {
        updateBlur(newValue);
      }
    }
  });
})();

// Other Utility Functions
