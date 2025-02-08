import { goToPage, setCurrentUser, toast } from "./index.js";
import { hashPassword } from "./utils.js";
import DbService from "./db.js";
const loginForm = document.getElementById("login");

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
