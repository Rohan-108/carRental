import { getCurrentUser, getCurrentCarId, toast } from "./index.js";
import DbService from "./db.js";
import { getFileFromInput } from "./utils.js";
const closeModal = document.getElementById("closeButton");
const modal = document.getElementById("modal");
const openImageModal = document.getElementById("openImageModal");
const imageForm = document.getElementById("imageForm");
const sendUser = document.getElementById("sendUser");
openImageModal.addEventListener("click", () => {
  modal.style.display = "flex";
});
closeModal.addEventListener("click", () => {
  modal.style.display = "none";
});
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
      conversationId:
        document.getElementById("sendUser").dataset.conversationId,
      sender: getCurrentUser().id,
      message: "",
      image: avatarData,
      createdAt: Date.now(),
    });
    modal.style.display = "none";
    loadUserChat();
  } catch (error) {
    console.error(error);
    toast("error", "Error sending image").showToast();
  }
});
async function loadUserChat() {
  try {
    const messageBox = document.getElementById("messageBoxUser");
    const user = getCurrentUser();
    const carId = getCurrentCarId();
    if (!carId) {
      toast("error", "No car selected").showToast();
      return;
    }
    const car = await DbService.getItem("cars", carId);
    if (user.id === car.userId || user.role === "super-admin") {
      sendUser.setAttribute("disabled", true);
      sendUser.style.backgroundColor = "gray";
      sendUser.style.cursor = "not-allowed";
      openImageModal.setAttribute("disabled", true);
      openImageModal.style.cursor = "not-allowed";
      messageBox.innerHTML =
        "<div class='no-chat'><p>You can't Chat with yourself</p></div>";
      return;
    }
    let userAvatar;
    if (user.avatar instanceof ArrayBuffer) {
      const imageBlob = new Blob([user.avatar]);
      userAvatar = URL.createObjectURL(imageBlob);
    }
    const allcarConv = await DbService.searchAllByIndex(
      "conversations",
      "carId",
      carId
    );
    const myconversations = allcarConv.filter((conv) => {
      return conv.members.includes(user.id);
    });
    if (myconversations.length === 0) {
      messageBox.innerHTML =
        "<div class='no-chat'><p>Chat isn't stared yet</p></div>";
      return;
    }
    sendUser.dataset.conversationId = myconversations[0].id;
    const bidNow = document.getElementById("rentButton");
    bidNow.dataset.conversationId = myconversations[0].id;
    const myChat = await DbService.searchAllByIndex(
      "chat",
      "conversationId",
      myconversations[0].id
    );
    myChat.sort((a, b) => a.createdAt - b.createdAt);
    messageBox.innerHTML = "";
    for (const chat of myChat) {
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
                    <div
                      class="msg-img"
                    ><img src="${
                      userAvatar || "https://picsum.photos/200/300"
                    }" alt="user" />
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
            <div
            class="msg-img"
          ><img src="${imgUrl}" alt="user" />
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

sendUser.addEventListener("click", async (e) => {
  try {
    let convId = e.target.dataset.conversationId;
    const carId = getCurrentCarId();
    const car = await DbService.getItem("cars", carId);
    const owner = await DbService.getItem("users", car.userId);
    if (owner.id === getCurrentUser().id) {
      toast("error", "You cannot chat with yourself").showToast();
      return;
    }
    if (!convId) {
      const id = await DbService.addItem("conversations", {
        carId: getCurrentCarId(),
        members: [getCurrentUser().id, owner.id],
      });
      convId = id;
    }
    const message = document.getElementById("msgUser")?.value.trim();
    if (!message) {
      toast("error", "Message cannot be empty").showToast();
      return;
    }
    await DbService.addItem("chat", {
      conversationId: convId,
      sender: getCurrentUser().id,
      message,
      createdAt: Date.now(),
    });
    loadUserChat();
    document.getElementById("msgUser").value = "";
  } catch (error) {
    console.error(error);
    toast("error", "Error sending message").showToast();
  }
});
loadUserChat();
export { loadUserChat };
