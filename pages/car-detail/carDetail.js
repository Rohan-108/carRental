import carService from "../../js/services/carService.js";
import { getCurrentCarId, toast } from "../../js/index.js";

window.addEventListener("load", async () => {
  try {
    showLoader();
    await setCarDetails();
  } catch (error) {
  } finally {
    setTimeout(() => hideLoader(), 500);
  }
});

/**
 * @description Fetches car details from the database and sets the values in the DOM.
 * @returns {Promise<void>}
 */
async function setCarDetails() {
  try {
    const carId = getCurrentCarId();
    if (!carId) {
      toast("error", "Car not found").showToast();
      return;
    }
    const car = await carService.getCarById(carId);
    if (!car) {
      toast("error", "Car not found").showToast();
      return;
    }

    document.getElementById("carName").textContent = car.name;
    document.getElementById(
      "carPrice"
    ).textContent = `Rs ${car.rentalPrice}/day`;
    document.getElementById("carSeats").textContent = car.seats;
    document.getElementById("carFuel").textContent = car.fuelType;
    document.getElementById("carTransmission").textContent = car.transmission;
    document.getElementById("carType").textContent = car.vehicleType;

    if (car.owner) {
      document.getElementById("ownerName").textContent = car.owner.name;
      document.getElementById("ownerEmail").textContent = car.owner.email;
      document.getElementById("ownerPhone").textContent = car.owner.tel;
    }
    // Set car images and thnumbnails in the DOM
    const mainImage = document.getElementById("mainImage");
    const thumbnailContainer = document.getElementById("thumbnailContainer");
    if (car.images && car.images.length > 0) {
      let imgUrl = "https://picsum.photos/200/300";
      if (car.images[0] instanceof ArrayBuffer) {
        const blob = new Blob([car.images[0]]);
        imgUrl = URL.createObjectURL(blob);
      }
      mainImage.src = imgUrl;
      car.images.forEach((image, index) => {
        let imgUrl = "https://picsum.photos/200/300";
        if (image instanceof ArrayBuffer) {
          const blob = new Blob([image]);
          imgUrl = URL.createObjectURL(blob);
        }
        const img = document.createElement("img");
        img.src = imgUrl;
        img.classList.add("thumbnail");
        img.alt = `Car image ${index + 1}`;
        // Change the main image when a thumbnail is clicked
        img.addEventListener("click", () => {
          mainImage.classList.remove("fade-in");
          mainImage.classList.add("fade-out");

          setTimeout(() => {
            mainImage.src = imgUrl;
            mainImage.classList.remove("fade-out");
            mainImage.classList.add("fade-in");
          }, 500);
        });
        thumbnailContainer.appendChild(img);
      });
    }
  } catch (error) {
    console.error("Error fetching car details:", error);
    toast("error", "Error fetching car details").showToast();
  }
}
/**
 * @description Shows a loader on the page
 */
function showLoader() {
  const main = document.querySelector(".carDetailContainer");
  const loader = document.createElement("div");
  loader.className = "loader-overlay";
  loader.innerHTML = "<div class='loader'></div>";
  main.appendChild(loader);
}
/**
 * @description Hides the loader from the page
 */
function hideLoader() {
  const loader = document.querySelector(".loader-overlay");
  if (loader) loader.remove();
}
export { showLoader, hideLoader };
