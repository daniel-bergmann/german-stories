window.voice = function (mainContent) {
// Initialize variables to manage speech synthesis state
  let speechQueue = []; // Queue to hold chunks of text to be spoken
  let isSpeaking = false; // Flag to indicate if speech synthesis is active
  let currentButton = null; // Reference to the currently active voice button
  let cancelInitiated = false; // Flag to indicate if speech synthesis cancellation is in progress

  // Check if the main content section exists
  if (mainContent) {
    const stories = mainContent.querySelectorAll("h2");

    // Iterate through each story heading to add a voice button
    stories.forEach((heading) => {
      const voiceButton = document.createElement("button");
      voiceButton.classList.add("voice-button");
      voiceButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">\n' +
          '          <path d="M14.5 3a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.848.37L9.504 16H4.5A2.5 2.5 0 0 1 4.5 8h5.004l4.648-4.87A.5.5 0 0 1 14.5 3ZM5 9h-1a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 4 15h1v-6Zm10 8.5v-11L11.152 9H9v6h2.152L15 17.5ZM18.879 8.121a.5.5 0 0 1 .707 0 6 6 0 0 1 0 8.485.5.5 0 1 1-.707-.707 5 5 0 0 0 0-7.071.5.5 0 0 1 0-.707Zm-1.414 1.414a.5.5 0 0 1 .707 0 4 4 0 0 1 0 5.657.5.5 0 1 1-.707-.707 3 3 0 0 0 0-4.243.5.5 0 0 1 0-.707Z"/>\n' +
          '        </svg>'

      // Add click event listener to the voice button
      voiceButton.addEventListener("click", () => {
        if (!('speechSynthesis' in window)) {
          alert("Speech synthesis is not supported in your browser.");
          return;
        }

        // Handle stopping the current story if already playing
        if (currentButton === voiceButton && isSpeaking) {
          cancelInitiated = true;
          window.speechSynthesis.cancel();
          isSpeaking = false;
          voiceButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">\n' +
              '              <path d="M14.5 3a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.848.37L9.504 16H4.5A2.5 2.5 0 0 1 4.5 8h5.004l4.648-4.87A.5.5 0 0 1 14.5 3ZM5 9h-1a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 4 15h1v-6Zm10 8.5v-11L11.152 9H9v6h2.152L15 17.5ZM18.879 8.121a.5.5 0 0 1 .707 0 6 6 0 0 1 0 8.485.5.5 0 1 1-.707-.707 5 5 0 0 0 0-7.071.5.5 0 0 1 0-.707Zm-1.414 1.414a.5.5 0 0 1 .707 0 4 4 0 0 1 0 5.657.5.5 0 1 1-.707-.707 3 3 0 0 0 0-4.243.5.5 0 0 1 0-.707Z"/>\n' +
              '            </svg>'
          speechQueue.length = 0;
          return;
        }

        // Handle starting a new story
        if (isSpeaking) {
          cancelInitiated = true;
          window.speechSynthesis.cancel();
          speechQueue = []; // Reset the queue for the new story
          isSpeaking = false; // Update speaking flag
          if (currentButton) {
            currentButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
                <path d="M14.5 3a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.848.37L9.504 16H4.5A2.5 2.5 0 0 1 4.5 8h5.004l4.648-4.87A.5.5 0 0 1 14.5 3ZM5 9h-1a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 4 15h1v-6Zm10 8.5v-11L11.152 9H9v6h2.152L15 17.5ZM18.879 8.121a.5.5 0 0 1 .707 0 6 6 0 0 1 0 8.485.5.5 0 1 1-.707-.707 5 5 0 0 0 0-7.071.5.5 0 0 1 0-.707Zm-1.414 1.414a.5.5 0 0 1 .707 0 4 4 0 0 1 0 5.657.5.5 0 1 1-.707-.707 3 3 0 0 0 0-4.243.5.5 0 0 1 0-.707Z"/>
              </svg>`;
          }
        }

        // Set the current button and update its text
        currentButton = voiceButton;
        currentButton.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="red">\n' +
            '            <rect x="6" y="6" width="12" height="12" fill="white"/>\n' +
            '          </svg>';

        // Extract the story text and split it into manageable chunks
        const storyText = extractStoryText(heading);
        speechQueue = splitTextIntoChunks(storyText, 200);
        speakNextChunk();
      });

      heading.style.display = "inline-block";
      heading.style.marginLeft = "10px";
      heading.insertAdjacentElement("beforebegin", voiceButton);
    });
  }

  function extractStoryText(heading) {
    let storyText = heading.textContent.trim();
    let sibling = heading.nextElementSibling;

    // Traverse siblings until another heading (H2) is encountered
    while (sibling && sibling.tagName !== "H2") {
      if (sibling.tagName === "P") {
        storyText += ` ${sibling.textContent.trim()}`;
      }
      sibling = sibling.nextElementSibling;
    }

    return storyText;
  }

  //Speak the next chunk of text from the speech queue.
  function speakNextChunk() {
    if (!speechQueue.length) {
      isSpeaking = false; // Update speaking flag
      if (currentButton) {
        currentButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M14.5 3a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.848.37L9.504 16H4.5A2.5 2.5 0 0 1 4.5 8h5.004l4.648-4.87A.5.5 0 0 1 14.5 3Z"></path>
          </svg>`;
      }
      return;
    }

    // Get the next chunk from the queue and create an utterance
    const chunk = speechQueue.shift();
    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = "de-DE";

    // Event listener for when the current chunk finishes
    utterance.onend = () => speakNextChunk();
    utterance.onerror = () => {
      isSpeaking = false;
      if (currentButton) {
        currentButton.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">
            <path d="M14.5 3a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.848.37L9.504 16H4.5A2.5 2.5 0 0 1 4.5 8h5.004l4.648-4.87A.5.5 0 0 1 14.5 3Z"></path>
          </svg>
        `;
      }
    }

    // Event listener for handling errors during speech synthesis
    utterance.onerror = (error) => {
      console.error("Speech synthesis error:", error.error);

      if (!cancelInitiated) {
        alert("An error occurred while trying to play the story.");
      }

      cancelInitiated = false;
      isSpeaking = false; // Update speaking flag
      if (currentButton) {
        currentButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="white">\\n' +
                '          <path d="M14.5 3a.5.5 0 0 1 .5.5v17a.5.5 0 0 1-.848.37L9.504 16H4.5A2.5 2.5 0 0 1 4.5 8h5.004l4.648-4.87A.5.5 0 0 1 14.5 3ZM5 9h-1a1.5 1.5 0 0 0-1.5 1.5v3A1.5 1.5 0 0 0 4 15h1v-6Zm10 8.5v-11L11.152 9H9v6h2.152L15 17.5ZM18.879 8.121a.5.5 0 0 1 .707 0 6 6 0 0 1 0 8.485.5.5 0 1 1-.707-.707 5 5 0 0 0 0-7.071.5.5 0 0 1 0-.707Zm-1.414 1.414a.5.5 0 0 1 .707 0 4 4 0 0 1 0 5.657.5.5 0 1 1-.707-.707 3 3 0 0 0 0-4.243.5.5 0 0 1 0-.707Z"/>\\n' +
                '        </svg>`;
      }
    };

    // Start speaking the current chunk
    isSpeaking = true;
    window.speechSynthesis.speak(utterance);
  }


  //Split a large block of text into smaller chunks for speech synthesis.
  //Ensures that each chunk does not exceed the specified maximum length.
  function splitTextIntoChunks(text, maxLength) {
    const sentences = text.split(/([.!?])/);
    const chunks = [];
    let currentChunk = "";

    // Combine sentences into chunks while respecting the maximum length
    sentences.forEach((sentence) => {
      if (currentChunk.length + sentence.length <= maxLength) {
        currentChunk += sentence;
      } else {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      }
    });

    // Add the last chunk if any text remains
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }
}