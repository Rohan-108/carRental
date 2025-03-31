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
  "$uibModal",
  function (
    $scope,
    userService,
    chartService,
    utilService,
    approvalService,
    toaster,
    $q,
    $uibModal
  ) {
    // Initialize scope variables
    $scope.isLoading = false; // Loading state
    $scope.pageSize = 5; // Number of items per page
    $scope.currentPage = 1; // Current page number
    $scope.totalPage = 0; // Total number of pages
    $scope.totalItems = 0; // Total number of items
    $scope.currentTab = "home"; // Current tab
    $scope.stat = {}; // Statistics data for dashboard
    $scope.popularVehicleDetails = {}; // Popular vehicle details
    $scope.approvals = []; // Approvals data for dashboard
    $scope.approvalId = null; // Approval id

    // Approval filter with additional options
    $scope.approvalFilter = {
      status: "all",
      sortBy: "date",
      orderBy: "desc",
    };

    // Chart filter configurations
    $scope.carChartFilter = {
      field: "location",
      typeOfChart: "bar",
    };
    $scope.topEarningOwnersChartFilter = {
      typeOfChart: "bar",
      days: "7",
    };
    $scope.bookChartFilter = {
      field: "vehicle.location",
      typeOfChart: "bar",
      days: "7",
    };
    $scope.revenueChartFilter = {
      field: "vehicle.location",
      typeOfChart: "bar",
      days: "7",
    };
    $scope.chartInstances = {
      carChart: null,
      bookChart: null,
      revenueChart: null,
      topEarningOwnersChart: null,
    };

    /**
     * @description Get statistics data for dashboard
     */
    $scope.init = function () {
      if ($scope.currentTab === "home") {
        $scope.isLoading = true;
        $q.all([setStat(), getPopluarVehicleDetails()]).finally(() => {
          $scope.isLoading = false;
        });
      }
    };

    /**
     * @description Open the approve modal using UI Bootstrap
     * @param {string} id - Approval id
     */
    $scope.openApproveModal = function (id) {
      $scope.approvalId = id;

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "approveModal.html",
        controller: "ApproveModalController",
        size: "md",
        backdrop: "static",
        resolve: {
          approvalId: function () {
            return $scope.approvalId;
          },
        },
      });

      modalInstance.result.then(
        function () {
          // User clicked OK, proceed with approval
          $scope.approveUserRequest($scope.approvalId);
        },
        function () {
          // Modal dismissed, do nothing
          console.log("Approve modal dismissed");
        }
      );
    };

    /**
     * @description Open the cancel modal using UI Bootstrap
     * @param {string} id - Approval id
     */
    $scope.openCancelModal = function (id) {
      $scope.approvalId = id;

      var modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "cancelModal.html",
        controller: "CancelModalController",
        size: "md",
        backdrop: "static",
        resolve: {
          approvalId: function () {
            return $scope.approvalId;
          },
        },
      });

      modalInstance.result.then(
        function () {
          // User clicked OK, proceed with rejection
          $scope.cancelUserRequest($scope.approvalId);
        },
        function () {
          // Modal dismissed, do nothing
          console.log("Cancel modal dismissed");
        }
      );
    };

    /**
     * @description Change tab
     * @param {*} tab - Tab name
     */
    $scope.changeTab = function (tab) {
      $scope.currentTab = tab;
      $scope.currentPage = 1; // Reset to first page on tab change

      switch (tab) {
        case "home":
          break;
        case "analytics":
          $q.all([$scope.revenueChart(), $scope.topEarningOwnersChart()]);
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
    const setStat = function () {
      return userService
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
        });
    };

    /**
     * @description Get popular vehicle details
     */
    const getPopluarVehicleDetails = () => {
      return chartService
        .getPopularVehicleDetails()
        .then((response) => {
          $scope.popularVehicleDetails = response.data;
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error.message || "Error loading popular vehicle details"
          );
        });
    };

    /**
     * @description Set approvals for dashboard with enhanced pagination and filtering
     */
    $scope.setApprovals = function () {
      $scope.isLoading = true;
      const filter = {};
      const sort = {};

      // Apply status filter
      if ($scope.approvalFilter.status !== "all") {
        filter.status = $scope.approvalFilter.status;
      }

      // Apply sorting
      if ($scope.approvalFilter.sortBy === "date") {
        sort["createdAt"] = $scope.approvalFilter.orderBy === "asc" ? 1 : -1;
      } else if ($scope.approvalFilter.sortBy === "username") {
        sort["user.username"] =
          $scope.approvalFilter.orderBy === "asc" ? 1 : -1;
      } else if ($scope.approvalFilter.sortBy === "email") {
        sort["user.email"] = $scope.approvalFilter.orderBy === "asc" ? 1 : -1;
      }

      approvalService
        .getApprovals($scope.currentPage, $scope.pageSize, filter, sort)
        .then((result) => {
          $scope.approvals = result.data.requests;
          $scope.totalPage = result.data.pages;
          $scope.totalItems = result.data.total;
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
     * @description Handle page change for pagination
     */
    $scope.pageChanged = function () {
      $scope.setApprovals();
    };

    /**
     * @description Previous page navigation
     */
    $scope.prevPage = function () {
      if ($scope.currentPage > 1) {
        $scope.currentPage--;
        $scope.setApprovals();
      }
    };

    /**
     * @description Next page navigation
     */
    $scope.nextPage = function () {
      if ($scope.currentPage < $scope.totalPage) {
        $scope.currentPage++;
        $scope.setApprovals();
      }
    };

    /**
     * @description Cancel User Request to become a car owner
     * @param {string} approvalId - The ID of the approval to reject
     */
    $scope.cancelUserRequest = function (approvalId) {
      const id = approvalId || $scope.approvalId;
      if (!id) {
        toaster.pop("error", "Error", "Invalid request");
        return;
      }

      $scope.isLoading = true;
      approvalService
        .rejectApprovalRequest(id)
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
          $scope.isLoading = false;
        });
    };

    /**
     * @description Approve User Request to become a car owner
     * @param {string} approvalId - The ID of the approval to approve
     */
    $scope.approveUserRequest = function (approvalId) {
      const id = approvalId || $scope.approvalId;
      if (!id) {
        toaster.pop("error", "Error", "Invalid request");
        return;
      }

      $scope.isLoading = true;
      approvalService
        .approveApprovalRequest(id)
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
      const days = $scope.bookChartFilter.days;
      chartService
        .getBookingChartDataForSuperAdmin(analyticsField, days)
        .then((response) => {
          const datasetLabel =
            "Number of Bookings by " + analyticsField.split(".").join(" ");
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
      const days = $scope.revenueChartFilter.days;
      chartService
        .getRevenueChartDataForSuperAdmin(analyticsField, days)
        .then((response) => {
          const datasetLabel =
            "Revenue by " + analyticsField.split(".").join(" ");
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

    $scope.topEarningOwnersChart = function () {
      $scope.isLoading = true;
      const days = $scope.topEarningOwnersChartFilter.days;
      chartService
        .getTopOwnersForSuperAdmin(days)
        .then((response) => {
          const datasetLabel = "Top Earning Owners";
          const chartData = chartService.buildChartDataForTopOwners(
            response.data
          );
          $scope.loadChart(
            chartData,
            $scope.topEarningOwnersChartFilter.typeOfChart,
            "topEarningOwnersChart",
            true,
            datasetLabel
          );
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error?.name || "Error loading Top Earning Owners Chart"
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

/**
 * Controller for the Approve Modal
 */
angular.module("rentIT").controller("ApproveModalController", [
  "$scope",
  "$uibModalInstance",
  "approvalId",
  function ($scope, $uibModalInstance, approvalId) {
    $scope.approvalId = approvalId;

    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss("cancel");
    };
  },
]);

/**
 * Controller for the Cancel Modal
 */
angular.module("rentIT").controller("CancelModalController", [
  "$scope",
  "$uibModalInstance",
  "approvalId",
  function ($scope, $uibModalInstance, approvalId) {
    $scope.approvalId = approvalId;

    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss("cancel");
    };
  },
]);
