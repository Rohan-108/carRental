/**
 * @description Controller for the profile page.
 * @name profileController
 * @requires $scope
 * @requires $rootScope
 * @requires userService
 * @requires sessionService
 * @requires utilService
 * @requires approvalService
 * @requires bidBookService
 * @requires toaster
 * @requires $q
 */
angular.module("rentIT").controller("profileController", [
  "$scope",
  "$rootScope",
  "userService",
  "sessionService",
  "utilService",
  "approvalService",
  "bidBookService",
  "toaster",
  "$q",
  function (
    $scope,
    $rootScope,
    userService,
    sessionService,
    utilService,
    approvalService,
    bidBookService,
    toaster,
    $q
  ) {
    // Initialize variables
    $scope.pageSize = 5; // Number of items per page
    $scope.currentPage = 1; // Current page number
    $scope.totalPage = null; // Total number of pages
    $scope.currentTab = "home"; // Current tab
    $scope.currentUser = {}; // Current user
    $scope.passwordFormData = {}; // Password form data
    $scope.changePasswordModal = false; // Change password modal
    $scope.changeProfileModal = false; // Change profile modal
    $scope.profileFormData = {}; // Profile form data
    $scope.bookings = []; // Bookings
    // Booking filter
    $scope.bookingFilter = {
      sortBy: "date",
      sortOrder: "desc",
    };
    $scope.approvalMessage =
      "To become a seller, you need to be approved by the admin."; // Approval message
    $scope.approvalBtnText = "Seek Approval"; // Approval button text
    $scope.approvalBtnDisabled = false; // Approval button disabled
    $scope.avatar = "https://picsum.photos/200"; // Avatar
    $scope.bids = []; // Bids
    // Bid filter
    $scope.bidFilter = {
      filterBy: "all",
      sortBy: "date",
      sortOrder: "desc",
    };

    /**
     * @description Initialize the controller.
     */
    $scope.init = function () {
      $scope.getAvatar();
    };

    /**
     * @description Change tab.
     * @param {*} tab - Tab name
     */
    $scope.changeTab = function (tab) {
      $scope.currentTab = tab;
      switch (tab) {
        case "home":
          break;
        case "approval":
          $scope.setApproval();
          break;
        case "bookings":
          $scope.currentPage = 1;
          $scope.setBookings();
          break;
        case "biddings":
          $scope.currentPage = 1;
          $scope.setBiddings();
          break;
        default:
          break;
      }
    };

    /**
     * @description Get avatar of the current user and set the profile form data.
     */
    $scope.getAvatar = function () {
      $q.when(userService.getUserById($rootScope.user.id))
        .then((user) => {
          const blob = new Blob([user.avatar]);
          const avatar = URL.createObjectURL(blob);
          $scope.avatar = avatar;
          $scope.currentUser = user;
          $scope.profileFormData = {
            id: user.id,
            name: user.name,
            tel: user.tel,
            avatar: null,
          };
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Toggle the change password modal.
     * @param {*} state - State of the change password modal
     */
    $scope.toggleChangePasswordModal = function (state) {
      $scope.changePasswordModal = state;
    };

    /**
     * @description Change password.
     */
    $scope.changePassword = function () {
      if ($scope.changePasswordForm.$invalid) {
        toaster.pop("error", "Error", "Please fill all required fields.");
        return;
      }
      if (
        $scope.passwordFormData.newPassword !==
        $scope.passwordFormData.confirmPassword
      ) {
        toaster.pop("error", "Error", "Passwords do not match.");
        return;
      }
      // Hash the new password
      $q.when(utilService.hashPassword($scope.passwordFormData.newPassword))
        .then((hashedPassword) => {
          // Check if the new password is different from the old password
          if ($scope.currentUser.password === hashedPassword) {
            throw new Error(
              "New password must be different from the old password."
            );
          }
          // Update the user with the new password
          return userService.updateUser({
            id: $scope.currentUser.id,
            password: hashedPassword,
          });
        })
        .then(() => {
          toaster.pop("success", "Success", "Password changed successfully.");
          $scope.toggleChangePasswordModal(false);
          $scope.passwordFormData = {};
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Toggle the change profile modal.
     * @param {*} state - State of the change profile modal
     */
    $scope.toggleChangeProfileModal = function (state) {
      $scope.changeProfileModal = state;
    };

    /**
     * @description Change profile data.
     */
    $scope.changeProfile = function () {
      if ($scope.editProfileForm.$invalid) {
        toaster.pop("error", "Error", "Please fill all required fields.");
        return;
      }
      let imagePromise;
      if ($scope.profileFormData.avatar) {
        imagePromise = $q.when(
          utilService.toArrayBuffer([$scope.profileFormData.avatar])
        );
      } else {
        imagePromise = $q.when(null);
      }
      imagePromise
        .then((imageBuffer) => {
          // Update the user with the new profile data
          return userService.updateUser(
            Object.assign({}, $scope.profileFormData, {
              avatar: imageBuffer || $scope.currentUser.avatar,
            })
          );
        })
        .then(() => {
          return userService.getUserById($rootScope.user.id);
        })
        .then((user) => {
          sessionService.setUser(user);
          $scope.currentUser = user;
          $scope.toggleChangeProfileModal(false);
          $scope.getAvatar();
          toaster.pop("success", "Success", "Profile updated successfully.");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message || error);
        });
    };

    /**
     * @description Set approval status , message and button text.
     */
    $scope.setApproval = function () {
      $q.when(approvalService.getApprovalByUserId($rootScope.user.id))
        .then((approval) => {
          if (!approval) return;
          let approvalBtnText = $scope.approvalBtnText;
          let approvalMessage = $scope.approvalMessage;
          if (approval.status === "approved") {
            approvalMessage = "You are already approved as a seller.";
            approvalBtnText = "Approved";
          } else if (approval.status === "pending") {
            approvalMessage = "Your approval request is pending.";
            approvalBtnText = "Pending";
          } else if (approval.status === "rejected") {
            approvalMessage = "Your approval request is rejected.";
            approvalBtnText = "Rejected";
          }
          $scope.approvalMessage = approvalMessage;
          $scope.approvalBtnText = approvalBtnText;
          $scope.approvalBtnDisabled = true;
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Seek approval to become a seller.
     */
    $scope.seekApproval = function () {
      $scope.approvalBtnDisabled = true;
      $q.when(approvalService.getApprovalByUserId($rootScope.user.id))
        .then((approval) => {
          if (approval) {
            throw new Error("You already have a pending approval request.");
          }
          // Add a new approval request
          const newApproval = {
            id: "",
            userId: $rootScope.user.id,
            user: $scope.currentUser,
            status: "pending",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          return approvalService.addApproval(newApproval);
        })
        .then(() => {
          $scope.approvalBtnDisabled = true;
          $scope.setApproval();
          toaster.pop("success", "Success", "Approval request sent.");
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Set bookings based on the filter and pagination.
     */
    $scope.setBookings = function () {
      $q.when(bidBookService.getBookingsByUserId($rootScope.user.id))
        .then((bookings) => {
          if ($scope.bookingFilter.sortBy === "date") {
            bookings.sort((a, b) => a.createdAt - b.createdAt);
          } else {
            bookings.sort((a, b) => a.amount - b.amount);
          }
          if ($scope.bookingFilter.sortOrder === "desc") {
            bookings.reverse();
          }
          //pagination
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
          $scope.bookings = paginatedBookings;
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };

    /**
     * @description Set biddings based on the filter and pagination
     */
    $scope.setBiddings = function () {
      $q.when(bidBookService.getBidsByUserId($rootScope.user.id))
        .then((biddings) => {
          if ($scope.bidFilter.filterBy !== "all") {
            biddings = biddings.filter(
              (bid) => bid.status === $scope.bidFilter.filterBy
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
          //pagination
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
          $scope.bids = paginatedBiddings;
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        });
    };
  },
]);
