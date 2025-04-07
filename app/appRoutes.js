/**
 * @description Route configuration
 * @param {Object} $stateProvider
 * @param {Object} $urlRouterProvider
 * @param {Object} $locationProvider
 */

angular.module("rentIT").config([
  "$stateProvider",
  "$urlRouterProvider",
  "$locationProvider",
  function ($stateProvider, $urlRouterProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
    $urlRouterProvider.otherwise("/");
    $stateProvider
      .state("home", {
        url: "/",
        templateUrl: "app/views/home/home.html",
        controller: "homeController",
      })
      .state("login", {
        url: "/login",
        templateUrl: "app/views/login/login.html",
        controller: "loginController",
      })
      .state("register", {
        url: "/register",
        templateUrl: "app/views/register/register.html",
        controller: "registerController",
      })
      .state("cars", {
        url: "/cars",
        templateUrl: "app/views/cars/cars.html",
        controller: "carsController",
      })
      .state("car", {
        url: "/cars/{carId}",
        templateUrl: "app/views/carDetail/carDetail.html",
        controller: "carDetailController",
        resolve: {
          car: [
            "carService",
            "$stateParams",
            function (carService, $stateParams) {
              return carService
                .getCarById($stateParams.carId)
                .then((response) => {
                  return response.data.vehicle;
                })
                .catch(() => {
                  throw new Error("Car_Not_Found");
                });
            },
          ],
        },
      })
      .state("profile", {
        url: "/profile",
        templateUrl: "app/views/profile/profile.html",
        controller: "profileController",
        resolve: {
          loggedIn: [
            "authService",
            function (authService) {
              return authService
                .isLoggedIn()
                .then((response) => {
                  return response;
                })
                .catch(() => {
                  throw new Error("User_Not_Authenticated");
                });
            },
          ],
        },
      })
      .state("chat", {
        url: "/chat",
        templateUrl: "app/views/chat/chat.html",
        controller: "chatController",
        resolve: {
          isLoggedIn: [
            "authService",
            function (authService) {
              return authService
                .isLoggedIn()
                .then((response) => {
                  return response;
                })
                .catch(() => {
                  throw new Error("User_Not_Authenticated");
                });
            },
          ],
        },
      })
      .state("dashboard", {
        url: "/dashboard",
        templateUrl: "app/views/dashboard/dashboard.html",
        controller: "dashboardController",
        resolve: {
          isAdmin: [
            "authService",
            function (authService) {
              return authService
                .isAdmin()
                .then((response) => {
                  return response;
                })
                .catch(() => {
                  throw new Error("Restricted_Access");
                });
            },
          ],
        },
      })
      .state("admin", {
        url: "/admin",
        templateUrl: "app/views/admin/admin.html",
        controller: "adminController",
        resolve: {
          isSuperAdmin: [
            "authService",
            function (authService) {
              return authService
                .isSuperAdmin()
                .then((response) => {
                  return response;
                })
                .catch(() => {
                  throw new Error("Restricted_Access");
                });
            },
          ],
        },
      });
  },
]);
