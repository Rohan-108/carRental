import { getCurrentUser, toast } from "./index.js";
import DbService from "./db.js";
const biddingCount = document.getElementById("biddingCount");
const bookingCount = document.getElementById("bookingCount");
const noOfAdmin = document.getElementById("noOfAdmin");
const nOfCars = document.getElementById("noOfCars");
const totalRevenue = document.getElementById("revenue");
const rejectedBids = document.getElementById("rejectedBids");
const averageRentDay = document.getElementById("averageRentDay");
const conversionRatio = document.getElementById("conversionRatio");
const chartType = document.getElementById("chartType");
const carfilter = document.getElementById("carfilter");
const bookChartType = document.getElementById("bookChartType");
const bookingFilter = document.getElementById("bookingFilter");
const revenueFilter = document.getElementById("revenueFilter");
const revenueChartType = document.getElementById("revenueChartType");
const commissionRate = 0.25;
let carschart = null;
let bookingsChart = null;
let revenueCharts = null;
window.addEventListener("load", () => {
  loadApprovals();
  loadStat();
  addEventListener();
  carChart();
  bookingChart();
  revenueChart();
});
async function loadApprovals() {
  try {
    const approvalBody = document.getElementById("approvalsBody");
    const approvalFilterValue = document.getElementById("approvalFilter").value;
    let approvals = await DbService.getAllItems("approvals");
    approvals = approvals.filter((app) => app.status == approvalFilterValue);
    approvalBody.innerHTML = "";
    approvals.forEach((app) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
      <td data-label="Approval ID">${app.id}</td>
      <td data-label="User ID">${app.userId}</td>
      <td data-label="Email">${app.email}</td>
      <td data-label="Request Date">${new Date(
        app.createdAt
      ).toDateString()}</td>
      ${
        approvalFilterValue == "pending"
          ? `<td data-label="Actions">
        <button class="btn-approve" data-id="${app.id}">Approve</button>
        <button class="btn-deny" data-id="${app.id}">Cancel</button>
      </td>`
          : `<td data-label="Status">${approvalFilterValue}</td>`
      }
    `;

      approvalBody.appendChild(tr);
    });
  } catch (error) {
    console.log(error);
    toast("error", "Error loading approvals").showToast();
  }
}
async function loadStat() {
  try {
    const nUsers = await DbService.countItems("users", "id");
    const nCars = await DbService.countItems("cars", "id");

    const allBids = await DbService.getAllItems("bids");
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
        revenue += Number(bid.amount) * days * commissionRate; //25% commission
      }
      totalDay += days;
      noOfBids++;
    }
    //assigning data
    biddingCount.textContent = noOfBids;
    bookingCount.textContent = noOfApprovedBids;
    conversionRatio.textContent = `${Math.floor(
      (noOfApprovedBids / noOfBids) * 100
    )}%`;
    noOfAdmin.textContent = nUsers;
    nOfCars.textContent = nCars;
    totalRevenue.textContent = `Rs.${revenue}`;
    rejectedBids.textContent = noOfRejectedBids;
    averageRentDay.textContent = `${Math.floor(totalDay / noOfBids)}`;
  } catch (error) {
    toast("error", "Error loading stat").showToast();
  }
}
function addEventListener() {
  const approvalBody = document.getElementById("approvalsBody");
  approvalBody.addEventListener("click", (e) => {
    const approve = e.target.closest(".btn-approve");
    const deny = e.target.closest(".btn-deny");
    if (approve && approve.dataset.id) {
      approveRequest(approve.dataset.id);
    }
    if (deny && deny.dataset.id) {
      denyRequest(deny.dataset.id);
    }
  });
  document.getElementById("approvalFilter").addEventListener("change", () => {
    loadApprovals();
  });
  chartType.addEventListener("change", () => {
    carChart();
  });
  carfilter.addEventListener("change", () => {
    carChart();
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
async function approveRequest(id) {
  try {
    const user = getCurrentUser();
    const approval = await DbService.getItem("approvals", id);
    await DbService.updateItem("approvals", {
      id,
      status: "approved",
    });
    await DbService.updateItem("users", { id: approval.userId, role: "admin" });
    toast("success", "Request approved").showToast();
    loadApprovals();
  } catch (error) {
    toast("error", "Error approving request").showToast();
  }
}

async function denyRequest(id) {
  try {
    await DbService.updateItem("approvals", {
      id,
      status: "rejected",
    });
    toast("success", "Request rejected").showToast();
    loadApprovals();
  } catch (error) {
    toast("error", "Error denying request").showToast();
  }
}

// bookingChart Function
async function bookingChart() {
  try {
    const analyticsField = bookingFilter?.value;
    const typeOfChart = bookChartType?.value;
    const bids = await DbService.getAllItems("bids");
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
//revenueChart Function
async function revenueChart() {
  try {
    const analyticsField = revenueFilter?.value;
    const typeOfChart = revenueChartType?.value;
    const bids = await DbService.getAllItems("bids");
    const bidsWithCars = await Promise.all(
      bids.map(async (bid) => {
        const car = await DbService.getItem("cars", bid.carId);
        const owner = await DbService.getItem("users", bid.ownerId);
        return { ...bid, car, owner };
      })
    );
    let groupedData, datasetLabel;
    groupedData = groupData(
      bidsWithCars,
      (bid) => {
        if (bid.hasOwnProperty(analyticsField)) return bid[analyticsField];
        if (bid.car && bid.car.hasOwnProperty(analyticsField))
          return bid.car[analyticsField];
        if (bid.owner && bid.owner.hasOwnProperty(analyticsField))
          return bid.owner[analyticsField];
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
    toast("error", "Error loading revenue chart").showToast();
  }
}
// carChart Function
async function carChart() {
  try {
    const cars = await DbService.searchAllByIndex("cars", "show", "true");
    const analyticsField = carfilter?.value;
    const typeOfChart = chartType?.value;
    const groupedData = groupData(cars, (car) => car[analyticsField]);
    const datasetLabel =
      "Number of Cars by " +
      analyticsField.charAt(0).toUpperCase() +
      analyticsField.slice(1);
    const data = buildChartData(groupedData, datasetLabel);
    loadChart(data, typeOfChart, "chart");
  } catch (error) {
    toast("error", "Error loading car chart").showToast();
  }
}

//utils
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
      val *=
        getDaysDiff(item.startDate, item.endDate) *
        (key === "email" ? 1 - commissionRate : commissionRate);
      grouped[key] = (grouped[key] || 0) + val;
    } else {
      grouped[key] = (grouped[key] || 0) + 1;
    }
  });
  return grouped;
}

function buildChartData(groupedData, datasetLabel) {
  let labels = Object.keys(groupedData);
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
  const ctx = document.getElementById(id).getContext("2d");
  if (id == "chart" && carschart) {
    carschart.destroy();
  }
  if (id == "bookChart" && bookingsChart) {
    bookingsChart.destroy();
  }
  if (id == "revenueChart" && revenueCharts) {
    revenueCharts.destroy();
  }

  const yAxisTicksCallback = isAmount
    ? function (value) {
        return "Rs. " + value;
      }
    : function (value) {
        return value % 1 === 0 ? value : "";
      };
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

  if (id === "chart") {
    carschart = chart;
  }
  if (id === "bookChart") bookingsChart = chart;
  if (id === "revenueChart") revenueCharts = chart;
}
function getDaysDiff(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMilliseconds = end - start;
  const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24)) + 1;
  return diffInDays;
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
