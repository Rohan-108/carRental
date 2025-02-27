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
  "userService",
  "carService",
  "bidBookService",
  "utilService",
  "chatService",
  "toaster",
  "$q",
  function (
    $scope,
    $rootScope,
    car,
    userService,
    carService,
    bidBookService,
    utilService,
    chatService,
    toaster,
    $q
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
      if ($rootScope.user.id === $scope.car.ownerId) {
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
        id: "",
        carId: $scope.car.id,
        userId: $rootScope.user.id,
        amount: Number($scope.rental.amount) * ndays,
        startDate: startDate,
        endDate: endDate,
        car: $scope.car,
        user: $rootScope.user,
        isOutStation: $scope.rental.isOutStation,
        ownerId: $scope.car.ownerId,
        status: "pending",
        tripCompleted: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      $q.when(bidBookService.addBid(bid))
        .then(() => {
          $scope.picker.clear();
          $scope.rental = {
            amount: $scope.car.rentalPrice,
            isOutStation: false,
          };
          toaster.pop("success", "Success", "Bid placed successfully");
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while placing bid");
        });
    };

    /**
     * @description Load user chat function
     */
    $scope.loadUserChat = function () {
      if ($rootScope.user.role === "super-admin") return;
      if ($scope.car.ownerId === $rootScope.user.id) return;
      $q.when(chatService.getConversationsByCarId($scope.car.id))
        .then((allCarConv) => {
          // get conversations where user is a member
          const myconversations = allCarConv.filter((conv) => {
            let ismyconv = false;
            conv.members.forEach((member) => {
              if (member.id === $scope.user.id) {
                ismyconv = true;
              }
            });
            return ismyconv;
          });
          // if no conversation found return
          if (myconversations.length === 0) return;
          return $q
            .when(chatService.getChatsByConversationId(myconversations[0].id))
            .then((myChat) => {
              myChat.sort((a, b) => a.createdAt - b.createdAt);
              myChat = myChat.map((chat) => {
                if (chat.image) {
                  chat.image = URL.createObjectURL(new Blob([chat.image]));
                }
                chat.user.avatar = URL.createObjectURL(
                  new Blob([chat.user.avatar])
                );
                return chat;
              });
              $scope.messages = myChat;
              $scope.convId = myconversations[0].id;
            });
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while loading chat messages");
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
      if ($scope.car.ownerId === $rootScope.user.id) {
        toaster.pop("error", "Error", "You cannot send message to yourself");
        return;
      }
      if ($scope.convId === null) {
        toaster.pop("error", "Error", "Error while sending message");
        return;
      }
      if ($scope.message.trim() === "") {
        toaster.pop("error", "Error", "Message cannot be empty");
        return;
      }
      let convId = $scope.convId;
      $q.when(userService.getUserById($rootScope.user.id))
        .then((user) => {
          // if conversation id is not present create a new conversation
          if (!convId) {
            return $q
              .when(carService.getCarById($scope.car.id))
              .then((carData) => {
                return chatService
                  .addConversation({
                    id: "",
                    carId: $scope.car.id,
                    car: carData,
                    members: [user, $scope.car.owner],
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  })
                  .then((id) => {
                    convId = id;
                    return convId;
                  });
              });
          }
          return convId;
        })
        .then(() => {
          // add chat to the conversation
          return chatService.addChat({
            id: "",
            conversationId: convId,
            sender: $rootScope.user.id,
            user: $rootScope.user,
            message: $scope.message,
            image: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          });
        })
        .then((chatId) => {
          // get chat by id
          return chatService.getChatById(chatId);
        })
        .then((chat) => {
          // set image and avatar to blob url
          chat.image = URL.createObjectURL(new Blob([chat.image]));
          chat.user.avatar = URL.createObjectURL(new Blob([chat.user.avatar]));
          chat.createdAt = new Date(chat.createdAt).toLocaleString();
          $scope.messages.push(chat);
          $scope.message = "";
          $scope.convId = convId;
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while sending message");
        });
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
     * @description Upload image function to upload image
     */
    $scope.uploadImage = function () {
      if ($scope.image === null) {
        toaster.pop("error", "Error", "Please select an image to upload");
        return;
      }
      $q.when(utilService.toArrayBuffer([$scope.image]))
        .then((image) => {
          // add image to chat
          return userService.getUserById($rootScope.user.id).then((user) => {
            return chatService.addChat({
              id: "",
              conversationId: $scope.convId,
              sender: $rootScope.user.id,
              message: "",
              user: user,
              image: image,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
          });
        })
        .then((id) => {
          return chatService.getChatById(id);
        })
        .then((chat) => {
          // set image and avatar to blob url
          chat.image = URL.createObjectURL(new Blob([chat.image]));
          chat.user.avatar = URL.createObjectURL(new Blob([chat.user.avatar]));
          chat.createdAt = new Date(chat.createdAt).toLocaleString();
          $scope.toggleModal(false);
          $scope.messages.push(chat);
          toaster.pop("success", "Success", "Image uploaded successfully");
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while uploading image");
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
      return $q
        .when(bidBookService.getBookingsByCarId($scope.car.id))
        .then((bookings) => {
          return bookings.flatMap((booking) =>
            getDatesInRange(booking.startDate, booking.endDate)
          );
        })
        .catch((_) => {
          toaster.pop("error", "Error", "Error while getting booked dates");
          return [];
        });
    }
  },
]);
