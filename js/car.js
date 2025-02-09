import { goToPage, toast, setCurrentCarId } from "./index.js";
import { cities, debounce } from "./utils.js";
import DbService from "./db.js";

let currentPage = 1;
const pageSize = 10;

const applyFiltersBtn = document.getElementById("applyFilters");
const clearFiltersBtn = document.getElementById("clearFilters");
const city = document.getElementById("city");
const carType = document.getElementById("carType");
const transmission = document.getElementById("transmission");
const fuelType = document.getElementById("fuelType");
window.addEventListener("load", async () => {
  setFilter();
  await setCars();
  addEventListeners();
});

function setFilter() {
  cities.forEach((c) => {
    const option = document.createElement("option");
    option.value = c;
    option.text = c;
    city.appendChild(option);
  });
  applyFiltersBtn.addEventListener("click", async function () {
    currentPage = 1;
    try {
      const cars = await getCars();
      renderCars(cars, "carContainer");
    } catch (error) {
      console.log(error);
      toast("error", "Failed to apply filters").showToast();
    }
  });
  clearFiltersBtn.addEventListener("click", async function () {
    try {
      city.value = "All";
      carType.value = "All";
      transmission.value = "All";
      fuelType.value = "All";
      currentPage = 1;
      const cars = await getCars();
      renderCars(cars, "carContainer");
    } catch (error) {
      console.log(error);
      toast("error", "Failed to clear filters").showToast();
    }
  });
}

async function setCars() {
  try {
    const cars = await getCars();
    if (cars && cars.length !== 0) {
      renderCars(cars, "carContainer");
    }
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set car details").showToast();
  }
}

async function getCars(query) {
  try {
    let cars;
    if (
      city.value === "All" &&
      carType.value === "All" &&
      transmission.value === "All" &&
      fuelType.value === "All" &&
      (!query || query === "")
    ) {
      const result = await DbService.getPaginatedItems("cars", {
        page: currentPage,
        pageSize,
        indexName: "show",
        direction: "next",
      });
      cars = result.data;
      renderPagination(result.totalPages, currentPage);
    } else {
      cars = await DbService.searchAllByIndex("cars", "show", "true");
      if (carType.value !== "All") {
        cars = cars.filter((car) => car.vehicleType === carType.value);
      }
      if (city.value !== "All") {
        cars = cars.filter((car) => car.location === city.value);
      }
      if (transmission.value !== "All") {
        cars = cars.filter((car) => car.transmission === transmission.value);
      }
      if (fuelType.value !== "All") {
        cars = cars.filter((car) => car.fuelType === fuelType.value);
      }
      if (query) {
        cars = cars.filter((car) =>
          car.name.toLowerCase().includes(query.toLowerCase())
        );
      }
      const totalItems = cars.length;
      const totalPages = Math.ceil(totalItems / pageSize);
      if (currentPage > totalPages) currentPage = totalPages;
      if (currentPage < 1) currentPage = 1;
      const start = (currentPage - 1) * pageSize;
      const paginatedCars = cars.slice(start, start + pageSize);
      renderPagination(totalPages, currentPage);
      return paginatedCars;
    }
    return cars;
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set car details").showToast();
  }
}

function renderCars(cars, id) {
  const carsContainer = document.getElementById(id);
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
              <img class="first" src="${imgUrl}" alt="${car.name}" />
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

function renderPagination(totalPages, current) {
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";
  if (totalPages <= 1) return;
  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.disabled = current <= 1;
  prevButton.addEventListener("click", async () => {
    currentPage = current - 1;
    const cars = await getCars();
    renderCars(cars, "carContainer");
  });
  const pageIndicator = document.createElement("span");
  pageIndicator.textContent = `Page ${current} of ${totalPages}`;
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.disabled = current >= totalPages;
  nextButton.addEventListener("click", async () => {
    currentPage = current + 1;
    const cars = await getCars();
    renderCars(cars, "carContainer");
  });
  paginationDiv.appendChild(prevButton);
  paginationDiv.appendChild(pageIndicator);
  paginationDiv.appendChild(nextButton);
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
        currentPage = 1;
        const query = event.target.value?.trim();
        const cars = await getCars(query);
        renderCars(cars, "carContainer");
      }, 300)
    );
  }
}
