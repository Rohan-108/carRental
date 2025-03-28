/**
 * @description Controller for dashboard page
 * @name dashboardController
 * @requires $scope
 * @requires $rootScope
 * @requires userService
 * @requires carService
 * @requires chartService
 * @requires bidBookService
 * @requires chatService
 * @requires utilService
 * @requires toaster
 * @requires $q
 */
angular.module("rentIT").controller("dashboardController", [
  "$scope",
  "$rootScope",
  "userService",
  "carService",
  "bidBookService",
  "chartService",
  "utilService",
  "toaster",
  "$q",
  function (
    $scope,
    $rootScope,
    userService,
    carService,
    bidBookService,
    chartService,
    utilService,
    toaster,
    $q
  ) {
    // Initialize variables
    $scope.isLoading = false;
    $scope.pageSize = 2; // Number of items per page
    $scope.currentPage = 1; // Current page number
    $scope.totalPage = null; // Total number of pages
    $scope.currentTab = "home"; // Current tab
    $scope.cars = []; // List of cars
    $scope.vehicleTypes = ["Sedan", "SUV", "Hatchback", "Coupe", "Convertible"]; // List of vehicle types
    $scope.fuelTypes = ["Petrol", "Diesel", "Electric", "Hybrid"]; // List of fuel types
    $scope.transmissionTypes = ["Automatic", "Manual"]; // List of transmission types
    $scope.cities = utilService.cities; // List of cities
    $scope.carFormData = {}; // Form data for adding car
    $scope.carModal = null; // Modal state for adding car
    $scope.stat = {}; // Statistics data for dashboard
    $scope.bids = []; // List of bids
    // Filter for bids
    $scope.bidFilter = {
      filterByCar: "all",
      filterByStatus: "all",
      sortBy: "date",
      sortOrder: "desc",
    };
    $scope.carsForFilter = []; // List of cars for filter
    $scope.editCarModal = null; // Modal state for editing car
    $scope.editCarFormData = {}; // Form data for editing car
    $scope.carId = null; // Id of car
    $scope.approveBidModal = null; // Modal state for approving bid
    $scope.cancelBidModal = null; // Modal state for cancelling bid
    $scope.bidId = null; // Id of bid
    $scope.bookings = []; // List of bookings
    $scope.bookingTab = "all"; // Current booking tab
    // Filter for bookings
    $scope.bookingFilter = {
      filterByCar: "all",
      sortBy: "date",
      sortOrder: "desc",
    };
    $scope.bookingId = null; // Id of booking
    $scope.odometerModal = null; // Modal state for adding odometer value
    $scope.odometerFormData = {}; // Form data for adding odometer value
    $scope.type = null; // Type of odometer value (current or final)
    $scope.startOdometer = null; // Start odometer value
    $scope.chartInstances = {
      bookChart: null,
      revenueChart: null,
      comparisionChart: null,
    };
    $scope.comparisionChartFilter = {
      days: "7",
      typeOfChart: "bar",
    };
    $scope.bookingChartFilter = {
      dataBy: "status",
      typeOfChart: "bar",
      days: "7",
    };
    $scope.revenueChartFilter = {
      dataBy: "vehicle.location",
      typeOfChart: "bar",
      days: "7",
    };
    /**
     * @description Initialize function
     */
    $scope.init = function () {
      if ($scope.currentTab === "home") {
        $q.all([
          $scope.setStat(),
          $scope.getCarsForFilter(),
          $scope.comparisionChart(),
        ]);
      }
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
        case "cars":
          $scope.setCars();
          break;
        case "bookings":
          $scope.currentPage = 1;
          $scope.setBookings();
          break;
        case "biddings":
          $scope.currentPage = 1;
          $scope.setBiddings();
          break;
        case "analytics":
          $q.all([$scope.bookingChart(), $scope.revenueChart()]);
          break;
      }
    };

    /**
     * @description Get the cars for filter
     * @param {*} status - Status of the bid
     */
    $scope.getCarsForFilter = function () {
      bidBookService
        .getUniqueCarsForFilter()
        .then((response) => {
          $scope.carsForFilter = [
            {
              _id: "all",
              name: "All Cars",
            },
            ...response.data.vehicles,
          ];
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error.description || "Error loading cars for filter"
          );
        });
    };

    /**
     * @description Set statistics for dashboard
     */
    $scope.setStat = function () {
      userService
        .getStatsForOwner()
        .then((response) => {
          $scope.stat = response.data;
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error?.description || "Error loading statistics"
          );
        });
    };

    /**
     * @description Toggle add car modal
     * @param {*} state - Modal state
     */
    $scope.toggleAddCarModal = (state) => {
      $scope.carModal = state;
    };

    /**
     * @description Function to add car
     */
    $scope.addCar = function () {
      const formData = new FormData();
      for (const key in $scope.carFormData) {
        if (key === "images") {
          for (const i in $scope.carFormData.images) {
            formData.append("images", $scope.carFormData.images[i]);
          }
        } else {
          formData.append(key, $scope.carFormData[key]);
        }
      }
      carService
        .addCar(formData)
        .then((response) => {
          $scope.carFormData = {};
          $scope.toggleAddCarModal(false);
          $scope.cars.push(response.data.vehicle);
          toaster.pop("success", "Success", "Car added successfully");
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.description || "Error adding car"
          );
        });
    };

    /**
     * @description Set cars for owner
     */
    $scope.setCars = function () {
      $scope.isLoading = true;
      carService
        .getCars($scope.currentPage, $scope.pageSize, {
          "owner._id": $rootScope.user._id,
        })
        .then((response) => {
          $scope.cars = response.data.vehicles;
          $scope.totalPage = response.data.pages;
        })
        .catch((response) => {
          toaster.pop(
            "error",
            "Error",
            response.description || "Error loading cars"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Toggle edit car modal
     * @param {*} state - Modal state
     * @param {*} id - Car id
     */
    $scope.toggleEditCarModal = (state, id) => {
      $scope.editCarModal = state;
      $scope.carId = id;
      if (!id) return;
      // Get car by id
      const car = $scope.cars.find((car) => car._id === id);
      // Set form data
      $scope.editCarFormData = {
        rentalPrice: car.rentalPrice,
        ratePerKm: car.ratePerKm,
        fixedKilometer: car.fixedKilometer,
        location: car.location,
        rentalPriceOutStation: car.rentalPriceOutStation,
        minRentalPeriod: car.minRentalPeriod,
        maxRentalPeriod: car.maxRentalPeriod,
        images: [],
      };
    };

    /**
     * @description Function to edit car
     */
    $scope.editCar = function () {
      $scope.isLoading = true;
      const formData = new FormData();
      for (const key in $scope.editCarFormData) {
        if (key === "images") {
          for (const i in $scope.editCarFormData.images) {
            formData.append("images", $scope.editCarFormData.images[i]);
          }
        } else {
          formData.append(key, $scope.editCarFormData[key]);
        }
      }
      carService
        .updateCar(formData, $scope.carId)
        .then((response) => {
          $scope.editCarFormData = {};
          $scope.toggleEditCarModal(false, null);
          $scope.setCars();
          toaster.pop("success", "Success", "Car updated successfully");
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.description || "Error updating car"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Set biddings for owner
     */
    $scope.setBiddings = function () {
      $scope.isLoading = true;
      const filter = {};
      if ($scope.bidFilter.filterByCar != "all") {
        filter["vehicle._id"] = $scope.bidFilter.filterByCar;
      }
      if ($scope.bidFilter.filterByStatus != "all") {
        filter["status"] = $scope.bidFilter.filterByStatus;
      }
      const sort = {};
      sort[$scope.bidFilter.sortBy === "date" ? "createdAt" : "amount"] =
        $scope.bidFilter.sortOrder === "desc" ? -1 : 1;
      bidBookService
        .getAllBidsByOwner($scope.currentPage, $scope.pageSize, filter, sort)
        .then((response) => {
          $scope.bids = response.data.bids;
          $scope.totalPage = response.data.pages;
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error?.description || "Error loading biddings"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Toggle approve bid modal
     * @param {*} state - Modal state
     * @param {*} id - Bid id
     */
    $scope.toggleApproveBidModal = (state, id) => {
      $scope.approveBidModal = state;
      $scope.bidId = id;
    };

    /**
     * @description Toggle cancel bid modal
     * @param {*} state - Modal state
     * @param {*} id - Bid id
     */
    $scope.toggleCancelBidModal = (state, id) => {
      $scope.cancelBidModal = state;
      $scope.bidId = id;
    };

    /**
     * @description Approve bid
     */
    $scope.approveBid = function () {
      $scope.isLoading = true;
      if (!$scope.bidId) {
        toaster.pop("error", "Error", "Please select a bid to approve");
        return;
      }
      bidBookService
        .approveBid($scope.bidId)
        .then((response) => {
          console.log(response);
          $scope.toggleApproveBidModal(false, null);
          $scope.setBiddings();
          toaster.pop("success", "Success", "Bid approved successfully");
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error.description || "Error approving bid"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Cancel bid
     */
    $scope.cancelBid = function () {
      $scope.isLoading = true;
      if (!$scope.bidId) {
        toaster.pop("error", "Error", "Please select a bid to cancel");
        return;
      }
      bidBookService
        .rejectBid($scope.bidId)
        .then((response) => {
          console.log(response);
          $scope.toggleCancelBidModal(false, null);
          $scope.setBiddings();
          toaster.pop("success", "Success", "Bid cancelled successfully");
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.description || "Error cancelling bid"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Change booking tab
     * @param {*} tab - Tab name
     */
    $scope.changeBookingTab = function (tab) {
      $scope.bookingTab = tab;
      $scope.setBookings();
    };

    /**
     * @description Set bookings for owner
     */
    $scope.setBookings = function () {
      $scope.isLoading = true;
      const filter = {
        status: "approved",
      };
      if ($scope.bookingTab === "completed") {
        filter["tripCompleted"] = true;
      }
      if ($scope.bookingTab === "active") {
        filter["tripCompleted"] = false;
        const date = new Date().toISOString().split("T")[0];
        filter["startDate"] = date;
      }
      if ($scope.bookingFilter.filterByCar != "all") {
        filter["vehicle._id"] = $scope.bookingFilter.filterByCar;
      }
      const sort = {};
      sort[$scope.bookingFilter.sortBy === "date" ? "createdAt" : "amount"] =
        $scope.bookingFilter.sortOrder === "desc" ? -1 : 1;
      bidBookService
        .getAllBidsByOwner($scope.currentPage, $scope.pageSize, filter, sort)
        .then((response) => {
          $scope.bookings = response.data.bids;
          $scope.totalPage = response.data.pages;
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.description || "Error loading bookings"
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Open and close odometer modal
     * @param {*} state - Modal state
     * @param {*} id - Booking id
     * @param {*} type - Type of odometer value (current or final)
     */
    $scope.toggleOdometerModal = (state, id, type) => {
      $scope.odometerModal = state;
      $scope.bookingId = id;
      $scope.type = type;
      if (id) {
        const currentBid = $scope.bookings.find(
          (booking) => booking._id === $scope.bookingId
        );
        $scope.startOdometer = currentBid?.startOdometer;
      }
    };

    /**
     * @description Add odometer value
     */
    $scope.addOdometerValue = function () {
      if ($scope.odometerFormData.odometerValue == null) {
        toaster.pop("error", "Error", "Please enter the odometer value");
        return;
      }
      if (!$scope.bookingId) {
        toaster.pop("error", "Error", "Please select a booking");
        return;
      }
      if (!$scope.type) {
        toaster.pop("error", "Error", "Please select a type");
        return;
      }
      const currentOdometer = parseInt($scope.odometerFormData.odometerValue);
      $scope.isLoading = true;
      if ($scope.type === "start") {
        bidBookService
          .addStartOdometerReading($scope.bookingId, currentOdometer)
          .then(() => {
            $scope.odometerFormData = {};
            $scope.toggleOdometerModal(false, null, null);
            $scope.setBookings();
            toaster.pop(
              "success",
              "Success",
              "Odometer value added successfully"
            );
          })
          .catch((error) => {
            toaster.pop(
              "error",
              "Error",
              error.description || "Error adding odometer value"
            );
          })
          .finally(() => {
            $scope.isLoading = false;
          });
      } else {
        const currentBid = $scope.bookings.find(
          (booking) => booking._id === $scope.bookingId
        );
        if (currentBid.startOdometer >= currentOdometer) {
          toaster.pop(
            "error",
            "Error",
            "Final odometer value should be greater than start odometer value"
          );
          $scope.isLoading = false;
          return;
        }
        bidBookService
          .addFinalOdometerReading($scope.bookingId, currentOdometer)
          .then(() => {
            $scope.odometerFormData = {};
            toaster.pop(
              "success",
              "Success",
              "Odometer value added successfully"
            );
            finalizeBooking($scope.bookingId);
            $scope.toggleOdometerModal(false, null, null);
          })
          .catch((error) => {
            toaster.pop(
              "error",
              "Error",
              error.description || "Error adding odometer value"
            );
          })
          .finally(() => {
            $scope.isLoading = false;
          });
      }
    };

    /**
     * @description Finalize booking, calculate amount and update bid
     */
    const finalizeBooking = function (bookingId) {
      bidBookService
        .endTrip(bookingId)
        .then(() => {
          $scope.setBookings();
          toaster.pop("success", "Success", "Booking finalized successfully");
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error.description || "Error finalizing booking"
          );
        });
    };

    /**
     * @description Function to build data for bookings chart and load the chart
     */
    $scope.bookingChart = function () {
      $scope.isLoading = true;
      const analyticsField = $scope.bookingChartFilter.dataBy;
      const days = $scope.bookingChartFilter.days;
      chartService
        .getBookingChartDataForOwner(analyticsField, days)
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
            $scope.bookingChartFilter.typeOfChart,
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
      const analyticsField = $scope.revenueChartFilter.dataBy;
      const days = $scope.revenueChartFilter.days;
      chartService
        .getRevenueChartDataForOwner(analyticsField, days)
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

    $scope.comparisionChart = function () {
      $scope.isLoading = true;
      const days = $scope.comparisionChartFilter.days;
      chartService
        .getOwnerAverageAgainstAllOwners(days)
        .then((response) => {
          const datasetLabel =
            "Comparision of Owner Revenue with All Owners Average";
          console.log(response.data);
          const chartData = chartService.buildChartDataForComparision(
            response.data
          );
          $scope.loadChart(
            chartData,
            $scope.comparisionChartFilter.typeOfChart,
            "comparisionChart",
            true,
            datasetLabel
          );
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error?.name || "Error loading Comparision Chart"
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
      if ($scope.chartInstances[id]) {
        $scope.chartInstances[id].destroy();
      }
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
     * @description Function to change the page
     * @param {*} pagename - Name of the page
     */
    $scope.nextPage = function (pagename) {
      if (pagename === "bookings") {
        if ($scope.currentPage < $scope.totalPage) $scope.currentPage++;
        $scope.setBookings();
      } else if (pagename === "bids") {
        if ($scope.currentPage < $scope.totalPage) $scope.currentPage++;
        console.log($scope.currentPage);
        $scope.setBiddings();
      } else if (pagename === "cars") {
        if ($scope.currentPage < $scope.totalPage) $scope.currentPage++;
        $scope.setCars();
      }
    };

    $scope.prevPage = function (pagename) {
      if (pagename === "bookings") {
        if ($scope.currentPage > 1) $scope.currentPage--;
        $scope.setBookings();
      } else if (pagename === "bids") {
        if ($scope.currentPage > 1) $scope.currentPage--;
        $scope.setBiddings();
      } else if (pagename === "cars") {
        if ($scope.currentPage > 1) $scope.currentPage--;
        $scope.setCars();
      }
    };
  },
]);
