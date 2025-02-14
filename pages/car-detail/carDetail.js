import carService from "../../js/services/carService.js";
import { getCurrentCarId, toast } from "../../js/index.js";

window.addEventListener("load", () => {
  setCarDetails();
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
