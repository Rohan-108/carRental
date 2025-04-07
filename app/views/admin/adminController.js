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
  "configService",
  function (
    $scope,
    userService,
    chartService,
    utilService,
    approvalService,
    toaster,
    $q,
    $uibModal,
    configService
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

    // Platform configuration
    $scope.config = {
      vehicleType: [],
      fuelType: [],
      transmissionType: [],
      cities: [],
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
        case "platformConfig":
          $scope.loadConfig();
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
    /**
     * @description To Load Chart data for top earning owners
     * @param {number} days - Number of days for the chart data
     */
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

    /**
     * @description Load platform configuration
     */
    $scope.loadConfig = function () {
      $scope.isLoading = true;
      configService
        .getConfig()
        .then(function (response) {
          $scope.config = response.data;
          console.log("Platform configuration loaded:", $scope.config);
        })
        .catch(function (error) {
          console.error("Error loading configuration:", error);
          toaster.pop(
            "error",
            "Error",
            "Failed to load platform configuration"
          );
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Open modal to add new configuration item
     * @param {string} type - Type of configuration (vehicleType, fuelType, transmissionType, city)
     */
    $scope.openAddConfigModal = function (type) {
      const modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "addConfigModal.html",
        controller: "AddConfigModalController",
        size: "md",
        backdrop: "static",
        resolve: {
          configType: function () {
            return type;
          },
        },
      });

      modalInstance.result.then(function (newItem) {
        // Pass the string value directly
        $scope.updateConfiguration("add", type, newItem.name);
      });
    };

    /**
     * @description Open modal to edit configuration item
     * @param {string} type - Type of configuration
     * @param {string} item - String value to edit
     */
    $scope.openEditConfigModal = function (type, item) {
      const modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "editConfigModal.html",
        controller: "EditConfigModalController",
        size: "md",
        backdrop: "static",
        resolve: {
          configType: function () {
            return type;
          },
          configItem: function () {
            // Create a temporary object with name property for the modal
            return { name: item, original: item };
          },
        },
      });

      modalInstance.result.then(function (updatedItem) {
        $scope.updateConfiguration("update", type, {
          newValue: updatedItem.name,
          oldValue: updatedItem.original,
        });
      });
    };

    /**
     * @description Open modal to delete configuration item
     * @param {string} type - Type of configuration
     * @param {string} item - String value to delete
     */
    $scope.openDeleteConfigModal = function (type, item) {
      const modalInstance = $uibModal.open({
        animation: true,
        templateUrl: "deleteConfigModal.html",
        controller: "DeleteConfigModalController",
        size: "md",
        backdrop: "static",
        resolve: {
          configType: function () {
            return type;
          },
          configItem: function () {
            // Create a temporary object with name property for the modal
            return { name: item };
          },
        },
      });

      modalInstance.result.then(function () {
        $scope.updateConfiguration("delete", type, item);
      });
    };

    /**
     * @description Update configuration with a unified function
     * @param {string} operation - Operation type ('add', 'update', 'delete')
     * @param {string} type - Type of configuration
     * @param {string|Object} item - String value for add/delete or object {newValue, oldValue} for update
     */
    $scope.updateConfiguration = function (operation, type, item) {
      $scope.isLoading = true;

      // Create a copy of the current config
      let updatedConfig = angular.copy($scope.config);

      // Map type to config property
      const configMap = {
        vehicleType: "vehicleType",
        fuelType: "fuelType",
        transmissionType: "transmissionType",
        city: "cities",
      };

      const configKey = configMap[type];

      // Update the config object based on the operation
      switch (operation) {
        case "add":
          // Check if the item already exists (case insensitive)
          if (
            !updatedConfig[configKey].some(
              (existing) => existing.toLowerCase() === item.toLowerCase()
            )
          ) {
            updatedConfig[configKey].push(item);
          } else {
            toaster.pop("warning", "Warning", `This ${type} already exists`);
            $scope.isLoading = false;
            return;
          }
          break;

        case "update":
          // For update, item is an object with oldValue and newValue
          const updateIndex = updatedConfig[configKey].indexOf(item.oldValue);
          if (updateIndex !== -1) {
            // Check if the new name already exists (excluding the current item)
            const nameExists = updatedConfig[configKey].some(
              (existing, idx) =>
                idx !== updateIndex &&
                existing.toLowerCase() === item.newValue.toLowerCase()
            );

            if (nameExists) {
              toaster.pop(
                "warning",
                "Warning",
                `This ${type} name already exists`
              );
              $scope.isLoading = false;
              return;
            }

            updatedConfig[configKey][updateIndex] = item.newValue;
          }
          break;

        case "delete":
          // For delete, item is the string value to remove
          const deleteIndex = updatedConfig[configKey].indexOf(item);
          if (deleteIndex !== -1) {
            updatedConfig[configKey].splice(deleteIndex, 1);
          }
          break;
      }

      // Update the scope config first
      $scope.config = updatedConfig;

      // Then call the service to persist changes
      configService
        .updateConfig(updatedConfig)
        .then(function (response) {
          // Update with the response from server to ensure consistency
          $scope.config = response.data || response;
          toaster.pop(
            "success",
            "Success",
            `${type} ${
              operation === "add"
                ? "added"
                : operation === "update"
                ? "updated"
                : "deleted"
            } successfully`
          );
        })
        .catch(function (error) {
          console.error(`Error ${operation}ing ${type}:`, error);
          toaster.pop("error", "Error", `Failed to ${operation} ${type}`);

          // Reload the config to revert changes in case of failure
          $scope.loadConfig();
        })
        .finally(function () {
          $scope.isLoading = false;
        });
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

/**
 * Controller for Adding Configuration Items
 */
angular.module("rentIT").controller("AddConfigModalController", [
  "$scope",
  "$uibModalInstance",
  "configType",
  function ($scope, $uibModalInstance, configType) {
    $scope.configType = configType;
    $scope.configItem = {
      name: "",
    };

    $scope.ok = function () {
      $uibModalInstance.close($scope.configItem);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss("cancel");
    };
  },
]);

/**
 * Controller for Editing Configuration Items
 */
angular.module("rentIT").controller("EditConfigModalController", [
  "$scope",
  "$uibModalInstance",
  "configType",
  "configItem",
  function ($scope, $uibModalInstance, configType, configItem) {
    $scope.configType = configType;
    $scope.configItem = {
      name: configItem.name,
      original: configItem.original,
    };

    $scope.ok = function () {
      $uibModalInstance.close($scope.configItem);
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss("cancel");
    };
  },
]);

/**
 * Controller for Deleting Configuration Items
 */
angular.module("rentIT").controller("DeleteConfigModalController", [
  "$scope",
  "$uibModalInstance",
  "configType",
  "configItem",
  function ($scope, $uibModalInstance, configType, configItem) {
    $scope.configType = configType;
    $scope.configItem = configItem;

    $scope.ok = function () {
      $uibModalInstance.close();
    };

    $scope.cancel = function () {
      $uibModalInstance.dismiss("cancel");
    };
  },
]);
