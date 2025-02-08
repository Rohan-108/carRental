import { goToPage, toast, setCurrentCarId } from "./index.js";
import { cities } from "./utils.js";
import DbService from "./db.js";
const applyFiltersBtn = document.getElementById("applyFilters");
const toggleFilterBtn = document.getElementById("toggleFilter");
const filterPanel = document.getElementById("filterPanel");
const searchQuery = document.getElementById("search");
const city = document.getElementById("city");
const carType = document.getElementById("carType");
window.addEventListener("load", () => {
  setFilter();
  setCars();
  addEventListeners();
});

function setFilter() {
  cities.forEach((c) => {
    const option = document.createElement("option");
    option.value = c;
    option.text = c;
    city.appendChild(option);
  });
  toggleFilterBtn.addEventListener("click", function () {
    filterPanel.classList.toggle("active");
  });
  applyFiltersBtn.addEventListener("click", async function () {
    try {
      const carTypeValue = carType?.value;
      const cityValue = city?.value;
      const cars = await getCars();
      renderCars(cars, "carContainer");
      filterPanel.classList.remove("active");
    } catch (error) {
      console.log(error);
      toast("error", "Failed to apply filters").showToast();
    }
  });
}
async function setCars() {
  try {
    const cars = await DbService.searchAllByIndex("cars", "show", "true");
    if (cars.length !== 0) {
      renderCars(cars, "carContainer");
    }
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set car details").showToast();
  }
}
async function getCars(query) {
  try {
    let cars = await DbService.searchAllByIndex("cars", "show", "true");
    const carTypeValue = carType?.value;
    const cityValue = city?.value;
    if (carTypeValue !== "All") {
      cars = cars.filter((car) => car.vehicleType === carTypeValue);
    }
    if (cityValue !== "All") {
      cars = cars.filter((car) => car.location === cityValue);
    }
    if (query) {
      cars = cars.filter((car) =>
        car.name.toLowerCase().includes(query.toLowerCase())
      );
    }
    return cars;
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set car details").showToast();
  }
}
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
function renderCars(cars, id) {
  const carsContainer = document.getElementById(`${id}`);
  carsContainer.innerHTML = "";
  carsContainer.innerHTML = cars
    .map((car) => {
      let imgUrl = "https://picsum.photos/200/300";
      if (car.images[0] instanceof ArrayBuffer) {
        const blob = new Blob([car.images[0]]);
        imgUrl = URL.createObjectURL(blob);
      }
      return `<div class="carCard">
      <div class="details">
        <div class="thumb-gallery">
          <img
            class="first"
            src="${imgUrl}"
            alt="Bugatti Chiron"
          />
        </div>
        <div class="info">
          <h3>${car.name}</h3>
          <p class="car-type">${car.vehicleType}</p>
          <p class="car-type">Location: ${car.location}</p>
          <div class="price">
            <span>Base Price</span>
            <h4>Rs ${car.rentalPrice}/day</h4>
          </div>
          <div class="ctas">
            <button class="btn" data-id="${car.id}">More Details</button>
          </div>
        </div>
      </div>
    </div>`;
    })
    .join("");
}

function addEventListeners() {
  const carContainer = document.getElementById("carContainer");
  carContainer.addEventListener("click", (event) => {
    const button = event.target.closest(".btn");
    if (button && button.dataset.id) {
      const carId = button.dataset.id;
      setCurrentCarId(carId);
      goToPage("carDetail");
    }
  });
  const searchInput = document.getElementById("search");
  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce(async (event) => {
        const query = event.target.value?.trim();
        const cars = await getCars(query);
        renderCars(cars, "carContainer");
      }, 300)
    );
  }
}
