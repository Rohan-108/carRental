/**
 * @description Controller for the profile page.
 * @name profileController
 * @requires $scope
 * @requires userFactory
 * @requires approvalService
 * @requires bidBookService
 * @requires toaster
 * @requires $uibModal
 */
angular.module("rentIT").controller("profileController", [
  "$scope",
  "userFactory",
  "approvalService",
  "bidBookService",
  "toaster",
  "$uibModal",
  function (
    $scope,
    userFactory,
    approvalService,
    bidBookService,
    toaster,
    $uibModal
  ) {
    // Initialize variables
    $scope.isLoading = false; // Loading state
    $scope.pageSize = 5; // Number of items per page
    $scope.currentPage = 1; // Current page number
    $scope.totalPage = null; // Total number of pages
    $scope.totalItems = 0; // Total items for UI Bootstrap pagination
    $scope.currentTab = "home"; // Current tab
    $scope.passwordFormData = {}; // Password form data
    $scope.profileFormData = {
      username: $scope.user.username,
      avatar: null,
      tel: $scope.user.tel,
    }; // Profile form data
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
     * @description Open the change password modal.
     */
    $scope.toggleChangePasswordModal = function () {
      var modalInstance = $uibModal.open({
        templateUrl: "changePasswordModal.html",
        backdrop: "static", // Prevent closing on backdrop click
        keyboard: false, // Prevent closing on ESC key
        controller: function ($scope, $uibModalInstance, passwordFormData) {
          $scope.passwordFormData = passwordFormData;

          $scope.ok = function () {
            if ($scope.changePasswordForm.$invalid) {
              return;
            }
            $uibModalInstance.close($scope.passwordFormData);
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss("cancel");
          };
        },
        resolve: {
          passwordFormData: function () {
            return $scope.passwordFormData;
          },
        },
      });

      modalInstance.result
        .then(function (passwordData) {
          // Handle the password change
          $scope.isLoading = true;
          const user = userFactory.createUser($scope.user);
          user
            .changePassword(
              passwordData.oldPassword,
              passwordData.newPassword,
              passwordData.confirmPassword
            )
            .then(() => {
              toaster.pop(
                "success",
                "Success",
                "Password changed successfully."
              );
            })
            .catch((error) => {
              console.log(error);
              toaster.pop(
                "error",
                "Error",
                error?.description || "Error changing password."
              );
            })
            .finally(() => {
              $scope.isLoading = false;
            });
        })
        .catch(function () {
          console.log("Password modal dismissed.");
        });
    };

    /**
     * @description Open the change profile modal.
     */
    $scope.toggleChangeProfileModal = function () {
      var modalInstance = $uibModal.open({
        templateUrl: "profileEditModal.html",
        backdrop: "static", // Prevent closing on backdrop click
        keyboard: false, // Prevent closing on ESC key
        controller: function ($scope, $uibModalInstance, profileFormData) {
          $scope.profileFormData = profileFormData;

          $scope.ok = function () {
            if ($scope.editProfileForm.$invalid) {
              return;
            }
            $uibModalInstance.close($scope.profileFormData);
          };

          $scope.cancel = function () {
            $uibModalInstance.dismiss("cancel");
          };
        },
        resolve: {
          profileFormData: function () {
            return angular.copy($scope.profileFormData);
          },
        },
      });

      modalInstance.result
        .then(function (profileData) {
          // Handle the profile update
          $scope.isLoading = true;
          const user = userFactory.createUser($scope.user);
          user
            .updateUser(profileData)
            .then(() => {
              toaster.pop(
                "success",
                "Success",
                "Profile updated successfully."
              );
            })
            .catch((error) => {
              toaster.pop(
                "error",
                "Error",
                error?.description || "Error updating profile."
              );
            })
            .finally(() => {
              $scope.isLoading = false;
            });
        })
        .catch(function () {
          console.log("Profile modal dismissed.");
        });
    };

    /**
     * @description Set approval status, message and button text.
     */
    $scope.setApproval = function () {
      $scope.isLoading = true;
      if ($scope.user.role === "super-admin" || $scope.user.role === "admin") {
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
          $scope.totalItems = response.data.pages * $scope.pageSize; // Calculate total items
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
      $scope.isLoading = true;
      bidBookService
        .getAllBidsByUser($scope.currentPage, $scope.pageSize, filter, sort)
        .then((response) => {
          $scope.bids = response.data.bids;
          $scope.totalPage = response.data.pages;
          $scope.totalItems = response.data.pages * $scope.pageSize; // Calculate total items
        })
        .catch((error) => {
          toaster.pop("error", "Error", error.name || "Error getting bids.");
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };

    /**
     * @description Handle page change for UI Bootstrap pagination
     * @param {string} pagename - Type of items being paginated
     */
    $scope.pageChanged = function (pagename) {
      if (pagename === "bookings") {
        $scope.setBookings();
      } else if (pagename === "bids") {
        $scope.setBiddings();
      }
    };

    // Legacy pagination functions maintained for compatibility
    $scope.nextPage = function (pagename) {
      if ($scope.currentPage >= $scope.totalPage) return;

      $scope.currentPage++;
      if (pagename === "bookings") {
        $scope.setBookings();
      } else if (pagename === "biddings" || pagename === "bids") {
        $scope.setBiddings();
      }
    };

    $scope.prevPage = function (pagename) {
      if ($scope.currentPage <= 1) return;

      $scope.currentPage--;
      if (pagename === "bookings") {
        $scope.setBookings();
      } else if (pagename === "biddings" || pagename === "bids") {
        $scope.setBiddings();
      }
    };

    /**
     * @description Generate an array for pagination.
     */
    $scope.getPageArray = function () {
      const pages = [];
      const maxPages = Math.min(5, $scope.totalPage);
      let startPage = Math.max(1, $scope.currentPage - 2);
      let endPage = Math.min($scope.totalPage, startPage + maxPages - 1);

      if (endPage - startPage + 1 < maxPages) {
        startPage = Math.max(1, endPage - maxPages + 1);
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    /**
     * @description Navigate to a specific page.
     * @param {number} page - Page number to navigate to.
     */
    $scope.goToPage = function (page) {
      if (page === $scope.currentPage) return;

      $scope.currentPage = page;
      if ($scope.currentTab === "bookings") {
        $scope.setBookings();
      } else if ($scope.currentTab === "biddings") {
        $scope.setBiddings();
      }
    };
  },
]);
