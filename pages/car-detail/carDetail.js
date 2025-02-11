import DbService from "../../js/db.js";
import { getCurrentCarId, toast } from "../../js/index.js";

window.addEventListener("load", () => {
  setCarDetails();
});

async function setCarDetails() {
  const carId = getCurrentCarId();
  console.log("Car ID:", carId);
  if (!carId) {
    console.log("No car ID found in local storage.");
    return;
  }

  try {
    const car = await DbService.getItem("cars", carId);
    if (!car) {
      console.log("Car not found.");
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

    if (car.userId) {
      const owner = await DbService.getItem("users", car.userId);
      if (owner) {
        document.getElementById("ownerName").textContent = owner.name;
        document.getElementById("ownerEmail").textContent = owner.email;
        document.getElementById("ownerPhone").textContent = owner.tel;
      }
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
