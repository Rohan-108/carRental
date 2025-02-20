import { toast } from "../index.js";

/**
 * Applies validation to a field.
 * @param {HTMLElement} field - The input element.
 * @param {boolean} isValid - Validation result.
 * @param {string} errorMessage - Error message if invalid.
 * @returns {boolean} - Returns the isValid flag.
 */
function applyValidation(field, isValid, errorMessage) {
  if (!isValid) {
    field.style.border = "2px solid red";
    toast("error", errorMessage).showToast();
  } else {
    field.style.border = "";
  }
  return isValid;
}

/* ==================== User Validator ==================== */
function UserValidator() {
  // Check if email format is valid.
  function isEmailValid(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Check if password meets strength requirements.
  function isPasswordStrong(str) {
    return /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/.test(str);
  }
  // Check if email format is valid.
  const validateEmail = (emailInput) => {
    const valid = isEmailValid(emailInput.value.trim());
    return applyValidation(emailInput, valid, "Invalid email format");
  };
  // Check if password format is valid.
  const validatePassword = (passwordInput) => {
    const valid = isPasswordStrong(passwordInput.value.trim());
    return applyValidation(
      passwordInput,
      valid,
      "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
    );
  };

  // Now requires both confirm and original password inputs.
  const validateConfirmPassword = (confirmPasswordInput, passwordInput) => {
    const valid =
      confirmPasswordInput.value.trim() === passwordInput.value.trim();
    return applyValidation(
      confirmPasswordInput,
      valid,
      "Passwords do not match"
    );
  };
  // Check if adhaar number format is valid.
  const validateAdhaar = (adhaarInput) => {
    const valid = /^\d{12}$/.test(adhaarInput.value.trim());
    return applyValidation(
      adhaarInput,
      valid,
      "Adhaar number must be 12 digits"
    );
  };
  // Check if phone number format is valid.
  const validatePhone = (phoneInput) => {
    const valid = /^\d{10}$/.test(phoneInput.value.trim());
    return applyValidation(phoneInput, valid, "Phone number must be 10 digits");
  };
  // Check if avatar image format is valid.
  const validateAvatar = (avatarInput) => {
    if (avatarInput.files[0]) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      const maxSizeInBytes = 500 * 1024;
      const valid =
        allowedTypes.includes(avatarInput.files[0].type) &&
        avatarInput.files[0].size <= maxSizeInBytes;
      return applyValidation(
        avatarInput,
        valid,
        "Avatar must be PNG, JPEG, or JPG and less than 500KB"
      );
    }
    return true; // No file is considered valid.
  };

  return {
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    validateAdhaar,
    validatePhone,
    validateAvatar,
  };
}

/* ==================== Car Validator ==================== */
function CarValidator() {
  // Check if plate number format is valid.
  function isValidPlateNumber(plate) {
    return /^[A-Z]{2}[ -][0-9]{1,2}(?: [A-Z])?(?: [A-Z]*)? [0-9]{4}$/.test(
      plate
    );
  }
  // Check if car name format is valid.
  const validateCarName = (carNameInput) => {
    const valid = /^(?!.*\d)[A-Za-z\s]{3,20}$/.test(carNameInput.value.trim());
    return applyValidation(
      carNameInput,
      valid,
      "Car name must be 3-20 letters (no digits)"
    );
  };
  // Check if rental price format is valid.
  const validateRentalPrice = (rentalPriceInput) => {
    const value = rentalPriceInput.value.trim();
    const numeric = Number(value);
    const valid = /^\d+$/.test(value) && numeric >= 100 && numeric <= 10000;
    return applyValidation(
      rentalPriceInput,
      valid,
      "Rental price must be a number between 100 and 10000"
    );
  };
  // Check if plate number format is valid.
  const validatePlateNumberField = (plateNumberInput) => {
    const valid = isValidPlateNumber(plateNumberInput.value.trim());
    return applyValidation(plateNumberInput, valid, "Invalid plate number");
  };
  // Check if dropdown field is selected.
  const validateDropdown = (dropdownInput, fieldName) => {
    const valid = dropdownInput.value.trim() !== "";
    return applyValidation(dropdownInput, valid, `${fieldName} is required`);
  };
  // Check if seats format is valid.
  const validateSeats = (seatsInput) => {
    const value = seatsInput.value.trim();
    const numeric = Number(value);
    const valid = /^\d+$/.test(value) && numeric >= 2 && numeric <= 10;
    return applyValidation(
      seatsInput,
      valid,
      "Seats must be a number between 2 and 10"
    );
  };
  // Check if car image format is valid.
  const validateCarImage = (fileInput) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const maxSizeInBytes = 500 * 1024; //500KB
    if (fileInput.files.length < 1 || fileInput.files.length > 3) {
      fileInput.style.border = "2px solid red";
      toast("error", "Select at least 1 and no more than 3 images").showToast();
      return false;
    }
    let valid = true;
    for (const file of fileInput.files) {
      if (file.size > maxSizeInBytes || !allowedTypes.includes(file.type)) {
        valid = false;
        break;
      }
    }
    return valid
      ? ((fileInput.style.border = ""), true)
      : applyValidation(
          fileInput,
          false,
          "Images must be PNG, JPEG, or JPG and each less than 500KB"
        );
  };
  // Check if rental period format is valid.
  const validateRentalPeriod = (rentalInput, fieldName) => {
    const value = rentalInput.value.trim();
    const numeric = Number(value);
    const valid = /^\d+$/.test(value) && numeric >= 1 && numeric <= 365;
    return applyValidation(
      rentalInput,
      valid,
      `${fieldName} must be a number between 1 and 365`
    );
  };
  // Check if rate per km format is valid.
  const validateRatePerKm = (rateInput) => {
    const value = rateInput.value.trim();
    const numeric = Number(value);
    const valid = /^\d+$/.test(value) && numeric >= 1 && numeric <= 10;
    return applyValidation(
      rateInput,
      valid,
      `Rate must be a number between 1 and 10`
    );
  };
  // Check if fixed kilometer format is valid.
  const validateFixedKilometer = (fixedInput) => {
    const value = fixedInput.value.trim();
    const numeric = Number(value);
    const valid = /^\d+$/.test(value) && numeric >= 200 && numeric <= 1000;
    return applyValidation(
      fixedInput,
      valid,
      `Fixed Kilometer must be a number between 200 and 1000`
    );
  };
  return {
    validateCarName,
    validateRentalPrice,
    validatePlateNumberField,
    validateDropdown,
    validateSeats,
    validateCarImage,
    validateRentalPeriod,
    validateFixedKilometer,
    validateRatePerKm,
  };
}

export { UserValidator, CarValidator };
