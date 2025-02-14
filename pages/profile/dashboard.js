import { getCurrentUser, toast, goToPage } from "../../js/index.js";
import { getDaysDiff } from "../../js/utils.js";
import UserService from "../../js/services/userService.js";
import ApprovalService from "../../js/services/ApprovalService.js";
import BidService from "../../js/services/BidService.js";
import userService from "../../js/services/userService.js";

// --------------------- DOM Elements ---------------------
const dashboardContainer = document.querySelector(".dashboardPage");
const seekApprovalBtn = document.getElementById("seekApprovalBtn");
const mainContainer = document.querySelector(".dashboard-main");
const statusFilterForBidding = document.getElementById("statusFilter");
const sortFilterBidding = document.getElementById("sortFilterBidding");
const sortFilterBooking = document.getElementById("sortFilterBooking");
const sortOrderBidding = document.getElementById("sortOrderBidding");
const sortOrderBooking = document.getElementById("sortOrderBooking");

// --------------------- Pagination Variables ---------------------
let currentPage = 1;
const pageSize = 5;

// --------------------- Initialization ---------------------
window.addEventListener("load", async () => {
  try {
    showLoader();
    const currentUser = getCurrentUser();
    if (!currentUser) {
      goToPage("login");
      return;
    }
    await setUserDetail();
    initEventListeners();
  } catch (error) {
    console.error(error);
    toast("error", "Failed to load profile").showToast();
  } finally {
    hideLoader();
  }
});

// --------------------- Dashboard Navigation ---------------------
dashboardContainer.addEventListener("click", (e) => {
  const target = e.target.closest(".dashboard-page");
  if (!target) return;

  // Update active page indicator
  dashboardContainer
    .querySelectorAll(".dashboard-page")
    .forEach((page) => page.classList.remove("active"));
  target.classList.add("active");

  // Hide all hidden sections
  document
    .querySelectorAll(".dashboard-main > .hidden-section")
    .forEach((section) => {
      section.style.display = "none";
    });

  // Show selected section
  switch (target.dataset.id) {
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
    default:
      break;
  }
});

// --------------------- Event Listeners ---------------------
function initEventListeners() {
  // Sorting and filtering
  sortFilterBidding.addEventListener("change", loadBiddings);
  sortFilterBooking.addEventListener("change", loadBookings);
  sortOrderBidding.addEventListener("change", loadBiddings);
  sortOrderBooking.addEventListener("change", loadBookings);
  statusFilterForBidding.addEventListener("change", loadBiddings);

  // Seek approval button
  seekApprovalBtn.addEventListener("click", async () => {
    try {
      const currentUser = await userService.getUserById(getCurrentUser().id);
      await ApprovalService.addApproval({
        id: "",
        userId: currentUser.id,
        user: currentUser,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: "pending",
      });
      await loadApprovals();
    } catch (error) {
      console.error(error);
      toast("error", "Failed to seek approval").showToast();
    }
  });
}

// --------------------- Approval Section ---------------------
async function loadApprovals() {
  try {
    showLoader();
    const currentUser = getCurrentUser();
    const approvalSection = document.getElementById("approvalSection");
    const approvalMessage = document.getElementById("approvalMessage");
    const seekApprovalBtn = document.getElementById("seekApprovalBtn");

    if (currentUser.role === "general") {
      const approvalReq = await ApprovalService.getApprovalByUserId(
        currentUser.id
      );
      console.log(approvalReq);
      if (!approvalReq) {
        approvalMessage.textContent =
          "Your account is not approved yet. Please seek approval to become admin.";
        seekApprovalBtn.disabled = false;
        seekApprovalBtn.textContent = "Seek Approval";
        seekApprovalBtn.style.background = "";
      } else if (approvalReq.status === "pending") {
        approvalMessage.textContent = "Your approval request is pending.";
        seekApprovalBtn.disabled = true;
        seekApprovalBtn.textContent = "Approval Pending";
        seekApprovalBtn.style.background = "grey";
      } else if (approvalReq.status === "rejected") {
        approvalMessage.textContent =
          "Your approval request has been rejected.";
        seekApprovalBtn.disabled = true;
        seekApprovalBtn.textContent = "Rejected";
        seekApprovalBtn.style.background = "grey";
      } else if (approvalReq.status === "approved") {
        approvalMessage.textContent =
          "Your approval request has been approved. You are now an admin.";
        seekApprovalBtn.disabled = true;
        seekApprovalBtn.textContent = "Approved";
        seekApprovalBtn.style.background = "green";
        seekApprovalBtn.style.cursor = "not-allowed";
      }
    } else {
      approvalMessage.textContent =
        "Your approval request has been approved. You are now an admin.";
      seekApprovalBtn.disabled = true;
      seekApprovalBtn.textContent = "Approved";
      seekApprovalBtn.style.cursor = "not-allowed";
    }
    approvalSection.style.display = "flex";
  } catch (error) {
    console.error(error);
    toast("error", "Error loading approvals").showToast();
  } finally {
    hideLoader();
  }
}

// --------------------- User Details ---------------------
async function setUserDetail() {
  try {
    showLoader();
    const currentUser = getCurrentUser();
    const user = await UserService.getUserById(currentUser.id);

    document.getElementById("name").textContent = currentUser.name || "No Name";
    document.getElementById("email").textContent =
      currentUser.email || "No Email";
    document.getElementById("phone").textContent =
      currentUser.tel || "No Phone";
    document.getElementById("adhaar").textContent =
      currentUser.adhaar || "No Adhaar";

    const userAvatar = document.getElementById("userAvatar");
    if (user.avatar instanceof ArrayBuffer) {
      const blob = new Blob([user.avatar]);
      userAvatar.src = URL.createObjectURL(blob);
    } else {
      userAvatar.src = user.avatar || "https://picsum.photos/200/300";
    }
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set user details").showToast();
  } finally {
    hideLoader();
  }
}

// --------------------- Biddings ---------------------
async function loadBiddings() {
  showLoader();
  try {
    let biddings = await BidService.getBidsByUserId(getCurrentUser().id);
    const statusValue = statusFilterForBidding.value;

    // Calculate total bid amount based on rental days and filter out approved bids
    biddings = biddings
      .map((bid) => ({
        ...bid,
        amount: Number(bid.amount) * getDaysDiff(bid.startDate, bid.endDate),
      }))
      .filter((bid) => bid.status !== "approved");

    if (statusValue !== "all") {
      biddings = biddings.filter((bid) => bid.status === statusValue);
    }
    // Sort bids by date or amount
    const sortValue = sortFilterBidding.value;
    if (sortValue === "date") {
      biddings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === "amount") {
      biddings.sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    if (sortOrderBidding.value === "desc") {
      biddings.reverse();
    }
    // Pagination
    const totalItems = biddings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (currentPage - 1) * pageSize;
    const paginatedBids = biddings.slice(start, start + pageSize);
    // Render bidding table
    const biddingTableBody = document.getElementById("biddingContainer");
    biddingTableBody.innerHTML = "";
    if (paginatedBids.length === 0) {
      biddingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const bid of paginatedBids) {
        const tr = document.createElement("tr");
        const car = bid.car;
        const owner = bid.car.owner;
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
    // Render pagination controls if data exists
    if (paginatedBids.length > 0) {
      renderPagination(
        totalPages,
        currentPage,
        loadBiddings,
        "profileBiddings"
      );
    }
  } catch (error) {
    console.error(error);
    toast("error", "Error loading biddings").showToast();
  } finally {
    hideLoader();
  }
}

// --------------------- Bookings ---------------------
async function loadBookings() {
  showLoader();
  try {
    let bookings = await BidService.getBookingsByUserId(getCurrentUser().id);
    bookings = bookings.map((book) => ({
      ...book,
      amount: Number(book.amount) * getDaysDiff(book.startDate, book.endDate),
    }));

    // Sort bookings by date or amount
    const sortValue = sortFilterBooking.value;
    if (sortValue === "date") {
      bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === "amount") {
      bookings.sort((a, b) => a.amount - b.amount);
    }
    if (sortOrderBooking.value === "desc") {
      bookings.reverse();
    }
    // Pagination
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    currentPage = Math.max(1, Math.min(currentPage, totalPages));
    const start = (currentPage - 1) * pageSize;
    const paginatedBookings = bookings.slice(start, start + pageSize);
    // Render booking table
    const bookingTableBody = document.getElementById("bookingContainer");
    bookingTableBody.innerHTML = "";
    if (paginatedBookings.length === 0) {
      bookingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const booking of paginatedBookings) {
        const tr = document.createElement("tr");
        const car = booking.car;
        const owner = booking.car.owner;
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

    // Render pagination controls if data exists
    if (paginatedBookings.length > 0) {
      renderPagination(
        totalPages,
        currentPage,
        loadBookings,
        "profileBookings"
      );
    }
  } catch (error) {
    console.error(error);
    toast("error", "Error loading bookings").showToast();
  } finally {
    hideLoader();
  }
}

// --------------------- Loader Helpers ---------------------
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

// --------------------- Pagination Renderer ---------------------
/**
 * Renders pagination controls for the given section.
 * @param {number} totalPages - Total pages available.
 * @param {number} current - Current page number.
 * @param {Function} callback - Callback to load data for the page.
 * @param {string} sectionId - ID of the section container.
 */
function renderPagination(totalPages, current, callback, sectionId) {
  const paginationDiv = document.querySelector(`#${sectionId} .pagination`);
  paginationDiv.innerHTML = "";

  // Create Previous button
  const prevButton = document.createElement("button");
  prevButton.classList.add("pagination-button");
  prevButton.textContent = "Previous";
  prevButton.disabled = current <= 1;
  prevButton.addEventListener("click", async () => {
    currentPage = current - 1;
    await callback();
  });

  // Create Page indicator
  const pageIndicator = document.createElement("span");
  pageIndicator.textContent = `Page ${current} of ${totalPages}`;

  // Create Next button
  const nextButton = document.createElement("button");
  nextButton.classList.add("pagination-button");
  nextButton.textContent = "Next";
  nextButton.disabled = current >= totalPages;
  nextButton.addEventListener("click", async () => {
    currentPage = current + 1;
    await callback();
  });

  paginationDiv.append(prevButton, pageIndicator, nextButton);
}

export { setUserDetail };
