import { goToPage, setCurrentUser, toast } from "../../js/index.js";
import {
  hashPassword,
  isEmailValid,
  isPasswordStrong,
} from "../../js/utils.js";
import DbService from "../../js/db.js";

const loginForm = document.getElementById("login");
const validateField = (field, isValid, errorMessage) => {
  if (!isValid) {
    field.style.border = "2px solid red";
    toast("error", errorMessage).showToast();
  } else {
    field.style.border = "";
  }
};

const validateEmail = (emailInput) => {
  const emailValue = emailInput.value.trim();
  const valid = isEmailValid(emailValue);
  validateField(emailInput, valid, "Invalid email format");
};
const validatePassword = (passwordInput) => {
  const passwordValue = passwordInput.value.trim();
  const valid = isPasswordStrong(passwordValue);
  validateField(
    passwordInput,
    valid,
    "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
  );
};

loginForm?.elements["email"].addEventListener("change", (e) =>
  validateEmail(e.target)
);
loginForm?.elements["password"].addEventListener("change", (e) =>
  validatePassword(e.target)
);

loginForm?.addEventListener("submit", async (e) => {
  try {
    e.preventDefault();
    const email = loginForm.elements["email"].value?.trim();
    const password = loginForm.elements["password"].value?.trim();

    if ([email, password].some((item) => item === "")) {
      toast("error", "All fields are required").showToast();
      return;
    }

    const user = await DbService.searchItemByIndex("users", "email", email);
    if (!user) {
      toast("error", "User not found").showToast();
      return;
    }

    const hashedPassword = await hashPassword(password);
    if (hashedPassword !== user.password) {
      toast("error", "Incorrect password").showToast();
      return;
    }

    toast("success", "Login successful").showToast();
    const u = {
      email: user.email,
      name: user.name,
      tel: user.tel,
      id: user.id,
      role: user.role,
      adhaar: user.adhaar,
    };

    setCurrentUser(u);
    goToPage("index");
  } catch (error) {
    console.error(error);
    toast("error", "Something went wrong").showToast();
  }
});
