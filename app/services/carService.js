/**
 * @description This service is responsible for handling all the car related operations.
 * @requires utilService
 * @requires DbService
 */

angular.module("rentIT").factory("carService", [
  "utilService",
  "DbService",
  function (utilService, DbService) {
    const CAR_SCHEMA = {
      id: "string",
      name: "string",
      vehicleType: "string",
      seats: "number",
      transmission: "string",
      ownerId: "string",
      owner: "object",
      plateNumber: "string",
      fuelType: "string",
      rentalPrice: "number",
      rentalPriceOutStation: "number",
      minRentalPeriod: "number",
      maxRentalPeriod: "number",
      location: "string",
      show: "boolean",
      images: "[ArrayBuffer]",
      ratePerKm: "number",
      fixedKilometer: "number",
      createdAt: "number",
      updatedAt: "number",
    };
    const STORE_NAME = "cars";
    // Add a new car to the database
    const addCar = async (car) => {
      if (!utilService.validateSchema(CAR_SCHEMA, car)) {
        return new Error("Invalid car data provided");
      }
      const id = await DbService.addItem(STORE_NAME, car);
      return id;
    };

    // Update an existing car in the database
    const updateCar = async (car) => {
      if (!utilService.partialValidateSchema(CAR_SCHEMA, car)) {
        return new Error("Invalid car data provided");
      }
      car.updatedAt = Date.now();
      const updatedCar = await DbService.updateItem(STORE_NAME, car);
      return updatedCar;
    };

    // Get a car by its ID
    const getCarById = async (id) => {
      const car = await DbService.getItem(STORE_NAME, id);
      return car;
    };

    // Get all cars owned by a specific owner
    const getCarsByOwnerId = async (ownerId) => {
      const cars = await DbService.searchAllByIndex(
        STORE_NAME,
        "ownerId",
        ownerId
      );
      return cars;
    };

    // Get all cars that match a specific index and value
    const getCarsByIndex = async (index, value) => {
      const cars = await DbService.searchAllByIndex(STORE_NAME, index, value);
      return cars;
    };

    // Get paged cars based on options and a filter function
    const getPagedCars = async (options, filterFunction) => {
      const data = await DbService.getPaginatedItems(
        STORE_NAME,
        options,
        filterFunction
      );
      return data;
    };

    // Get the count of cars that match a specific index and value
    const getCountByIndex = async (index, value) => {
      const count = await DbService.countItemByIndex(STORE_NAME, index, value);
      return count;
    };

    // Get a car that matches a specific index and value
    const getCarByIndex = async (index, value) => {
      const car = await DbService.searchItemByIndex(STORE_NAME, index, value);
      return car;
    };

    // Get the total count of cars in the database
    const countCars = async () => {
      const count = await DbService.countItems(STORE_NAME);
      return count;
    };

    // Return the public methods of the CarService
    return {
      addCar,
      updateCar,
      getCarById,
      getPagedCars,
      getCarsByOwnerId,
      getCarsByIndex,
      getCountByIndex,
      getCarByIndex,
      countCars,
    };
  },
]);
