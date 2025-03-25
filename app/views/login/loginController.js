/**
 * @description The controller for the login page.
 * @param {Object} $scope - The scope
 * @param {Object} $state - The state service
 * @param {Object} toaster - The toaster service
 * @param {Object} userService - The user service
 * @param {Object} sessionService - The session service
 */
angular.module("rentIT").controller("loginController", [
  "$scope",
  "$state",
  "toaster",
  "userService",
  "sessionService",
  function ($scope, $state, toaster, userService, sessionService) {
    //to hold the login form data
    $scope.loginData = {
      email: "",
      password: "",
    };
    /**
     * @description Submit the login form.
     */
    $scope.submitLogin = function () {
      if ($scope.loginForm.$invalid) {
        toaster.pop("error", "Error", "Invalid form data.");
        return;
      }
      // Check if the user exists and the password is correct
      userService
        .login($scope.loginData.email, $scope.loginData.password)
        .then(function (response) {
          const user = response.data.user;
          const accessToken = response.data.accessToken;
          sessionService.setUser({
            ...user,
            accessToken,
          });
          toaster.pop("success", "Success", response.data.message);
          $state.go("home");
        })
        .catch(function (response) {
          $scope.loginData.password = "";
          $scope.loginData.email = "";
          toaster.pop("error", "Error", response.description);
        });
    };
  },
]);
