import { goToPage, setCurrentUser, toast } from "../../js/index.js";
import DbService from "../../js/db.js";
import {
  isEmailValid,
  isPasswordStrong,
  hashPassword,
  getFileFromInput,
} from "../../js/utils.js";

const signUpForm = document.getElementById("register");

// Utility function to validate input fields
const validateField = (field, isValid, errorMessage) => {
  if (!isValid) {
    field.style.border = "2px solid red";
    toast("error", errorMessage).showToast();
  } else {
    field.style.border = "";
  }
};

// Individual field validation functions
const validateEmail = (emailInput) => {
  const isValid = isEmailValid(emailInput.value.trim());
  validateField(emailInput, isValid, "Invalid email format");
};

const validatePassword = (passwordInput) => {
  const isValid = isPasswordStrong(passwordInput.value.trim());
  validateField(
    passwordInput,
    isValid,
    "Password must have at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
  );
};

const validateConfirmPassword = (confirmPasswordInput) => {
  const passwordInput = signUpForm.elements["password"];
  const isValid =
    confirmPasswordInput.value.trim() === passwordInput.value.trim();
  validateField(confirmPasswordInput, isValid, "Passwords do not match");
};

const validateAdhaar = (adhaarInput) => {
  const isValid = /^\d{12}$/.test(adhaarInput.value.trim());
  validateField(adhaarInput, isValid, "Adhaar number must be 12 digits");
};

const validatePhone = (phoneInput) => {
  const isValid = /^\d{10}$/.test(phoneInput.value.trim());
  validateField(phoneInput, isValid, "Phone number must be 10 digits");
};

const validateAvatar = (avatarInput) => {
  const avatarFile = avatarInput.files[0];
  if (avatarFile) {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    const maxSizeInBytes = 500 * 1024;
    const isValid =
      allowedTypes.includes(avatarFile.type) &&
      avatarFile.size <= maxSizeInBytes;

    validateField(
      avatarInput,
      isValid,
      "Avatar must be PNG, JPEG, or JPG and less than 500KB"
    );
  }
};

// Attach onchange validation to input fields
signUpForm?.elements["email"].addEventListener("change", (e) =>
  validateEmail(e.target)
);
signUpForm?.elements["password"].addEventListener("change", (e) =>
  validatePassword(e.target)
);
signUpForm?.elements["confirmPassword"].addEventListener("change", (e) =>
  validateConfirmPassword(e.target)
);
signUpForm?.elements["adhaar"].addEventListener("change", (e) =>
  validateAdhaar(e.target)
);
signUpForm?.elements["phone"].addEventListener("change", (e) =>
  validatePhone(e.target)
);
signUpForm?.elements["avatar"].addEventListener("change", (e) =>
  validateAvatar(e.target)
);

// Form submission event
signUpForm?.addEventListener("submit", async (e) => {
  try {
    e.preventDefault();

    const name = signUpForm.elements["name"].value?.trim();
    const password = signUpForm.elements["password"].value?.trim();
    const tel = signUpForm.elements["phone"].value?.trim();
    const email = signUpForm.elements["email"].value?.trim();
    const adhaar = signUpForm.elements["adhaar"].value?.trim();
    const confirmPassword =
      signUpForm.elements["confirmPassword"].value?.trim();

    if (
      [name, password, tel, email, confirmPassword, adhaar].some(
        (item) => item === ""
      )
    ) {
      toast("error", "All fields are required").showToast();
      return;
    }

    if (password !== confirmPassword) {
      toast("error", "Passwords do not match").showToast();
      return;
    }

    if (!isEmailValid(email)) {
      toast("error", "Invalid email").showToast();
      return;
    }

    if (!isPasswordStrong(password)) {
      toast(
        "error",
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character"
      ).showToast();
      return;
    }

    if (!/^\d{12}$/.test(adhaar)) {
      toast("error", "Adhaar number must be 12 digits").showToast();
      return;
    }

    if (!/^\d{10}$/.test(tel)) {
      toast("error", "Phone number must be 10 digits").showToast();
      return;
    }

    const u = await DbService.searchItemByIndex("users", "email", email);
    if (u) {
      toast("error", "Email already exists").showToast();
      return;
    }

    let avatarData = "https://picsum.photos/200/300";
    const avatarInput = signUpForm.elements["avatar"];
    const avatarFile = avatarInput?.files[0];

    if (avatarFile) {
      const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
      if (!allowedTypes.includes(avatarFile.type)) {
        toast(
          "error",
          "Avatar must be an image of type PNG, JPEG, or JPG"
        ).showToast();
        return;
      }
      const maxSizeInBytes = 500 * 1024;
      if (avatarFile.size > maxSizeInBytes) {
        toast("error", "Avatar image must be less than 500KB").showToast();
        return;
      }
      avatarData = await getFileFromInput(avatarInput);
    }

    const hashedPassword = await hashPassword(password);
    const user = {
      name,
      password: hashedPassword,
      tel,
      email,
      adhaar,
      role: "general",
      avatar: avatarData || "https://picsum.photos/200/300",
      createdAt: Date.now(),
    };

    await DbService.addItem("users", user);
    let newUser = await DbService.searchItemByIndex("users", "email", email);
    newUser = {
      email: newUser.email,
      name: newUser.name,
      tel: newUser.tel,
      id: newUser.id,
      role: newUser.role,
      adhaar: newUser.adhaar,
    };

    setCurrentUser(newUser);
    toast("success", "User registered successfully").showToast();
    goToPage("index");
  } catch (error) {
    console.error(error);
    toast("error", error?.message || "Something went wrong").showToast();
  }
});
