import { toast } from "../../js/index.js";
import ApprovalService from "../../js/services/ApprovalService.js";
import userService from "../../js/services/userService.js";
import carService from "../../js/services/carService.js";
import { getDaysDiff, formatNumber } from "../../js/utils.js";
import BidService from "../../js/services/BidService.js";
import {
  revenueChart,
  loadComparisonChart,
  loadDailyRevenueChart,
  carChart,
  bookingChart,
} from "./adminChart.js";
//dom elements
const dashboardContainer = document.querySelector(".dashboardPage");
const biddingCount = document.getElementById("biddingCount");
const bookingCount = document.getElementById("bookingCount");
const noOfAdmin = document.getElementById("noOfAdmin");
const nOfCars = document.getElementById("noOfCars");
const totalRevenue = document.getElementById("revenue");
const rejectedBids = document.getElementById("rejectedBids");
const averageRentDay = document.getElementById("averageRentDay");
const conversionRatio = document.getElementById("conversionRatio");
//variable & instances
const commissionRate = 0.25;
let currentPage = 1;
let pageSize = 5;
//function to change the active tab
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
      //set the date to current month and day
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
/**
 * @description Function to add event listeners for the page
 */
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
}
window.addEventListener("load", () => {
  loadStat();
  addEventListeners();
});
/**
 * @description Function to load approvals
 * @returns {Promise<void>}
 */
async function loadApprovals() {
  try {
    showLoader();
    const approvalBody = document.getElementById("approvalsBody");
    const approvalFilterValue = document.getElementById("approvalFilter").value;
    const sortFilterValue = document.getElementById("sortFilterApproval").value;
    const sortOrderValue = document.getElementById("sortOrderApproval").value;
    let approvals = await ApprovalService.getAllApprovals();
    //filtering
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
    //pagination logic
    const totalItems = approvals.length;
    const totalPages = Math.ceil(totalItems / pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;
    const start = (currentPage - 1) * pageSize;
    approvals = approvals.slice(start, start + pageSize);
    //rendering the page
    approvalBody.innerHTML = "";
    for (const app of approvals) {
      const tr = document.createElement("tr");
      const user = app.user;
      tr.innerHTML = `
        <td data-label="Name">${app.user.name}</td>
        <td data-label="Adhaar">${app.user.adhaar}</td>
        <td data-label="Email">${app.user.email}</td>
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
    renderPagination(totalPages, currentPage, loadApprovals, "approvals");
  } catch (error) {
    toast("error", "Error loading approvals").showToast();
  } finally {
    hideLoader();
  }
}
/**
 * @description Function to load stats
 */
async function loadStat() {
  showLoader();
  try {
    const nUsers = await userService.countUsers();
    const nCars = await carService.countCars();
    const allBids = await BidService.getAllBids();
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
/**
 * @description Function to approve request
 * @param {*} id
 * @returns
 */
async function approveRequest(id) {
  try {
    const prompt = confirm("Do you want to approve this request?");
    if (!prompt) return;
    const approval = await ApprovalService.getApprovalById(id);
    await userService.updateUser({ id: approval.userId, role: "admin" });
    await ApprovalService.updateApproval({ id, status: "approved" });
    toast("success", "Request approved").showToast();
    loadApprovals();
  } catch (error) {
    toast("error", "Error approving request").showToast();
  }
}
/**
 * @description Function to deny request
 * @param {*} id
 * @returns
 */
async function denyRequest(id) {
  try {
    const prompt = confirm("Do you want to reject this request?");
    if (!prompt) return;
    await ApprovalService.updateApproval({ id, status: "rejected" });
    toast("success", "Request rejected").showToast();
    loadApprovals();
  } catch (error) {
    toast("error", "Error denying request").showToast();
  }
}

/**
 * @description To render the pagination
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
/**
 * @description Function to show loader
 */
function showLoader() {
  const main = document.querySelector(".dashboard-main");
  const loader = document.createElement("div");
  loader.className = "loader-overlay";
  loader.innerHTML = "<div class='loader'></div>";
  main.appendChild(loader);
}
/**
 * @description Function to hide loader
 */
function hideLoader() {
  const loader = document.querySelector(".loader-overlay");
  if (loader) loader.remove();
}

export { showLoader, hideLoader };
