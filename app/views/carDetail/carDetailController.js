/**
 * @description Controller for car detail page
 * @name carDetailController
 * @requires $scope
 * @requires $rootScope
 * @requires car
 * @requires userService
 * @requires carService
 * @requires bidBookService
 * @requires utilService
 * @requires chatService
 * @requires toaster
 * @requires $q
 */
angular.module("rentIT").controller("carDetailController", [
  "$scope",
  "$rootScope",
  "car",
  "bidBookService",
  "utilService",
  "chatService",
  "toaster",
  "$q",
  "$timeout",
  function (
    $scope,
    $rootScope,
    car,
    bidBookService,
    utilService,
    chatService,
    toaster,
    $q,
    $timeout
  ) {
    // Initialize variables
    $scope.car = car; // set car details that came through resolve
    $scope.currentImage = car.images[0]; // set current image to first image
    $scope.imageModal = false; // set image modal to false
    $scope.image = null; // set image to null
    // set rental object with amount and isOutStation
    $scope.rental = {
      amount: $scope.car.rentalPrice,
      isOutStation: false,
    };
    $scope.picker = null; // set picker to null
    $scope.messages = []; // set messages to empty array
    $scope.message = ""; // set message to empty string
    $scope.convId = null; // set conversation id to null

    /**
     * @description Initialize function
     */
    $scope.init = function () {
      $scope.setUpDatePicker();
      $scope.loadUserChat();
      $scope.listenForChat();
    };

    $scope.listenForChat = function () {
      chatService.socket.on("newMessage", (data) => {
        $timeout(() => {
          $scope.messages.push(data);
        });
      });
    };
    /**
     * @description Change image function
     * @param {*} image - image url to change
     */
    $scope.changeImage = function (image) {
      $scope.currentImage = image;
    };

    /**
     * @description Set up date picker function and block the booked dates
     */
    $scope.setUpDatePicker = function () {
      getBookedDates()
        .then((bookedDates) => {
          const formattedBookedDates = bookedDates.map(
            (d) => new easepick.DateTime(d, "YYYY-MM-DD")
          );
          // create date picker
          const datePicker = new easepick.create({
            element: document.getElementById("datepicker"),
            css: [
              "https://cdn.jsdelivr.net/npm/@easepick/bundle@1.2.1/dist/index.css",
            ],
            plugins: ["RangePlugin", "LockPlugin"],
            zIndex: 1000,
            RangePlugin: {
              tooltipNumber(num) {
                return num;
              },
              locale: {
                one: "day",
                other: "days",
              },
            },
            // set min date to current date and block the booked dates
            LockPlugin: {
              minDate: new Date(),
              minDays: $scope.car.minRentalPeriod,
              inseparable: true,
              filter(date, picked) {
                if (picked.length === 1) {
                  return (
                    !picked[0].isSame(date, "day") &&
                    date.inArray(formattedBookedDates, "[]")
                  );
                }
                return date.inArray(formattedBookedDates, "[]");
              },
            },
          });
          $scope.picker = datePicker;
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while setting up date picker");
        });
    };

    /**
     * @description Change rental amount function
     */
    $scope.changeBidAmount = function () {
      $scope.rental.amount = $scope.rental.isOutStation
        ? Number($scope.car.rentalPriceOutStation)
        : Number($scope.car.rentalPrice);
    };
    /**
     * @description Bid now function to place a bid
     */
    $scope.bidNow = function () {
      if ($rootScope.user._id === $scope.car.owner._id) {
        toaster.pop("error", "Error", "You cannot bid on your own car");
        return;
      }
      if ($rootScope.user.role === "super-admin") {
        toaster.pop("error", "Error", "Super admin cannot place bid");
        return;
      }
      const startDate = $scope.picker.getStartDate()
        ? $scope.picker.getStartDate().format("YYYY-MM-DD")
        : null;
      const endDate = $scope.picker.getEndDate()
        ? $scope.picker.getEndDate().format("YYYY-MM-DD")
        : null;
      if (!startDate || !endDate) {
        toaster.pop("error", "Error", "Please select start and end date");
        return;
      }
      // check if rental period is between min and max rental period
      const ndays = utilService.getDaysDiff(startDate, endDate);
      if (
        ndays < Number($scope.car.minRentalPeriod) ||
        ndays > Number($scope.car.maxRentalPeriod)
      ) {
        toaster.pop(
          "error",
          "Error",
          `Rental period should be between ${$scope.car.minRentalPeriod} and ${$scope.car.maxRentalPeriod} days`
        );
        return;
      }
      // check if rental amount is greater than base price
      if (
        $scope.rental.amount <
        ($scope.rental.isOutStation
          ? Number($scope.car.rentalPriceOutStation)
          : Number($scope.car.rentalPrice))
      ) {
        toaster.pop(
          "error",
          "Error",
          "Rental amount cannot be less than the base price"
        );
        return;
      }
      // create bid object
      const bid = {
        amount: Number($scope.rental.amount) * ndays,
        startDate: startDate,
        endDate: endDate,
        isOutStation: $scope.rental.isOutStation,
        status: "pending",
        tripCompleted: false,
      };
      bidBookService
        .addBid(bid, $scope.car._id)
        .then((response) => {
          console.log(response);
          toaster.pop("success", "Success", "Bid placed successfully");
          $scope.picker.clear();
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error.description || "Error while placing bid"
          );
        });
    };

    /**
     * @description Load user chat function
     */
    $scope.loadUserChat = function () {
      if ($rootScope.user.role === "super-admin") return;
      if ($scope.car.owner._id === $rootScope.user._id) return;
      chatService
        .getConversationByCarAndMember($scope.car._id, $rootScope.user._id)
        .then((response) => {
          $scope.convId = response.data._id;
          chatService.joinConversation($scope.convId);
          chatService
            .getAllChats($scope.convId)
            .then((response) => {
              $scope.messages = response.data.chats;
            })
            .catch((error) => {
              toaster.pop("error", "Error", "Error while loading chat");
            });
        })
        .catch((error) => {
          toaster.pop("success", "success", "No conversation found");
        });
    };

    /**
     * @description Send chat function to send message
     */
    $scope.sendChat = function () {
      if ($rootScope.user.role === "super-admin") {
        toaster.pop("error", "Error", "Super admin cannot send message");
        return;
      }
      if ($scope.car.owner._id === $rootScope.user._id) {
        toaster.pop("error", "Error", "You cannot send message to yourself");
        return;
      }
      if ($scope.message.trim() === "") {
        toaster.pop("error", "Error", "Message cannot be empty");
        return;
      }
      if ($scope.convId === null) {
        chatService
          .addConversation($scope.car._id, [
            $scope.car.owner._id,
            $rootScope.user._id,
          ])
          .then((response) => {
            $scope.convId = response.data.conversationId;
            chatService
              .sendMessage($scope.message, $scope.convId)
              .then(() => {
                $scope.message = "";
              })
              .catch((error) => {
                console.log(error);
                toaster.pop("error", "Error", "Error while sending message");
              });
          })
          .catch((error) => {
            console.log(error);
            toaster.pop("error", "Error", "Error while creating conversation");
          });
      } else {
        chatService
          .sendMessage($scope.message, $scope.convId)
          .then(() => {
            $scope.message = "";
          })
          .catch((error) => {
            console.log(error);
            toaster.pop("error", "Error", "Error while sending message");
          });
      }
    };

    /**
     * @description Toggle modal function for image upload
     * @param {*} state - state to toggle modal
     */
    $scope.toggleModal = function (state) {
      $scope.imageModal = state;
      $scope.image = null;
    };

    /**
     * @description upload the image to the selected conversation
     */
    $scope.uploadImage = function () {
      if ($scope.image === null) {
        toaster.pop("error", "Error", "Please select an image");
        return;
      }
      const key = $scope.image.name + "-" + Date.now();
      const contentType = $scope.image.type;
      chatService
        .uploadAttachment($scope.image, key, contentType, $scope.convId)
        .then((response) => {
          toaster.pop("success", "Success", "Image uploaded successfully");
          $scope.toggleModal(false);
          $scope.image = null;
        })
        .catch((error) => {
          toaster.pop(
            "error",
            "Error",
            error?.message || "Error while uploading image"
          );
        });
    };

    /**
     * @description Get dates in range function
     * @param {*} startDate - start date
     * @param {*} endDate - end date
     * @returns {Array} - dates in range
     */
    function getDatesInRange(startDate, endDate) {
      const dates = [];
      let currentDate = new Date(startDate);
      const end = new Date(endDate);
      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split("T")[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    }
    /**
     * @description Get booked dates function
     * @returns {Promise<Array>} - booked dates
     */
    function getBookedDates() {
      const deferred = $q.defer();
      bidBookService
        .getBookedDates($scope.car._id)
        .then((response) => {
          const bookings = response.data.bookedDates;
          const flattenBookedDates = bookings.flatMap((booking) =>
            getDatesInRange(booking.startDate, booking.endDate)
          );
          console.log(flattenBookedDates);
          return deferred.resolve(flattenBookedDates);
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while getting booked dates");
          return deferred.resolve([]);
        });
      return deferred.promise;
    }
  },
]);
