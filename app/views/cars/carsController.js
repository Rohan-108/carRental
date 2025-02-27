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
      city: "All",
      fuelType: "All",
      transmission: "All",
      carType: "All",
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
      const filterFunction = function (car) {
        if ($scope.filter.city !== "All" && car.location !== $scope.filter.city)
          return false;
        if (carType.value !== "All" && car.vehicleType !== carType.value)
          return false;
        if (
          $scope.filter.transmission !== "All" &&
          car.transmission !== $scope.filter.transmission
        )
          return false;
        if (
          $scope.filter.fuelType !== "All" &&
          car.fuelType !== $scope.filter.fuelType
        )
          return false;
        if (
          car.rentalPrice < Number($scope.filter.minPrice) ||
          car.rentalPrice > Number($scope.filter.maxPrice)
        )
          return false;
        if (
          $scope.query &&
          !car.name.toLowerCase().includes($scope.query.toLowerCase())
        )
          return false;
        return true;
      };
      $q.when(
        carService.getPagedCars(
          {
            page: $scope.currentPage,
            pageSize: $scope.pageSize,
            indexName: "show",
            direction: "next",
            range: null,
          },
          filterFunction
        )
      )
        .then(function (result) {
          const cars = result.data.map(function (car) {
            const blob = new Blob([car.images[0]]);
            const imgUrl = URL.createObjectURL(blob);
            return Object.assign({}, car, { imgUrl: imgUrl });
          });
          $scope.cars = [];
          $scope.cars = cars;
          $scope.totalPage = result.totalPages;
        })
        .catch(function (error) {
          toaster.pop("error", "Error", error.message);
        })
        .finally(function () {
          $scope.isLoading = false;
        });
    };
    /**
     * @description Apply the filter and set the list of cars
     * @returns {Promise} - A promise that resolves to the list of cars
     */
    $scope.clearFilters = function () {
      $scope.filter = defaultFilter;
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
