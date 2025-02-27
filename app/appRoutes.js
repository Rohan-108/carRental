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
        resolve: {
          loadAssets: [
            "resourceInjector",
            function (resourceInjector) {
              return resourceInjector.loadCSS("./views/cars/cars.css");
            },
          ],
        },
      })
      .state("car", {
        url: "/cars/{carId}",
        templateUrl: "app/views/carDetail/carDetail.html",
        controller: "carDetailController",
        resolve: {
          loadAssets: [
            "resourceInjector",
            function (resourceInjector) {
              return resourceInjector.loadCSS(
                "./views/carDetail/carDetail.css"
              );
            },
          ],
          car: [
            "carService",
            "$stateParams",
            function (carService, $stateParams) {
              return carService.getCarById($stateParams.carId).then((car) => {
                let imgUrls = [];
                car.images.forEach((image) => {
                  let blob = new Blob([image]);
                  let url = URL.createObjectURL(blob);
                  imgUrls.push(url);
                });
                car.images = imgUrls;
                return car;
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
          loadAssets: [
            "resourceInjector",
            function (resourceInjector) {
              return resourceInjector.loadCSS("./views/profile/profile.css");
            },
          ],
        },
      })
      .state("chat", {
        url: "/chat",
        templateUrl: "app/views/chat/chat.html",
        controller: "chatController",
      })
      .state("dashboard", {
        url: "/dashboard",
        templateUrl: "app/views/dashboard/dashboard.html",
        controller: "dashboardController",
        resolve: {
          loadAssets: [
            "resourceInjector",
            function (resourceInjector) {
              return resourceInjector.loadCSS(
                "./views/dashboard/dashboard.css"
              );
            },
          ],
        },
      })
      .state("admin", {
        url: "/admin",
        templateUrl: "app/views/admin/admin.html",
        controller: "adminController",
        resolve: {
          loadAssets: [
            "resourceInjector",
            function (resourceInjector) {
              return resourceInjector.loadCSS("./views/admin/admin.css");
            },
          ],
        },
      });
  },
]);
