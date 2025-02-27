/**
 * @description Admin controller
 */

angular.module("rentIT").controller("adminController", [
  "$scope",
  "userService",
  "carService",
  "bidBookService",
  "chartService",
  "utilService",
  "approvalService",
  "toaster",
  "$q",
  function (
    $scope,
    userService,
    carService,
    bidBookService,
    chartService,
    utilService,
    approvalService,
    toaster,
    $q
  ) {
    // Initialize scope variables
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
      field: "location",
      typeOfChart: "bar",
    };
    $scope.revenueChartFilter = {
      field: "location",
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
      $q.when(carService.countCars())
        .then((nCars) => {
          return $q.when(bidBookService.getAllBids()).then((allBids) => {
            let revenue = 0,
              noOfPendingBids = 0,
              noOfRejectedBids = 0,
              noOfApprovedBids = 0,
              noOfBids = 0,
              totalDay = 0;
            // Calculate statistics
            allBids.forEach((bid) => {
              const days = utilService.getDaysDiff(bid.startDate, bid.endDate);
              if (bid.status === "pending") {
                noOfPendingBids++;
              } else if (bid.status === "rejected") {
                noOfRejectedBids++;
              } else {
                noOfApprovedBids++;
                revenue += Number(bid.amount);
              }
              totalDay += days;
              noOfBids++;
            });
            // Set statistics
            $scope.stat = {
              cars: nCars,
              revenue: revenue * 0.25,
              bids: noOfBids,
              bookings: noOfApprovedBids,
              rejectedBids: noOfRejectedBids,
              avgRentalDay: Math.floor(totalDay / noOfBids) || 0,
              conversionRatio:
                Math.ceil(noOfApprovedBids / noOfBids) * 100 || 0,
            };
          });
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Set approvals for dashboard
     */
    $scope.setApprovals = function () {
      const filterFunction = function (approval) {
        if ($scope.approvalFilter.status === "all") {
          return true;
        }
        return approval.status === $scope.approvalFilter.status;
      };
      $q.when(
        approvalService.getPagedApprovals(
          {
            page: $scope.currentPage,
            pageSize: $scope.pageSize,
            direction: "next",
          },
          filterFunction
        )
      )
        .then((result) => {
          $scope.totalPage = result.totalPages;
          result.data.sort((a, b) => a.createdAt - b.createdAt);
          if ($scope.approvalFilter.orderBy === "desc") {
            result.data.reverse();
          }
          $scope.approvals = result.data;
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
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
      $q.when(
        approvalService.updateApproval({
          id: $scope.approvalId,
          status: "rejected",
        })
      )
        .then(() => {
          $scope.setApprovals();
          toaster.pop("success", "Success", "Request cancelled successfully");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
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
      $q.when(
        approvalService.updateApproval({
          id: $scope.approvalId,
          status: "approved",
        })
      )
        .then(() => {
          $scope.setApprovals();
          toaster.pop("success", "Success", "Request approved successfully");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };
    /**
     * @description To Load car Chart showing the number of cars by analytics field
     */
    $scope.carChart = function () {
      const analyticsField = $scope.carChartFilter.field;
      const typeOfChart = $scope.carChartFilter.typeOfChart;
      const keyAccessor = (item) => item[analyticsField];
      $q.when(
        chartService.groupData("cars", keyAccessor, "show", "next", null, {
          filterFunction: () => {
            return true;
          },
        })
      )
        .then((groupedData) => {
          const chartData = chartService.buildChartData(groupedData);
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
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description To Load Chart data for bookings
     */
    $scope.bookChart = function () {
      const analyticsField = $scope.bookChartFilter.field;
      const keyAccessor = (bid) => {
        if (bid.hasOwnProperty(analyticsField)) return bid[analyticsField];
        if (bid.car && bid.car.hasOwnProperty(analyticsField))
          return bid.car[analyticsField];
        return "Unknown";
      };
      const options = {
        filterFunction: (item) => {
          return item.status === "approved";
        },
      };
      $q.when(
        chartService.groupDataBifarcate(
          "bids",
          keyAccessor,
          null,
          "next",
          null,
          options
        )
      )
        .then((groupedData) => {
          const datasetLabel =
            "Number of Bookings by " +
            analyticsField.charAt(0).toUpperCase() +
            analyticsField.slice(1);
          const chartData = chartService.buildChartDataBifarcate(
            groupedData,
            "Bookings",
            "Biddings"
          );
          $scope.loadChart(
            chartData,
            $scope.bookChartFilter.typeOfChart,
            "bookChart",
            false,
            datasetLabel
          );
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error loading Booking Chart");
        });
    };
    /**
     * @description To Load Chart data for revenue
     */
    $scope.revenueChart = function () {
      const analyticsField = $scope.revenueChartFilter.field;
      //keyaccer function
      const keyAccessor = (bid) => {
        if (bid.hasOwnProperty(analyticsField)) return bid[analyticsField];
        if (bid.car && bid.car.hasOwnProperty(analyticsField))
          return bid.car[analyticsField];
        return "Unknown";
      };
      //options object
      const options = {
        summationField: "amount",
        commissionRate: 0.25,
        filterFunction: (item) => {
          return item.isOutStation;
        },
      };
      $q.when(
        chartService.groupDataBifarcate(
          "bids",
          keyAccessor,
          null,
          "next",
          null,
          options
        )
      )
        .then((groupedData) => {
          const datasetLabel =
            "Total Amount by " +
            analyticsField.charAt(0).toUpperCase() +
            analyticsField.slice(1);
          const chartData = chartService.buildChartDataBifarcate(
            groupedData,
            "OutStation",
            "Local"
          );
          $scope.loadChart(
            chartData,
            $scope.revenueChartFilter.typeOfChart,
            "revenueChart",
            true,
            datasetLabel
          );
        })
        .catch((_) => {
          console.log(_);
          toaster.pop("error", "Error", "Error loading revenue Chart");
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
