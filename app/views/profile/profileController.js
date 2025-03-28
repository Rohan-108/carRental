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
  "approvalService",
  "bidBookService",
  "toaster",
  function (
    $scope,
    $rootScope,
    userService,
    sessionService,
    approvalService,
    bidBookService,
    toaster
  ) {
    // Initialize variables
    $scope.isLoading = false; // Loading state
    $scope.pageSize = 5; // Number of items per page
    $scope.currentPage = 1; // Current page number
    $scope.totalPage = null; // Total number of pages
    $scope.currentTab = "home"; // Current tab
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
    $scope.bids = []; // Bids
    // Bid filter
    $scope.bidFilter = {
      filterBy: "all",
      sortBy: "date",
      sortOrder: "desc",
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
      $scope.isLoading = true;
      userService
        .changePassword(
          $scope.passwordFormData.oldPassword,
          $scope.passwordFormData.newPassword
        )
        .then((response) => {
          console.log(response);
          toaster.pop(
            "success",
            "Success",
            response.data.message || "Password changed successfully."
          );
          $scope.toggleChangePasswordModal(false);
          $scope.passwordFormData = {};
        })
        .catch((response) => {
          toaster.pop(
            "error",
            "Error",
            response.description || "Error changing password."
          );
        })
        .finally(() => {
          $scope.isLoading = false;
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
      $scope.isLoading = true;
      if ($scope.editProfileForm.$invalid) {
        toaster.pop("error", "Error", "Please fill all required fields.");
        return;
      }
      const formData = new FormData();
      for (const key in $scope.profileFormData) {
        formData.append(key, $scope.profileFormData[key]);
      }
      userService
        .updateUser(formData)
        .then((response) => {
          const newUser = {
            ...response.data.user,
            accessToken: $rootScope.user.accessToken,
          };
          sessionService.setUser(newUser);
          $rootScope.user = newUser;
          toaster.pop(
            "success",
            "Success",
            response.data.message || "Profile updated successfully."
          );
          $scope.toggleChangeProfileModal(false);
        })
        .catch((response) => {
          toaster.pop(
            "error",
            "Error",
            response.description || "Error updating profile."
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Set approval status , message and button text.
     */
    $scope.setApproval = function () {
      $scope.isLoading = true;
      if (
        $rootScope.user.role === "super-admin" ||
        $rootScope.user.role === "admin"
      ) {
        $scope.approvalMessage =
          "You are an admin. You are already approved as a seller.";
        $scope.approvalBtnText = "Approved";
        $scope.approvalBtnDisabled = true;
        $scope.isLoading = false;
        return;
      }
      approvalService
        .getApprovalByUserId()
        .then((approval) => {
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
          toaster.pop(
            "error",
            "Error",
            "You are not approved as a seller yet."
          );
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Seek approval to become a seller.
     */
    $scope.seekApproval = function () {
      $scope.approvalBtnDisabled = true;
      $scope.isLoading = true;
      approvalService
        .addApproval()
        .then((response) => {
          toaster.pop("success", "Success", response.data.message);
          $scope.setApproval();
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.message);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Set bookings based on the filter and pagination.
     */
    $scope.setBookings = function () {
      const filter = {
        status: "approved",
      };
      const sort = {};
      if ($scope.bookingFilter.sortBy === "date") {
        sort.createdAt = $scope.bookingFilter.sortOrder === "desc" ? -1 : 1;
      } else {
        sort.amount = $scope.bookingFilter.sortOrder === "desc" ? -1 : 1;
      }
      $scope.isLoading = true;
      bidBookService
        .getAllBidsByUser($scope.currentPage, $scope.pageSize, filter, sort)
        .then((response) => {
          $scope.bookings = response.data.bids;
          $scope.totalPage = response.data.pages;
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.name || "Error getting bids.");
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Set biddings based on the filter and pagination
     */
    $scope.setBiddings = function () {
      const filter = {};
      if ($scope.bidFilter.filterBy !== "all") {
        filter.status = $scope.bidFilter.filterBy;
      }
      const sort = {};
      if ($scope.bidFilter.sortBy === "date") {
        sort.createdAt = $scope.bidFilter.sortOrder === "desc" ? -1 : 1;
      } else {
        sort.amount = $scope.bidFilter.sortOrder === "desc" ? -1 : 1;
      }
      bidBookService
        .getAllBidsByUser($scope.currentPage, $scope.pageSize, filter, sort)
        .then((response) => {
          $scope.bids = response.data.bids;
          $scope.totalPage = response.data.pages;
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.name || "Error getting bids.");
        })
        .finally(() => {
          $scope.isLoading = false;
        });
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
        $scope.setBiddings();
      }
    };

    $scope.prevPage = function (pagename) {
      if (pagename === "bookings") {
        if ($scope.currentPage > 1) $scope.currentPage--;
        $scope.setBookings();
      } else if (pagename === "bids") {
        if ($scope.currentPage > 1) $scope.currentPage--;
        $scope.setBiddings();
      }
    };
  },
]);
