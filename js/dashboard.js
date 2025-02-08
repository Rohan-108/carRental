import { getCurrentUser, toast, setCurrentUser } from "./index.js";
import { getFileFromInput } from "./utils.js";
import DbService from "./db.js";
const approvalButton = document.getElementById("seekApproval");
const editProfileButton = document.getElementById("editProfile");
const editCloseButton = document.getElementById("editCloseButton");
const profileModal = document.getElementById("profileModal");
const editProfileForm = document.getElementById("editProfileForm");
window.addEventListener("load", () => {
  const currentUser = getCurrentUser();
  if (currentUser) {
    setUserDetail();
    setBookingDetails();
    setBiddingDetails();
  }
});
editCloseButton?.addEventListener("click", () => {
  profileModal.style.display = "none";
});
editProfileButton?.addEventListener("click", async () => {
  try {
    const user = getCurrentUser();
    editProfileForm.elements["name"].value = user.name;
    editProfileForm.elements["phone"].value = user.tel;
    profileModal.style.display = "block";
  } catch (error) {
    console.log(error);
    toast("error", "Failed to add profile data").showToast();
  }
});
approvalButton?.addEventListener("click", async () => {
  const currentUser = getCurrentUser();
  try {
    await DbService.addItem("approvals", {
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      createdAt: new Date().toISOString(),
      status: "pending",
    });
    setUserDetail();
  } catch (error) {
    console.log(error);
    toast("error", "Failed to seek approval").showToast();
  }
});
editProfileForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const currentUser = getCurrentUser();
    const user = await DbService.getItem("users", currentUser.id);
    const name = editProfileForm.elements["name"].value?.trim();
    const phone = editProfileForm.elements["phone"].value?.trim();
    let avatarData = user.avatar;
    const avatarInput = editProfileForm.elements["avatar"];
    const avatarFile = avatarInput?.files[0];
    if (avatarFile) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(avatarFile.type)) {
        toast(
          "error",
          "Avatar must be an image of type PNG, JPEG, or JPG"
        ).showToast();
        return;
      }
      const maxSizeInBytes = 500 * 1024;
      if (avatarFile.size > maxSizeInBytes) {
        toast("error", "Avatar image must be less than 500KB").showToast();
        return;
      }
      avatarData = await getFileFromInput(avatarInput);
    }
    await DbService.updateItem("users", {
      id: currentUser.id,
      name,
      tel: phone,
      avatar: avatarData,
    });
    const u = await DbService.getItem("users", currentUser.id);
    setCurrentUser(u);
    setUserDetail();
    profileModal.style.display = "none";
  } catch (error) {
    console.log(error);
    toast("error", "Failed to update profile").showToast();
  }
});
async function setUserDetail() {
  try {
    const currentUser = getCurrentUser();
    const user = await DbService.getItem("users", currentUser.id);
    const userAvatar = document.getElementById("userAvatar");
    document.getElementById("name").textContent = currentUser.name || "No Name";
    document.getElementById("email").textContent =
      currentUser.email || "No Email";
    document.getElementById("phone").textContent =
      currentUser.tel || "No Phone";
    document.getElementById("adhaar").textContent =
      currentUser?.adhaar || "No Adhaar";
    console.log(currentUser.avatar);
    if (user.avatar instanceof ArrayBuffer) {
      const imageBlob = new Blob([user.avatar]);
      userAvatar.src = URL.createObjectURL(imageBlob);
    }
    const approval = document.getElementById("approvalNotice");
    if (currentUser.role === "general") {
      approval.style.display = "flex";
      const approvalReq = await DbService.searchItemByIndex(
        "approvals",
        "userId",
        currentUser.id
      );
      if (!approvalReq) {
        approval.style.display = "flex";
        return;
      }
      if (approvalReq && approvalReq.status === "pending") {
        approvalButton.disabled = true;
        approvalButton.textContent = "Approval Pending";
        approvalButton.style.background = "grey";
      } else if (approvalReq && approvalReq.status === "rejected") {
        approvalButton.disabled = true;
        approvalButton.textContent = "Rejected";
        approvalButton.style.background = "grey";
      } else {
        approval.style.display = "none";
      }
    }
  } catch (error) {
    console.log(error);
    toast("error", "Failed to set user details").showToast();
  }
}

async function setBookingDetails() {
  try {
    const currentUser = getCurrentUser();
    const bookings = await DbService.searchAllByIndex(
      "bookings",
      "userId",
      currentUser.id
    );
    const noBooking = document.getElementById("noBooking");
    noBooking.style.display = "none";
    const bookingTableBody = document.querySelector("#bookingTable tbody");
    bookingTableBody.innerHTML = "";
    if (bookings.length > 0) {
      bookings.forEach(async (booking) => {
        const car = await DbService.getItem("cars", booking.carId);
        const owner = await DbService.getItem("users", car.userId);
        const tr = document.createElement("tr");
        tr.innerHTML = `
                        <td data-label="Booking ID">${booking.id}</td>
                        <td data-label="Car Name" data-id="${car.id}">${car.name}</td>
                        <td data-label="Owner Name"
                        data-label="${owner.id}">${owner.name}</td>
                        <td data-label="Start Date">${booking.startDate}</td>
                        <td data-label="End Date">${booking.endDate}</td>
                        <td data-label="Amount">Rs.${booking.amount}/day</td>
                      `;
        bookingTableBody.appendChild(tr);
      });
    } else {
      noBooking.style.display = "block";
      document.getElementById("bookingTable").style.display = "none";
    }
  } catch (error) {
    console.log(error);
    toast("error", "Failed to set booking details").showToast();
  }
}
async function setBiddingDetails() {
  try {
    const currentUser = getCurrentUser();
    let biddings = await DbService.searchAllByIndex(
      "bids",
      "userId",
      currentUser.id
    );
    biddings = biddings.filter((bid) => bid.status !== "approved");
    const noBidding = document.getElementById("noBidding");
    noBidding.style.display = "none";
    const biddingTableBody = document.querySelector("#biddingTable tbody");
    biddingTableBody.innerHTML = "";
    if (biddings.length > 0) {
      biddings.forEach(async (bidding) => {
        const car = await DbService.getItem("cars", bidding.carId);
        const owner = await DbService.getItem("users", car.userId);
        const tr = document.createElement("tr");
        tr.innerHTML = `
                        <td data-label="Bidding ID">${bidding.id}</td>
                        <td data-label="Car Name"  data-id="${car.id}">${car.name}</td>
                        <td data-label="Owner Name"
                         data-id="${owner.id}">${owner.name}</td>
                        <td data-label="Start Date">${bidding.startDate}</td>
                        <td data-label="End Date">${bidding.endDate}</td>
                        <td data-label="Amount">Rs.${bidding.amount}/day</td>
                        <td data-label="Status">${bidding.status}</td>
                      `;
        biddingTableBody.appendChild(tr);
      });
    } else {
      noBidding.style.display = "block";
      document.getElementById("biddingTable").style.display = "none";
    }
  } catch (error) {
    console.log(error);
    toast("error", "Failed to set bidding details").showToast();
  }
}
