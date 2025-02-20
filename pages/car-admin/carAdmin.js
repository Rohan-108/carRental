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
let currentTab = "all-bookings";
// intialize the page
window.addEventListener("load", async () => {
  showLoader();
  try {
    await Promise.all[(setup(), loadStat(), addEventListeners())];
  } catch (error) {
    console.log(error);
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
        revenue += Number(bid.amount);
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
            <button class="approveBid" style="background-color:green;
            color:#fff;border-radius:1rem;cursor:pointer" data-id="${bid.id}" data-car="${bid.carId}" data-start="${bid.startDate}" data-end="${bid.endDate}">Approve</button>
            <button class="cancelBid" style="background-color:red;
            color:#fff;border-radius:1rem;cursor:pointer" data-id="${bid.id}">Cancel</button>
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
// Function to update the table header based on the current tab
function updateTableHeader() {
  const theadRow = document.querySelector("#bookingTable thead tr");
  // Check if an Action column exists (by looking for a th with class "action-col")
  const actionTh = theadRow.querySelector(".action-col");
  if (currentTab === "active-bookings") {
    if (!actionTh) {
      const th = document.createElement("th");
      th.scope = "col";
      th.className = "action-col";
      th.textContent = "Action";
      theadRow.appendChild(th);
    }
  } else {
    if (actionTh) {
      theadRow.removeChild(actionTh);
    }
  }
}
// Main function to load bookings
async function loadBookings() {
  showLoader();
  try {
    // Get filter values
    const carFilterValue = carFilterForBooking.value;
    const sortValue = sortFilterBooking.value;
    const order = sortFilterBooking.value;
    let bookings = await BidService.getBookingsByOwnerId(getCurrentUser().id);
    const now = new Date();
    if (currentTab === "active-bookings") {
      bookings = bookings.filter(
        (booking) =>
          new Date(booking.startDate) <= now && booking.tripCompleted === false
      );
    } else if (currentTab === "completed-bookings") {
      bookings = bookings.filter(
        (booking) =>
          booking.tripCompleted === true || new Date(booking.endDate) < now
      );
    }
    if (carFilterValue !== "all") {
      bookings = bookings.filter((booking) => booking.carId == carFilterValue);
    }

    // Sort bookings
    if (sortValue === "date") {
      bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortValue === "amount") {
      bookings.sort((a, b) => Number(a.amount) - Number(b.amount));
    }
    if (order === "desc") {
      bookings.reverse();
    }

    // Pagination
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    const paginatedBookings = bookings.slice(start, start + pageSize);

    // Update table header based on the active tab
    updateTableHeader();

    // Render table body
    const bookingTableBody = document.getElementById("bookingContainer");
    bookingTableBody.innerHTML = "";
    if (paginatedBookings.length === 0) {
      // Adjust colspan based on whether the Action column is present (7 columns for active, 6 otherwise)
      const colspan = currentTab === "active-bookings" ? 7 : 6;
      bookingTableBody.innerHTML = `<tr><td colspan="${colspan}" class="no-data">There is no data</td></tr>`;
    } else {
      paginatedBookings.forEach((booking) => {
        const tr = document.createElement("tr");
        let rowHTML = `
          <td data-label="Car Name">${booking.car.name}</td>
          <td data-label="Renter">${booking.user.name}</td>
          <td data-label="Adhaar Number">${booking.user.adhaar || ""}</td>
          <td data-label="Start Date">${booking.startDate}</td>
          <td data-label="End Date">${booking.endDate}</td>
          <td data-label="Amount">Rs.${booking.amount}</td>
        `;
        // For active bookings, add the Action column
        if (currentTab === "active-bookings") {
          let actionContent = "";
          if (!booking.currentOdometer) {
            actionContent = `<button class="add-odometer" data-id="${booking.id}" data-action="current">Add Current Odometer</button>`;
          } else if (booking.currentOdometer && !booking.finalOdometer) {
            actionContent = `<button class="add-odometer" data-id="${booking.id}" data-action="final">Add Final Odometer</button>`;
          }
          rowHTML += `<td data-label="Action">${actionContent}</td>`;
        }
        tr.innerHTML = rowHTML;
        bookingTableBody.appendChild(tr);
      });
    }
    if (paginatedBookings.length > 0) {
      renderPagination(
        totalPages,
        currentPage,
        loadBookings,
        "booking-section"
      );
    }
  } catch (error) {
    console.error(error);
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
    // send a message to the user
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
 * @description generate invoice for the user.
 * @param {*} booking
 * @param {*} odometerValue
 * @returns
 */
async function generateInvoice(booking, odometerValue) {
  //calculate the total kilometers
  const totalKilometers = Math.max(
    0,
    Number(odometerValue) - Number(booking.currentOdometer)
  );
  const daysOfTravel = getDaysDiff(booking.startDate, booking.endDate);
  const extraKilometers = Math.max(
    0,
    totalKilometers - Number(booking.car.fixedKilometer) * daysOfTravel
  );
  // Calculate the extra charges
  const extraCharges =
    extraKilometers > 0 ? extraKilometers * Number(booking.car.ratePerKm) : 0;
  const finalAmount = booking.amount + extraCharges;
  const baseRentalPay = booking.amount;
  //html for the invoice
  const invoiceHTML = `
    <div id="invoiceContent" style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; position: relative;
    width:100%;max-width:600px; background-color:#fff;">
      <h2 style="text-align: center;">Invoice</h2>
      <p><strong>Car Name:</strong> ${booking.car.name}</p>
      <p><strong>Renter:</strong> ${booking.user.name}</p>
      <p><strong>Start Date:</strong> ${booking.startDate}</p>
      <p><strong>End Date:</strong> ${booking.endDate}</p>
      <p><strong>Initial Odometer:</strong> ${booking.currentOdometer}</p>
      <p><strong>Final Odometer:</strong> ${odometerValue}</p>
      <p><strong>Number of Days of Travel:</strong> ${daysOfTravel}</p>
      <p><strong>Base Rental Pay:</strong> Rs.${baseRentalPay}</p>
      <p><strong>Rate per Km:</strong> Rs.${booking.car.ratePerKm}</p>
      <p><strong>Free Kilometer:</strong> ${
        booking.car.fixedKilometer
      }*${daysOfTravel} = ${
    Number(booking.car.fixedKilometer) * daysOfTravel
  }km</p>
      <p><strong>Total Kilometers Traveled:</strong> ${totalKilometers}km</p>
      <p><strong>Extra Kilometer: </strong>${totalKilometers}-${
    Number(booking.car.fixedKilometer) * daysOfTravel
  } = ${extraKilometers}Km</p>
      <p><strong>Extra Charges:</strong> Rs.${extraCharges}</p>
      <hr/>
      <p><strong>Final Pay:</strong> Rs.${finalAmount}</p>
    </div>
  `;
  return invoiceHTML;
}

/**
 * @description Show the invoice modal
 * @param {*} invoiceHTML
 */
function showInvoiceModal(invoiceHTML) {
  // Create a background overlay
  const overlay = document.createElement("div");
  overlay.id = "invoiceOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.backdropFilter = "blur(5px)";
  overlay.style.zIndex = "999";

  // Create the modal
  const modal = document.createElement("div");
  modal.id = "invoiceModal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.zIndex = "1000";
  modal.style.maxWidth = "600px";
  modal.style.width = "100%";
  modal.innerHTML = invoiceHTML;

  // Append the download button to the modal
  const downloadButton = document.createElement("button");
  downloadButton.id = "downloadButton";
  downloadButton.style.marginTop = "20px";
  downloadButton.style.padding = "10px 20px";
  downloadButton.style.backgroundColor = "#4CAF50";
  downloadButton.style.color = "white";
  downloadButton.style.border = "none";
  downloadButton.style.cursor = "pointer";
  downloadButton.innerText = "Download Invoice";
  modal.appendChild(downloadButton);

  // Append the modal and overlay to the body
  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  // Close modal when clicking the close button
  document.getElementById("closeButton").addEventListener("click", function () {
    overlay.remove();
    modal.remove();
  });

  // Download invoice as image when clicking the download button
  document
    .getElementById("downloadButton")
    .addEventListener("click", async function () {
      const invoiceContent = document.getElementById("invoiceContent");
      const dataUrl = await htmlToImage.toPng(invoiceContent);
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "invoice.png";
      link.click();
    });

  // Close modal when clicking outside of it
  overlay.addEventListener("click", function () {
    overlay.remove();
    modal.remove();
  });
}
/**
 * @description Handle the final stage of the booking
 * @param {*} bookingId
 * @param {*} actionType
 * @param {*} odometerValue
 * @returns
 */
async function handleFinalStage(bookingId, actionType, odometerValue) {
  try {
    const booking = await BidService.getBidById(bookingId);
    if (
      odometerValue == null ||
      odometerValue === "" ||
      Number(odometerValue) < 0
    ) {
      toast("error", "Invalid odometer reading").showToast();
      return;
    }
    if (
      booking.currentOdometer &&
      Number(odometerValue) <= Number(booking.currentOdometer)
    ) {
      toast(
        "error",
        "Final odometer reading must be greater than the initial one"
      ).showToast();
      return;
    }
    await BidService.updateOdometer(bookingId, actionType, odometerValue);
    toast("info", "Current odometer added successfully").showToast();
    if (actionType === "current") {
      await loadBookings();
      return;
    }
    //new amount calculation
    const newAmount =
      booking.amount +
      booking.car.ratePerKm *
        Math.max(
          Number(odometerValue) -
            Number(booking.currentOdometer) -
            Number(booking.car.fixedKilometer) *
              getDaysDiff(booking.startDate, booking.endDate),
          0
        );
    //update the bid with the new amount and trip completed
    await BidService.updateBid({
      id: bookingId,
      amount: newAmount,
      tripCompleted: true,
    });
    //generate invoice and send it to the user
    const invoiceHTML = await generateInvoice(booking, odometerValue);
    await sendInvoiceToUser(booking, invoiceHTML);
    //show the invoice modal
    showInvoiceModal(invoiceHTML);
    loadBookings();
  } catch (error) {
    console.log(error);
    toast("error", error.message).showToast();
  }
}
/**
 * @description Send the invoice to the user
 * @param {*} booking
 * @param {*} invoiceHTML
 */
async function sendInvoiceToUser(booking, invoiceHTML) {
  try {
    const convs = await ChatService.getConversationsByCarId(booking.carId);
    const user = await userService.getUserById(getCurrentUser().id);
    let convId = convs.filter((conv) =>
      conv.members.some((member) => member.id === user.id)
    );
    if (convId.length && convId[0].id) {
      // Create a temporary element to hold the invoice HTML
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = invoiceHTML;
      document.body.appendChild(tempDiv);

      // Use html-to-image to convert the HTML to an image
      const dataUrl = await htmlToImage.toPng(tempDiv, {
        style: { width: "auto", height: "auto", padding: "0", margin: "0" },
      });

      // Convert the image data URL to an array buffer
      const response = await fetch(dataUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Remove the temporary element
      document.body.removeChild(tempDiv);

      // Send the array buffer as an image in the chat message
      await ChatService.addChat({
        id: "",
        message: `Invoice for ${booking.car.name} from ${booking.startDate} to ${booking.endDate} has been generated`,
        conversationId: convId[0].id,
        image: arrayBuffer,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        sender: user.id,
        user: user,
      });
    }
  } catch (error) {
    console.log(error);
    toast("error", error.message).showToast();
  }
}
/**
 * @description Show the odometer modal
 * @param {*} bookingId
 * @param {*} actionType
 */
function showOdometerModal(bookingId, actionType) {
  const modal = document.createElement("div");
  modal.id = "odometerModal";
  modal.style.position = "fixed";
  modal.style.top = "50%";
  modal.style.left = "50%";
  modal.style.transform = "translate(-50%, -50%)";
  modal.style.backgroundColor = "white";
  modal.style.padding = "20px";
  modal.style.boxShadow = "0 0 15px rgba(0, 0, 0, 0.3)";
  modal.style.borderRadius = "8px";
  modal.style.zIndex = "1000";
  modal.style.width = "300px";
  modal.style.maxWidth = "90%";
  modal.style.display = "flex";
  modal.style.flexDirection = "column";
  modal.style.alignItems = "center";
  modal.style.gap = "15px";

  const overlay = document.createElement("div");
  overlay.id = "modalOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
  overlay.style.backdropFilter = "blur(5px)";
  overlay.style.zIndex = "999";

  modal.innerHTML = `
    <div style="width: 100%; display: flex; justify-content: flex-end;">
      <button style="background: none; border: none; font-size: 20px; cursor: pointer;" onclick="document.getElementById('odometerModal').remove(); document.getElementById('modalOverlay').remove();">&times;</button>
    </div>
    <h2 style="text-align: center; margin: 0;">${
      actionType === "current"
        ? "Enter current odometer reading:"
        : "Enter final odometer reading:"
    }</h2>
    <input type="number" id="odometerInput" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;" />
    <button id="submitOdometer" style="padding: 10px 20px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Submit</button>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);

  document
    .getElementById("submitOdometer")
    .addEventListener("click", async function () {
      const odometerValue = document.getElementById("odometerInput").value;
      if (odometerValue != null && odometerValue !== "") {
        await handleFinalStage(bookingId, actionType, odometerValue);
        document.getElementById("odometerModal").remove();
        document.getElementById("modalOverlay").remove();
      }
    });
}
/**
 * @description Event listeners for the dashboard
 */
function addEventListeners() {
  const carContainer = document.getElementById("carCardsGrid");
  const biddingContainer = document.getElementById("biddingContainer");
  const bookingContainer = document.getElementById("bookingContainer");
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
  // Listen for tab clicks
  document.querySelectorAll(".tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      // Remove active class from all tabs and add to the clicked one
      document
        .querySelectorAll(".tab-button")
        .forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Set the current tab (all-bookings, active-bookings, completed-bookings)
      currentTab = button.getAttribute("data-tab");
      currentPage = 1; // Reset pagination on tab change
      loadBookings();
    });
  });

  bookingContainer.addEventListener("click", async function (e) {
    if (e.target.classList.contains("add-odometer")) {
      const bookingId = e.target.getAttribute("data-id");
      const actionType = e.target.getAttribute("data-action");
      showOdometerModal(bookingId, actionType);
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
        loadBiddings();
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
        loadBiddings();
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
    currentPage = 1;
    loadBiddings();
  });
  carFilterForBooking.addEventListener("change", () => {
    currentPage = 1;
    loadBookings();
  });
  statusFilterForBidding.addEventListener("change", () => {
    currentPage = 1;
    loadBiddings();
  });
  sortFilterBidding.addEventListener("change", () => {
    currentPage = 1;
    loadBiddings();
  });
  sortFilterBooking.addEventListener("change", () => {
    currentPage = 1;
    loadBookings();
  });
  sortOrderBidding.addEventListener("change", () => {
    currentPage = 1;
    loadBiddings();
  });
  sortOrderBooking.addEventListener("change", () => {
    currentPage = 1;
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
    editCarForm.elements["ratePerKm"].value = Number(car.ratePerKm);
    editCarForm.elements["fixedKilometer"].value = Number(car.fixedKilometer);
    editCarForm.elements["rentalPriceOutStation"].value = Number(
      car.rentalPriceOutStation
    );
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
/**
 * @description Show loader
 */
function showLoader() {
  const main = document.querySelector(".dashboard-main");
  const loader = document.createElement("div");
  loader.className = "loader-overlay";
  loader.innerHTML = "<div class='loader'></div>";
  main.appendChild(loader);
}
/**
 * @description Hide Loader
 */
function hideLoader() {
  const loader = document.querySelector(".loader-overlay");
  if (loader) loader.remove();
}
export { loadCars, showLoader, hideLoader };
