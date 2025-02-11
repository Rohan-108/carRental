import { toast } from "../../js/index.js";
import DbService from "../../js/db.js";
import { getDaysDiff, formatNumber } from "../../js/utils.js";
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
let currentPage = 1;
let pageSize = 5;
let carschart = null;
let bookingsChart = null;
let revenueCharts = null;
let dailyRevenueChart = null;
let compChart = null;
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
      document.getElementById("dailyRevenueChartSection").style.display =
        "flex";
      document.getElementById("comparisonChart").style.display = "flex ";
      const today = new Date();
      const endDate = today.toISOString().split("T")[0];
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startDate = startOfMonth.toISOString().split("T")[0];
      document.getElementById("startDate").value = startDate;
      document.getElementById("endDate").value = endDate;
      revenueChart();
      loadDailyRevenueChart();
      loadComparisonChart();
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
async function setup() {
  loadStat();
}
window.addEventListener("load", () => {
  setup();
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
    const totalItems = approvals.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    approvals = approvals.slice(start, start + pageSize);
    renderPagination(totalPages, currentPage, loadApprovals, "approvals");
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
                <button class="btn-approve" style="background-color:green;
                color:#fff;border-radius:1rem;" data-id="${app.id}">Approve</button>
                <button class="btn-deny" style="background-color:red;
                color:#fff;border-radius:1rem;"  data-id="${app.id}">Cancel</button>
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
    const prompt = confirm("Do you want to approve this request?");
    if (!prompt) return;
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
    const prompt = confirm("Do you want to reject this request?");
    if (!prompt) return;
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
  if (id === "chartComparison" && compChart) {
    compChart.destroy();
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
  if (id === "chartComparison") {
    compChart = chartInstance;
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
    if (startDateInput > endDateInput) {
      toast("error", "Start date should be less than end date").showToast();
      return;
    }
    let bids = await DbService.getAllItems("bids");
    bids = bids.filter((bid) => bid.status == "approved");
    const filteredBids = bids.filter((bid) => {
      const createdDate = new Date(bid.createdAt).toISOString().split("T")[0];
      return createdDate >= startDateInput && createdDate <= endDateInput;
    });

    const revenuePerDay = {};
    filteredBids.forEach((bid) => {
      const dateKey = new Date(bid.createdAt).toISOString().split("T")[0];
      const days = getDaysDiff(bid.startDate, bid.endDate);
      const revenue = Number(bid.amount) * days * commissionRate;
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

//comparison chart
async function loadComparisonChart() {
  try {
    const period = document.getElementById("comparisonPeriod").value;
    let bids = await DbService.getAllItems("bids");
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
      const revenue = Number(bid.amount) * days * commission;
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

document
  .getElementById("comparisonPeriod")
  .addEventListener("change", loadComparisonChart);
