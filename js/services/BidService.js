import { validateSchema, partialValidateSchema } from "../utils.js";
import DbService from "./db.js";
import { USER_SCHEMA } from "./userService.js";
import { CAR_SCHEMA } from "./carService.js";

const APPROVED = "approved";
export const BID_SCHEMA = {
  id: "string",
  carId: "string",
  userId: "string",
  ownerId: "string",
  car: CAR_SCHEMA,
  user: USER_SCHEMA,
  amount: "number",
  startDate: "string",
  endDate: "string",
  isOutStation: "boolean",
  status: "string",
  tripCompleted: "boolean",
  createdAt: "number",
  updatedAt: "number",
};

function BidService() {
  const STORE_NAME = "bids";
  const addBid = async (bid) => {
    if (!validateSchema(BID_SCHEMA, bid)) {
      return;
    }
    const id = await DbService.addItem(STORE_NAME, bid);
    return id;
  };
  const updateBid = async (bid) => {
    if (!partialValidateSchema(BID_SCHEMA, bid)) {
      return;
    }
    const updatedBid = await DbService.updateItem(STORE_NAME, bid);
    return updatedBid;
  };
  const getBidById = async (id) => {
    const bid = await DbService.getItem(STORE_NAME, id);
    return bid;
  };
  const getBidsByCarId = async (carId) => {
    const bids = await DbService.searchAllByIndex(STORE_NAME, "carId", carId);
    return bids;
  };
  const getBidsByUserId = async (userId) => {
    const bids = await DbService.searchAllByIndex(STORE_NAME, "userId", userId);
    return bids;
  };
  const getBidsByOwnerId = async (ownerId) => {
    const bids = await DbService.searchAllByIndex(
      STORE_NAME,
      "ownerId",
      ownerId
    );
    return bids;
  };
  const getBookingsByCarId = async (carId) => {
    let bids = await DbService.searchAllByIndex(STORE_NAME, "carId", carId);
    bids = bids.filter((bid) => bid.status === APPROVED);
    return bids;
  };
  const getBidsByStatus = async (status) => {
    const bids = await DbService.searchAllByIndex(STORE_NAME, "status", status);
    return bids;
  };
  const getBookingsByOwnerId = async (ownerId) => {
    let bids = await DbService.searchAllByIndex(STORE_NAME, "ownerId", ownerId);
    bids = bids.filter((bid) => bid.status === APPROVED);
    return bids;
  };
  const getPagedBids = async (options, filterFunction) => {
    const data = await DbService.getPaginatedItems(
      STORE_NAME,
      options,
      filterFunction
    );
    return data;
  };
  const getAllBids = async () => {
    const bids = await DbService.getAllItems(STORE_NAME);
    return bids;
  };
  const getBookingsByUserId = async (userId) => {
    let bids = await DbService.searchAllByIndex(STORE_NAME, "userId", userId);
    bids = bids.filter((bid) => bid.status === APPROVED);
    return bids;
  };
  return {
    addBid,
    updateBid,
    getBidById,
    getBidsByCarId,
    getBidsByUserId,
    getBookingsByCarId,
    getBidsByStatus,
    getBookingsByOwnerId,
    getBookingsByUserId,
    getPagedBids,
    getAllBids,
    getBidsByOwnerId,
  };
}

export default BidService();
