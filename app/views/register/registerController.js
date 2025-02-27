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
  "utilService",
  "$q",
  function (
    $scope,
    $state,
    toaster,
    userService,
    sessionService,
    utilService,
    $q
  ) {
    $scope.user = {}; // to hold the user form data
    /**
     * @description Register the user to the application.
     */
    $scope.register = function () {
      if ($scope.registerForm.$invalid) {
        toaster.pop("error", "Error", "Invalid form data.");
        return;
      }

      let newUserData = {};

      return $q
        .when(userService.getByEmail($scope.user.email))
        .then(function (userExists) {
          if (userExists) {
            throw new Error("User already exists.");
          }
          return $q.when(utilService.hashPassword($scope.user.password));
        })
        .then(function (hashedPassword) {
          newUserData.password = hashedPassword;
          return $q.when(utilService.toArrayBuffer([$scope.user.avatar]));
        })
        .then(function (imageBuffer) {
          newUserData = {
            ...newUserData,
            id: "",
            name: $scope.user.name,
            email: $scope.user.email,
            tel: $scope.user.phone,
            adhaar: $scope.user.adhaar,
            role: "general",
            avatar: imageBuffer,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          // Add the user.
          return $q.when(userService.addUser(newUserData));
        })
        .then(function () {
          return $q.when(userService.getByEmail(newUserData.email));
        })
        .then(function (newUser) {
          sessionService.setUser(newUser);
          toaster.pop("success", "Success", "Registered successfully.");
          $state.go("home");
        })
        .catch(function (error) {
          toaster.pop("error", "Error", error.message);
        });
    };
  },
]);
