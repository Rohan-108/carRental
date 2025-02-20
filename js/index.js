const mobileBtn = document.getElementById("mobile-cta");
const nav = document.querySelector("nav");
const mobileBtnExit = document.getElementById("mobile-exit");
const rentitButton = document.getElementById("rentitButton");
const logout = document.getElementById("logoutLink");
//window onload
window.addEventListener("load", () => {
  handleNavbar();
  routeProtection();
});
//handle navbar
function handleNavbar() {
  const currentUser = getCurrentUser();
  const dashboardLink = document.getElementById("dashboardLink");
  const logoutLink = document.getElementById("logoutLink");
  const registerLink = document.getElementById("registerLink");
  const profileLink = document.getElementById("profileLink");
  const chatLink = document.getElementById("chatLink");
  const adminLink = document.getElementById("adminLink");
  if (currentUser) {
    if (currentUser.role == "admin") dashboardLink.style.display = "block";
    if (currentUser.role == "super-admin") {
      adminLink.style.display = "block";
    }
    profileLink.style.display = "block";
    chatLink.style.display = "block";
    logoutLink.style.display = "block";
    registerLink.style.display = "none";
  } else {
    dashboardLink.style.display = "none";
    logoutLink.style.display = "none";
    profileLink.style.display = "none";
    chatLink.style.display = "none";
    registerLink.style.display = "block";
  }
}
logout?.addEventListener("click", () => {
  sessionStorage.clear();
  goToPage("index");
});
mobileBtn?.addEventListener("click", () => {
  nav?.classList.add("menu-btn");
});
mobileBtnExit?.addEventListener("click", () => {
  nav?.classList.remove("menu-btn");
});
rentitButton?.addEventListener("click", () => {
  goToPage("cars");
});
//go to page
function goToPage(page) {
  let p = "";
  switch (page) {
    case "login":
      p = `/pages/login/login.html`;
      break;
    case "register":
      p = `/pages/register/register.html`;
      break;
    case "dashboard":
      p = `/pages/profile/dashboard.html`;
      break;
    case "admin":
      p = `/pages/super-admin/admin.html`;
      break;
    case "carAdmin":
      p = `/pages/car-admin/carAdmin.html`;
      break;
    case "cars":
      p = `/pages/cars/cars.html`;
      break;
    case "carDetail":
      p = `/pages/car-detail/carDetail.html`;
      break;
    case "chat":
      p = `/pages/chat/chat.html`;
      break;
    default:
      p = `/${page}.html`;
  }
  window.location.href = p;
}
//toast
function toast(type, message, duration) {
  return Toastify({
    text: message ? message : "Something went wrong",
    duration: duration ? duration : 3000,
    close: true,
    gravity: "bottom",
    position: "right",
    stopOnFocus: true,
    style: {
      background: type === "error" ? "red" : "green",
    },
    onClick: function () {},
  });
}
function getCurrentUser() {
  return JSON.parse(sessionStorage.getItem("currentUser")) || null;
}
function setCurrentUser(user) {
  sessionStorage.setItem("currentUser", JSON.stringify(user));
}
function removeCurrentUser() {
  sessionStorage.removeItem("currentUser");
}
function getCurrentCarId() {
  return JSON.parse(sessionStorage.getItem("carId"))?.carId || null;
}
function setCurrentCarId(carId) {
  sessionStorage.setItem("carId", JSON.stringify({ carId: carId }));
}
//route protection
function routeProtection() {
  const currentUser = getCurrentUser();
  const currentPage = window.location.href.split("/").pop().split(".")[0];
  try {
    if (!currentUser) {
      if (
        currentPage === "admin" ||
        currentPage === "dashboard" ||
        currentPage === "carAdmin"
      ) {
        goToPage("login");
        throw new Error("You are not authorized to access this page");
      }
    } else {
      if (currentPage === "admin" && currentUser.role !== "super-admin") {
        goToPage("index");
        throw new Error("You are not authorized to access this page");
      }
      if (currentPage === "carAdmin" && currentUser.role !== "admin") {
        goToPage("index");
        throw new Error("You are not authorized to access this page");
      }
      if (currentPage === "login" || currentPage === "register") {
        goToPage("index");
        throw new Error("You are already logged in");
      }
    }
  } catch (error) {
    toast("error", error?.message).showToast();
  }
}

//toast("error", "Failed to open database").showToast();
export {
  toast,
  goToPage,
  getCurrentUser,
  setCurrentUser,
  removeCurrentUser,
  getCurrentCarId,
  setCurrentCarId,
};
