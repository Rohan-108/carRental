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
  "$timeout",
  "$document",
  "configService",
  function (
    $scope,
    $state,
    carService,
    utilService,
    toaster,
    $timeout,
    $document,
    configService
  ) {
    // Initialize variables
    $scope.cars = []; // List of cars
    $scope.pageSize = 3; // Number of cars per page
    $scope.currentPage = 1; // Current page
    $scope.totalPage = null; // Total number of pages

    // Mobile sidebar control variables - set initially but don't track resize
    $scope.isSidebarCollapsed = true; // Default to collapsed on mobile
    $scope.isMobile = true; // Bootstrap classes will handle responsive behavior

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
      // Set totalItems for pagination
      $scope.totalItems = 0;
      $scope.itemsPerPage = $scope.pageSize;

      $scope.getConfig(); // Load configuration
      $scope.setCars();
    };

    $scope.getConfig = function () {
      configService
        .getConfig()
        .then((response) => {
          const config = response.data;
          console.log("Config loaded successfully", config);
          $scope.transmissionType = ["All", ...config.transmissionType];
          $scope.fuelTypes = ["All", ...config.fuelType];
          $scope.vehicleTypes = ["All", ...config.vehicleType];
          $scope.cities = ["All", ...config.cities];
        })
        .catch((error) => {
          console.error("Error loading config", error);
          toaster.error(
            "error",
            "Error",
            error?.description || "Could not load config"
          );
        });
    };
    /**
     * @description Toggle sidebar visibility (for mobile)
     */
    $scope.toggleSidebar = function () {
      $scope.isSidebarCollapsed = !$scope.isSidebarCollapsed;
    };

    /**
     * @description Slider functionality: Start dragging minimum handle
     */
    $scope.startDragMin = function (event) {
      event.preventDefault();

      const sliderWidth = document.querySelector(
        '[style*="background: #e1e9f6"]'
      ).offsetWidth;
      const startX = event.pageX;
      const startValue = $scope.filter.minPrice;

      function onMouseMove(event) {
        const dx = event.pageX - startX;
        const percent = (dx / sliderWidth) * 100;
        let newValue = startValue + percent * 100;

        // Constrain to valid range
        newValue = Math.max(
          0,
          Math.min(newValue, $scope.filter.maxPrice - 500)
        );

        // Round to nearest step (500)
        newValue = Math.round(newValue / 500) * 500;

        // Use $timeout instead of $apply to avoid digest cycle issues
        $timeout(function () {
          $scope.filter.minPrice = newValue;
        }, 0);
      }

      function onMouseUp() {
        $document.off("mousemove", onMouseMove);
        $document.off("mouseup", onMouseUp);
      }

      $document.on("mousemove", onMouseMove);
      $document.on("mouseup", onMouseUp);
    };

    /**
     * @description Slider functionality: Start dragging maximum handle
     */
    $scope.startDragMax = function (event) {
      event.preventDefault();

      const sliderWidth = document.querySelector(
        '[style*="background: #e1e9f6"]'
      ).offsetWidth;
      const startX = event.pageX;
      const startValue = $scope.filter.maxPrice;

      function onMouseMove(event) {
        const dx = event.pageX - startX;
        const percent = (dx / sliderWidth) * 100;
        let newValue = startValue + percent * 100;

        // Constrain to valid range
        newValue = Math.max(
          $scope.filter.minPrice + 500,
          Math.min(newValue, 10000)
        );

        // Round to nearest step (500)
        newValue = Math.round(newValue / 500) * 500;

        // Use $timeout instead of $apply
        $timeout(function () {
          $scope.filter.maxPrice = newValue;
        }, 0);
      }

      function onMouseUp() {
        $document.off("mousemove", onMouseMove);
        $document.off("mouseup", onMouseUp);
      }

      $document.on("mousemove", onMouseMove);
      $document.on("mouseup", onMouseUp);
    };

    /**
     * @description Calculate the style properties for the price range slider
     * This moves the inline expressions from the template to the controller
     */
    $scope.getSliderStyles = function () {
      return {
        range: {
          left: $scope.filter.minPrice / 100 + "%",
          right: (10000 - $scope.filter.maxPrice) / 100 + "%",
        },
        minHandle: {
          left: $scope.filter.minPrice / 100 + "%",
        },
        maxHandle: {
          left: $scope.filter.maxPrice / 100 + "%",
        },
      };
    };

    /**
     * @description Set the list of cars based on the filter
     */
    $scope.setCars = function () {
      $scope.isLoading = true;

      carService
        .getCars(
          $scope.currentPage,
          $scope.pageSize,
          $scope.filter,
          $scope.query
        )
        .then((response) => {
          $scope.cars = response.data.vehicles || [];
          $scope.totalPage = response.data.pages || 0;
          $scope.totalItems =
            response.data.count || $scope.totalPage * $scope.pageSize || 0;
        })
        .catch((error) => {
          $scope.cars = [];
          toaster.error(
            "error",
            "Error",
            error.description || "Could not load cars"
          );
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
      $scope.query = ""; // Reset search query
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
     * @description Page change handler for pagination
     */
    $scope.pageChanged = function () {
      $scope.setCars();
    };

    /**
     * @description Change the state to the car details page
     * */
    $scope.changeState = function (state) {
      $state.go("car", { carId: state });
    };

    /**
     * @description Generate an array of page numbers for pagination
     * @returns {Array} Array of page numbers
     */
    $scope.getPageArray = function () {
      const pages = [];
      let startPage, endPage;
      if ($scope.totalPage <= 5) {
        startPage = 1;
        endPage = $scope.totalPage;
      } else {
        if ($scope.currentPage <= 3) {
          startPage = 1;
          endPage = 5;
        } else if ($scope.currentPage + 1 >= $scope.totalPage) {
          startPage = $scope.totalPage - 4;
          endPage = $scope.totalPage;
        } else {
          startPage = $scope.currentPage - 2;
          endPage = $scope.currentPage + 2;
        }
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      return pages;
    };

    /**
     * @description Go to a specific page
     * @param {number} page - The page number to go to
     */
    $scope.goToPage = function (page) {
      if (page !== $scope.currentPage) {
        $scope.currentPage = page;
        $scope.setCars();
      }
    };
  },
]);
