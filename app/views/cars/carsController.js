/**
 * @description Controller for the cars page
 * @name carsController
 * @requires $scope
 * @requires $state
 * @requires carService
 * @requires utilService
 * @requires toaster
 * @requires $q
 */
angular.module("rentIT").controller("carsController", [
  "$scope",
  "$state",
  "carService",
  "utilService",
  "toaster",
  "$q",
  function ($scope, $state, carService, utilService, toaster, $q) {
    // Initialize variables
    $scope.cars = []; // List of cars
    $scope.pageSize = 2; // Number of cars per page
    $scope.currentPage = 1; // Current page
    $scope.totalPage = null; // Total number of pages
    // Default filter
    const defaultFilter = {
      location: "All",
      fuelType: "All",
      transmission: "All",
      vehicleType: "All",
      minPrice: 0,
      maxPrice: 10000,
    };
    $scope.fuelTypes = ["All", "Petrol", "Diesel", "Electric", "Hybrid"]; // Fuel types
    $scope.vehicleTypes = [
      "All",
      "Sedan",
      "SUV",
      "Hatchback",
      "Coupe",
      "Convertible",
    ]; // Vehicle types
    $scope.transmissionType = ["All", "Automatic", "Manual"]; // Transmission types
    $scope.cities = ["All", ...utilService.cities]; // Cities
    $scope.filter = defaultFilter; // Filter
    $scope.query = ""; // Search query

    /**
     * @description Initialize the controller
     */
    $scope.init = function () {
      $scope.setCars();
    };
    /**
     * @description Set the list of cars based on the filter
     */
    $scope.setCars = function () {
      // Filter function for the paged cars
      // Set loading state to true
      $scope.isLoading = true;

      carService
        .getCars(
          $scope.currentPage,
          $scope.pageSize,
          $scope.filter,
          $scope.query
        )
        .then((response) => {
          $scope.cars = response.data.vehicles;
          $scope.totalPage = response.data.pages;
        })
        .catch((error) => {
          toaster.error("error", "error", error.description);
        })
        .finally(() => {
          $scope.isLoading = false;
        });
    };
    /**
     * @description Apply the filter and set the list of cars
     * @returns {Promise} - A promise that resolves to the list of cars
     */
    $scope.clearFilters = function () {
      $scope.filter = {
        location: "All",
        fuelType: "All",
        transmission: "All",
        vehicleType: "All",
        minPrice: 0,
        maxPrice: 10000,
      };
      $scope.currentPage = 1;
      $scope.setCars();
    };
    /**
     * @description Load the previous page
     * @returns {Promise} - A promise that resolves to the list of cars
     */
    $scope.prevPage = function () {
      if ($scope.currentPage > 1) {
        $scope.currentPage--;
        $scope.setCars();
      }
    };
    /**
     * @description Next page
     * @returns {Promise} - A promise that resolves to the list of cars
     */
    $scope.nextPage = function () {
      if ($scope.currentPage < $scope.totalPage) {
        $scope.currentPage++;
        $scope.setCars();
      }
    };

    $scope.search = function () {
      $scope.currentPage = 1;
      $scope.setCars();
    };

    /**
     * @description Change the state to the car details page
     * */
    $scope.changeState = function (state) {
      $state.go("car", { carId: state });
    };
  },
]);
