//signup form
import { goToPage, setCurrentUser, toast } from "./index.js";
import DbService from "./db.js";
import {
  isEmailValid,
  isPasswordStrong,
  hashPassword,
  getFileFromInput,
} from "./utils.js";
const signUpForm = document.getElementById("register");

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
        "Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number and one special character"
      ).showToast();
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
