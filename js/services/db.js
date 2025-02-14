import { openDB } from "https://cdn.jsdelivr.net/npm/idb@8.0.1/+esm";
import { UUID } from "https://unpkg.com/uuidjs@^5";
import { toast } from "../index.js";

function DbService() {
  const DB_NAME = "carRental";
  const DB_VERSION = 1;
  let dbInstance = null;

  const openDatabase = async () => {
    if (dbInstance) return dbInstance;

    try {
      dbInstance = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          const stores = {
            users: { keyPath: "id" },
            cars: { keyPath: "id" },
            bids: { keyPath: "id" },
            approvals: { keyPath: "id" },
            chat: { keyPath: "id" },
            conversations: { keyPath: "id" },
          };

          for (const [name, config] of Object.entries(stores)) {
            if (!db.objectStoreNames.contains(name)) {
              const store = db.createObjectStore(name, config);
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
                case "conversations":
                  store.createIndex("carId", "carId");
              }
            }
          }
        },
      });
      return dbInstance;
    } catch (error) {
      toast("error", "Database error: " + error.message).showToast();
      throw error;
    }
  };
  return {
    async addItem(storeName, data) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readwrite");
      try {
        data.id = UUID.generate();
        const id = await tx.store.add(data);
        await tx.done;
        return id;
      } catch (error) {
        toast(
          "error",
          `Failed to add item to ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async updateItem(storeName, data) {
      if (!data.id) throw new Error("Update requires item ID");

      const db = await openDatabase();
      const tx = db.transaction(storeName, "readwrite");
      try {
        const existing = await tx.store.get(data.id);
        if (!existing) throw new Error("Item not found");

        const updated = { ...existing, ...data };
        await tx.store.put(updated);
        await tx.done;
        return updated;
      } catch (error) {
        toast(
          "error",
          `Failed to update item in ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async getItem(storeName, id) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readonly");
      try {
        return await tx.store.get(id);
      } catch (error) {
        toast(
          "error",
          `Failed to get item from ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async getAllItems(storeName) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readonly");
      try {
        return await tx.store.getAll();
      } catch (error) {
        toast(
          "error",
          `Failed to get items from ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async deleteItem(storeName, id) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readwrite");
      try {
        await tx.store.delete(id);
        await tx.done;
        return true;
      } catch (error) {
        toast(
          "error",
          `Failed to delete item from ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async deleteByIndex(storeName, indexName, key) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readwrite");
      try {
        const index = tx.store.index(indexName);
        const keys = await index.getAllKeys(key);
        await Promise.all(keys.map((k) => tx.store.delete(k)));
        await tx.done;
        return keys.length;
      } catch (error) {
        toast(
          "error",
          `Failed to delete by index in ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async searchItemByIndex(storeName, indexName, key) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readonly");
      try {
        const index = tx.store.index(indexName);
        return await index.get(key);
      } catch (error) {
        toast(
          "error",
          `Search failed in ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async searchAllByIndex(storeName, indexName, key) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readonly");
      try {
        const index = tx.store.index(indexName);
        return await index.getAll(key);
      } catch (error) {
        toast(
          "error",
          `Search failed in ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },

    async countItemByIndex(storeName, indexName, key) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readonly");
      try {
        const index = tx.store.index(indexName || "id");
        return typeof key !== "undefined"
          ? await index.count(key)
          : await tx.store.count();
      } catch (error) {
        toast(
          "error",
          `Count failed in ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },
    async countItems(storeName) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readonly");
      try {
        return await tx.store.count();
      } catch (error) {
        toast(
          "error",
          `Count failed in ${storeName}: ${error.message}`
        ).showToast();
        throw error;
      }
    },
    async getPaginatedItems(
      storeName,
      {
        page = 1,
        pageSize = 10,
        indexName = "id",
        direction = "next",
        range = null,
      } = {},
      filterFunction = () => {
        return true;
      }
    ) {
      const db = await openDatabase();
      const tx = db.transaction(storeName, "readonly");
      const index = tx.store.index(indexName);

      let cursor = await index.openCursor(range, direction);
      const results = [];
      let counter = 0;
      const skip = (page - 1) * pageSize;

      while (cursor) {
        if (counter >= skip && results.length < pageSize) {
          if (filterFunction(cursor.value)) results.push(cursor.value);
        }
        counter++;
        cursor = await cursor.continue();
      }
      return {
        data: results,
        total: await this.countItems(storeName, indexName),
        page,
        pageSize,
        totalPages: Math.ceil(
          (await this.countItems(storeName, indexName)) / pageSize
        ),
      };
    },
  };
}

export default DbService();
