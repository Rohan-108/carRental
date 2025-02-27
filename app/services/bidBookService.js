/**
 * @description This service is responsible for handling all the operations related to bidding booking.
 * @requires utilService
 * @requires DbService
 */

angular.module("rentIT").service("bidBookService", [
  "utilService",
  "DbService",
  function (utilService, DbService) {
    const APPROVED = "approved";
    const BID_SCHEMA = {
      id: "string", // Bid ID
      carId: "string", // ID of the car being bid on
      userId: "string", // ID of the user placing the bid
      ownerId: "string", // ID of the car owner
      car: "object", // Details of the car being bid on
      user: "object", // Details of the user placing the bid
      amount: "number", // Bid amount
      startDate: "string", // Start date of the bid
      endDate: "string", // End date of the bid
      isOutStation: "boolean", // Indicates if the bid is for an outstation trip
      status: "string", // Status of the bid
      tripCompleted: "boolean", // Indicates if the trip associated with the bid is completed
      createdAt: "number", // Timestamp of bid creation
      updatedAt: "number", // Timestamp of bid update
    };
    const STORE_NAME = "bids"; // Name of the store in the database

    /**
     * @description Adds a new bid to the database.
     * @param {object} bid - The bid object to be added.
     * @returns {Promise<string|Error>} - The ID of the added bid or an error if the bid data is invalid.
     */
    const addBid = async (bid) => {
      if (!utilService.validateSchema(BID_SCHEMA, bid)) {
        return new Error("Invalid bid data.");
      }
      const id = await DbService.addItem(STORE_NAME, bid);
      return id;
    };

    /**
     * @description Updates an existing bid in the database.
     * @param {object} bid - The bid object to be updated.
     * @returns {Promise<object|Error>} - The updated bid object or an error if the bid data is invalid.
     */
    const updateBid = async (bid) => {
      if (!utilService.partialValidateSchema(BID_SCHEMA, bid)) {
        return new Error("Invalid bid data.");
      }
      const updatedBid = await DbService.updateItem(STORE_NAME, bid);
      return updatedBid;
    };

    /**
     * @description Retrieves a bid by its ID.
     * @param {string} id - The ID of the bid to retrieve.
     * @returns {Promise<object|null>} - The bid object if found, or null if not found.
     */
    const getBidById = async (id) => {
      const bid = await DbService.getItem(STORE_NAME, id);
      return bid;
    };

    /**
     * @description Retrieves all bids for a specific car ID.
     * @param {string} carId - The ID of the car.
     * @returns {Promise<Array>} - An array of bids for the specified car ID.
     */
    const getBidsByCarId = async (carId) => {
      const bids = await DbService.searchAllByIndex(STORE_NAME, "carId", carId);
      return bids;
    };

    /**
     * @description Retrieves all bids placed by a specific user ID.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array>} - An array of bids placed by the specified user ID.
     */
    const getBidsByUserId = async (userId) => {
      const bids = await DbService.searchAllByIndex(
        STORE_NAME,
        "userId",
        userId
      );
      return bids;
    };
    /**
     * @description Retrieves all bids placed by a specific owner ID.
     * @param {*} ownerId - The ID of the owner.
     * @returns {Promise<Array>} - An array of bids placed by the specified owner ID.
     */
    const getBidsByOwnerId = async (ownerId) => {
      const bids = await DbService.searchAllByIndex(
        STORE_NAME,
        "ownerId",
        ownerId
      );
      return bids;
    };
    /**
     * @description Retrieves all bids associated with a specific car ID that have been approved.
     * @param {string} carId - The ID of the car.
     * @returns {Promise<Array>} - An array of approved bids for the specified car ID.
     */
    const getBookingsByCarId = async (carId) => {
      let bids = await DbService.searchAllByIndex(STORE_NAME, "carId", carId);
      bids = bids.filter((bid) => bid.status === APPROVED);
      return bids;
    };

    /**
     * @description Retrieves all bids with a specific status.
     * @param {string} status - The status of the bids to retrieve.
     * @returns {Promise<Array>} - An array of bids with the specified status.
     */
    const getBidsByStatus = async (status) => {
      const bids = await DbService.searchAllByIndex(
        STORE_NAME,
        "status",
        status
      );
      return bids;
    };

    /**
     * @description Retrieves all bookings associated with a specific owner ID that have been approved.
     * @param {string} ownerId - The ID of the car owner.
     * @returns {Promise<Array>} - An array of approved bookings for the specified owner ID.
     */
    const getBookingsByOwnerId = async (ownerId) => {
      let bids = await DbService.searchAllByIndex(
        STORE_NAME,
        "ownerId",
        ownerId
      );
      bids = bids.filter((bid) => bid.status === APPROVED);
      return bids;
    };

    /**
     * @description Retrieves all bookings associated with a specific user ID that have been approved.
     * @param {string} userId - The ID of the user.
     * @returns {Promise<Array>} - An array of approved bookings for the specified user ID.
     */
    const getBookingsByUserId = async (userId) => {
      let bids = await DbService.searchAllByIndex(STORE_NAME, "userId", userId);
      bids = bids.filter((bid) => bid.status === APPROVED);
      return bids;
    };

    /**
     * @description Retrieves paged bids based on the specified options and filter function.
     * @param {object} options - The options for pagination.
     * @param {function} filterFunction - The filter function to apply on the bids.
     * @returns {Promise<object>} - The paged bids data.
     */
    const getPagedBids = async (options, filterFunction) => {
      const data = await DbService.getPaginatedItems(
        STORE_NAME,
        options,
        filterFunction
      );
      return data;
    };

    /**
     * @description Retrieves all bids in the database.
     * @returns {Promise<Array>} - An array of all bids.
     */
    const getAllBids = async () => {
      const bids = await DbService.getAllItems(STORE_NAME);
      return bids;
    };

    /**
     * @description Updates the odometer value of a bid.
     * @param {string} bidId - The ID of the bid.
     * @param {string} actionType - The type of odometer action ("current" or "final").
     * @param {number} value - The new odometer value.
     * @returns {Promise<void>}
     */
    const updateOdometer = async (bidId, actionType, value) => {
      const key =
        actionType === "current" ? "currentOdometer" : "finalOdometer";
      await DbService.updateItem(STORE_NAME, { id: bidId, [key]: value });
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
      updateOdometer,
    };
  },
]);
