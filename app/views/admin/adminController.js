/**
 * @description Admin controller
 */

angular.module("rentIT").controller("adminController", [
  "$scope",
  "userService",
  "chartService",
  "utilService",
  "approvalService",
  "toaster",
  "$q",
  function (
    $scope,
    userService,
    chartService,
    utilService,
    approvalService,
    toaster,
    $q
  ) {
    // Initialize scope variables
    $scope.isLoading = false; // Loading state
    $scope.pageSize = 5; // Number of items per page
    $scope.currentPage = 1; // Current page number
    $scope.totalPage = null; // Total number of pages
    $scope.currentTab = "home"; // Current tab
    $scope.stat = {}; // Statistics data for dashboard
    $scope.approvals = []; // Approvals data for dashboard
    $scope.approveModal = false; // Approve modal state
    $scope.cancelApproveModal = false; // Cancel approve modal state
    $scope.approvalId = null; // Approval id
    // Approval filter
    $scope.approvalFilter = {
      status: "all",
      sortBy: "date",
      orderBy: "desc",
    };
    $scope.carChartFilter = {
      field: "location",
      typeOfChart: "bar",
    };
    $scope.bookChartFilter = {
      field: "vehicle.location",
      typeOfChart: "bar",
    };
    $scope.revenueChartFilter = {
      field: "vehicle.location",
      typeOfChart: "bar",
    };
    $scope.chartInstances = {
      carChart: null,
      bookChart: null,
      revenueChart: null,
    };
    /**
     * @description Get statistics data for dashboard
     */
    $scope.init = function () {
      if ($scope.currentTab === "home") {
        $scope.setStat();
      }
    };

    /**
     * @description toggle approve modal
     * @param {Boolean} state - Modal state
     * @param {string} id - Bid id
     */
    $scope.toggleApproveModal = (state, id) => {
      $scope.approvalId = id;
      $scope.approveModal = state;
    };
    /**
     * @description toggle cancel approve modal
     * @param {Boolean} state - Modal state
     * @param {string} id - Bid id
     */
    $scope.toggleCancelApproveModal = (state, id) => {
      $scope.approvalId = id;
      $scope.cancelApproveModal = state;
    };
    /**
     * @description Change tab
     * @param {*} tab - Tab name
     */
    $scope.changeTab = function (tab) {
      $scope.currentTab = tab;
      switch (tab) {
        case "home":
          break;
        case "analytics":
          $scope.revenueChart();
          break;
        case "approvals":
          $scope.setApprovals();
          break;
        case "carBookAnalytics":
          $q.all([$scope.carChart(), $scope.bookChart()]);
          break;
      }
    };

    /**
     * @description Set statistics for dashboard
     */
    $scope.setStat = function () {
      $scope.isLoading = true;
      userService
        .getStatsForSuperAdmin()
        .then((result) => {
          $scope.stat = result.data;
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error.message || "Error loading statistics"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Set approvals for dashboard
     */
    $scope.setApprovals = function () {
      $scope.isLoading = true;
      const filter = {};
      const sort = {};
      if ($scope.approvalFilter.status !== "all") {
        filter.status = $scope.approvalFilter.status;
      }
      sort["createdAt"] = $scope.approvalFilter.orderBy === "asc" ? 1 : -1;
      approvalService
        .getApprovals($scope.currentPage, $scope.pageSize, filter, sort)
        .then((result) => {
          console.log(result);
          $scope.approvals = result.data.requests;
          $scope.totalPage = result.data.pages;
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error.message || "Error loading approvals"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Cancel User Request to become a car owner
     */
    $scope.cancelUserRequest = function () {
      if (!$scope.approvalId) {
        toaster.pop("error", "Error", "Invalid request");
        return;
      }
      $scope.isLoading = true;
      approvalService
        .rejectApprovalRequest($scope.approvalId)
        .then(() => {
          $scope.setApprovals();
          toaster.pop("success", "Success", "Request rejected successfully");
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error.message || "Error rejecting request"
          );
        })
        .finally(() => {
          $scope.toggleCancelApproveModal(false);
          $scope.isLoading = false;
        });
    };

    /**
     * @description Approve User Request to become a car owner
     */
    $scope.approveUserRequest = function () {
      if (!$scope.approvalId) {
        toaster.pop("error", "Error", "Invalid request");
        return;
      }
      $scope.isLoading = true;
      approvalService
        .approveApprovalRequest($scope.approvalId)
        .then(() => {
          $scope.setApprovals();
          toaster.pop("success", "Success", "Request approved successfully");
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.message || "Error approving request"
          );
        })
        .finally(() => {
          $scope.toggleApproveModal(false);
          $scope.isLoading = false;
        });
    };
    /**
     * @description To Load car Chart showing the number of cars by analytics field
     */
    $scope.carChart = function () {
      $scope.isLoading = true;
      const analyticsField = $scope.carChartFilter.field;
      const typeOfChart = $scope.carChartFilter.typeOfChart;
      chartService
        .getCarDataForSuperAdmin(analyticsField)
        .then((response) => {
          const chartData = chartService.buildChartDataForCar(response.data);
          const datasetLabel =
            "Number of Cars by " +
            analyticsField.charAt(0).toUpperCase() +
            analyticsField.slice(1);
          $scope.loadChart(
            chartData,
            typeOfChart,
            "carChart",
            false,
            datasetLabel
          );
        })
        .catch((error) => {
          console.log(error);
          toaster.pop("error", "Error", error.message);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description To Load Chart data for bookings
     */
    $scope.bookChart = function () {
      $scope.isLoading = true;
      const analyticsField = $scope.bookChartFilter.field;
      chartService
        .getBookingChartDataForSuperAdmin(analyticsField)
        .then((response) => {
          const datasetLabel =
            "Number of Bookings by " +
            analyticsField.charAt(0).toUpperCase() +
            analyticsField.slice(1);
          const chartData = chartService.buildChartDataForBooking(
            response.data
          );
          $scope.loadChart(
            chartData,
            $scope.bookChartFilter.typeOfChart,
            "bookChart",
            false,
            datasetLabel
          );
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error?.name || "Error loading Booking Chart"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };
    /**
     * @description To Load Chart data for revenue
     */
    $scope.revenueChart = function () {
      $scope.isLoading = true;
      const analyticsField = $scope.revenueChartFilter.field;
      chartService
        .getRevenueChartDataForSuperAdmin(analyticsField)
        .then((response) => {
          const datasetLabel =
            "Revenue by " +
            analyticsField.charAt(0).toUpperCase() +
            analyticsField.slice(1);
          const chartData = chartService.buildChartDataForRevenue(
            response.data
          );
          $scope.loadChart(
            chartData,
            $scope.revenueChartFilter.typeOfChart,
            "revenueChart",
            true,
            datasetLabel
          );
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error?.name || "Error loading Revenue Chart"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };
    /**
     * @description To Load Chart instances
     * @param {*} data - chart data
     * @param {*} chartType - type of chart
     * @param {*} id - id of canvas
     * @param {*} isAmount - is it of type amount(Rs.)
     * @param {*} datasetLabel - datasetLabel name
     */
    $scope.loadChart = function (
      data,
      chartType,
      id,
      isAmount = false,
      datasetLabel = null
    ) {
      const yAxisTicksCallback = isAmount
        ? (value) => "Rs. " + utilService.formatNumber(value)
        : (value) => (value % 1 === 0 ? utilService.formatNumber(value) : "");
      const ctx = document.getElementById(id).getContext("2d");
      $scope.chartInstances[id] && $scope.chartInstances[id].destroy();
      const chart = new Chart(ctx, {
        type: chartType,
        data: data,
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: datasetLabel ? datasetLabel : data.datasets[0].label,
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
      $scope.chartInstances[id] = chart;
    };
  },
]);
