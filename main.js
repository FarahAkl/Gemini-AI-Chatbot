const container = document.querySelector(".container");
const promptForm = document.querySelector(".prompt-form");
const promptInput = promptForm.querySelector(".prompt-input");
const fileUploadWrapper = document.querySelector(".file-upload-wrapper");
const addFileBtn = promptForm.querySelector("#add-file-btn");
const cancelFileBtn = promptForm.querySelector("#cancel-file-btn");
const fileInput = promptForm.querySelector("#file-input");
const chatsContainer = document.querySelector(".chats-container");
const GOOGLE_API_KEY = "AIzaSyDJXAr-WcQsY4JC-fUC_PVmMNI6rONn5gU";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GOOGLE_API_KEY}`;

const chatHistory = [];
const userData = { message: "", file: {} };

// Handle Form Submit
const handleFormSubmit = (e) => {
  e.preventDefault();
  const userMessage = promptInput.value.trim();
  if (!userMessage) return;
  promptInput.value = "";
  userData.message = userMessage;
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");

  // Generate user message and add to chats container
  const userMsgHTML = `<p class="message-text">${userMessage}</p>
  ${
    userData.file.data
      ? userData.file.isImage
        ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class="img-attachment" />`
        : `<p class="file-attachment"><span class="material-symbols-rounded">description</span>${userData.file.fileName}</p>`
      : ""
  } `;
  const userMsgDiv = createMsgElement(userMsgHTML, "user-message");
  userMsgDiv.querySelector(".message-text").textContent = userMessage;
  chatsContainer.appendChild(userMsgDiv);
  scrollToBottom();

  setTimeout(() => {
    // Generate bot message and add to chats container
    const botMsgHTML = `<img src="gemini-chatbot-logo.svg" alt="logo" class="avatar"><p class="message-text">Just a sec...</p> `;
    const botMsgDiv = createMsgElement(botMsgHTML, "bot-message", "loading");
    chatsContainer.appendChild(botMsgDiv);
    generateResponse(botMsgDiv);
  }, 600);
};

// Create Message Element
const createMsgElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Generate Bot Response
const generateResponse = async (botMsgDiv) => {
  const textElement = botMsgDiv.querySelector(".message-text");
  // Add user message to chat history
  chatHistory.push({
    role: "user",
    parts: [
      { text: userData.message },
      ...(userData.file.data
        ? [
            {
              inline_data: (({ fileName, isImage, ...rest }) => rest)(
                userData.file
              ),
            },
          ]
        : []),
    ],
  });
  try {
    // Send the chat history to the API to get a response
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: chatHistory }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Process the response text and display with typing effect
    const responseText = data.candidates[0].content.parts[0].text
      .replace(/\*\*([^*]+)\*\*/g, "")
      .trim();
    typingEffect(responseText, textElement, botMsgDiv);

    chatHistory.push({
      role: "model",
      parts: [{ text: responseText }],
    });
    console.log(chatHistory);
  } catch (error) {
    console.log(error);
  } finally {
    userData.file = {};
  }
};

// Typing Effect Function
const typingEffect = (text, textElement, botMsgDiv) => {
  textElement.textContent = ``;
  const words = text.split(" ");
  let wordIndex = 0;
  const typingInterval = setInterval(() => {
    if (wordIndex < words.length) {
      textElement.textContent +=
        (wordIndex === 0 ? "" : " ") + words[wordIndex++];
      scrollToBottom();
    } else {
      botMsgDiv.classList.remove("loading");
      clearInterval(typingInterval);
    }
  }, 40);
};

// Scroll to Bottom Function
const scrollToBottom = () =>
  container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });

// Handle file input change (file upload)
fileInput.addEventListener("change", () => {
  const file = fileInput.files[0];
  if (!file) return;

  const isImage = file.type.startsWith("image/");
  const reader = new FileReader();
  reader.readAsDataURL(file);

  reader.onload = (e) => {
    fileInput.value = "";
    const base64String = e.target.result.split(",")[1];

    fileUploadWrapper.querySelector(".file-preview").src = e.target.result;
    fileUploadWrapper.classList.add(
      "active",
      isImage ? "img-attached" : "file-attached"
    );

    // Store file data in userData object
    userData.file = {
      fileName: file.name,
      data: base64String,
      mime_type: file.type,
      isImage,
    };
  };
});

// Cancel file upload
cancelFileBtn.addEventListener("click", () => {
  userData.file = {};
  fileUploadWrapper.classList.remove("active", "img-attached", "file-attached");
});

promptForm.addEventListener("submit", handleFormSubmit);
addFileBtn.addEventListener("click", () => fileInput.click());
