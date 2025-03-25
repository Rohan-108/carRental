/**
 * @description Controller for register page.
 * @param {Object} $scope - The scope
 * @param {Object} $state - The state service
 * @param {Object} toaster - The toaster service
 * @param {Object} userService - The user service
 * @param {Object} sessionService - The session service
 * @param {Object} utilService - The util service
 */
angular.module("rentIT").controller("registerController", [
  "$scope",
  "$state",
  "toaster",
  "userService",
  "sessionService",
  function ($scope, $state, toaster, userService, sessionService) {
    $scope.user = {}; // to hold the user form data

    /**
     * @description Register the user to the application.
     */
    $scope.register = function () {
      if ($scope.registerForm.$invalid) {
        toaster.pop("error", "Error", "Invalid form data.");
        return;
      }
      const formdata = new FormData();
      formdata.append("username", $scope.user.username);
      formdata.append("email", $scope.user.email);
      formdata.append("password", $scope.user.password);
      formdata.append("avatar", $scope.user.avatar);
      formdata.append("role", "user");
      formdata.append("adhaar", $scope.user.adhaar);
      formdata.append("tel", $scope.user.tel);
      userService
        .addUser(formdata)
        .then(function (response) {
          const user = response.data.user;
          const accessToken = response.data.accessToken;
          sessionService.setUser({ ...user, accessToken });
          $state.go("home");
          toaster.pop("success", "Success", "User registered successfully.");
        })
        .catch(function (response) {
          console.log(response);
          toaster.pop("error", "Error", response.description);
        });
    };
  },
]);
