function isEmailValid(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function isPasswordStrong(str) {
  const re = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
  return re.test(str);
}
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
function isValidPlateNumber(plate) {
  const re = /^[A-Z]{2}[ -][0-9]{1,2}(?: [A-Z])?(?: [A-Z]*)? [0-9]{4}$/;
  return re.test(plate);
}
function getDaysDiff(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffInMilliseconds = end - start;
  const diffInDays = Math.ceil(diffInMilliseconds / (1000 * 60 * 60 * 24)) + 1;
  return diffInDays;
}

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

export {
  isEmailValid,
  isPasswordStrong,
  hashPassword,
  isValidPlateNumber,
  getDaysDiff,
  getFileFromInput,
  cities,
};
