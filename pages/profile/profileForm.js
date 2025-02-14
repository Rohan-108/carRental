import UserService from "../../js/services/userService.js";
import { setCurrentUser, getCurrentUser, toast } from "../../js/index.js";
import { UserValidator } from "../../js/services/validator.js";
import { getFileFromInput, hashPassword } from "../../js/utils.js";
import { setUserDetail } from "./dashboard.js";
// Get DOM elements
const passForm = document.getElementById("changePasswordForm");
const editProfileForm = document.getElementById("editProfileForm");
const editProfileBtn = document.getElementById("editProfileBtn");
const editCloseBtn = document.getElementById("editCloseButton");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const changePasswordModal = document.getElementById("changePasswordModal");
const passCloseButton = document.getElementById("passCloseButton");
const profileModal = document.getElementById("profileModal");

const validator = UserValidator();

// ------------------- OnChange Validations -------------------
// Validate new password on change
passForm.elements["newPassword"].addEventListener("change", (e) =>
  validator.validatePassword(e.target)
);
// Validate confirm password (compared against new password)
passForm.elements["confirmPassword"].addEventListener("change", (e) =>
  validator.validateConfirmPassword(e.target, passForm.elements["newPassword"])
);
// Validate phone field on change
editProfileForm.elements["phone"].addEventListener("change", (e) =>
  validator.validatePhone(e.target)
);
// Validate avatar file on change
editProfileForm.elements["avatar"].addEventListener("change", (e) =>
  validator.validateAvatar(e.target)
);

// ------------------- UI Event Listeners -------------------
/**
 * Initializes modal open/close event listeners.
 */
function initEventListeners() {
  // Close change password modal
  passCloseButton.addEventListener("click", () => {
    changePasswordModal.style.display = "none";
  });
  // Open change password modal
  changePasswordBtn.addEventListener("click", () => {
    changePasswordModal.style.display = "flex";
  });
  // Close profile modal
  editCloseBtn.addEventListener("click", () => {
    profileModal.style.display = "none";
  });
  // Open profile modal and load current user details
  editProfileBtn.addEventListener("click", async () => {
    try {
      const currentUser = getCurrentUser();
      const user = await UserService.getUserById(currentUser.id);
      editProfileForm.elements["name"].value = user.name;
      editProfileForm.elements["phone"].value = user.tel;
      profileModal.style.display = "block";
    } catch (error) {
      console.error(error);
      toast("error", "Failed to load profile data").showToast();
    }
  });
}

// ------------------- Change Password Form -------------------
passForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    // Extract values using FormData API
    const formData = new FormData(passForm);
    const oldPassword = formData.get("oldPassword").trim();
    const newPassword = formData.get("newPassword").trim();
    const confirmPassword = formData.get("confirmPassword").trim();

    const newPasswordInput = passForm.elements["newPassword"];
    const confirmPasswordInput = passForm.elements["confirmPassword"];

    // Validate new password and confirm password fields
    if (!validator.validatePassword(newPasswordInput)) return;
    if (
      !validator.validateConfirmPassword(confirmPasswordInput, newPasswordInput)
    )
      return;
    if (newPassword !== confirmPassword) {
      toast(
        "error",
        "New password and confirm password do not match"
      ).showToast();
      return;
    }

    const currentUser = getCurrentUser();
    const user = await UserService.getUserById(currentUser.id);

    // Check if old password is correct and new password is different
    if (user.password !== (await hashPassword(oldPassword))) {
      toast("error", "Old password is incorrect").showToast();
      return;
    }
    if (user.password === (await hashPassword(newPassword))) {
      toast("error", "New password cannot be same as old password").showToast();
      return;
    }

    // Update password
    const hashedPassword = await hashPassword(newPassword);
    await UserService.updateUser({
      id: currentUser.id,
      password: hashedPassword,
    });
    toast("success", "Password changed successfully").showToast();
    passForm.reset();
    changePasswordModal.style.display = "none";
  } catch (error) {
    console.error(error);
    toast("error", "Failed to change password").showToast();
  }
});

// ------------------- Edit Profile Form -------------------
editProfileForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    // Extract values using FormData API
    const formData = new FormData(editProfileForm);
    const name = formData.get("name").trim();
    const phone = formData.get("phone").trim();

    // Validate phone field
    const phoneInput = editProfileForm.elements["phone"];
    if (!validator.validatePhone(phoneInput)) return;

    // Process avatar if provided; else use existing avatar
    let avatarData;
    const currentUser = getCurrentUser();
    const user = await UserService.getUserById(currentUser.id);
    avatarData = user.avatar;
    const avatarInput = editProfileForm.elements["avatar"];
    if (avatarInput && avatarInput.files[0]) {
      if (!validator.validateAvatar(avatarInput)) return;
      avatarData = await getFileFromInput(avatarInput);
    }

    // Update user profile
    await UserService.updateUser({
      id: currentUser.id,
      name,
      tel: phone,
      avatar: avatarData,
    });
    const updatedUser = await UserService.getUserById(currentUser.id);
    setCurrentUser(updatedUser);
    await setUserDetail();
    profileModal.style.display = "none";
  } catch (error) {
    console.error(error);
    toast("error", "Failed to update profile").showToast();
  }
});

// Initialize modal event listeners
initEventListeners();
