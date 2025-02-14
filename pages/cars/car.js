import { goToPage, toast, setCurrentCarId } from "../../js/index.js";
import { cities, debounce } from "../../js/utils.js";
import carService from "../../js/services/carService.js";

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
/**
 * @description Set filters for cars
 */
function setFilter() {
  cities.forEach((c) => {
    const option = document.createElement("option");
    option.value = c;
    option.text = c;
    city.appendChild(option);
  });
  applyFiltersBtn.addEventListener("click", async function () {
    showLoader();
    currentPage = 1;
    try {
      const cars = await getCars();
      renderCars(cars, "carContainer");
    } catch (error) {
      console.log(error);
      toast("error", "Failed to apply filters").showToast();
    } finally {
      hideLoader();
    }
  });
  clearFiltersBtn.addEventListener("click", async function () {
    showLoader();
    try {
      city.value = "All";
      carType.value = "All";
      transmission.value = "All";
      fuelType.value = "All";
      currentPage = 1;
      const rangeInput = document.querySelectorAll(".range-input input");
      const rangePrice = document.querySelectorAll(".range-price input");
      rangeInput[0].value = 0;
      rangeInput[1].value = 10000;
      rangePrice[0].value = 0;
      rangePrice[1].value = 10000;
      const cars = await getCars();
      renderCars(cars, "carContainer");
    } catch (error) {
      console.log(error);
      toast("error", "Failed to clear filters").showToast();
    } finally {
      hideLoader();
    }
  });
  //range slider logic
  let rangeMin = 500;
  const range = document.querySelector(".range-selected");
  const rangeInput = document.querySelectorAll(".range-input input");
  const rangePrice = document.querySelectorAll(".range-price input");

  rangeInput.forEach((input) => {
    input.addEventListener("input", (e) => {
      let minRange = parseInt(rangeInput[0].value);
      let maxRange = parseInt(rangeInput[1].value);
      if (maxRange - minRange < rangeMin) {
        if (e.target.className === "min") {
          rangeInput[0].value = maxRange - rangeMin;
        } else {
          rangeInput[1].value = minRange + rangeMin;
        }
      } else {
        rangePrice[0].value = minRange;
        rangePrice[1].value = maxRange;
        range.style.left = (minRange / rangeInput[0].max) * 100 + "%";
        range.style.right = 100 - (maxRange / rangeInput[1].max) * 100 + "%";
      }
    });
  });

  rangePrice.forEach((input) => {
    input.addEventListener("input", (e) => {
      let minPrice = rangePrice[0].value;
      let maxPrice = rangePrice[1].value;
      if (maxPrice - minPrice >= rangeMin && maxPrice <= rangeInput[1].max) {
        if (e.target.className === "min") {
          rangePrice[0].value = minPrice;
          rangeInput[0].value = minPrice;
          range.style.left = (minPrice / rangeInput[0].max) * 100 + "%";
        } else {
          rangePrice[1].value = maxPrice;
          rangeInput[1].value = maxPrice;
          range.style.right = 100 - (maxPrice / rangeInput[1].max) * 100 + "%";
        }
      }
    });
  });
}
/**
 * @description Set cars intially
 */
async function setCars() {
  showLoader();
  try {
    const cars = await getCars();
    if (cars && cars.length !== 0) {
      renderCars(cars, "carContainer");
    }
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set car details").showToast();
  } finally {
    hideLoader();
  }
}

/**
 * @description Get cars based on filters
 * @param {*} query
 * @returns
 */
async function getCars(query) {
  try {
    const rangeInput = document.querySelectorAll(".range-input input");
    const minPrice = parseInt(rangeInput[0].value);
    const maxPrice = parseInt(rangeInput[1].value);
    const filterFunction = (car) => {
      if (city.value !== "All" && car.location !== city.value) return false;
      if (carType.value !== "All" && car.vehicleType !== carType.value)
        return false;
      if (
        transmission.value !== "All" &&
        car.transmission !== transmission.value
      )
        return false;
      if (fuelType.value !== "All" && car.fuelType !== fuelType.value)
        return false;
      if (car.rentalPrice < minPrice || car.rentalPrice > maxPrice)
        return false;
      if (query && !car.name.toLowerCase().includes(query.toLowerCase()))
        return false;
      return true;
    };
    const result = await carService.getPagedCars(
      { page: currentPage, pageSize, indexName: "show", direction: "next" },
      filterFunction
    );
    renderPagination(result.totalPages, currentPage);
    return result.data;
  } catch (error) {
    console.error(error);
    toast("error", "Failed to set car details").showToast();
  }
}
/**
 * @description Render cars
 * @param {*} cars
 * @param {*} id
 * @returns
 */
function renderCars(cars, id) {
  const carsContainer = document.getElementById(id);
  carsContainer.innerHTML = "";
  if (cars.length === 0) {
    carsContainer.innerHTML = `<div>No cars found</div>`;
    return;
  }
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

/**
 * @description Render pagination
 * @param {*} totalPages
 * @param {*} current
 * @returns
 */
function renderPagination(totalPages, current) {
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML = "";
  if (totalPages <= 1) return;
  const prevButton = document.createElement("button");
  prevButton.textContent = "Previous";
  prevButton.disabled = current <= 1;
  prevButton.addEventListener("click", async () => {
    showLoader();
    try {
      currentPage = current - 1;
      const cars = await getCars();
      renderCars(cars, "carContainer");
    } catch (error) {
      toast("error", "Failed to load previous page").showToast();
    } finally {
      hideLoader();
    }
  });
  const pageIndicator = document.createElement("span");
  pageIndicator.textContent = `Page ${current} of ${totalPages}`;
  const nextButton = document.createElement("button");
  nextButton.textContent = "Next";
  nextButton.disabled = current >= totalPages;
  nextButton.addEventListener("click", async () => {
    showLoader();
    try {
      currentPage = current + 1;
      const cars = await getCars();
      renderCars(cars, "carContainer");
    } catch (error) {
      toast("error", "Failed to load next page").showToast();
    } finally {
      hideLoader();
    }
  });
  paginationDiv.appendChild(prevButton);
  paginationDiv.appendChild(pageIndicator);
  paginationDiv.appendChild(nextButton);
}

/**
 * @description Add event listeners
 */
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
        try {
          showLoader();
          currentPage = 1;
          const query = event.target.value?.trim();
          const cars = await getCars(query);
          renderCars(cars, "carContainer");
        } catch (error) {
          toast("error", "Failed to search").showToast();
        } finally {
          hideLoader();
        }
      }, 300)
    );
  }
}

// Loader
function showLoader() {
  const mainContainer = document.getElementById("carContainer");
  const loader = document.createElement("div");
  loader.className = "loader-overlay";
  loader.innerHTML = "<div class='loader'></div>";
  mainContainer.appendChild(loader);
}
function hideLoader() {
  const loader = document.querySelector(".loader-overlay");
  if (loader) loader.remove();
}
