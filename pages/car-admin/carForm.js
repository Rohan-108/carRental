import { toast, getCurrentUser } from "../../js/index.js";
import { getFileFromInput, isValidPlateNumber } from "../../js/utils.js";
import { loadCars } from "./carAdmin.js";
import DbService from "../../js/db.js";

const addCarForm = document.getElementById("addCarForm");
const editCarForm = document.getElementById("editCarForm");
const modal = document.getElementById("carModal");
const editModal = document.getElementById("editModal");
const validateField = (field, isValid, errorMessage) => {
  if (!isValid) {
    field.style.border = "2px solid red";
    toast("error", errorMessage).showToast();
  } else {
    field.style.border = "";
  }
};
const validateCarName = (carNameInput) => {
  const value = carNameInput.value.trim();
  const regex = /^(?!.*\d)[A-Za-z\s]{3,20}$/;
  const valid = regex.test(value);
  validateField(
    carNameInput,
    valid,
    "Car name must be 3-20 letters (no digits)"
  );
};

const validateRentalPrice = (rentalPriceInput) => {
  const value = rentalPriceInput.value.trim();
  const digitsOnly = /^\d+$/.test(value);
  const numeric = Number(value);
  const valid = digitsOnly && numeric >= 100 && numeric <= 10000;
  validateField(
    rentalPriceInput,
    valid,
    "Rental price must be a number between 100 and 10000"
  );
};
const validatePlateNumberField = (plateNumberInput) => {
  const value = plateNumberInput.value.trim();
  const valid = isValidPlateNumber(value);
  validateField(plateNumberInput, valid, "Invalid plate number");
};

const validateDropdown = (dropdownInput, fieldName) => {
  const value = dropdownInput.value.trim();
  const valid = value !== "";
  validateField(dropdownInput, valid, `${fieldName} is required`);
};
const validateSeats = (seatsInput) => {
  const value = seatsInput.value.trim();
  const digitsOnly = /^\d+$/.test(value);
  const numeric = Number(value);
  const valid = digitsOnly && numeric >= 2 && numeric <= 10;
  validateField(seatsInput, valid, "Seats must be a number between 2 and 10");
};
const validateRentalPeriod = (rentalInput, fieldName) => {
  const value = rentalInput.value.trim();
  const digitsOnly = /^\d+$/.test(value);
  const numeric = Number(value);
  const valid = digitsOnly && numeric >= 1 && numeric <= 365;
  validateField(
    rentalInput,
    valid,
    `${fieldName} must be a number between 1 and 365`
  );
};
const validateCarImage = (fileInput) => {
  const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
  const maxSizeInBytes = 500 * 1024;
  if (fileInput.files.length < 1 || fileInput.files.length > 3) {
    fileInput.style.border = "2px solid red";
    toast("error", "Select at least 1 and no more than 3 images").showToast();
    return false;
  }
  for (const file of fileInput.files) {
    if (file.size > maxSizeInBytes) {
      fileInput.style.border = "2px solid red";
      toast("error", "Each image must be less than 500KB").showToast();
      return false;
    }
    if (!allowedTypes.includes(file.type)) {
      fileInput.style.border = "2px solid red";
      toast("error", "Images must be PNG, JPEG, or JPG").showToast();
      return false;
    }
  }
  fileInput.style.border = "";
  return true;
};
addCarForm.elements["carName"].addEventListener("change", (e) =>
  validateCarName(e.target)
);
addCarForm.elements["rentalPrice"].addEventListener("change", (e) =>
  validateRentalPrice(e.target)
);
addCarForm.elements["plateNumber"].addEventListener("change", (e) =>
  validatePlateNumberField(e.target)
);
addCarForm.elements["vehicleType"].addEventListener("change", (e) =>
  validateDropdown(e.target, "Vehicle Type")
);
addCarForm.elements["seats"].addEventListener("change", (e) =>
  validateSeats(e.target)
);
addCarForm.elements["fuelType"].addEventListener("change", (e) =>
  validateDropdown(e.target, "Fuel Type")
);
addCarForm.elements["transmission"].addEventListener("change", (e) =>
  validateDropdown(e.target, "Transmission")
);
addCarForm.elements["location"].addEventListener("change", (e) =>
  validateDropdown(e.target, "Location")
);
addCarForm.elements["minRental"].addEventListener("change", (e) =>
  validateRentalPeriod(e.target, "Minimum Rental Period")
);
addCarForm.elements["maxRental"].addEventListener("change", (e) =>
  validateRentalPeriod(e.target, "Maximum Rental Period")
);
addCarForm.elements["carImage"].addEventListener("change", (e) =>
  validateCarImage(e.target)
);

addCarForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const carNameInput = addCarForm.elements["carName"];
    const rentalPriceInput = addCarForm.elements["rentalPrice"];
    const plateNumberInput = addCarForm.elements["plateNumber"];
    const vehicleTypeInput = addCarForm.elements["vehicleType"];
    const seatsInput = addCarForm.elements["seats"];
    const fuelTypeInput = addCarForm.elements["fuelType"];
    const transmissionInput = addCarForm.elements["transmission"];
    const locationInput = addCarForm.elements["location"];
    const minRentalInput = addCarForm.elements["minRental"];
    const maxRentalInput = addCarForm.elements["maxRental"];
    const carImageInput = addCarForm.elements["carImage"];
    validateCarName(carNameInput);
    validateRentalPrice(rentalPriceInput);
    validatePlateNumberField(plateNumberInput);
    validateDropdown(vehicleTypeInput, "Vehicle Type");
    validateDropdown(seatsInput, "Seats");
    validateDropdown(fuelTypeInput, "Fuel Type");
    validateDropdown(transmissionInput, "Transmission");
    validateDropdown(locationInput, "Location");
    validateRentalPeriod(minRentalInput, "Minimum Rental Period");
    validateRentalPeriod(maxRentalInput, "Maximum Rental Period");
    const carImageValid = validateCarImage(carImageInput);
    const invalidField = addCarForm.querySelector(
      "input[style*='red'], select[style*='red']"
    );
    if (invalidField || !carImageValid) {
      toast("error", "Please correct the highlighted fields").showToast();
      return;
    }
    if (
      Number(rentalPriceInput.value.trim()) < 100 ||
      Number(rentalPriceInput.value.trim()) > 10000
    ) {
      toast("error", "Rental price must be between 100 and 10000").showToast();
      return;
    }
    if (
      Number(minRentalInput.value.trim()) < 1 ||
      Number(minRentalInput.value.trim()) > 365 ||
      Number(maxRentalInput.value.trim()) < 1 ||
      Number(maxRentalInput.value.trim()) > 365
    ) {
      toast(
        "error",
        "Rental period must be between 1 and 365 days"
      ).showToast();
      return;
    }
    if (
      Number(minRentalInput.value.trim()) > Number(maxRentalInput.value.trim())
    ) {
      toast(
        "error",
        "Minimum rental period cannot be greater than maximum rental period"
      ).showToast();
      return;
    }

    const currentUser = getCurrentUser();
    const name = carNameInput.value.trim();
    const vehicleType = vehicleTypeInput.value.trim();
    const nseats = seatsInput.value.trim();
    const fuelType = fuelTypeInput.value.trim();
    const transmission = transmissionInput.value.trim();
    const rentalPrice = rentalPriceInput.value.trim();
    const minRentalPeriod = minRentalInput.value.trim();
    const maxRentalPeriod = maxRentalInput.value.trim();
    const plateNumber = plateNumberInput.value.trim();
    const location = locationInput.value.trim();
    const fileInput = carImageInput;

    let imagesBuffer = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      const buffer = await getFileFromInput(fileInput, i);
      imagesBuffer.push(buffer);
    }

    await DbService.addItem("cars", {
      userId: currentUser.id,
      name,
      plateNumber,
      vehicleType,
      seats: nseats,
      fuelType,
      transmission,
      rentalPrice,
      minRentalPeriod,
      maxRentalPeriod,
      location,
      show: "true",
      images: imagesBuffer,
      createdAt: Date.now(),
    });
    toast("success", "Car added successfully").showToast();
    loadCars();
    modal.style.display = "none";
  } catch (error) {
    toast("error", "Failed to add car").showToast();
  }
});
// edit car form
editCarForm.elements["rentalPrice"].addEventListener("change", (e) =>
  validateRentalPrice(e.target)
);
editCarForm.elements["minRental"].addEventListener("change", (e) =>
  validateRentalPeriod(e.target, "Minimum Rental Period")
);
editCarForm.elements["maxRental"].addEventListener("change", (e) =>
  validateRentalPeriod(e.target, "Maximum Rental Period")
);
editCarForm.elements["location"].addEventListener("change", (e) =>
  validateDropdown(e.target, "Location")
);
editCarForm.elements["carImage"].addEventListener("change", (e) =>
  validateCarImage(e.target)
);

editCarForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const rentalPriceInput = editCarForm.elements["rentalPrice"];
    const minRentalInput = editCarForm.elements["minRental"];
    const maxRentalInput = editCarForm.elements["maxRental"];
    const locationInput = editCarForm.elements["location"];
    const carImageInput = editCarForm.elements["carImage"];

    validateRentalPrice(rentalPriceInput);
    validateRentalPeriod(minRentalInput, "Minimum Rental Period");
    validateRentalPeriod(maxRentalInput, "Maximum Rental Period");
    validateDropdown(locationInput, "Location");
    const carImageValid = validateCarImage(carImageInput);
    const invalidField = editCarForm.querySelector(
      "input[style*='red'], select[style*='red']"
    );
    if (invalidField || !carImageValid) {
      toast("error", "Please correct the highlighted fields").showToast();
      return;
    }
    if (
      Number(minRentalInput.value.trim()) > Number(maxRentalInput.value.trim())
    ) {
      toast(
        "error",
        "Minimum rental period cannot be greater than maximum rental period"
      ).showToast();
      return;
    }
    if (
      Number(rentalPriceInput.value.trim()) < 100 ||
      Number(rentalPriceInput.value.trim()) > 10000
    ) {
      toast("error", "Rental price must be between 100 and 10000").showToast();
      return;
    }

    const carId = editCarForm.dataset.id;
    const car = await DbService.getItem("cars", carId);
    const rentalPrice = rentalPriceInput.value.trim();
    const minRentalPeriod = minRentalInput.value.trim();
    const maxRentalPeriod = maxRentalInput.value.trim();
    const location = locationInput.value.trim();
    const fileInput = carImageInput;
    if (fileInput) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      const maxSizeInBytes = 500 * 1024;
      for (const file of fileInput.files) {
        if (file.size > maxSizeInBytes) {
          toast("error", "Image must be less than 500KB").showToast();
          return;
        }
        if (!allowedTypes.includes(file.type)) {
          toast("error", "Image must be of type PNG, JPEG, or JPG").showToast();
          return;
        }
      }
    }

    let imagesBuffer = [];
    for (let i = 0; i < fileInput.files.length; i++) {
      const buffer = await getFileFromInput(fileInput, i);
      imagesBuffer.push(buffer);
    }

    await DbService.updateItem("cars", {
      id: carId,
      rentalPrice,
      minRentalPeriod,
      maxRentalPeriod,
      location,
      images: imagesBuffer.length ? imagesBuffer : car.images,
    });
    toast("success", "Updated Successfully").showToast();
    editModal.style.display = "none";
    loadCars();
  } catch (error) {
    toast("error", "Something went wrong").showToast();
  }
});
