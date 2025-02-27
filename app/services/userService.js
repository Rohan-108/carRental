/**
 * @description This module contains services for intercating with the user data.
 * @requires DbService
 * @requires utilService
 */

angular.module("rentIT").factory("userService", [
  "DbService",
  "utilService",
  function (DbService, utilService) {
    const STORE_NAME = "users";
    const USER_SCHEMA = {
      id: "string",
      name: "string",
      email: "string",
      password: "string",
      tel: "string",
      adhaar: "string",
      role: "string",
      avatar: "ArrayBuffer",
      createdAt: "number",
      updatedAt: "number",
    };
    /**
     * Retrieves a user by email.
     * @param {string} email - The email of the user.
     * @returns {Promise<Object>} A promise that resolves to the user object.
     */
    const getByEmail = async (email) => {
      const user = await DbService.searchItemByIndex(
        STORE_NAME,
        "email",
        email
      );
      return user;
    };

    /**
     * Retrieves a user by ID.
     * @param {string} id - The ID of the user.
     * @returns {Promise<Object>} A promise that resolves to the user object.
     */
    const getUserById = async (id) => {
      const user = await DbService.getItem(STORE_NAME, id);
      return user;
    };

    /**
     * Adds a new user.
     * @param {Object} user - The user object to be added.
     * @returns {Promise<string>} A promise that resolves to the ID of the added user.
     */
    const addUser = async (user) => {
      if (!utilService.validateSchema(USER_SCHEMA, user)) {
        return new Error("Invalid user data.");
      }
      const existingUser = await getByEmail(user.email);
      if (existingUser) {
        throw new Error("User with this email already exists.");
      }
      const id = await DbService.addItem(STORE_NAME, user);
      return id;
    };

    /**
     * Updates an existing user.
     * @param {Object} user - The updated user object.
     * @returns {Promise<Object>} A promise that resolves to the updated user object.
     */
    const updateUser = async (user) => {
      if (!utilService.partialValidateSchema(USER_SCHEMA, user)) {
        return;
      }
      user.updatedAt = Date.now();
      const updatedUser = await DbService.updateItem(STORE_NAME, user);
      return updatedUser;
    };

    /**
     * Retrieves all users.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of user objects.
     */
    const getAllUsers = async () => {
      const users = await DbService.getAllItems(STORE_NAME);
      return users;
    };

    /**
     * Counts the total number of users.
     * @returns {Promise<number>} A promise that resolves to the total number of users.
     */
    const countUsers = async () => {
      const count = await DbService.countItems(STORE_NAME);
      return count;
    };

    /**
     * Counts the number of users with a specific email.
     * @param {string} email - The email to search for.
     * @returns {Promise<number>} A promise that resolves to the number of users with the specified email.
     */
    const countUserByEmail = async (email) => {
      const count = await DbService.countItemByIndex(
        STORE_NAME,
        "email",
        email
      );
      return count;
    };

    /**
     * Retrieves a paginated list of users.
     * @param {number} page - The page number.
     * @param {number} pageSize - The number of users per page.
     * @param {string} indexName - The name of the index to use for pagination.
     * @returns {Promise<Object>} A promise that resolves to the paginated user data.
     */
    const getPaginatedUsers = async (page, pageSize, indexName) => {
      const data = await DbService.getPaginatedItems(STORE_NAME, {
        page,
        pageSize,
        indexName,
      });
      return data;
    };

    return {
      getByEmail,
      addUser,
      updateUser,
      getUserById,
      getAllUsers,
      countUsers,
      countUserByEmail,
      getPaginatedUsers,
    };
  },
]);
