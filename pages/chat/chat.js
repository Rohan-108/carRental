import { toast, getCurrentUser } from "../../js/index.js";
import { getFileFromInput } from "../../js/utils.js";
import ChatService from "../../js/services/ChatService.js";
import { UserValidator } from "../../js/services/validator.js";
import userService from "../../js/services/userService.js";
//dom elements
const messageBox = document.getElementById("messageBox");
const sendBtn = document.getElementById("send");
const closeModal = document.getElementById("closeButton");
const modal = document.getElementById("modal");
const openImageModal = document.getElementById("openImageModal");
const imageForm = document.getElementById("imageForm");

window.addEventListener("load", () => {
  addEventListeners();
  loadSidebar();
  setChatBox();
});
/**
 * @description Sets the chat box with the selected conversation
 */
async function setChatBox() {
  modal.style.display = "none";
  const convId = JSON.parse(sessionStorage.getItem("convId"))?.convId || null;
  if (convId) {
    await loadChat(convId);
  } else {
    messageBox.innerHTML = `
        <div class="no-chat">
          <p>No chat Selected</p>
          </div>
        `;
    sendBtn.style.background = "gray";
    sendBtn.style.cursor = "not-allowed";
    sendBtn.style.pointerEvents = "none";
  }
}
/**
 * @description sends the image from the input field
 */
imageForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const validator = UserValidator();
    let avatarData;
    const imageInput = imageForm.elements["image"];
    const imageFile = imageInput?.files[0];
    const user = await userService.getUserById(getCurrentUser().id);
    if (!imageFile) {
      toast("error", "Please select an image").showToast();
      return;
    }
    if (imageFile) {
      if (!validator.validateAvatar(imageInput)) return;
      avatarData = await getFileFromInput(imageInput);
    }
    await ChatService.addChat({
      id: "",
      conversationId: sendBtn.dataset.convId,
      sender: user.id,
      user: user,
      message: "",
      image: avatarData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    modal.style.display = "none";
    loadChat(sendBtn.dataset.convId);
  } catch (error) {
    console.error(error);
    toast("error", "Error sending image").showToast();
  }
});
/**
 * @description Adds event listeners to the chat box
 */
function addEventListeners() {
  const sidebar = document.getElementById("sidebar");
  sidebar?.addEventListener("click", (e) => {
    const conv = e.target.closest(".conversation");
    if (conv) {
      const convId = conv.dataset.convId;
      if (convId) {
        sessionStorage.setItem("convId", JSON.stringify({ convId }));
        sidebar.querySelectorAll(".conversation").forEach((c) => {
          c.classList.remove("active");
        });
        conv.classList.add("active");
        loadChat(convId);
      }
    }
  });
  openImageModal.addEventListener("click", () => {
    modal.style.display = "flex";
  });
  closeModal.addEventListener("click", () => {
    modal.style.display = "none";
  });
}
/**
 * @description Loads the sidebar with the user's conversations
 */
async function loadSidebar() {
  try {
    const allconv = await ChatService.getAllConversations();
    const currentConvId =
      JSON.parse(sessionStorage.getItem("convId"))?.convId || null;
    const user = await userService.getUserById(getCurrentUser().id);
    //filter the conversations to get the user's conversations
    const myconversations = allconv.filter((conv) => {
      let ismember = false;
      for (const member of conv.members) {
        if (member.id === user.id) {
          ismember = true;
          break;
        }
      }
      return ismember;
    });
    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";
    for (const conv of myconversations) {
      const car = conv.car;
      const otherMemeber = conv.members.find((member) => member.id !== user.id);
      if (!otherMemeber) continue;
      const convDiv = document.createElement("div");
      convDiv.classList.add("conversation");
      if (currentConvId && currentConvId === conv.id) {
        convDiv.classList.add("active");
      }
      convDiv.dataset.convId = conv.id;
      let imgUrl = otherMemeber.avatar;
      if (imgUrl instanceof ArrayBuffer) {
        const blob = new Blob([imgUrl]);
        imgUrl = URL.createObjectURL(blob);
      } else {
        imgUrl = "https://picsum.photos/200/300";
      }
      convDiv.innerHTML = `
      <div class="convDetail">
        <img
          src="${imgUrl}"
          alt="owner image"
          class="user-img"
        />
        <div class="info">
          <p>${otherMemeber.name}</p>
          <p>${car.name}</p>
        </div>
      </div>
    `;
      sidebar.appendChild(convDiv);
    }
  } catch (error) {
    console.error(error);
    toast("error", "Error loading sidebar").showToast();
  }
}
/**
 * @description Loads the chat with the selected conversation
 * @param {string} convId
 * @returns {Promise<void>}
 * */
async function loadChat(convId) {
  try {
    modal.style.display = "none";
    sendBtn.dataset.convId = convId;
    const user = await userService.getUserById(getCurrentUser().id);
    let imgUrl = user.avatar;
    if (imgUrl instanceof ArrayBuffer) {
      const blob = new Blob([imgUrl]);
      imgUrl = URL.createObjectURL(blob);
    }
    sendBtn.style.background = "green";
    sendBtn.style.cursor = "pointer";
    sendBtn.style.pointerEvents = "auto";

    let carChat = await ChatService.getChatsByConversationId(convId);

    if (carChat.length === 0) {
      messageBox.innerHTML = `
        <div class="no-chat">
          <p>No chat found</p>
        </div>
      `;
      return;
    }
    //sort the chat by timestamp
    carChat.sort((a, b) => a.createdAt - b.createdAt);
    //display the chat
    messageBox.innerHTML = "";
    for (const chat of carChat) {
      const msgDiv = document.createElement("div");
      msgDiv.classList.add("msg");
      let msgImgUrl;
      if (chat.image) {
        const blob = new Blob([chat.image]);
        msgImgUrl = URL.createObjectURL(blob);
      }
      if (chat.sender === user.id) {
        msgDiv.innerHTML = `
          <div class="right-msg">
            <div class="msg-img">
              <img src="${imgUrl}" alt="user" />
            </div>
            <div class="msg-bubble">
              <div class="msg-info">
                <div class="msg-info-name">${user.name}</div>
                <div class="msg-info-time">${new Date(
                  chat.createdAt
                ).toDateString()}</div>
              </div>
              <div class="msg-text">
                ${chat.message}
              </div>
              ${
                msgImgUrl
                  ? `<div class="chat-img"><img src="${msgImgUrl}" alt="chat image" /></div>`
                  : ""
              }
            </div>
          </div>
        `;
      } else {
        const sender = chat.user;
        let imgUrl = sender.avatar;
        if (imgUrl instanceof ArrayBuffer) {
          const blob = new Blob([imgUrl]);
          imgUrl = URL.createObjectURL(blob);
        }
        msgDiv.innerHTML = `
          <div class="left-msg">
            <div class="msg-img">
              <img src="${imgUrl}" alt="user" />
            </div>
            <div class="msg-bubble">
              <div class="msg-info">
                <div class="msg-info-name">${sender.name}</div>
                <div class="msg-info-time">${new Date(
                  chat.createdAt
                ).toDateString()}</div>
              </div>
              <div class="msg-text">
                ${chat.message}
              </div>
              ${
                msgImgUrl
                  ? `<div class="chat-img"><img src="${msgImgUrl}" alt="chat image" /></div>`
                  : ""
              }
            </div>
          </div>
        `;
      }
      messageBox.appendChild(msgDiv);
      messageBox.scrollTop = messageBox.scrollHeight;
    }
  } catch (error) {
    console.error(error);
    toast("error", "Error loading chat").showToast();
  }
}

//send message
document.getElementById("send").addEventListener("click", async () => {
  try {
    const user = await userService.getUserById(getCurrentUser().id);
    const msg = document.getElementById("msg").value?.trim();
    if (!msg || msg === "") {
      toast("error", "Message cannot be empty").showToast();
      return;
    }
    if (!sendBtn.dataset.convId) {
      toast("error", "Error sending message").showToast();
      return;
    }
    //send the message to user
    await ChatService.addChat({
      id: "",
      conversationId: sendBtn.dataset.convId,
      sender: user.id,
      user: user,
      message: msg,
      image: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    document.getElementById("msg").value = "";
  } catch (error) {
    console.error(error);
    toast("error", "Error sending message").showToast();
  }
});
