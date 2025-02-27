import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8.0.1/+esm";
import { UUID } from "https://unpkg.com/uuidjs@^5";

// Define the DbService as an AngularJS service
angular.module("rentIT").factory("DbService", [
  "toaster",
  function (toaster) {
    // Database constants
    const DB_NAME = "carRental";
    const DB_VERSION = 1;
    // Cached database instance
    let dbInstance = null;

    /**
     * Opens (or returns the cached) IndexedDB instance.
     * If the database is being created/upgraded, it also sets up
     * the required object stores and indexes.
     * @returns {Promise<IDBPDatabase>} The database instance.
     */
    const openDatabase = async () => {
      if (dbInstance) return dbInstance;

      try {
        dbInstance = await openDB(DB_NAME, DB_VERSION, {
          upgrade(db) {
            // Define our object stores with configuration options
            const stores = {
              users: { keyPath: "id" },
              cars: { keyPath: "id" },
              bids: { keyPath: "id" },
              approvals: { keyPath: "id" },
              chat: { keyPath: "id" },
              conversations: { keyPath: "id" },
            };

            // Create each store if it does not exist already
            for (const [name, config] of Object.entries(stores)) {
              if (!db.objectStoreNames.contains(name)) {
                const store = db.createObjectStore(name, config);
                // Create indexes based on the store type
                switch (name) {
                  case "users":
                    store.createIndex("email", "email", { unique: true });
                    store.createIndex("adhaar", "adhaar", { unique: true });
                    break;
                  case "cars":
                    store.createIndex("ownerId", "ownerId");
                    store.createIndex("plateNumber", "plateNumber", {
                      unique: true,
                    });
                    store.createIndex("show", "show");
                    break;
                  case "approvals":
                    store.createIndex("userId", "userId", { unique: true });
                    break;
                  case "bids":
                    store.createIndex("userId", "userId");
                    store.createIndex("carId", "carId");
                    store.createIndex("ownerId", "ownerId");
                    break;
                  case "chat":
                    store.createIndex("conversationId", "conversationId");
                    break;
                  case "conversations":
                    store.createIndex("carId", "carId");
                    break;
                }
              }
            }
          },
        });
        return dbInstance;
      } catch (error) {
        toaster.pop("error", "Error", "Failed to open database");
        throw error;
      }
    };

    // Return an object exposing the public API of the service
    return {
      /**
       * Adds a new item to a specified object store.
       * Generates a unique ID for the item before adding.
       * @param {string} storeName - The object store name.
       * @param {Object} data - The data to add.
       * @returns {Promise<string>} The generated ID.
       */
      addItem: async function (storeName, data) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readwrite");
        try {
          // Generate and assign a unique ID for the item
          data.id = UUID.generate();
          const id = await tx.store.add(data);
          await tx.done;
          return id;
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Failed to add item to ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Updates an existing item in a specified store.
       * Requires the data object to include an 'id' property.
       * @param {string} storeName - The object store name.
       * @param {Object} data - The updated data.
       * @returns {Promise<Object>} The updated item.
       */
      updateItem: async function (storeName, data) {
        if (!data.id) throw new Error("Update requires item ID");
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readwrite");
        try {
          const existing = await tx.store.get(data.id);
          if (!existing) throw new Error("Item not found");
          // Merge existing data with new updates
          const updated = { ...existing, ...data };
          await tx.store.put(updated);
          await tx.done;
          return updated;
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Failed to update item in ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Retrieves an item by its ID from the specified store.
       * @param {string} storeName - The object store name.
       * @param {string} id - The ID of the item.
       * @returns {Promise<Object>} The retrieved item.
       */
      getItem: async function (storeName, id) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readonly");
        try {
          return await tx.store.get(id);
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Failed to get item from ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Retrieves all items from a specified object store.
       * @param {string} storeName - The object store name.
       * @returns {Promise<Array>} Array of items.
       */
      getAllItems: async function (storeName) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readonly");
        try {
          return await tx.store.getAll();
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Failed to get items from ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Deletes an item by its ID from a specified store.
       * @param {string} storeName - The object store name.
       * @param {string} id - The ID of the item to delete.
       * @returns {Promise<boolean>} Returns true if deletion is successful.
       */
      deleteItem: async function (storeName, id) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readwrite");
        try {
          await tx.store.delete(id);
          await tx.done;
          return true;
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Failed to delete item from ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Deletes items from a store using an index key.
       * @param {string} storeName - The object store name.
       * @param {string} indexName - The index to use for deletion.
       * @param {*} key - The key to match for deletion.
       * @returns {Promise<number>} The number of items deleted.
       */
      deleteByIndex: async function (storeName, indexName, key) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readwrite");
        try {
          const index = tx.store.index(indexName);
          const keys = await index.getAllKeys(key);
          await Promise.all(keys.map((k) => tx.store.delete(k)));
          await tx.done;
          return keys.length;
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Failed to delete items from ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Searches for a single item in a store by a given index.
       * @param {string} storeName - The object store name.
       * @param {string} indexName - The index to search.
       * @param {*} key - The key to search for.
       * @returns {Promise<Object>} The found item.
       */
      searchItemByIndex: async function (storeName, indexName, key) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readonly");
        try {
          const index = tx.store.index(indexName);
          return await index.get(key);
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Search failed in ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Searches for all items in a store matching a key in a specified index.
       * @param {string} storeName - The object store name.
       * @param {string} indexName - The index to search.
       * @param {*} key - The key to match.
       * @returns {Promise<Array>} Array of matching items.
       */
      searchAllByIndex: async function (storeName, indexName, key) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readonly");
        try {
          const index = tx.store.index(indexName);
          return await index.getAll(key);
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Search failed in ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Counts the number of items in a store using an index.
       * If a key is provided, counts items matching that key; otherwise, counts all items.
       * @param {string} storeName - The object store name.
       * @param {string} [indexName='id'] - The index name (default is "id").
       * @param {*} [key] - Optional key to count.
       * @returns {Promise<number>} The count of items.
       */
      countItemByIndex: async function (storeName, indexName, key) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readonly");
        try {
          const index = tx.store.index(indexName || "id");
          return typeof key !== "undefined"
            ? await index.count(key)
            : await tx.store.count();
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Count failed in ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Counts all items in the specified object store.
       * @param {string} storeName - The object store name.
       * @returns {Promise<number>} The total number of items.
       */
      countItems: async function (storeName) {
        const db = await openDatabase();
        const tx = db.transaction(storeName, "readonly");
        try {
          return await tx.store.count();
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Count failed in ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * Retrieves paginated items from a store with optional filtering.
       * @param {string} storeName - The object store name.
       * @param {Object} options - Pagination options.
       * @param {number} [options.page=1] - The page number.
       * @param {number} [options.pageSize=10] - Number of items per page.
       * @param {string} [options.indexName="id"] - Index name to use.
       * @param {string} [options.direction="next"] - Cursor direction.
       * @param {*} [options.range=null] - Optional key range.
       * @param {function} [filterFunction] - A function to filter items.
       * @returns {Promise<Object>} An object containing paginated data and metadata.
       */
      getPaginatedItems: async function (
        storeName,
        {
          page = 1,
          pageSize = 10,
          indexName,
          direction = "next",
          range = null,
        } = {},
        filterFunction = () => true
      ) {
        try {
          const db = await openDatabase();
          const tx = db.transaction(storeName, "readonly");
          const index = indexName ? tx.store.index(indexName) : tx.store;

          let cursor = await index.openCursor(range, direction);
          const results = [];
          let counter = 0;
          const skip = (page - 1) * pageSize;

          // Iterate over the cursor to collect filtered items
          while (cursor) {
            if (counter >= skip && results.length < pageSize) {
              if (filterFunction(cursor.value)) {
                results.push(cursor.value);
              }
            }
            counter++;
            cursor = await cursor.continue();
          }
          return {
            data: results,
            total: await this.countItems(storeName),
            page,
            pageSize,
            totalPages: Math.ceil(
              (await this.countItems(storeName)) / pageSize
            ),
          };
        } catch (error) {
          toaster.pop(
            "error",
            "Error",
            `Failed to get paginated items from ${storeName}: ${error.message}`
          );
          throw error;
        }
      },

      /**
       * @description Iterate over the store and group data into two parts
       * @param {*} storeName - store name
       * @param {*} keyAccessor - to access key
       * @param {*} indexName - index name
       * @param {*} direction - direction
       * @param {*} range - range
       * @param {*} options - options
       * @returns {Array<Object>} - data
       */
      getChartDataBifarcate: async function (
        storeName,
        keyAccessor,
        indexName,
        direction = "next",
        range = null,
        options = {}
      ) {
        try {
          const db = await openDatabase();
          const tx = db.transaction(storeName, "readonly");
          const store = indexName ? tx.store.index(indexName) : tx.store;
          let cursor = await store.openCursor(range, direction);
          const { summationField, commissionRate, filterFunction } = options;
          const data = { partOne: {}, partTwo: {} };
          while (cursor) {
            const item = cursor.value;
            const key = keyAccessor(item) || "Unknown";
            const val = summationField
              ? Number(item[summationField]) * (1 - commissionRate)
              : 1;
            if (filterFunction(item)) {
              data.partOne[key] = (data.partOne[key] || 0) + val;
            } else {
              data.partTwo[key] = (data.partTwo[key] || 0) + val;
            }
            cursor = await cursor.continue();
          }
          return data;
        } catch (error) {
          throw error;
        }
      },

      /**
       * @description Iterate over the store and group data
       * @param {*} storeName - store name
       * @param {*} keyAccessor - to access key
       * @param {*} indexName - index name
       * @param {*} direction - direction
       * @param {*} range - range
       * @param {*} options - options
       * @returns {Array<Object>} - data
       */
      getChartData: async function (
        storeName,
        keyAccessor,
        indexName,
        direction = "next",
        range = null,
        options = {}
      ) {
        try {
          const db = await openDatabase();
          const tx = db.transaction(storeName, "readonly");
          const store = indexName ? tx.store.index(indexName) : tx.store;
          let cursor = await store.openCursor(range, direction);
          const { summationField, commissionRate, filterFunction } = options;
          const data = {};
          while (cursor) {
            const item = cursor.value;
            const key = keyAccessor(item) || "Unknown";
            const val = summationField
              ? Number(item[summationField]) * (1 - commissionRate)
              : 1;
            if (filterFunction(item)) {
              data[key] = (data[key] || 0) + val;
            }
            cursor = await cursor.continue();
          }
          return data;
        } catch (error) {
          throw error;
        }
      },
    };
  },
]);
