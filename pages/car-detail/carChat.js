import { getCurrentUser, getCurrentCarId, toast } from "../../js/index.js";
import ChatService from "../../js/services/ChatService.js";
import { getFileFromInput } from "../../js/utils.js";
import UserService from "../../js/services/userService.js";
import { UserValidator } from "../../js/services/validator.js";
import carService from "../../js/services/carService.js";
import userService from "../../js/services/userService.js";
// dom elements
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

/**
 * @description Send image to the user
 */
imageForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    let avatarData;
    const validator = UserValidator();
    const user = await UserService.getUserById(getCurrentUser().id);
    const imageInput = imageForm.elements["image"];
    const imageFile = imageInput?.files[0];
    if (imageFile) {
      if (!validator.validateAvatar(imageInput)) {
        return;
      }
      avatarData = await getFileFromInput(imageInput);
    }
    await ChatService.addChat({
      id: "",
      conversationId:
        document.getElementById("sendUser").dataset.conversationId,
      sender: user.id,
      message: "",
      user: user,
      image: avatarData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    modal.style.display = "none";
    loadUserChat();
  } catch (error) {
    console.error(error);
    toast("error", "Error sending image").showToast();
  }
});

/**
 * @description Load chat messages for the user
 * @returns {Promise<void>}
 */
async function loadUserChat() {
  try {
    const messageBox = document.getElementById("messageBoxUser");
    const u = getCurrentUser();
    const user = await UserService.getUserById(u.id);
    const carId = getCurrentCarId();
    if (!carId) {
      toast("error", "No car selected").showToast();
      return;
    }
    const car = await carService.getCarById(carId);
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
    } else {
      userAvatar = "https://picsum.photos/200/300";
    }
    //get all conversations for the car
    const allcarConv = await ChatService.getConversationsByCarId(carId);
    //get the conversation that the user is part of
    const myconversations = allcarConv.filter((conv) => {
      let ismyconv = false;
      conv.members.forEach((member) => {
        if (member.id === user.id) {
          ismyconv = true;
        }
      });
      return ismyconv;
    });
    if (myconversations.length === 0) {
      messageBox.innerHTML =
        "<div class='no-chat'><p>Chat isn't stared yet</p></div>";
      return;
    }
    sendUser.dataset.conversationId = myconversations[0].id;
    const bidNow = document.getElementById("rentButton");
    bidNow.dataset.conversationId = myconversations[0].id;
    //get all chats for the conversation
    const myChat = await ChatService.getChatsByConversationId(
      myconversations[0].id
    );
    myChat.sort((a, b) => a.createdAt - b.createdAt);
    //clear the message box and reload the messages
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
        const sender = chat.user;
        let imgUrl = sender.avatar;
        if (imgUrl instanceof ArrayBuffer) {
          const blob = new Blob([imgUrl]);
          imgUrl = URL.createObjectURL(blob);
        } else {
          imgUrl = "https://picsum.photos/200/300";
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
      messageBox.scrollTop = messageBox.scrollHeight; //scroll to the bottom
    }
  } catch (error) {
    console.error(error);
    toast("error", "Error loading chat").showToast();
  }
}
/**
 * @description Send message to the user
 */
sendUser.addEventListener("click", async (e) => {
  try {
    let convId = e.target.dataset.conversationId;
    const user = await userService.getUserById(getCurrentUser().id);
    const carId = getCurrentCarId();
    const car = await carService.getCarById(carId);
    const owner = car.owner;
    if (owner.id === user.id) {
      toast("error", "You cannot chat with yourself").showToast();
      return;
    }
    if (!convId) {
      const id = await ChatService.addConversation({
        id: "",
        carId: carId,
        car: car,
        members: [user, owner],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      convId = id;
    }
    const message = document.getElementById("msgUser")?.value.trim();
    if (!message) {
      toast("error", "Message cannot be empty").showToast();
      return;
    }
    await ChatService.addChat({
      id: "",
      conversationId: convId,
      sender: user.id,
      user: user,
      message,
      image: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    loadUserChat();
    document.getElementById("msgUser").value = "";
  } catch (error) {
    console.error(error);
    toast("error", "Error sending message").showToast();
  }
});
// load chat messages
loadUserChat();
export { loadUserChat };
