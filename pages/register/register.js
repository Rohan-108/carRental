import { goToPage, setCurrentUser, toast } from "../../js/index.js";
import { hashPassword, getFileFromInput } from "../../js/utils.js";
import { UserValidator } from "../../js/services/validator.js";
import UserService from "../../js/services/userService.js";
const validator = UserValidator();
const signUpForm = document.getElementById("register");

// Attach on-change validations for each field using the validator
signUpForm?.elements["email"].addEventListener("change", (e) =>
  validator.validateEmail(e.target)
);
signUpForm?.elements["password"].addEventListener("change", (e) =>
  validator.validatePassword(e.target)
);
signUpForm?.elements["confirmPassword"].addEventListener("change", (e) =>
  validator.validateConfirmPassword(e.target)
);
signUpForm?.elements["adhaar"].addEventListener("change", (e) =>
  validator.validateAdhaar(e.target)
);
signUpForm?.elements["phone"].addEventListener("change", (e) =>
  validator.validatePhone(e.target)
);
signUpForm?.elements["avatar"].addEventListener("change", (e) =>
  validator.validateAvatar(e.target)
);

/**
 * @description Handles the registration form submission.
 */
signUpForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Extract form data using the FormData API
    const formData = new FormData(signUpForm);
    const name = (formData.get("name") || "").trim();
    const email = (formData.get("email") || "").trim();
    const password = (formData.get("password") || "").trim();
    const confirmPassword = (formData.get("confirmPassword") || "").trim();
    const tel = (formData.get("phone") || "").trim();
    const adhaar = (formData.get("adhaar") || "").trim();

    // Check that all required fields are provided
    if (
      [name, email, password, confirmPassword, tel, adhaar].some(
        (field) => field === ""
      )
    ) {
      toast("error", "All fields are required").showToast();
      return;
    }

    // Retrieve input elements from the form for validation
    const emailInput = signUpForm.elements["email"];
    const passwordInput = signUpForm.elements["password"];
    const confirmPasswordInput = signUpForm.elements["confirmPassword"];
    const adhaarInput = signUpForm.elements["adhaar"];
    const phoneInput = signUpForm.elements["phone"];
    const avatarInput = signUpForm.elements["avatar"];

    // Validate each field using the validator; if any fail, abort submission
    if (
      !validator.validateEmail(emailInput) ||
      !validator.validatePassword(passwordInput) ||
      !validator.validateConfirmPassword(confirmPasswordInput, passwordInput) ||
      !validator.validateAdhaar(adhaarInput) ||
      !validator.validatePhone(phoneInput) ||
      !validator.validateAvatar(avatarInput)
    ) {
      return;
    }

    // Ensure the password and confirm password fields match
    if (password !== confirmPassword) {
      toast("error", "Passwords do not match").showToast();
      return;
    }
    // Retrieve the avatar file data
    const avatarData = await getFileFromInput(avatarInput);

    // Hash the password for secure storage
    const hashedPassword = await hashPassword(password);

    // Build the user object with all necessary fields
    const user = {
      id: "",
      name,
      password: hashedPassword,
      tel,
      email,
      adhaar,
      role: "general",
      avatar: avatarData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await UserService.addUser(user);
    let newUser = await UserService.getByEmail(email);
    if (!newUser) {
      throw new Error("User not found");
    }
    // Set the current user and navigate to the home page
    setCurrentUser(newUser);
    toast("success", "User registered successfully").showToast();
    goToPage("index");
  } catch (error) {
    console.error("Registration error:", error);
    toast("error", error?.message || "Something went wrong").showToast();
  }
});
