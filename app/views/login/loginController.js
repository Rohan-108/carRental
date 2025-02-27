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
  "utilService",
  "sessionService",
  "$q",
  function (
    $scope,
    $state,
    toaster,
    userService,
    utilService,
    sessionService,
    $q
  ) {
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
      return $q
        .when(userService.getByEmail($scope.loginData.email))
        .then(function (user) {
          if (!user) {
            throw new Error("User not found.");
          }
          return user;
        })
        .then(function (user) {
          return $q
            .when(utilService.hashPassword($scope.loginData.password))
            .then(function (hashedPassword) {
              if (hashedPassword !== user.password) {
                throw new Error("Invalid password.");
              }
              return user;
            });
        })
        .then(function (user) {
          sessionService.setUser(user);
          toaster.pop("success", "Success", "Logged in successfully.");
          $state.go("home");
        })
        .catch(function (error) {
          toaster.pop("error", "Error", error.message);
        });
    };
  },
]);
