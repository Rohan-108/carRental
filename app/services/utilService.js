/**
 * @description A service that provides utility functions for common tasks.
 */
angular.module("rentIT").factory("utilService", [
  "$q",
  function ($q) {
    /**
     * Hashes the given password using SHA-256.
     * @param {string} password - The plain text password.
     * @returns {Promise<string>} A promise that resolves with the hex hash.
     */
    async function hashPassword(password) {
      const encoder = new TextEncoder();
      const data = encoder.encode(password);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      return hashHex;
    }

    /**
     * Calculates the difference in days between two dates.
     * @param {string|Date} startDate - The start date.
     * @param {string|Date} endDate - The end date.
     * @returns {number} The number of days difference.
     */
    function getDaysDiff(startDate, endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffInMilliseconds = end - start;
      const diffInDays =
        Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24)) + 1;
      return diffInDays;
    }

    /**
     * Formats a number into a shorter string with units (K, M, B, T).
     * @param {number} num - The number to format.
     * @returns {string} The formatted number.
     */
    function formatNumber(num) {
      if (Math.abs(num) < 1000) return num.toString();
      const units = ["K", "M", "B", "T"];
      let unitIndex = -1;
      do {
        num /= 1000;
        unitIndex++;
      } while (Math.abs(num) >= 1000 && unitIndex < units.length - 1);
      return num.toFixed(1).replace(/\.0$/, "") + units[unitIndex];
    }

    /**
     * Reads a file from an input element and returns its content as an ArrayBuffer.
     * @param {HTMLInputElement} input - The file input element.
     * @param {number} [index=0] - The index of the file in the input's files list.
     * @returns {Promise<ArrayBuffer>} A promise that resolves with the file content.
     */
    function toArrayBuffer(files, index = 0) {
      return new Promise((resolve, reject) => {
        const file = files[index];
        if (!file) {
          reject("No file selected");
          return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve(e.target.result);
        };
        reader.onerror = (e) => {
          reject(e.target.error);
        };
        reader.readAsArrayBuffer(file);
      });
    }

    /**
     * Validates that the provided data object contains all required fields defined in the schema.
     * If a field is missing, displays an error using toaster.
     * @param {Object} schema - The schema object with field names as keys.
     * @param {Object} data - The data object to validate.
     * @returns {boolean} True if valid; otherwise, false.
     */
    function validateSchema(schema, data) {
      for (const field in schema) {
        if (!(field in data)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Partially validates that the provided data object does not contain any fields not defined in the schema.
     * If an extra field is found, displays an error using toaster.
     * @param {Object} schema - The schema object with allowed field names.
     * @param {Object} data - The data object to validate.
     * @returns {boolean} True if valid; otherwise, false.
     */
    function partialValidateSchema(schema, data) {
      for (const field in data) {
        if (!(field in schema)) {
          return false;
        }
      }
      return true;
    }

    /**
     * Array of city names.
     */
    const cities = [
      "Mumbai",
      "Delhi",
      "Bangalore",
      "Hyderabad",
      "Chennai",
      "Kolkata",
      "Pune",
      "Ahmedabad",
      "Jaipur",
      "Lucknow",
      "Nagpur",
      "Indore",
      "Coimbatore",
      "Bhopal",
      "Visakhapatnam",
      "Patna",
      "Ludhiana",
      "Agra",
      "Vadodara",
      "Nashik",
    ];

    /**
     * Creates a debounced version of the provided function.
     * The function execution is delayed until after the specified wait time.
     * @param {Function} func - The function to debounce.
     * @param {number} wait - The delay in milliseconds.
     * @returns {Function} The debounced function.
     */
    function debounce(func, wait) {
      let timeout;
      return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
    /**
     * @description Wraps a function to make it asynchronous using $q service to resolve the promise and run the digest cycle.
     * @param {*} fn - The function to wrap.
     * @returns
     */
    function asyncWrapper(fn) {
      return function (...args) {
        return $q.resolve().then(() => fn.apply(this, args));
      };
    }

    // Expose all utility functions and constants as the public API of the utilService.
    return {
      hashPassword,
      getDaysDiff,
      formatNumber,
      toArrayBuffer,
      validateSchema,
      partialValidateSchema,
      cities: cities,
      debounce,
      asyncWrapper,
    };
  },
]);
