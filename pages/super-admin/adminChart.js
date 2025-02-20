import { getDaysDiff, formatNumber } from "../../js/utils.js";
import { toast } from "../../js/index.js";
import carService from "../../js/services/carService.js";
import BidService from "../../js/services/BidService.js";
import { showLoader, hideLoader } from "./admin.js";
//dom elements
const chartType = document.getElementById("chartType");
const carfilter = document.getElementById("carfilter");
const bookChartType = document.getElementById("bookChartType");
const bookingFilter = document.getElementById("bookingFilter");
const revenueFilter = document.getElementById("revenueFilter");
const revenueChartType = document.getElementById("revenueChartType");

let carschart = null;
let bookingsChart = null;
let revenueCharts = null;
let dailyRevenueChart = null;
let compChart = null;
const commissionRate = 0.25;

window.addEventListener("load", () => {
  addEventListeners();
});

/**
 * @description Add Event Listeners for the chart filters
 */
function addEventListeners() {
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

  document
    .getElementById("comparisonPeriod")
    .addEventListener("change", loadComparisonChart);

  document
    .getElementById("applyDateRange")
    .addEventListener("click", loadDailyRevenueChart);
}

/**
 * @description Booking Chart Data
 * @returns
 */
async function bookingChart() {
  try {
    showLoader();
    const analyticsField = bookingFilter?.value;
    const typeOfChart = bookChartType?.value;
    const bids = await BidService.getAllBids();
    let groupedData, datasetLabel;
    if (analyticsField === "status") {
      groupedData = groupData(bids, (bid) => bid.status);
      datasetLabel = "Number of Bookings by Status";
      const data = buildChartData(groupedData, datasetLabel);
      loadChart(data, typeOfChart, "bookChart");
      return;
    }
    groupedData = groupDataForBids(bids, (bid) => {
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
/**
 * @description Revenue Chart
 */
async function revenueChart() {
  try {
    showLoader();
    const analyticsField = revenueFilter?.value;
    const typeOfChart = revenueChartType?.value;
    const bids = await BidService.getAllBids();
    let groupedData, datasetLabel;
    groupedData = groupData(
      bids,
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
    console.error(error);
    toast("error", "Error loading revenue chart").showToast();
  } finally {
    hideLoader();
  }
}
/**
 * @description Car Chart
 */
async function carChart() {
  try {
    showLoader();
    const cars = await carService.getCarsByIndex("show", "true");
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
  } finally {
    hideLoader();
  }
}
/**
 * @description Load Daily Revenue Chart
 * @returns
 */
async function loadDailyRevenueChart() {
  try {
    showLoader();
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
    let bids = await BidService.getAllBids();
    bids = bids.filter((bid) => bid.status == "approved");
    const filteredBids = bids.filter((bid) => {
      const createdDate = new Date(bid.createdAt).toISOString().split("T")[0];
      return createdDate >= startDateInput && createdDate <= endDateInput;
    });

    const revenuePerDay = {};
    filteredBids.forEach((bid) => {
      const dateKey = new Date(bid.createdAt).toISOString().split("T")[0];
      const revenue = Number(bid.amount) * commissionRate;
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
  } finally {
    hideLoader();
  }
}

//<--------------------------------Helper Function----------------------->
/**
 * @description Group data for the chart (generic)
 * @param {*} items
 * @param {*} keyAccessor
 * @param {*} options
 * @returns
 */
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
      val *= key === "email" ? 1 - commissionRate : commissionRate;
      grouped[key] = (grouped[key] || 0) + val;
    } else {
      grouped[key] = (grouped[key] || 0) + 1;
    }
  });
  return grouped;
}
/**
 * @description Group Data for Bids
 * @param {*} bids
 * @param {*} keyAccessor
 * @param {*} options
 * @returns
 */
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
/**
 * @description Build Chart Data
 * @param {*} groupedData
 * @param {*} datasetLabel
 * @returns
 */
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
/**
 * @description Build Chart Data for Bids
 * @param {*} groupedData
 * @returns
 */
function buildChartDataForBids(groupedData) {
  const labels = Object.keys(groupedData.approved);
  const dataValuesForApproved = Object.values(groupedData.approved);
  const dataValuesForAll = Object.values(groupedData.all);
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
/**
 * @description Load Chart
 */
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
/**
 * @description generate Random Colors
 * @param {*} count
 * @param {*} opacity
 * @returns
 */
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
/**
 * @description Load Line Chart
 * @param {*} data
 * @param {*} canvasId
 */
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

/**
 * @description Load Comparison Chart
 */
async function loadComparisonChart() {
  try {
    const period = document.getElementById("comparisonPeriod").value;
    let bids = await BidService.getAllBids();
    bids = bids.filter((bid) => bid.status === "approved");
    const commission = 0.25;
    //grouping data for comparison of x days before today and x days before that
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
    //grouping data on the basis of date
    bids.forEach((bid) => {
      const bidDate = new Date(bid.createdAt);
      const revenue = Number(bid.amount) * commission;
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

export {
  revenueChart,
  bookingChart,
  loadComparisonChart,
  loadDailyRevenueChart,
  carChart,
};
