import DbService from "./db.js";
import { getCurrentUser, toast } from "./index.js";
import {
  isValidPlateNumber,
  getDaysDiff,
  getFileFromInput,
  cities,
} from "./utils.js";
const commissionRate = 0.25;
const closeButton = document.getElementById("closeButton");
const editCloseButton = document.getElementById("editCloseButton");
const modal = document.getElementById("carModal");
const editModal = document.getElementById("editModal");
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
const archived = document.getElementById("archived");
let bookchart = null;
let revChart = null;
window.addEventListener("load", function () {
  loadStat();
  loadCars();
  loadBiddings();
  addEventListeners();
  bookingChart();
  revenueChart();
});
async function loadStat() {
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
        revenue += Number(bid.amount) * days * (1 - commissionRate);
      }
      totalDay += days;
      noOfBids++;
    }
    biddingCount.textContent = noOfBids;
    bookingCount.textContent = noOfApprovedBids;
    nOfCars.textContent = nCars;
    totalRevenue.textContent = `Rs.${revenue}`;
    rejectedBids.textContent = noOfRejectedBids;
    averageRentDay.textContent = `${Math.floor(totalDay / noOfBids)}`;
  } catch (error) {
    toast("error", "Error loading stat").showToast();
  }
}
async function loadCars(status = "true") {
  try {
    const user = getCurrentUser();
    let cars = await DbService.searchAllByIndex("cars", "userId", user.id);
    cars = cars.filter((car) => car.show == status);
    const carCardsGrid = document.getElementById("carCardsGrid");
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
            <button class="deleteCarBtn" data-id="${car.id}">Delete</button>
          </div>
        </div>
      `;

      carCardsGrid.appendChild(card);
    });
    const carFilter = document.getElementById("carFilter");
    carFilter.innerHTML = `<option value="all">All Cars</option>`;
    cars.forEach((car) => {
      const option = document.createElement("option");
      option.value = car.id;
      option.textContent = car.name;
      carFilter.appendChild(option);
    });
  } catch (error) {
    toast("error", "Error loading cars").showToast();
  }
}
async function loadBiddings() {
  const statusValue = document.getElementById("statusFilter").value;
  const filterValuee = document.getElementById("carFilter").value;
  let biddings = await DbService.searchAllByIndex(
    "bids",
    "ownerId",
    getCurrentUser().id
  );
  biddings = biddings.filter((bid) => bid.status === statusValue);
  if (filterValuee !== "all") {
    biddings = biddings.filter((bid) => bid.carId == filterValuee);
  }
  const biddingTableBody = document.querySelector("#biddingTable tbody");
  biddingTableBody.innerHTML = "";

  biddings.forEach(async (bid) => {
    const tr = document.createElement("tr");
    const car = await DbService.getItem("cars", bid.carId);
    const user = await DbService.getItem("users", bid.userId);
    tr.innerHTML = `
    <td data-label="BID ID">${bid.id}</td>
    <td data-label="Car Name" data-id="${car.id}">${car.name}</td>
    <td data-label="Renter" data-id="${user.id}">${user.name}</td>
    <td data-label="Start Date">${bid.startDate}</td>
    <td data-label="End Date">${bid.endDate}</td>
    <td data-label="Amount">Rs.${bid.amount}/day</td>
    ${
      statusValue === "pending"
        ? `<td data-label="Actions">
      <button class="approveBid" data-id="${bid.id}" data-car="${bid.carId}" data-start="${bid.startDate}" data-end="${bid.endDate}">Approve</button>
      <button class="cancelBid" data-id="${bid.id}">Cancel</button>
    </td>`
        : `<td data-label="Status">${statusValue}</td>`
    }
  `;
    biddingTableBody.appendChild(tr);
  });
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
    await DbService.updateItem("bids", {
      id: bidId,
      status: "approved",
    });
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

    allCaridbookings.forEach(async (bid) => {
      const bidStart = parseCustomDate(bid.startDate);
      const bidEnd = parseCustomDate(bid.endDate);
      const compStart = parseCustomDate(startDate);
      const compEnd = parseCustomDate(endDate);
      if (
        bid.id != bidId &&
        ((bidStart.getTime() >= compStart.getTime() &&
          bidStart.getTime() <= compEnd.getTime()) ||
          (bidEnd.getTime() >= compStart.getTime() &&
            bidEnd.getTime() <= compEnd.getTime()))
      ) {
        await DbService.updateItem("bids", {
          id: bid.id,
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
    await DbService.updateItem("bids", {
      id: bidId,
      status: "rejected",
    });
    loadBiddings();
    toast("info", "Bid cancelled successfully").showToast();
  } catch (error) {
    toast("error", error.message).showToast();
  }
}
editCarForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const carId = editCarForm.dataset.id;
    const car = await DbService.getItem("cars", carId);
    const rentalPrice = editCarForm.elements["rentalPrice"].value?.trim();
    const minRentalPeriod = editCarForm.elements["minRental"].value?.trim();
    const maxRentalPeriod = editCarForm.elements["maxRental"].value?.trim();
    const location = editCarForm.elements["location"].value?.trim();
    const fileInput = editCarForm.elements["carImage"];
    if (Number(minRentalPeriod) > Number(maxRentalPeriod)) {
      toast(
        "error",
        "Minimum rental period cannot be greater than maximum rental period"
      ).showToast();
      return;
    }
    if (fileInput) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      const maxSizeInBytes = 500 * 1024;
      for (const file of fileInput.files) {
        if (file.size > maxSizeInBytes) {
          toast("error", "Image must be less than 500KB").showToast();
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          toast("error", "Image must be of type PNG, JPEG, or JPG").showToast();
          return;
        }
      }
    }
    let imagesBuffer = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      const buffer = await getFileFromInput(fileInput, i);
      imagesBuffer.push(buffer);
    }
    await DbService.updateItem("cars", {
      id: carId,
      rentalPrice,
      maxRentalPeriod,
      minRentalPeriod,
      location,
      images: imagesBuffer.length ? imagesBuffer : car.images,
    });
    toast("success", "Updated Successfully").showToast();
    editModal.style.display = "none";
    loadCars();
  } catch (error) {
    console.log(error);
    toast("error", "Something went wrong").showToast();
  }
});
addCarForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const currentUser = getCurrentUser();
    const name = addCarForm.elements["carName"].value?.trim();
    const vehicleType = addCarForm.elements["vehicleType"].value?.trim();
    const nseats = addCarForm.elements["seats"].value?.trim();
    const fuelType = addCarForm.elements["fuelType"].value?.trim();
    const transmission = addCarForm.elements["transmission"].value?.trim();
    const rentalPrice = addCarForm.elements["rentalPrice"].value?.trim();
    const minRentalPeriod = addCarForm.elements["minRental"].value?.trim();
    const maxRentalPeriod = addCarForm.elements["maxRental"].value?.trim();
    const plateNumber = addCarForm.elements["plateNumber"].value?.trim();
    const location = addCarForm.elements["location"].value?.trim();
    const fileInput = addCarForm.elements["carImage"];
    if (!isValidPlateNumber(plateNumber)) {
      toast("error", "Invalid plate number").showToast();
      return;
    }
    if (Number(minRentalPeriod) > Number(maxRentalPeriod)) {
      toast(
        "error",
        "Minimum rental period cannot be greater than maximum rental period"
      ).showToast();
      return;
    }
    if (fileInput) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (fileInput.files.length < 1 || fileInput.files.length > 3) {
        toast(
          "error",
          "Please select at least one or less than 3 image"
        ).showToast();
        return;
      }
      const maxSizeInBytes = 500 * 1024;
      for (const file of fileInput.files) {
        if (file.size > maxSizeInBytes) {
          toast("error", "Image must be less than 500KB").showToast();
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          toast("error", "Image must be of type PNG, JPEG, or JPG").showToast();
          return;
        }
      }
    }
    let imagesBuffer = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      const buffer = await getFileFromInput(fileInput, i);
      imagesBuffer.push(buffer);
    }
    await DbService.addItem("cars", {
      userId: currentUser.id,
      name: name,
      plateNumber,
      vehicleType,
      seats: nseats,
      fuelType,
      transmission,
      rentalPrice,
      minRentalPeriod,
      maxRentalPeriod,
      location,
      show: "true",
      images: imagesBuffer,
      createdAt: Date.now(),
    });
    toast("success", "Car added successfully").showToast();
    loadCars();
    modal.style.display = "none";
  } catch (error) {
    console.log(error);
    toast("error", "Failed to add car").showToast();
  }
});

function addEventListeners() {
  const carContainer = document.getElementById("carCardsGrid");
  const biddingConatiner = document.getElementById("biddingConatiner");
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
  biddingConatiner.addEventListener("click", (e) => {
    const approveButton = e.target.closest(".approveBid");
    const cancelButton = e.target.closest(".cancelBid");
    if (cancelButton && cancelButton.dataset.id) {
      const carId = cancelButton.dataset.id;
      cancelBid(carId);
    }
    if (approveButton && approveButton.dataset.id) {
      const bidId = approveButton.dataset.id;
      const carId = approveButton.dataset.car;
      const start = approveButton.dataset.start;
      const end = approveButton.dataset.end;
      approveBid(bidId, carId, start, end);
    }
  });
  closeButton?.addEventListener("click", () => {
    modal.style.display = "none";
  });
  addCarButton?.addEventListener("click", () => {
    modal.style.display = "block";
    addCarForm.elements["location"].innerHTML = "";
    cities.forEach((city) => {
      const option = document.createElement("option");
      option.value = city;
      option.textContent = city;
      addCarForm.elements["location"].appendChild(option);
    });
  });
  document.getElementById("carFilter").addEventListener("change", (e) => {
    loadBiddings();
  });
  document.getElementById("statusFilter").addEventListener("change", (e) => {
    loadBiddings();
  });
  editCloseButton?.addEventListener("click", () => {
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
  archived.addEventListener("change", (e) => {
    loadCars(e.target.value);
  });
}

async function deleteCar(carId) {
  try {
    const ok = prompt(
      "Deleting car will also reject all pending biddings",
      "type yes to delete the car"
    );
    if (!ok || ok !== "yes") {
      toast("success", "Car isn't deleted").showToast();
      return;
    }
    await DbService.updateItem("cars", {
      id: carId,
      show: "false",
    });
    const bids = await DbService.searchAllByIndex("bids", "carId", carId);
    bids.forEach(async (bid) => {
      if (bid.status !== "approved")
        await DbService.updateItem("bids", {
          id: bid.id,
          status: "rejected",
        });
    });
    toast("success", "Car Deleted Successfully").showToast();
    loadBiddings();
    loadCars();
  } catch (error) {
    toast("error", "Error deleting car").showToast();
  }
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
    console.log(error);
    toast("error", "error setting car detail").showToast();
  }
}

async function bookingChart() {
  try {
    const analyticsField = bookingFilter?.value;
    const typeOfChart = bookChartType?.value;
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
      groupedData = groupData(bidsWithCars, (bid) => {
        return bid.status;
      });
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
    console.log(error);
    toast("error", "Error loading booking chart").showToast();
  }
}
async function revenueChart() {
  try {
    const analyticsField = revenueFilter?.value;
    const typeOfChart = revenueChartType?.value;
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
    console.log(error);
    toast("error", "Error loading booking chart").showToast();
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
  console.log("approved", dataValuesForApproved);
  console.log("all", dataValuesForAll);
  console.log(labels);
  const numItems = labels.length;
  return {
    labels: labels,
    datasets: [
      {
        label: "Bookings",
        data: dataValuesForApproved,
        backgroundColor: generateRandomColors(numItems, 0.5),
        borderColor: generateRandomColors(numItems, 1),
        borderWidth: 1,
      },
      {
        label: "Bids",
        data: dataValuesForAll,
        backgroundColor: generateRandomColors(numItems, 0.5),
        borderColor: generateRandomColors(numItems, 1),
        borderWidth: 1,
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
    ? function (value) {
        return "Rs. " + value;
      }
    : function (value) {
        return value % 1 === 0 ? value : "";
      };
  const ctx = document.getElementById(id).getContext("2d");
  if (id == "bookChart" && bookchart) bookchart.destroy();
  if (id == "revenueChart" && revChart) revChart.destroy();
  const chart = new Chart(ctx, {
    type: chartType,
    data: data,
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: data.datasets[0].label,
          font: {
            size: 20,
            weight: "bold",
          },
          color: "#333",
        },
        legend: {
          labels: {
            font: {
              size: 14,
              weight: "bold",
            },
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
                  font: {
                    size: 14,
                    weight: "bold",
                  },
                  color: "#333",
                  callback: yAxisTicksCallback,
                },
              },
              x: {
                ticks: {
                  font: {
                    size: 14,
                    weight: "bold",
                  },
                  color: "#333",
                },
              },
            },
    },
  });
  if (id == "bookChart") bookchart = chart;
  if (id == "revenueChart") revChart = chart;
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
