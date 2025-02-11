import { toast, getCurrentUser } from "../../js/index.js";
import { getFileFromInput } from "../../js/utils.js";
import DbService from "../../js/db.js";
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

imageForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    let avatarData;
    const imageInput = imageForm.elements["image"];
    const imageFile = imageInput?.files[0];
    if (!imageFile) {
      toast("error", "Please select an image").showToast();
      return;
    }
    if (imageFile) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(imageFile.type)) {
        toast(
          "error",
          "Avatar must be an image of type PNG, JPEG, or JPG"
        ).showToast();
        return;
      }
      const maxSizeInBytes = 500 * 1024;
      if (imageFile.size > maxSizeInBytes) {
        toast("error", "Avatar image must be less than 500KB").showToast();
        return;
      }
      avatarData = await getFileFromInput(imageInput);
    }
    await DbService.addItem("chat", {
      conversationId: sendBtn.dataset.convId,
      sender: getCurrentUser().id,
      message: "",
      image: avatarData,
      createdAt: Date.now(),
    });
    modal.style.display = "none";
    loadChat(sendBtn.dataset.convId);
  } catch (error) {
    console.error(error);
    toast("error", "Error sending image").showToast();
  }
});

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
async function loadSidebar() {
  try {
    const allconv = await DbService.getAllItems("conversations");
    const currentConvId =
      JSON.parse(sessionStorage.getItem("convId"))?.convId || null;
    const user = getCurrentUser();
    const myconversations = allconv.filter((conv) => {
      return conv.members.includes(user.id);
    });
    const sidebar = document.getElementById("sidebar");
    sidebar.innerHTML = "";
    for (const conv of myconversations) {
      const car = await DbService.getItem("cars", conv.carId);
      const otherMemeberId = conv.members.filter((id) => id !== user.id);
      const otherMemeber = await DbService.getItem("users", otherMemeberId[0]);
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
    toast("error", "Error loading sidebar").showToast();
  }
}
async function loadChat(convId) {
  try {
    modal.style.display = "none";
    sendBtn.dataset.convId = convId;
    const user = getCurrentUser();
    const avatar = (await DbService.getItem("users", user.id)).avatar;
    let imgUrl = avatar;
    if (imgUrl instanceof ArrayBuffer) {
      const blob = new Blob([imgUrl]);
      imgUrl = URL.createObjectURL(blob);
    }
    sendBtn.style.background = "green";
    sendBtn.style.cursor = "pointer";
    sendBtn.style.pointerEvents = "auto";

    let carChat = await DbService.searchAllByIndex(
      "chat",
      "conversationId",
      convId
    );

    if (carChat.length === 0) {
      messageBox.innerHTML = `
        <div class="no-chat">
          <p>No chat found</p>
        </div>
      `;
      return;
    }

    carChat.sort((a, b) => a.createdAt - b.createdAt);
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
        const sender = await DbService.getItem("users", chat.sender);
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

document.getElementById("send").addEventListener("click", async () => {
  try {
    const user = getCurrentUser();
    const msg = document.getElementById("msg").value?.trim();
    if (!msg || msg === "") {
      toast("error", "Message cannot be empty").showToast();
      return;
    }
    if (!sendBtn.dataset.convId) {
      toast("error", "Error sending message").showToast();
      return;
    }
    await DbService.addItem("chat", {
      conversationId: sendBtn.dataset.convId,
      sender: user.id,
      message: msg,
      createdAt: Date.now(),
    });
    document.getElementById("msg").value = "";
  } catch (error) {
    console.error(error);
    toast("error", "Error sending message").showToast();
  }
});
