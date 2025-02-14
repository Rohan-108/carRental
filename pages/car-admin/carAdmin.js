import { getCurrentUser, toast } from "../../js/index.js";
import { getDaysDiff, cities, formatNumber } from "../../js/utils.js";
import {
  revenueChart,
  bookingChart,
  loadComparisonChart,
  loadDailyRevenueChart,
} from "./carChart.js";
import carService from "../../js/services/carService.js";
import BidService from "../../js/services/BidService.js";
import ChatService from "../../js/services/ChatService.js";
import userService from "../../js/services/userService.js";
const commissionRate = 0.25;
// dom elements
const closeButton = document.getElementById("closeButton");
const editCloseButton = document.getElementById("editCloseButton");
const modal = document.getElementById("carModal");
const editModal = document.getElementById("editModal");
const approveBidModal = document.getElementById("approveBidModal");
const cancelBidModal = document.getElementById("cancelBidModal");
const approveBidForm = document.getElementById("approveBidForm");
const cancelBidForm = document.getElementById("cancelBidForm");
const closeApproveBidModal = document.getElementById("closeButtonApprove");
const closeCancelBidModal = document.getElementById("closeButtonCancel");
const addCarButton = document.getElementById("addCar");
const addCarForm = document.getElementById("addCarForm");
const editCarForm = document.getElementById("editCarForm");
const biddingCount = document.getElementById("biddingCount");
const bookingCount = document.getElementById("bookingCount");
const nOfCars = document.getElementById("noOfCars");
const totalRevenue = document.getElementById("revenue");
const rejectedBids = document.getElementById("rejectedBids");
const averageRentDay = document.getElementById("averageRentDay");
const dashboardContainer = document.querySelector(".dashboardPage");
const carFilterForBidding = document.getElementById("carFilter");
const statusFilterForBidding = document.getElementById("statusFilter");
const carFilterForBooking = document.getElementById("carFilterBooking");
const sortFilterBidding = document.getElementById("sortFilterBidding");
const sortFilterBooking = document.getElementById("sortFilterBooking");
const sortOrderBidding = document.getElementById("sortOrderBidding");
const sortOrderBooking = document.getElementById("sortOrderBooking");
let currentPage = 1;
let pageSize = 5;
window.addEventListener("load", async () => {
  showLoader();
  try {
    await Promise.all[(setup(), loadStat(), addEventListeners())];
  } catch (error) {
    toast("error", "Error loading page").showToast();
  } finally {
    hideLoader();
  }
});
/**
 * @description Handle tab changes
 */
dashboardContainer.addEventListener("click", (e) => {
  const target = e.target.closest(".dashboard-page");
  if (!target) return;
  currentPage = 1;
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
      document.getElementById("dataSection").style.display = "flex";
      loadStat();
      break;
    case "cars":
      document.getElementById("car-cards-section").style.display = "flex";
      loadCars();
      break;
    case "bookings":
      document.getElementById("booking-section").style.display = "flex";
      loadBookings();
      break;
    case "biddings":
      document.getElementById("bidding-section").style.display = "flex";
      loadBiddings();
      break;
    case "analytics":
      document.getElementById("revenue-chart").style.display = "flex";
      document.getElementById("booking-chart").style.display = "flex";
      document.getElementById("comparisonChart").style.display = "flex";
      document.getElementById("dailyRevenueChartSection").style.display =
        "flex";
      const today = new Date();
      const endDate = today.toISOString().split("T")[0];
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split("T")[0];
      document.getElementById("startDate").value = startDate;
      document.getElementById("endDate").value = endDate;
      revenueChart();
      bookingChart();
      loadComparisonChart();
      loadDailyRevenueChart();
      break;
  }
});
/**
 * @description Setup the dashboard
 */
async function setup() {
  try {
    document
      .querySelectorAll(".dashboard-main > .hidden-section")
      .forEach((section) => (section.style.display = "none"));
    document.getElementById("dataSection").style.display = "flex";
    const cars = await carService.getCarsByOwnerId(getCurrentUser().id);
    cars.forEach((car) => {
      const option = document.createElement("option");
      option.value = car.id;
      option.textContent = car.name;
      carFilterForBidding.appendChild(option);
      carFilterForBooking.appendChild(option.cloneNode(true));
    });
  } catch (error) {
    toast("error", "Error setting up dashboard").showToast();
  }
}
/**
 * @description Load Stat Numbers for the dashboard
 * @returns {Promise<void>}
 * */
async function loadStat() {
  showLoader();
  try {
    const nCars = await carService.getCountByIndex(
      "ownerId",
      getCurrentUser().id
    );
    const allBids = await BidService.getBidsByOwnerId(getCurrentUser().id);
    let revenue = 0,
      noOfPendingBids = 0,
      noOfRejectedBids = 0,
      noOfApprovedBids = 0,
      noOfBids = 0,
      totalDay = 0;
    for (let bid of allBids) {
      const days = getDaysDiff(bid.startDate, bid.endDate);
      if (bid.status == "pending") {
        noOfPendingBids++;
      } else if (bid.status == "rejected") {
        noOfRejectedBids++;
      } else {
        noOfApprovedBids++;
        revenue += Number(bid.amount) * days;
      }
      totalDay += days;
      noOfBids++;
    }
    biddingCount.textContent = formatNumber(noOfBids);
    bookingCount.textContent = formatNumber(noOfApprovedBids);
    nOfCars.textContent = nCars;
    totalRevenue.textContent = `Rs.${formatNumber(
      revenue * (1 - commissionRate)
    )}`;
    rejectedBids.textContent = formatNumber(noOfRejectedBids);
    averageRentDay.textContent = `${formatNumber(
      Math.floor(totalDay / noOfBids)
    )} days`;
  } catch (error) {
    toast("error", "Error loading stat").showToast();
  } finally {
    hideLoader();
  }
}
/**
 * @description Load Owner Cars
 * @param {*} status
 */

async function loadCars(status = "true") {
  showLoader();
  try {
    const user = getCurrentUser();
    let result = await carService.getPagedCars(
      {
        page: currentPage,
        pageSize: pageSize,
        indexName: "ownerId",
        direction: "next",
      },
      (car) => car.ownerId === user.id && car.show === status
    );
    carCardsGrid.innerHTML = "";
    result.data.forEach((car) => {
      const card = document.createElement("div");
      card.classList.add("car-card");
      let imgUrl = "https://picsum.photos/200/300";
      if (car.images[0] instanceof ArrayBuffer) {
        const blob = new Blob([car.images[0]]);
        imgUrl = URL.createObjectURL(blob);
      }
      card.innerHTML = `
        <div class="car-image-container">
          <img src="${imgUrl}" alt="${car.name}" class="car-image">
        </div>
        <div class="car-details">
          <h3 class="car-name">${car.name}</h3>
          <p class="car-price">Price per day: Rs ${car.rentalPrice}</p>
          <p class="car-id">Car ID: ${car.id}</p>
          <p class="car-plate">Plate Number: ${car.plateNumber}</p>
          <div class="car-actions">
            <button class="editCarBtn" data-id="${car.id}">Edit</button>
            <button class="deleteCarBtn" data-id="${car.id}">Hide</button>
          </div>
        </div>
      `;
      carCardsGrid.appendChild(card);
      // render pagination
      renderPagination(
        result.totalPages,
        currentPage,
        loadCars,
        "car-cards-section"
      );
    });
  } catch (error) {
    toast("error", "Error loading cars").showToast();
  } finally {
    hideLoader();
  }
}
/**
 * @description Load Biddings for the car owner
 */
async function loadBiddings() {
  showLoader();
  try {
    const statusValue = statusFilterForBidding.value;
    const filterValue = carFilterForBidding.value;
    let biddings = await BidService.getBidsByOwnerId(getCurrentUser().id);
    biddings = biddings.map((bid) => ({
      ...bid,
      amount: bid.amount * getDaysDiff(bid.startDate, bid.endDate),
    }));
    if (statusValue !== "all") {
      biddings = biddings.filter((bid) => bid.status === statusValue);
    }
    if (filterValue !== "all") {
      biddings = biddings.filter((bid) => bid.carId == filterValue);
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
    //pagination
    const totalItems = biddings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    biddings = biddings.slice(start, start + pageSize);
    const biddingTableBody = document.getElementById("biddingContainer");
    biddingTableBody.innerHTML = "";
    if (biddings.length === 0) {
      biddingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const bid of biddings) {
        const tr = document.createElement("tr");
        const car = bid.car;
        const user = bid.user;
        tr.innerHTML = `
          <td data-label="Car Name">${car.name}</td>
          <td data-label="Renter">${user.name}</td>
          <td data-label="Adhaar Number">${user.adhaar || ""}</td>
          <td data-label="Start Date">${bid.startDate}</td>
          <td data-label="End Date">${bid.endDate}</td>
          <td data-label="Amount">Rs.${bid.amount}</td>
          ${
            bid.status === "pending"
              ? `<td data-label="Actions">
            <button class="approveBid" data-id="${bid.id}" data-car="${bid.carId}" data-start="${bid.startDate}" data-end="${bid.endDate}">Approve</button>
            <button class="cancelBid" data-id="${bid.id}">Cancel</button>
          </td>`
              : `<td data-label="Status">${bid.status}</td>`
          }
        `;
        biddingTableBody.appendChild(tr);
      }
    }
    if (biddings.length > 0)
      renderPagination(
        totalPages,
        currentPage,
        loadBiddings,
        "bidding-section"
      );
  } catch (error) {
    toast("error", "Error loading biddings").showToast();
  } finally {
    hideLoader();
  }
}
/**
 * @description Load Bookings for the car owner
 */
async function loadBookings() {
  showLoader();
  try {
    let bookings = await BidService.getBookingsByOwnerId(getCurrentUser().id);
    bookings = bookings.map((book) => ({
      ...book,
      amount: book.amount * getDaysDiff(book.startDate, book.endDate),
    }));
    const filterValue = carFilterForBooking.value;
    if (filterValue !== "all") {
      bookings = bookings.filter((booking) => booking.carId == filterValue);
    }
    const sortValue = sortFilterBooking.value;
    if (sortValue === "date") {
      bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === "amount") {
      bookings.sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    const order = sortOrderBooking.value;
    if (order === "desc") {
      bookings.reverse();
    }
    //pagination
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    bookings = bookings.slice(start, start + pageSize);
    const bookingTableBody = document.getElementById("bookingContainer");
    bookingTableBody.innerHTML = "";
    if (bookings.length === 0) {
      bookingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const booking of bookings) {
        const tr = document.createElement("tr");
        const car = booking.car;
        const user = booking.user;
        tr.innerHTML = `
          <td data-label="Car Name">${car.name}</td>
          <td data-label="Renter">${user.name}</td>
          <td data-label="Adhaar Number">${user.adhaar || ""}</td>
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
    if (bookings.length > 0)
      renderPagination(
        totalPages,
        currentPage,
        loadBookings,
        "booking-section"
      );
  } catch (error) {
    toast("error", "Error loading bookings").showToast();
  } finally {
    hideLoader();
  }
}

/**
 * @description Approve the user bid and send a message
 * @param {*} bidId
 * @param {*} carId
 * @param {*} startDate
 * @param {*} endDate
 */
async function approveBid(bidId, carId, startDate, endDate) {
  try {
    const user = await userService.getUserById(getCurrentUser().id);
    const bid = await BidService.getBidById(bidId);
    const car = bid.car;
    await BidService.updateBid({ id: bidId, status: "approved" });
    const convs = await ChatService.getConversationsByCarId(carId);
    let convId = convs.filter((conv) =>
      conv.members.some((member) => member.id === user.id)
    );
    if (convId.length && convId[0].id) {
      await ChatService.addChat({
        id: "",
        message: `Your bid for ${car.name} from ${startDate} to ${endDate} of amount Rs.${bid.amount} has been approved`,
        conversationId: convId[0].id,
        image: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sender: user.id,
        user: user,
      });
    }
    const allCaridbookings = await BidService.getBidsByCarId(carId);
    function parseCustomDate(dateStr) {
      return new Date(dateStr + "T00:00:00");
    }
    // reject all other bids for the same car with overlapping dates
    allCaridbookings.forEach(async (bidItem) => {
      const bidStart = parseCustomDate(bidItem.startDate);
      const bidEnd = parseCustomDate(bidItem.endDate);
      const compStart = parseCustomDate(startDate);
      const compEnd = parseCustomDate(endDate);
      if (
        bidItem.id != bidId &&
        ((bidStart.getTime() >= compStart.getTime() &&
          bidStart.getTime() <= compEnd.getTime()) ||
          (bidEnd.getTime() >= compStart.getTime() &&
            bidEnd.getTime() <= compEnd.getTime()))
      ) {
        await BidService.updateBid({
          id: bidItem.id,
          status: "rejected",
        });
      }
    });
    loadBiddings();
    toast("info", "Bid approved successfully").showToast();
  } catch (error) {
    toast("error", error.message).showToast();
  }
}
/**
 * @description Cancel the user bid
 * @param {*} bidId
 * */
async function cancelBid(bidId) {
  try {
    await BidService.updateBid({ id: bidId, status: "rejected" });
    loadBiddings();
    toast("info", "Bid cancelled successfully").showToast();
  } catch (error) {
    toast("error", error.message).showToast();
  }
}
/**
 * @description Archive the car
 * @param {*} carId
 * @returns
 */
async function deleteCar(carId) {
  try {
    const prompt = confirm(
      `Are you sure you want to remove this car from listing?
      All pending bids will be rejected`
    );
    if (!prompt) return;
    const bids = await BidService.getBidsByCarId(carId);
    // reject all pending bids
    bids.forEach(async (bid) => {
      if (bid.status == "pending") {
        await BidService.updateBid({ id: bid.id, status: "rejected" });
      }
    });
    await carService.updateCar({ id: carId, show: "false" });
    toast("success", "Car deleted successfully").showToast();
    loadCars();
  } catch (error) {
    toast("error", "Error deleting car").showToast();
  }
}
/**
 * @description Event listeners for the dashboard
 */
function addEventListeners() {
  const carContainer = document.getElementById("carCardsGrid");
  const biddingContainer = document.getElementById("biddingContainer");
  carContainer.addEventListener("click", (event) => {
    const editbutton = event.target.closest(".editCarBtn");
    const deleteCarBtn = event.target.closest(".deleteCarBtn");
    if (editbutton && editbutton.dataset.id) {
      const carId = editbutton.dataset.id;
      editCar(carId);
    }
    if (deleteCarBtn && deleteCarBtn.dataset.id) {
      const carId = deleteCarBtn.dataset.id;
      deleteCar(carId);
    }
  });
  biddingContainer.addEventListener("click", (e) => {
    const approveButton = e.target.closest(".approveBid");
    const cancelButton = e.target.closest(".cancelBid");
    if (cancelButton && cancelButton.dataset.id) {
      cancelBidModal.style.display = "flex";
      cancelBidForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const bidId = cancelButton.dataset.id;
        await cancelBid(bidId);
        cancelBidModal.style.display = "none";
      });
    }
    if (approveButton && approveButton.dataset.id) {
      const bidId = approveButton.dataset.id;
      const carId = approveButton.dataset.car;
      const start = approveButton.dataset.start;
      const end = approveButton.dataset.end;
      approveBidModal.style.display = "flex";
      approveBidForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await approveBid(bidId, carId, start, end);
        approveBidModal.style.display = "none";
      });
    }
  });
  closeButton.addEventListener("click", () => {
    modal.style.display = "none";
  });
  closeApproveBidModal.addEventListener("click", () => {
    approveBidModal.style.display = "none";
  });
  closeCancelBidModal.addEventListener("click", () => {
    cancelBidModal.style.display = "none";
  });
  addCarButton.addEventListener("click", () => {
    modal.style.display = "block";
    addCarForm.elements["location"].innerHTML = "";
    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      addCarForm.elements["location"].appendChild(option);
    });
  });
  carFilterForBidding.addEventListener("change", () => {
    loadBiddings();
  });
  carFilterForBooking.addEventListener("change", () => {
    loadBookings();
  });
  statusFilterForBidding.addEventListener("change", () => {
    loadBiddings();
  });
  sortFilterBidding.addEventListener("change", () => {
    loadBiddings();
  });
  sortFilterBooking.addEventListener("change", () => {
    loadBookings();
  });
  sortOrderBidding.addEventListener("change", () => {
    loadBiddings();
  });
  sortOrderBooking.addEventListener("change", () => {
    loadBookings();
  });
  editCloseButton.addEventListener("click", () => {
    editModal.style.display = "none";
  });
}
/**
 * @description Fill car form with car details
 * @param {*} carId
 */
async function editCar(carId) {
  try {
    const car = await carService.getCarById(carId);
    editCarForm.elements["rentalPrice"].value = Number(car.rentalPrice);
    editCarForm.elements["location"].innerHTML = "";
    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      editCarForm.elements["location"].appendChild(option);
    });
    editCarForm.elements["location"].value = car.location;
    editCarForm.elements["minRental"].value = Number(car.minRentalPeriod);
    editCarForm.elements["maxRental"].value = Number(car.maxRentalPeriod);
    editCarForm.setAttribute("data-id", carId);
    editModal.style.display = "flex";
  } catch (error) {
    toast("error", "error setting car detail").showToast();
  }
}

/**
 * @description Render Pagination
 * @param {*} totalPages
 * @param {*} current
 * @param {*} fn
 * @param {*} sectionId
 */
function renderPagination(totalPages, current, fn, sectionId) {
  const paginationDiv = document.querySelector(`#${sectionId} .pagination`);
  paginationDiv.innerHTML = "";
  // if (totalPages <= 1) return;
  const prevButton = document.createElement("button");
  prevButton.classList.add("pagination-button");
  prevButton.textContent = "Previous";
  prevButton.disabled = current <= 1;
  prevButton.addEventListener("click", async () => {
    currentPage = current - 1;
    await fn();
  });
  const pageIndicator = document.createElement("span");
  pageIndicator.textContent = `Page ${current} of ${totalPages}`;
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.classList.add("pagination-button");
  nextButton.disabled = current >= totalPages;
  nextButton.addEventListener("click", async () => {
    currentPage = current + 1;
    await fn();
  });
  paginationDiv.appendChild(prevButton);
  paginationDiv.appendChild(pageIndicator);
  paginationDiv.appendChild(nextButton);
}
//<-------helper functions------------------------------------>
function showLoader() {
  const main = document.querySelector(".dashboard-main");
  const loader = document.createElement("div");
  loader.className = "loader-overlay";
  loader.innerHTML = "<div class='loader'></div>";
  main.appendChild(loader);
}
function hideLoader() {
  const loader = document.querySelector(".loader-overlay");
  if (loader) loader.remove();
}
export { loadCars, showLoader, hideLoader };
