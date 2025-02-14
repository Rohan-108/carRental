import { validateSchema, partialValidateSchema } from "../utils.js";
import DbService from "./db.js";
import { USER_SCHEMA } from "./userService.js";

export const CAR_SCHEMA = {
  id: "string",
  name: "string",
  vehicleType: "string",
  seats: "number",
  transmission: "string",
  ownerId: "string",
  owner: USER_SCHEMA,
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
  //isForOutStation: "boolean",
  createdAt: "number",
  updatedAt: "number",
};

function CarService() {
  const STORE_NAME = "cars";
  const addCar = async (car) => {
    if (!validateSchema(CAR_SCHEMA, car)) {
      return;
    }
    const id = await DbService.addItem(STORE_NAME, car);
    return id;
  };
  const updateCar = async (car) => {
    if (!partialValidateSchema(CAR_SCHEMA, car)) {
      return;
    }
    car.updatedAt = Date.now();
    const updatedCar = await DbService.updateItem(STORE_NAME, car);
    return updatedCar;
  };
  const getCarById = async (id) => {
    const car = await DbService.getItem(STORE_NAME, id);
    return car;
  };
  const getCarsByOwnerId = async (ownerId) => {
    const cars = await DbService.searchAllByIndex(
      STORE_NAME,
      "ownerId",
      ownerId
    );
    return cars;
  };
  const getCarsByIndex = async (index, value) => {
    const cars = await DbService.searchAllByIndex(STORE_NAME, index, value);
    return cars;
  };
  const getPagedCars = async (options, filterFunction) => {
    const data = await DbService.getPaginatedItems(
      STORE_NAME,
      options,
      filterFunction
    );
    return data;
  };
  const getCountByIndex = async (index, value) => {
    const count = await DbService.countItemByIndex(STORE_NAME, index, value);
    return count;
  };
  const getCarByIndex = async (index, value) => {
    const car = await DbService.searchItemByIndex(STORE_NAME, index, value);
    return car;
  };
  const countCars = async () => {
    const count = await DbService.countItems(STORE_NAME);
    return count;
  };
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
}

export default CarService();
