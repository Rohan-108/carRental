/**
 * @description Controller for register page.
 * @param {Object} $scope - The scope
 * @param {Object} $state - The state service
 * @param {Object} toaster - The toaster service
 * @param {Object} userFactory - The user factory
 */
angular.module("rentIT").controller("registerController", [
  "$scope",
  "$state",
  "toaster",
  "userFactory",
  function ($scope, $state, toaster, userFactory) {
    $scope.user = {}; // to hold the user form data

    /**
     * @description Register the user to the application.
     */
    $scope.register = function () {
      if ($scope.registerForm.$invalid) {
        toaster.pop("error", "Error", "Invalid form data.");
        return;
      }
      const user = userFactory.createUser($scope.user);
      user
        .register()
        .then(() => {
          $state.go("home");
          toaster.pop("success", "Success", "Registration successful.");
        })
        .catch((error) => {
          console.log(error);
          toaster.pop(
            "error",
            "Error",
            error?.description || "Error While Registering."
          );
        });
    };
  },
]);
