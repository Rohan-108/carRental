import { toast, getCurrentUser } from "../../js/index.js";
import { getFileFromInput } from "../../js/utils.js";
import { loadCars } from "./carAdmin.js";
import CarService from "../../js/services/carService.js";
import { CarValidator } from "../../js/services/validator.js";
import UserService from "../../js/services/userService.js";

const validator = CarValidator();
const addCarForm = document.getElementById("addCarForm");
const editCarForm = document.getElementById("editCarForm");
const modal = document.getElementById("carModal");
const editModal = document.getElementById("editModal");

/**
 * Helper function to process image files from a file input.
 * Returns an array of image buffers.
 * @param {HTMLInputElement} fileInput
 * @returns {Promise<string[]>}
 */
async function processImages(fileInput) {
  const imagesBuffer = [];
  for (let i = 0; i < fileInput.files.length; i++) {
    const buffer = await getFileFromInput(fileInput, i);
    imagesBuffer.push(buffer);
  }
  return imagesBuffer;
}

/* ----------------------- Add Car Form ----------------------- */
// Attach onchange validations for add car form fields using the validator
addCarForm.elements["carName"].addEventListener("change", (e) =>
  validator.validateCarName(e.target)
);
addCarForm.elements["rentalPrice"].addEventListener("change", (e) =>
  validator.validateRentalPrice(e.target)
);
addCarForm.elements["plateNumber"].addEventListener("change", (e) =>
  validator.validatePlateNumberField(e.target)
);
addCarForm.elements["vehicleType"].addEventListener("change", (e) =>
  validator.validateDropdown(e.target, "Vehicle Type")
);
addCarForm.elements["seats"].addEventListener("change", (e) =>
  validator.validateDropdown(e.target, "Seats")
);
addCarForm.elements["fuelType"].addEventListener("change", (e) =>
  validator.validateDropdown(e.target, "Fuel Type")
);
addCarForm.elements["transmission"].addEventListener("change", (e) =>
  validator.validateDropdown(e.target, "Transmission")
);
addCarForm.elements["location"].addEventListener("change", (e) =>
  validator.validateDropdown(e.target, "Location")
);
addCarForm.elements["minRental"].addEventListener("change", (e) =>
  validator.validateRentalPeriod(e.target, "Minimum Rental Period")
);
addCarForm.elements["maxRental"].addEventListener("change", (e) =>
  validator.validateRentalPeriod(e.target, "Maximum Rental Period")
);
addCarForm.elements["carImage"].addEventListener("change", (e) =>
  validator.validateCarImage(e.target)
);

addCarForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    // Use FormData to extract all form values
    const formData = new FormData(addCarForm);
    const carName = (formData.get("carName") || "").trim();
    const rentalPrice = Number((formData.get("rentalPrice") || "").trim());
    const plateNumber = (formData.get("plateNumber") || "").trim();
    const vehicleType = (formData.get("vehicleType") || "").trim();
    const seats = (formData.get("seats") || "").trim();
    const fuelType = (formData.get("fuelType") || "").trim();
    const transmission = (formData.get("transmission") || "").trim();
    const location = (formData.get("location") || "").trim();
    const minRental = Number((formData.get("minRental") || "").trim());
    const maxRental = Number((formData.get("maxRental") || "").trim());
    const carImageInput = addCarForm.elements["carImage"];

    // Ensure required fields are not empty
    if (
      [
        carName,
        rentalPrice,
        plateNumber,
        vehicleType,
        seats,
        fuelType,
        transmission,
        location,
        minRental,
        maxRental,
      ].some((field) => field === "")
    ) {
      toast("error", "All fields are required").showToast();
      return;
    }

    // Validate each field using the validator functions.
    if (
      !validator.validateCarName(addCarForm.elements["carName"]) ||
      !validator.validateRentalPrice(addCarForm.elements["rentalPrice"]) ||
      !validator.validatePlateNumberField(addCarForm.elements["plateNumber"]) ||
      !validator.validateDropdown(
        addCarForm.elements["vehicleType"],
        "Vehicle Type"
      ) ||
      !validator.validateDropdown(addCarForm.elements["seats"], "Seats") ||
      !validator.validateDropdown(
        addCarForm.elements["fuelType"],
        "Fuel Type"
      ) ||
      !validator.validateDropdown(
        addCarForm.elements["transmission"],
        "Transmission"
      ) ||
      !validator.validateDropdown(
        addCarForm.elements["location"],
        "Location"
      ) ||
      !validator.validateRentalPeriod(
        addCarForm.elements["minRental"],
        "Minimum Rental Period"
      ) ||
      !validator.validateRentalPeriod(
        addCarForm.elements["maxRental"],
        "Maximum Rental Period"
      ) ||
      !validator.validateCarImage(carImageInput)
    ) {
      toast("error", "Please correct the highlighted fields").showToast();
      return;
    }
    if (minRental > maxRental) {
      toast(
        "error",
        "Minimum rental period cannot be greater than maximum rental period"
      ).showToast();
      return;
    }
    // Process car images (if any)
    const imagesBuffer = await processImages(carImageInput);
    // Prepare car data for saving
    const currentUser = getCurrentUser();
    const owner = await UserService.getUserById(currentUser.id);
    const carData = {
      id: "",
      name: carName,
      plateNumber,
      vehicleType,
      seats,
      fuelType,
      transmission,
      rentalPrice,
      minRentalPeriod: minRental,
      maxRentalPeriod: maxRental,
      location,
      owner: owner,
      ownerId: owner.id,
      show: "true",
      images: imagesBuffer,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    // Save the new car entry
    await CarService.addCar(carData);
    toast("success", "Car added successfully").showToast();
    loadCars();
    modal.style.display = "none";
  } catch (error) {
    console.error("Add car error:", error);
    toast("error", "Failed to add car").showToast();
  }
});

/* ----------------------- Edit Car Form ----------------------- */
// Attach onchange validations for edit car form fields using the validator
editCarForm.elements["rentalPrice"].addEventListener("change", (e) =>
  validator.validateRentalPrice(e.target)
);
editCarForm.elements["minRental"].addEventListener("change", (e) =>
  validator.validateRentalPeriod(e.target, "Minimum Rental Period")
);
editCarForm.elements["maxRental"].addEventListener("change", (e) =>
  validator.validateRentalPeriod(e.target, "Maximum Rental Period")
);
editCarForm.elements["location"].addEventListener("change", (e) =>
  validator.validateDropdown(e.target, "Location")
);
editCarForm.elements["carImage"].addEventListener("change", (e) =>
  validator.validateCarImage(e.target)
);

editCarForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    const formData = new FormData(editCarForm);
    const rentalPrice = Number((formData.get("rentalPrice") || "").trim());
    const minRental = Number((formData.get("minRental") || "").trim());
    const maxRental = Number((formData.get("maxRental") || "").trim());
    const location = (formData.get("location") || "").trim();
    const carImageInput = editCarForm.elements["carImage"];

    // Validate required fields via validator functions
    if (
      !validator.validateRentalPrice(editCarForm.elements["rentalPrice"]) ||
      !validator.validateRentalPeriod(
        editCarForm.elements["minRental"],
        "Minimum Rental Period"
      ) ||
      !validator.validateRentalPeriod(
        editCarForm.elements["maxRental"],
        "Maximum Rental Period"
      ) ||
      !validator.validateDropdown(editCarForm.elements["location"], "Location")
    ) {
      toast("error", "Please correct the highlighted fields").showToast();
      return;
    }

    // Additional validations for numeric constraints
    if (minRental > maxRental) {
      toast(
        "error",
        "Minimum rental period cannot be greater than maximum rental period"
      ).showToast();
      return;
    }
    // Validate file type and size if images are provided
    if (carImageInput.files.length) {
      if (!validator.validateCarImage(carImageInput)) {
        toast("error", "Please correct the highlighted fields").showToast();
        return;
      }
    }

    // Process new images (if provided)
    const newImages = await processImages(carImageInput);
    const carId = editCarForm.dataset.id;
    const existingCar = await CarService.getCarById(carId);
    // Update the car data; if no new images were uploaded, retain existing images.
    const updatedCarData = {
      id: carId,
      rentalPrice,
      minRentalPeriod: minRental,
      maxRentalPeriod: maxRental,
      location,
      images: newImages.length ? newImages : existingCar.images,
      updatedAt: Date.now(),
    };

    await CarService.updateCar(updatedCarData);
    toast("success", "Updated Successfully").showToast();
    editModal.style.display = "none";
    loadCars();
  } catch (error) {
    console.error("Edit car error:", error);
    toast("error", "Something went wrong").showToast();
  }
});
