import { goToPage, setCurrentUser, toast } from "../../js/index.js";
import { hashPassword } from "../../js/utils.js";
import { UserValidator } from "../../js/services/validator.js";
import UserService from "../../js/services/userService.js";

const validator = UserValidator();
// Get the login form element by its ID
const loginForm = document.getElementById("login");

//onChange validation for email and password fields
loginForm?.elements["email"].addEventListener("change", (e) => {
  validator.validateEmail(e.target);
});

loginForm?.elements["password"].addEventListener("change", (e) => {
  validator.validatePassword(e.target);
});

/**
 * @description Handles the login form submission.
 */
loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  try {
    // Use FormData to retrieve form input values
    const formData = new FormData(loginForm);
    const email = (formData.get("email") || "").trim();
    const password = (formData.get("password") || "").trim();

    // Check if any required field is empty
    if (!email || !password) {
      toast("error", "All fields are required").showToast();
      return;
    }
    if (
      !validator.validateEmail(loginForm.elements["email"]) ||
      !validator.validatePassword(loginForm.elements["password"])
    ) {
      toast("error", "Invalid email or password").showToast();
      return;
    }
    // Search for the user in the database by email
    const user = await UserService.getByEmail(email);
    if (!user) {
      toast("error", "User not found").showToast();
      return;
    }
    // Hash the provided password and compare with the stored hashed password
    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== user.password) {
      toast("error", "Incorrect password").showToast();
      return;
    }
    toast("success", "Login successful").showToast();
    setCurrentUser(user);
    goToPage("index");
  } catch (error) {
    console.error("Login error:", error);
    toast("error", "Something went wrong").showToast();
  }
});
