import { toast } from "./index.js";
import DbService from "./db.js";
import { getDaysDiff, formatNumber } from "./utils.js";
const dashboardContainer = document.querySelector(".dashboardPage");
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
      document.getElementById("home").style.display = "flex";
      loadStat();
      break;
    case "stat":
      document.getElementById("carChart").style.display = "flex";
      document.getElementById("bookingsChart").style.display = "flex";
      carChart();
      bookingChart();
      break;
    case "analytics":
      document.getElementById("revenueChart").style.display = "flex";
      revenueChart();
      break;
    case "approvals":
      document.getElementById("approvals").style.display = "flex";
      loadApprovals();
      break;
  }
});
function addEventListeners() {
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
  document
    .getElementById("sortOrderApproval")
    .addEventListener("change", () => {
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
window.addEventListener("load", () => {
  loadStat();
  addEventListeners();
});
async function loadApprovals() {
  try {
    showLoader();
    const approvalBody = document.getElementById("approvalsBody");
    const approvalFilterValue = document.getElementById("approvalFilter").value;
    const sortFilterValue = document.getElementById("sortFilterApproval").value;
    const sortOrderValue = document.getElementById("sortOrderApproval").value;
    let approvals = await DbService.getAllItems("approvals");
    if (approvalFilterValue !== "all") {
      approvals = approvals.filter((app) => app.status === approvalFilterValue);
    }
    if (sortFilterValue === "date") {
      approvals = approvals.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    }
    if (sortOrderValue === "desc") {
      approvals.reverse();
    }
    if (approvals.length === 0) {
      approvalBody.innerHTML = `<tr><td colspan="5" class="no-data">There is no data</td></tr>`;
      return;
    }
    approvalBody.innerHTML = "";
    for (const app of approvals) {
      const tr = document.createElement("tr");
      const user = await DbService.getItem("users", app.userId);
      tr.innerHTML = `
        <td data-label="Name">${app.name}</td>
        <td data-label="Adhaar">${user.adhaar}</td>
        <td data-label="Email">${app.email}</td>
        <td data-label="Request Date">${new Date(
          app.createdAt
        ).toDateString()}</td>
        ${
          app.status === "pending"
            ? `<td data-label="Actions">
                <button class="btn-approve" data-id="${app.id}">Approve</button>
                <button class="btn-deny" data-id="${app.id}">Cancel</button>
              </td>`
            : `<td data-label="Status">${app.status}</td>`
        }
      `;
      approvalBody.appendChild(tr);
    }
  } catch (error) {
    toast("error", "Error loading approvals").showToast();
  } finally {
    hideLoader();
  }
}
async function loadStat() {
  showLoader();
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
      if (bid.status === "pending") {
        noOfPendingBids++;
      } else if (bid.status === "rejected") {
        noOfRejectedBids++;
      } else {
        noOfApprovedBids++;
        revenue += Number(bid.amount) * days * commissionRate;
      }
      totalDay += days;
      noOfBids++;
    }
    biddingCount.textContent = formatNumber(noOfBids);
    bookingCount.textContent = formatNumber(noOfApprovedBids);
    conversionRatio.textContent = `${Math.floor(
      (noOfApprovedBids / noOfBids) * 100
    )}%`;
    noOfAdmin.textContent = formatNumber(nUsers);
    nOfCars.textContent = formatNumber(nCars);
    totalRevenue.textContent = `Rs.${formatNumber(revenue)}`;
    rejectedBids.textContent = formatNumber(noOfRejectedBids);
    averageRentDay.textContent = `${Math.floor(totalDay / noOfBids)} days`;
  } catch (error) {
    toast("error", "Error loading stats").showToast();
  } finally {
    hideLoader();
  }
}
async function approveRequest(id) {
  try {
    const approval = await DbService.getItem("approvals", id);
    await DbService.updateItem("approvals", { id, status: "approved" });
    await DbService.updateItem("users", { id: approval.userId, role: "admin" });
    toast("success", "Request approved").showToast();
    loadApprovals();
  } catch (error) {
    toast("error", "Error approving request").showToast();
  }
}
async function denyRequest(id) {
  try {
    await DbService.updateItem("approvals", { id, status: "rejected" });
    toast("success", "Request rejected").showToast();
    loadApprovals();
  } catch (error) {
    toast("error", "Error denying request").showToast();
  }
}
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
  }
}
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
    loadChart(data, typeOfChart, "chartRevenue", true);
  } catch (error) {
    console.log(error);
    toast("error", "Error loading revenue chart").showToast();
  }
}
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
function groupData(items, keyAccessor, options = {}) {
  const grouped = {};
  const { summationField, status } = options;
  items.forEach((item) => {
    const key = keyAccessor(item) || "Unknown";
    if (summationField) {
      let val;
      if (status === "all") {
        val = Number(item[summationField]);
      } else {
        val = item.status === status ? Number(item[summationField]) : 0;
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
function groupDataForBids(bids, keyAccessor, options = {}) {
  const approved = {};
  const all = {};
  bids.forEach((bid) => {
    const key = keyAccessor(bid) || "Unknown";
    if (bid.status === "approved") {
      approved[key] = (approved[key] || 0) + 1;
    }
    all[key] = (all[key] || 0) + 1;
  });
  return { approved, all };
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
        backgroundColor: "rgba(54, 162, 235, 0.5)",
      },
      {
        label: "Bids",
        data: dataValuesForAll,
        backgroundColor: "rgba(255, 99, 132, 0.5)",
      },
    ],
  };
}
function loadChart(data, chartType, id, isAmount = false) {
  const ctx = document.getElementById(id);
  if (id === "chart" && carschart) {
    carschart.destroy();
  }
  if (id === "bookChart" && bookingsChart) {
    bookingsChart.destroy();
  }
  if (id === "chartRevenue" && revenueCharts) {
    revenueCharts.destroy();
  }
  const yAxisTicksCallback = isAmount
    ? (value) => "Rs. " + formatNumber(value)
    : (value) => (value % 1 === 0 ? value : "");
  const chartInstance = new Chart(ctx, {
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
  if (id === "chart") {
    carschart = chartInstance;
  }
  if (id === "bookChart") {
    bookingsChart = chartInstance;
  }
  if (id === "chartRevenue") {
    revenueCharts = chartInstance;
  }
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
