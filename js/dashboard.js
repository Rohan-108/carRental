import { getCurrentUser, toast, setCurrentUser, goToPage } from "./index.js";
import { getFileFromInput, getDaysDiff } from "./utils.js";
import DbService from "./db.js";
const dashboardContainer = document.querySelector(".dashboardPage");
const seekApprovalBtn = document.getElementById("seekApprovalBtn");
const editProfileBtn = document.getElementById("editProfileBtn");
const editCloseBtn = document.getElementById("editCloseButton");
const profileModal = document.getElementById("profileModal");
const editProfileForm = document.getElementById("editProfileForm");
const mainContainer = document.querySelector(".dashboard-main");
const statusFilterForBidding = document.getElementById("statusFilter");
const sortFilterBidding = document.getElementById("sortFilterBidding");
const sortFilterBooking = document.getElementById("sortFilterBooking");
const sortOrderBidding = document.getElementById("sortOrderBidding");
const sortOrderBooking = document.getElementById("sortOrderBooking");
window.addEventListener("load", async () => {
  try {
    showLoader();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      goToPage("login");
    }
    setUserDetail();
    addEventListeners();
  } catch (error) {
    console.error(error);
    toast("error", "Failed to load profile").showToast();
  } finally {
    hideLoader();
  }
});
dashboardContainer.addEventListener("click", (e) => {
  const target = e.target.closest(".dashboard-page");
  if (!target) return;
  dashboardContainer
    .querySelectorAll(".dashboard-page")
    .forEach((page) => page.classList.remove("active"));
  target.classList.add("active");
  const selectedId = target.dataset.id;
  document
    .querySelectorAll(".dashboard-main > .hidden-section")
    .forEach((section) => (section.style.display = "none"));
  switch (selectedId) {
    case "home":
      document.getElementById("profileHome").style.display = "flex";
      setUserDetail();
      break;
    case "bookings":
      document.getElementById("profileBookings").style.display = "flex";
      loadBookings();
      break;
    case "biddings":
      document.getElementById("profileBiddings").style.display = "flex";
      loadBiddings();
      break;
    case "approval":
      document.getElementById("approvalSection").style.display = "flex";
      loadApprovals();
      break;
  }
});
async function addEventListeners() {
  editCloseBtn.addEventListener("click", () => {
    profileModal.style.display = "none";
  });
  editProfileBtn.addEventListener("click", async () => {
    try {
      const user = getCurrentUser();
      editProfileForm.elements["name"].value = user.name;
      editProfileForm.elements["phone"].value = user.tel;
      profileModal.style.display = "block";
    } catch (error) {
      console.error(error);
      toast("error", "Failed to load profile data").showToast();
    }
  });
  sortFilterBidding.addEventListener("change", loadBiddings);
  sortFilterBooking.addEventListener("change", loadBookings);
  sortOrderBidding.addEventListener("change", loadBiddings);
  sortOrderBooking.addEventListener("change", loadBookings);
  statusFilterForBidding.addEventListener("change", loadBiddings);
}
seekApprovalBtn.addEventListener("click", async () => {
  const currentUser = getCurrentUser();
  try {
    await DbService.addItem("approvals", {
      userId: currentUser.id,
      name: currentUser.name,
      email: currentUser.email,
      createdAt: Date.now(),
      status: "pending",
    });
    await loadApprovals();
  } catch (error) {
    console.error(error);
    toast("error", "Failed to seek approval").showToast();
  }
});
editProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const currentUser = getCurrentUser();
    const user = await DbService.getItem("users", currentUser.id);
    const name = editProfileForm.elements["name"].value.trim();
    const phone = editProfileForm.elements["phone"].value.trim();
    let avatarData = user.avatar;
    const avatarInput = editProfileForm.elements["avatar"];
    const avatarFile = avatarInput && avatarInput.files[0];
    if (avatarFile) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(avatarFile.type)) {
        toast(
          "error",
          "Avatar must be an image of type PNG, JPEG, or JPG"
        ).showToast();
        return;
      }
      const maxSize = 500 * 1024;
      if (avatarFile.size > maxSize) {
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
    const updatedUser = await DbService.getItem("users", currentUser.id);
    setCurrentUser(updatedUser);
    await setUserDetail();
    profileModal.style.display = "none";
  } catch (error) {
    console.error(error);
    toast("error", "Failed to update profile").showToast();
  }
});

async function loadApprovals() {
  try {
    showLoader();
    const currentUser = getCurrentUser();
    const approvalSection = document.getElementById("approvalSection");
    const approvalMessage = document.getElementById("approvalMessage");
    const seekApprovalBtn = document.getElementById("seekApprovalBtn");
    if (currentUser.role === "general") {
      const approvalReq = await DbService.searchItemByIndex(
        "approvals",
        "userId",
        currentUser.id
      );
      if (!approvalReq) {
        approvalSection.style.display = "flex";
        approvalMessage.textContent =
          "Your account is not approved yet. Please seek approval to become admin.";
        seekApprovalBtn.disabled = false;
        seekApprovalBtn.textContent = "Seek Approval";
        seekApprovalBtn.style.background = "";
      } else if (approvalReq.status === "pending") {
        approvalSection.style.display = "flex";
        approvalMessage.textContent = "Your approval request is pending.";
        seekApprovalBtn.disabled = true;
        seekApprovalBtn.textContent = "Approval Pending";
        seekApprovalBtn.style.background = "grey";
      } else if (approvalReq.status === "rejected") {
        approvalSection.style.display = "flex";
        approvalMessage.textContent =
          "Your approval request has been rejected.";
        seekApprovalBtn.disabled = true;
        seekApprovalBtn.textContent = "Rejected";
        seekApprovalBtn.style.background = "grey";
      } else if (approvalReq.status === "approved") {
        approvalSection.style.display = "flex";
        approvalMessage.textContent =
          "Your approval request has been approved. You are now an admin.";
        seekApprovalBtn.disabled = true;
        seekApprovalBtn.textContent = "Approved";
      }
    } else {
      approvalSection.style.display = "flex";
      approvalMessage.textContent =
        "Your approval request has been approved. You are now an admin.";
      seekApprovalBtn.disabled = true;
      seekApprovalBtn.textContent = "Approved";
    }
  } catch (error) {
    console.log(error);
    toast("error", "Error loading approvals").showToast();
  } finally {
    hideLoader();
  }
}

async function setUserDetail() {
  try {
    showLoader();
    const currentUser = getCurrentUser();
    const user = await DbService.getItem("users", currentUser.id);
    const userAvatar = document.getElementById("userAvatar");
    document.getElementById("name").textContent = currentUser.name || "No Name";
    document.getElementById("email").textContent =
      currentUser.email || "No Email";
    document.getElementById("phone").textContent =
      currentUser.tel || "No Phone";
    document.getElementById("adhaar").textContent =
      currentUser.adhaar || "No Adhaar";
    if (user.avatar instanceof ArrayBuffer) {
      const blob = new Blob([user.avatar]);
      userAvatar.src = URL.createObjectURL(blob);
    }
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set user details").showToast();
  } finally {
    hideLoader();
  }
}
async function loadBiddings() {
  showLoader();
  try {
    const statusValue = statusFilterForBidding.value;
    let biddings = await DbService.searchAllByIndex(
      "bids",
      "userId",
      getCurrentUser().id
    );
    biddings = biddings.map((bid) => ({
      ...bid,
      amount: Number(bid.amount) * getDaysDiff(bid.startDate, bid.endDate),
    }));
    biddings = biddings.filter((bid) => bid.status !== "approved");
    if (statusValue !== "all") {
      biddings = biddings.filter((bid) => bid.status === statusValue);
    }
    const sortValue = sortFilterBidding.value;
    if (sortValue === "date") {
      biddings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === "amount") {
      biddings.sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    const order = sortOrderBidding.value;
    if (order === "desc") {
      biddings.reverse();
    }
    const biddingTableBody = document.getElementById("biddingContainer");
    biddingTableBody.innerHTML = "";
    if (biddings.length === 0) {
      biddingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const bid of biddings) {
        const tr = document.createElement("tr");
        const car = await DbService.getItem("cars", bid.carId);
        const owner = await DbService.getItem("users", bid.ownerId);
        tr.innerHTML = `
          <td data-label="Car Name">${car.name}</td>
          <td data-label="Owner">${owner.name}</td>
          <td data-label="Plate Number">${car.plateNumber || ""}</td>
          <td data-label="Start Date">${bid.startDate}</td>
          <td data-label="End Date">${bid.endDate}</td>
          <td data-label="Amount">Rs.${bid.amount}</td>
          <td data-label="Status">${bid.status}</td>
        `;
        biddingTableBody.appendChild(tr);
      }
    }
  } catch (error) {
    toast("error", "Error loading biddings").showToast();
  } finally {
    hideLoader();
  }
}

async function loadBookings() {
  showLoader();
  try {
    let bookings = await DbService.searchAllByIndex(
      "bookings",
      "userId",
      getCurrentUser().id
    );
    bookings = bookings.map((book) => ({
      ...book,
      amount: Number(book.amount) * getDaysDiff(book.startDate, book.endDate),
    }));
    const sortValue = sortFilterBooking.value;
    if (sortValue === "date") {
      bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === "amount") {
      bookings.sort((a, b) => a.amount - b.amount);
    }
    const order = sortOrderBooking.value;
    if (order === "desc") {
      bookings.reverse();
    }
    const bookingTableBody = document.getElementById("bookingContainer");
    bookingTableBody.innerHTML = "";
    if (bookings.length === 0) {
      bookingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const booking of bookings) {
        const tr = document.createElement("tr");
        const car = await DbService.getItem("cars", booking.carId);
        const owner = await DbService.getItem("users", booking.ownerId);
        tr.innerHTML = `
          <td data-label="Car Name">${car.name}</td>
          <td data-label="Owner">${owner.name}</td>
          <td data-label="Plate Number">${car.plateNumber || ""}</td>
          <td data-label="Start Date">${booking.startDate}</td>
          <td data-label="End Date">${booking.endDate}</td>
          <td data-label="Amount">Rs.${booking.amount}</td>
          <td data-label="Confirmed At">${new Date(
            booking.createdAt
          ).toLocaleString()}</td>
        `;
        bookingTableBody.appendChild(tr);
      }
    }
  } catch (error) {
    console.log(error);
    toast("error", "Error loading bookings").showToast();
  } finally {
    hideLoader();
  }
}
function showLoader() {
  const loader = document.createElement("div");
  loader.className = "loader-overlay";
  loader.innerHTML = "<div class='loader'></div>";
  mainContainer.appendChild(loader);
}
function hideLoader() {
  const loader = document.querySelector(".loader-overlay");
  if (loader) loader.remove();
}
