/**
 * @description The controller for the login page.
 * @param {Object} $scope - The scope
 * @param {Object} $state - The state service
 * @param {Object} toaster - The toaster service
 * @param {Object} userFactory - The user factory
 */
angular.module("rentIT").controller("loginController", [
  "$scope",
  "$state",
  "toaster",
  "userFactory",
  function ($scope, $state, toaster, userFactory) {
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
      const user = userFactory.createUser($scope.loginData);
      user
        .login()
        .then(() => {
          $state.go("home");
          toaster.pop("success", "Success", "Login successful.");
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error?.description || "An error occurred."
          );
        });
    };
  },
]);
