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
  "chatService",
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
    chatService,
    utilService,
    toaster,
    $q
  ) {
    // Initialize variables
    $scope.pageSize = 5; // Number of items per page
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
    $scope.chartInstances = {
      bookingChartInstance: null,
      revenueChartInstance: null,
      comparisionChartInstance: null,
    };
    $scope.bookingChartFilter = {
      dataBy: "status",
      typeOfChart: "bar",
    };
    $scope.revenueChartFilter = {
      dataBy: "location",
      typeOfChart: "bar",
    };
    // $scope.comparisionChartFilter = {
    //   days: 1,
    // };
    /**
     * @description Initialize function
     */
    $scope.init = function () {
      if ($scope.currentTab === "home") {
        $scope.setStat();
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
     * @description Set statistics for dashboard
     */
    $scope.setStat = function () {
      $q.when(carService.getCountByIndex("ownerId", $rootScope.user.id))
        .then((nCars) => {
          return $q
            .when(bidBookService.getBidsByOwnerId($rootScope.user.id))
            .then((allBids) => {
              let revenue = 0,
                noOfPendingBids = 0,
                noOfRejectedBids = 0,
                noOfApprovedBids = 0,
                noOfBids = 0,
                totalDay = 0;
              // Calculate statistics
              allBids.forEach((bid) => {
                const days = utilService.getDaysDiff(
                  bid.startDate,
                  bid.endDate
                );
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
                revenue: revenue,
                bids: noOfBids,
                bookings: noOfApprovedBids,
                rejectedBids: noOfRejectedBids,
                avgRentalDay: Math.floor(totalDay / noOfBids) || 0,
              };
            });
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
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
      $q.when(userService.getUserById($rootScope.user.id))
        .then((owner) => {
          // Convert images to array buffer
          const promises = $scope.carFormData.images.map((file) =>
            utilService.toArrayBuffer([file])
          );
          // Add car
          return $q.all(promises).then((buffers) => {
            const carObj = Object.assign({}, $scope.carFormData, {
              id: "",
              ownerId: $rootScope.user.id,
              owner: owner,
              show: "true",
              images: buffers,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            return carService.addCar(carObj);
          });
        })
        .then((id) => {
          return carService.getCarById(id);
        })
        .then((newCar) => {
          // Set image url
          const blob = new Blob([newCar.images[0]]);
          const imgUrl = URL.createObjectURL(blob);
          newCar.imgUrl = imgUrl;
          $scope.carFormData = {};
          $scope.toggleAddCarModal(false);
          $scope.cars.push(newCar);
          toaster.pop("success", "Success", "Car added successfully");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message || error);
        });
    };

    /**
     * @description Set cars for owner
     */
    $scope.setCars = function () {
      if ($scope.cars.length !== 0) return;
      $q.when(carService.getCarsByOwnerId($rootScope.user.id))
        .then((cars) => {
          cars = cars.map((car) => {
            const blob = new Blob([car.images[0]]);
            const imgUrl = URL.createObjectURL(blob);
            return Object.assign({}, car, { imgUrl: imgUrl });
          });
          $scope.cars = cars;
          $scope.totalPage = Math.ceil(cars.length / $scope.pageSize);
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
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
      const car = $scope.cars.find((car) => car.id === id);
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
      if ($scope.editCarForm.$invalid) {
        toaster.pop("error", "Error", "Please fill all the fields");
        return;
      }
      $q.when(carService.getCarById($scope.carId))
        .then((car) => {
          // Convert images to array buffer
          const promises = $scope.editCarFormData.images.map((file) =>
            utilService.toArrayBuffer([file])
          );
          // Update car
          return $q.all(promises).then((buffers) => {
            return carService.updateCar({
              id: $scope.carId,
              rentalPrice: $scope.editCarFormData.rentalPrice,
              ratePerKm: $scope.editCarFormData.ratePerKm,
              fixedKilometer: $scope.editCarFormData.fixedKilometer,
              location: $scope.editCarFormData.location,
              rentalPriceOutStation:
                $scope.editCarFormData.rentalPriceOutStation,
              minRentalPeriod: $scope.editCarFormData.minRentalPeriod,
              maxRentalPeriod: $scope.editCarFormData.maxRentalPeriod,
              images: buffers.length > 0 ? buffers : car.images,
              updatedAt: Date.now(),
            });
          });
        })
        .then(() => {
          // Set image url
          $scope.editCarFormData = {};
          $scope.toggleEditCarModal(false, null);
          $scope.setCars();
          toaster.pop("success", "Success", "Car updated successfully");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message || error);
        });
    };

    /**
     * @description Set biddings for owner
     */
    $scope.setBiddings = function () {
      $q.when(bidBookService.getBidsByOwnerId($rootScope.user.id))
        .then((biddings) => {
          // Filter biddings
          let cars = { all: { id: "all", name: "All" } };
          biddings.forEach((bid) => {
            cars[bid.car.id] = { id: bid.car.id, name: bid.car.name };
          });
          if ($scope.bidFilter.filterByStatus !== "all") {
            biddings = biddings.filter(
              (bid) => bid.status === $scope.bidFilter.filterByStatus
            );
          }
          if ($scope.bidFilter.filterByCar !== "all") {
            biddings = biddings.filter(
              (bid) => bid.car.id === $scope.bidFilter.filterByCar
            );
          }
          if ($scope.bidFilter.sortBy === "date") {
            biddings.sort((a, b) => a.createdAt - b.createdAt);
          } else {
            biddings.sort((a, b) => a.amount - b.amount);
          }
          if ($scope.bidFilter.sortOrder === "desc") {
            biddings.reverse();
          }
          // Paginate biddings
          const totalItems = biddings.length;
          $scope.totalPage = Math.floor(totalItems / $scope.pageSize) + 1;
          $scope.currentPage = Math.max(
            1,
            Math.min($scope.currentPage, $scope.totalPage)
          );
          const start = ($scope.currentPage - 1) * $scope.pageSize;
          const paginatedBiddings = biddings.slice(
            start,
            start + $scope.pageSize
          );
          // Set biddings
          $scope.bids = paginatedBiddings;
          $scope.carsForFilter = Object.values(cars);
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
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
      if (!$scope.bidId) {
        toaster.pop("error", "Error", "Please select a bid to approve");
        return;
      }
      $q.when(bidBookService.getBidById($scope.bidId))
        .then((bid) => {
          if (!bid) {
            throw new Error("Bid not found");
          }
          bid.status = "approved";
          // Update bid status and return bid
          return $q
            .when(bidBookService.updateBid({ id: bid.id, status: "approved" }))
            .then(() => bid);
        })
        .then((bid) => {
          // Get all bids by car id and reject overlapping bids
          return $q
            .when(bidBookService.getBidsByCarId(bid.car.id))
            .then((allBids) => {
              function parseCustomDate(dateStr) {
                return new Date(dateStr + "T00:00:00");
              }
              const compStart = parseCustomDate(bid.startDate);
              const compEnd = parseCustomDate(bid.endDate);
              const updatePromises = []; // Update promises
              allBids.forEach((bidItem) => {
                if (bidItem.id !== bid.id) {
                  const bidStart = parseCustomDate(bidItem.startDate);
                  const bidEnd = parseCustomDate(bidItem.endDate);
                  if (
                    (bidStart.getTime() >= compStart.getTime() &&
                      bidStart.getTime() <= compEnd.getTime()) ||
                    (bidEnd.getTime() >= compStart.getTime() &&
                      bidEnd.getTime() <= compEnd.getTime())
                  ) {
                    updatePromises.push(
                      bidBookService.updateBid({
                        id: bidItem.id,
                        status: "rejected",
                      })
                    );
                  }
                }
              });
              // Update all overlapping bids and return original bid
              return $q.all(updatePromises).then(() => bid);
            });
        })
        .then((bid) => {
          // Get user and conversation by car id and add chat
          return $q
            .when(userService.getUserById($rootScope.user.id))
            .then((user) => {
              return $q
                .when(chatService.getConversationsByCarId(bid.car.id))
                .then((convs) => {
                  // Get conversation id
                  const convIdArr = convs.filter((conv) =>
                    conv.members.some((member) => member.id === user.id)
                  );
                  // Add chat
                  if (convIdArr.length && convIdArr[0].id) {
                    return chatService.addChat({
                      id: "",
                      message: `Your bid for ${bid.car.name} from ${bid.startDate} to ${bid.endDate} of amount Rs.${bid.amount} has been approved`,
                      conversationId: convIdArr[0].id,
                      image: null,
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                      sender: user.id,
                      user: user,
                    });
                  }
                });
            })
            .then(() => bid);
        })
        .then(() => {
          // Set biddings
          $scope.toggleApproveBidModal(false, null);
          $scope.setBiddings();
          toaster.pop("success", "Success", "Bid approved successfully");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Cancel bid
     */
    $scope.cancelBid = function () {
      if (!$scope.bidId) {
        toaster.pop("error", "Error", "Please select a bid to cancel");
        return;
      }
      $q.when(
        bidBookService.updateBid({ id: $scope.bidId, status: "rejected" })
      )
        .then(() => {
          $scope.toggleCancelBidModal(false, null);
          $scope.setBiddings();
          toaster.pop("success", "Success", "Bid cancelled successfully");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
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
      $q.when(bidBookService.getBookingsByOwnerId($rootScope.user.id))
        .then((bookings) => {
          // Filter bookings and get unique cars
          let cars = { all: { id: "all", name: "All" } };
          bookings.forEach((bid) => {
            cars[bid.car.id] = { id: bid.car.id, name: bid.car.name };
          });
          const now = new Date();
          if ($scope.bookingTab === "active") {
            bookings = bookings.filter(
              (booking) =>
                new Date(booking.startDate) <= now &&
                booking.tripCompleted === false
            );
          } else if ($scope.bookingTab === "completed") {
            bookings = bookings.filter(
              (booking) => booking.tripCompleted === true
            );
          }
          if ($scope.bookingFilter.filterByCar != "all") {
            bookings = bookings.filter(
              (booking) => booking.carId == $scope.bookingFilter.filterByCar
            );
          }
          if ($scope.bookingFilter.sortBy === "date") {
            bookings.sort((a, b) => a.createdAt - b.createdAt);
          } else if ($scope.bookingFilter.sortBy === "amount") {
            bookings.sort((a, b) => a.amount - b.amount);
          }
          if ($scope.bookingFilter.sortOrder === "desc") {
            bookings.reverse();
          }
          // Paginate bookings
          const totalItems = bookings.length;
          $scope.totalPage = Math.floor(totalItems / $scope.pageSize) + 1;
          $scope.currentPage = Math.max(
            1,
            Math.min($scope.currentPage, $scope.totalPage)
          );
          const start = ($scope.currentPage - 1) * $scope.pageSize;
          const paginatedBookings = bookings.slice(
            start,
            start + $scope.pageSize
          );
          // Set bookings and cars
          $scope.bookings = paginatedBookings;
          $scope.carsForFilter = Object.values(cars);
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
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
      $q.when(bidBookService.getBidById($scope.bookingId))
        .then((booking) => {
          if (
            $scope.type === "final" &&
            booking.currentOdometer > $scope.odometerFormData.odometerValue
          ) {
            throw new Error(
              "Final odometer value should be greater than starting odometer value"
            );
          }
          // Update odometer value
          return bidBookService.updateOdometer(
            $scope.bookingId,
            $scope.type,
            Number($scope.odometerFormData.odometerValue)
          );
        })
        .then(() => {
          if ($scope.type === "final") {
            return $scope.finalizeBooking();
          }
        })
        .then(() => {
          $scope.setBookings();
          $scope.toggleOdometerModal(false, null, null);
          $scope.odometerFormData = {};
          toaster.pop(
            "success",
            "Success",
            "Odometer value added successfully"
          );
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Finalize booking, calculate amount and update bid
     */
    $scope.finalizeBooking = function () {
      if (!$scope.bookingId) {
        toaster.pop("error", "Error", "Please select a booking");
        return;
      }
      $q.when(bidBookService.getBidById($scope.bookingId))
        .then((booking) => {
          // Calculate amount
          const newAmount =
            booking.amount +
            booking.car.ratePerKm *
              Math.max(
                Number(booking.finalOdometer) -
                  Number(booking.currentOdometer) -
                  Number(booking.car.fixedKilometer) *
                    utilService.getDaysDiff(booking.startDate, booking.endDate),
                0
              );
          // Update bid
          return bidBookService.updateBid({
            id: booking.id,
            amount: newAmount,
            tripCompleted: true,
            updatedAt: Date.now(),
          });
        })
        .then(() => {
          toaster.pop("success", "Success", "Booking completed successfully");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Function to build data for bookings chart and load the chart
     */
    $scope.bookingChart = function () {
      const analyticsField = $scope.bookingChartFilter.dataBy;
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
          "ownerId",
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
            $scope.bookingChartFilter.typeOfChart,
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
      const analyticsField = $scope.revenueChartFilter.dataBy;
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
          "ownerId",
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
      if (id === "bookChart" && $scope.chartInstances.bookingChartInstance) {
        $scope.chartInstances.bookingChartInstance.destroy();
      }
      if (id === "revenueChart" && $scope.chartInstances.revenueChartInstance) {
        $scope.chartInstances.revenueChartInstance.destroy();
      }
      if (
        id === "chartComparison" &&
        $scope.chartInstances.comparisionChartInstance
      ) {
        $scope.chartInstances.comparisionChartInstance.destroy();
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
      if (id === "bookChart") {
        $scope.chartInstances.bookingChartInstance = chart;
      }
      if (id === "revenueChart") {
        $scope.chartInstances.revenueChartInstance = chart;
      }
      if (id === "chartComparison") {
        $scope.chartInstances.comparisionChartInstance = chart;
      }
    };
  },
]);
