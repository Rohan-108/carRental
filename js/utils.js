// Function to hash the password
import { toast } from "./index.js";
// Function to hash the password
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
// Function to get the difference between two dates
function getDaysDiff(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMilliseconds = end - start;
  const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24)) + 1;
  return diffInDays;
}
// Function to format number
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
// Function to read file from input element
const getFileFromInput = (input, index = 0) => {
  return new Promise((resolve, reject) => {
    const file = input.files[index];
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
};
//validate type of schema against given data
function validateSchema(schema, data) {
  for (const field in schema) {
    if (!(field in data)) {
      toast(
        "error",
        `Validation Error: Field "${field}" is required`
      ).showToast();
      return false;
    }
  }
  return true;
}
//partially validate schema
function partialValidateSchema(schema, data) {
  for (const field in data) {
    if (!(field in schema)) {
      toast(
        "error",
        `Validation Error: Field "${field}" is not allowed`
      ).showToast();
      return false;
    }
  }
  return true;
}
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
// Function to debounce a function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
export {
  hashPassword,
  getDaysDiff,
  getFileFromInput,
  cities,
  formatNumber,
  debounce,
  validateSchema,
  partialValidateSchema,
};
