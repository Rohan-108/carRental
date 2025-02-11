import DbService from "../../js/db.js";
import { getCurrentUser, toast } from "../../js/index.js";
import { getDaysDiff, cities, formatNumber } from "../../js/utils.js";
const commissionRate = 0.25;
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
const bookChartType = document.getElementById("bookChartType");
const bookingFilter = document.getElementById("bookingFilter");
const biddingCount = document.getElementById("biddingCount");
const bookingCount = document.getElementById("bookingCount");
const nOfCars = document.getElementById("noOfCars");
const totalRevenue = document.getElementById("revenue");
const rejectedBids = document.getElementById("rejectedBids");
const averageRentDay = document.getElementById("averageRentDay");
const revenueFilter = document.getElementById("revenueFilter");
const revenueChartType = document.getElementById("revenueChartType");
const dashboardContainer = document.querySelector(".dashboardPage");
const carFilterForBidding = document.getElementById("carFilter");
const statusFilterForBidding = document.getElementById("statusFilter");
const carFilterForBooking = document.getElementById("carFilterBooking");
const sortFilterBidding = document.getElementById("sortFilterBidding");
const sortFilterBooking = document.getElementById("sortFilterBooking");
const sortOrderBidding = document.getElementById("sortOrderBidding");
const sortOrderBooking = document.getElementById("sortOrderBooking");
let bookchart = null;
let revChart = null;
let dailyRevenueChart = null;
let compChart = null;
let currentPage = 1;
let pageSize = 5;
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
async function setup() {
  try {
    document
      .querySelectorAll(".dashboard-main > .hidden-section")
      .forEach((section) => (section.style.display = "none"));
    document.getElementById("dataSection").style.display = "flex";
    const cars = await DbService.searchAllByIndex(
      "cars",
      "userId",
      getCurrentUser().id
    );
    cars.forEach((car) => {
      const option = document.createElement("option");
      option.value = car.id;
      option.textContent = car.name;
      carFilterForBidding.appendChild(option);
      carFilterForBooking.appendChild(option.cloneNode(true));
    });
  } catch (error) {}
}
async function loadStat() {
  showLoader();
  try {
    const nCars = await DbService.countItemByIndex(
      "cars",
      "userId",
      getCurrentUser().id
    );
    const allBids = await DbService.searchAllByIndex(
      "bids",
      "ownerId",
      getCurrentUser().id
    );
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
async function loadCars(status = "true") {
  showLoader();
  try {
    const user = getCurrentUser();
    let cars = await DbService.searchAllByIndex("cars", "userId", user.id);
    cars = cars.filter((car) => car.show == status);
    const carCardsGrid = document.getElementById("carCardsGrid");
    const totalItems = cars.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    cars = cars.slice(start, start + pageSize);
    renderPagination(totalPages, currentPage, loadCars, "car-cards-section");
    carCardsGrid.innerHTML = "";
    cars.forEach((car) => {
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
    });
  } catch (error) {
    toast("error", "Error loading cars").showToast();
  } finally {
    hideLoader();
  }
}
async function loadBiddings() {
  showLoader();
  try {
    const statusValue = statusFilterForBidding.value;
    const filterValue = carFilterForBidding.value;
    let biddings = await DbService.searchAllByIndex(
      "bids",
      "ownerId",
      getCurrentUser().id
    );
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
    const totalItems = biddings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    biddings = biddings.slice(start, start + pageSize);
    renderPagination(totalPages, currentPage, loadBiddings, "bidding-section");
    const biddingTableBody = document.getElementById("biddingContainer");
    biddingTableBody.innerHTML = "";
    if (biddings.length === 0) {
      biddingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const bid of biddings) {
        const tr = document.createElement("tr");
        const car = await DbService.getItem("cars", bid.carId);
        const user = await DbService.getItem("users", bid.userId);
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
      "ownerId",
      getCurrentUser().id
    );
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
    const totalItems = bookings.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    bookings = bookings.slice(start, start + pageSize);
    renderPagination(totalPages, currentPage, loadBookings, "booking-section");
    const bookingTableBody = document.getElementById("bookingContainer");
    bookingTableBody.innerHTML = "";
    if (bookings.length === 0) {
      bookingTableBody.innerHTML = `<tr><td colspan="7" class="no-data">There is no data</td></tr>`;
    } else {
      for (const booking of bookings) {
        const tr = document.createElement("tr");
        const car = await DbService.getItem("cars", booking.carId);
        const user = await DbService.getItem("users", booking.userId);
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
  } catch (error) {
    toast("error", "Error loading bookings").showToast();
  } finally {
    hideLoader();
  }
}

async function approveBid(bidId, carId, startDate, endDate) {
  try {
    const user = getCurrentUser();
    const bid = await DbService.getItem("bids", bidId);
    const car = await DbService.getItem("cars", carId);
    await DbService.addItem("bookings", {
      ownerId: user.id,
      carId: carId,
      startDate: startDate,
      endDate: endDate,
      userId: bid.userId,
      amount: bid.amount,
      createdAt: Date.now(),
    });
    await DbService.updateItem("bids", { id: bidId, status: "approved" });
    const convs = await DbService.searchAllByIndex(
      "conversations",
      "carId",
      car.id
    );
    let convId = convs.filter((conv) => conv.members.includes(bid.userId));
    if (convId.length && convId[0].id) {
      await DbService.addItem("chat", {
        message: `Your bid for ${car.name} from ${startDate} to ${endDate} of amount Rs.${bid.amount} has been approved`,
        conversationId: convId[0].id,
        createdAt: Date.now(),
        sender: user.id,
      });
    }
    const allCaridbookings = await DbService.searchAllByIndex(
      "bids",
      "carId",
      carId
    );
    function parseCustomDate(dateStr) {
      return new Date(dateStr + "T00:00:00");
    }
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
        await DbService.updateItem("bids", {
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
async function cancelBid(bidId) {
  try {
    await DbService.updateItem("bids", { id: bidId, status: "rejected" });
    loadBiddings();
    toast("info", "Bid cancelled successfully").showToast();
  } catch (error) {
    toast("error", error.message).showToast();
  }
}

async function deleteCar(carId) {
  try {
    const prompt = confirm(
      `Are you sure you want to remove this car from listing?
      All pending bids will be rejected`
    );
    if (!prompt) return;
    const bids = await DbService.searchAllByIndex("bids", "carId", carId);
    // reject all pending bids
    bids.forEach(async (bid) => {
      if (bid.status == "pending") {
        await DbService.updateItem("bids", { id: bid.id, status: "rejected" });
      }
    });
    await DbService.updateItem("cars", { id: carId, show: "false" });
    toast("success", "Car deleted successfully").showToast();
    loadCars();
  } catch (error) {
    toast("error", "Error deleting car").showToast();
  }
}

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
  bookChartType.addEventListener("change", () => {
    bookingChart();
  });
  bookingFilter.addEventListener("change", () => {
    bookingChart();
  });
  revenueFilter.addEventListener("change", () => {
    revenueChart();
  });
  revenueChartType.addEventListener("change", () => {
    revenueChart();
  });
}
async function editCar(carId) {
  try {
    const car = await DbService.getItem("cars", carId);
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
async function bookingChart() {
  showLoader();
  try {
    const analyticsField = bookingFilter.value;
    const typeOfChart = bookChartType.value;
    const bids = await DbService.searchAllByIndex(
      "bids",
      "ownerId",
      getCurrentUser().id
    );
    const bidsWithCars = await Promise.all(
      bids.map(async (bid) => {
        const car = await DbService.getItem("cars", bid.carId);
        return { ...bid, car };
      })
    );
    let groupedData, datasetLabel;
    if (analyticsField === "status") {
      groupedData = groupData(bidsWithCars, (bid) => bid.status);
      datasetLabel = "Number of Bookings by Status";
      const data = buildChartData(groupedData, datasetLabel);
      loadChart(data, typeOfChart, "bookChart");
      return;
    }
    groupedData = groupDataForBids(bidsWithCars, (bid) => {
      if (bid.hasOwnProperty(analyticsField)) return bid[analyticsField];
      if (bid.car && bid.car.hasOwnProperty(analyticsField))
        return bid.car[analyticsField];
      return "Unknown";
    });
    datasetLabel =
      "Number of Bookings by " +
      analyticsField.charAt(0).toUpperCase() +
      analyticsField.slice(1);
    const data = buildChartDataForBids(groupedData, datasetLabel);
    loadChart(data, typeOfChart, "bookChart");
  } catch (error) {
    toast("error", "Error loading booking chart").showToast();
  } finally {
    hideLoader();
  }
}
async function revenueChart() {
  showLoader();
  try {
    const analyticsField = revenueFilter.value;
    const typeOfChart = revenueChartType.value;
    const bids = await DbService.searchAllByIndex(
      "bids",
      "ownerId",
      getCurrentUser().id
    );
    const bidsWithCars = await Promise.all(
      bids.map(async (bid) => {
        const car = await DbService.getItem("cars", bid.carId);
        return { ...bid, car };
      })
    );
    let groupedData, datasetLabel;
    groupedData = groupData(
      bidsWithCars,
      (bid) => {
        if (bid.hasOwnProperty(analyticsField)) return bid[analyticsField];
        if (bid.car && bid.car.hasOwnProperty(analyticsField))
          return bid.car[analyticsField];
        return "Unknown";
      },
      {
        summationField: "amount",
        status: analyticsField !== "status" ? "approved" : "all",
      }
    );
    datasetLabel =
      "Total Amount by " +
      analyticsField.charAt(0).toUpperCase() +
      analyticsField.slice(1);
    const data = buildChartData(groupedData, datasetLabel);
    loadChart(data, typeOfChart, "revenueChart", true);
  } catch (error) {
    toast("error", "Error loading booking chart").showToast();
  } finally {
    hideLoader();
  }
}
function groupDataForBids(bids, keyAccessor, options = {}) {
  const approved = {};
  const all = {};
  bids.forEach((bid) => {
    const key = keyAccessor(bid) || "Unknown";
    if (bid.status == "approved") {
      approved[key] = (approved[key] || 0) + 1;
    }
    all[key] = (all[key] || 0) + 1;
  });
  return { approved, all };
}
function groupData(items, keyAccessor, options = {}) {
  const grouped = {};
  const { summationField, status } = options;
  items.forEach((item) => {
    const key = keyAccessor(item) || "Unknown";
    if (summationField) {
      let val;
      if (status == "all") {
        val = Number(item[summationField]);
      } else {
        val = item.status == status ? Number(item[summationField]) : 0;
      }
      val *= getDaysDiff(item.startDate, item.endDate) * (1 - commissionRate);
      grouped[key] = (grouped[key] || 0) + val;
    } else {
      grouped[key] = (grouped[key] || 0) + 1;
    }
  });
  return grouped;
}
function buildChartDataForBids(groupedData) {
  const labels = Object.keys(groupedData.approved);
  const dataValuesForApproved = Object.values(groupedData.approved);
  const dataValuesForAll = Object.values(groupedData.all);
  const numItems = labels.length;
  return {
    labels: labels,
    datasets: [
      {
        label: "Bookings",
        data: dataValuesForApproved,
        backgroundColor: "rgba(0, 255, 0, 0.5)",
      },
      {
        label: "Bids",
        data: dataValuesForAll,
        backgroundColor: "rgba(255, 0, 0, 0.5)",
      },
    ],
  };
}
function buildChartData(groupedData, datasetLabel) {
  const labels = Object.keys(groupedData);
  const dataValues = Object.values(groupedData);
  const numItems = labels.length;
  return {
    labels: labels,
    datasets: [
      {
        label: datasetLabel,
        data: dataValues,
        backgroundColor: generateRandomColors(numItems, 0.5),
        borderColor: generateRandomColors(numItems, 1),
        borderWidth: 1,
      },
    ],
  };
}
function loadChart(data, chartType, id, isAmount = false) {
  const yAxisTicksCallback = isAmount
    ? (value) => "Rs. " + formatNumber(value)
    : (value) => (value % 1 === 0 ? formatNumber(value) : "");
  const ctx = document.getElementById(id).getContext("2d");
  if (id == "bookChart" && bookchart) bookchart.destroy();
  if (id == "revenueChart" && revChart) revChart.destroy();
  if (id === "chartComparison" && compChart) compChart.destroy();
  const chart = new Chart(ctx, {
    type: chartType,
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: data.datasets[0].label,
          font: { size: 20, weight: "bold" },
          color: "#333",
        },
        legend: {
          labels: {
            font: { size: 14, weight: "bold" },
            color: "#555",
          },
        },
      },
      scales:
        chartType === "pie" || chartType === "doughnut"
          ? {}
          : {
              y: {
                beginAtZero: true,
                ticks: {
                  font: { size: 14, weight: "bold" },
                  color: "#333",
                  callback: yAxisTicksCallback,
                },
              },
              x: {
                ticks: {
                  font: { size: 14, weight: "bold" },
                  color: "#333",
                },
              },
            },
    },
  });
  if (id == "bookChart") bookchart = chart;
  if (id == "revenueChart") revChart = chart;
  if (id === "chartComparison") compChart = chart;
}
function generateRandomColors(count, opacity) {
  const colors = [];
  for (let i = 0; i < count; i++) {
    const r = Math.floor(Math.random() * 256);
    const g = Math.floor(Math.random() * 256);
    const b = Math.floor(Math.random() * 256);
    colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
  }
  return colors;
}
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

async function loadDailyRevenueChart() {
  try {
    const startDateInput = document.getElementById("startDate").value;
    const endDateInput = document.getElementById("endDate").value;
    if (!startDateInput || !endDateInput) {
      toast("error", "Please select both start and end dates").showToast();
      return;
    }
    let bids = await DbService.searchAllByIndex(
      "bids",
      "ownerId",
      getCurrentUser().id
    );
    bids = bids.filter((bid) => bid.status == "approved");
    const filteredBids = bids.filter((bid) => {
      const createdDate = new Date(bid.createdAt).toISOString().split("T")[0];
      return createdDate >= startDateInput && createdDate <= endDateInput;
    });

    const revenuePerDay = {};
    filteredBids.forEach((bid) => {
      const dateKey = new Date(bid.createdAt).toISOString().split("T")[0];
      const days = getDaysDiff(bid.startDate, bid.endDate);
      const revenue = Number(bid.amount) * days * (1 - commissionRate);
      revenuePerDay[dateKey] = (revenuePerDay[dateKey] || 0) + revenue;
    });
    const labels = Object.keys(revenuePerDay).sort();
    const dataValues = labels.map((label) => revenuePerDay[label]);
    const data = {
      labels: labels,
      datasets: [
        {
          label: "Daily Revenue",
          data: dataValues,
          borderColor: "rgba(26, 188, 156, 1)",
          backgroundColor: "rgba(26, 188, 156, 0.2)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
    loadLineChart(data, "dailyRevenueChart");
  } catch (error) {
    console.log(error);
    toast("error", "Error loading daily revenue chart").showToast();
  }
}
async function loadComparisonChart() {
  try {
    const period = document.getElementById("comparisonPeriod").value;
    let bids = await DbService.searchAllByIndex(
      "bids",
      "ownerId",
      getCurrentUser().id
    );
    bids = bids.filter((bid) => bid.status === "approved");
    const commission = 0.25;
    let x;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (period === "day") {
      x = 1;
    } else if (period === "week") {
      x = 7;
    } else if (period === "month") {
      x = 30;
    }
    const currentStart = new Date(
      today.getTime() - (x - 1) * 24 * 60 * 60 * 1000
    );
    const currentEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const prevStart = new Date(
      currentStart.getTime() - x * 24 * 60 * 60 * 1000
    );
    const prevEnd = new Date(currentStart.getTime());
    const currentData = new Array(x).fill(0);
    const previousData = new Array(x).fill(0);
    const labels = [];
    for (let i = 0; i < x; i++) {
      const date = new Date(currentStart.getTime() + i * 24 * 60 * 60 * 1000);
      labels.push(
        date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
      );
    }
    bids.forEach((bid) => {
      const bidDate = new Date(bid.createdAt);
      const days = getDaysDiff(bid.startDate, bid.endDate);
      const revenue = Number(bid.amount) * days * (1 - commission);
      if (bidDate >= currentStart && bidDate < currentEnd) {
        const index = Math.floor(
          (bidDate.getTime() - currentStart.getTime()) / (24 * 60 * 60 * 1000)
        );
        if (index >= 0 && index < x) {
          currentData[index] += revenue;
        }
      } else if (bidDate >= prevStart && bidDate < prevEnd) {
        const index = Math.floor(
          (bidDate.getTime() - prevStart.getTime()) / (24 * 60 * 60 * 1000)
        );
        if (index >= 0 && index < x) {
          previousData[index] += revenue;
        }
      }
    });
    const data = {
      labels,
      datasets: [
        {
          label: "Previous Revenue (Rs)",
          data: previousData,
          fill: false,
          borderColor: "rgba(255, 99, 132, 1)",
          backgroundColor: "rgba(255, 99, 132, 0.2)",
          tension: 0.1,
        },
        {
          label: "Current Revenue (Rs)",
          data: currentData,
          fill: false,
          borderColor: "rgba(54, 162, 235, 1)",
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          tension: 0.1,
        },
      ],
    };
    loadChart(data, "line", "chartComparison", true);
  } catch (error) {
    console.log(error);
    toast("error", "Error loading comparison chart").showToast();
  }
}
function loadLineChart(data, canvasId) {
  const ctx = document.getElementById(canvasId).getContext("2d");
  if (dailyRevenueChart) {
    dailyRevenueChart.destroy();
  }
  dailyRevenueChart = new Chart(ctx, {
    type: "line",
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: data.datasets[0].label,
          font: { size: 20, weight: "bold" },
          color: "#333",
        },
        legend: {
          labels: {
            font: { size: 14, weight: "bold" },
            color: "#555",
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            font: { size: 14, weight: "bold" },
            color: "#333",
            callback: (value) => "Rs. " + formatNumber(value),
          },
        },
        x: {
          ticks: {
            font: { size: 14, weight: "bold" },
            color: "#333",
          },
        },
      },
    },
  });
}

document
  .getElementById("applyDateRange")
  .addEventListener("click", loadDailyRevenueChart);
document
  .getElementById("comparisonPeriod")
  .addEventListener("change", loadComparisonChart);

export { loadCars };
