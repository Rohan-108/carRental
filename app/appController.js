/**
 * @name mainController
 * @description This controller is used to handle the main page
 * @param {$scope}
 * @param {$rootScope}
 * @param {$state}
 * @param {toaster}
 * @param {sessionService}
 */
angular.module("rentIT").controller("mainController", [
  "$scope",
  "$state",
  "$rootScope",
  "toaster",
  "sessionService",
  function ($scope, $state, $rootScope, toaster, sessionService) {
    $scope.toggleMenu = null; //to oepn the menu on the mobile size
    /**
     * @description to logout the user from the application and send them to home page
     */
    $scope.logout = function () {
      sessionService.removeUser();
      $rootScope.user = null;
      $state.go("home");
      toaster.pop("success", "Success", "Logged out successfully");
    };
    /**
     * @description to open the menu bar
     */
    $scope.openMenu = function () {
      $scope.toggleMenu = true;
    };
    /**
     * @description to close the menu bar
     */
    $scope.closeMenu = function () {
      $scope.toggleMenu = false;
    };
  },
]);
