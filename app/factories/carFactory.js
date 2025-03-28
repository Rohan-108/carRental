angular.module("rentIT").factory("carFactory", [
  "$q",
  "carService",
  function ($q, carService) {
    class Car {
      constructor(car) {
        this._id = car?._id || null;
        this.name = car?.name || "";
        this.images = car?.images || null;
        this.vehicleType = car?.vehicleType || "";
        this.seats = car?.seats || 0;
        this.transmission = car?.transmission || "";
        this.fuelType = car?.fuelType || "";
        this.plateNumber = car?.plateNumber || "";
        this.rentalPrice = car?.rentalPrice || 0;
        this.rentalPriceOutStation = car?.rentalPriceOutStation || 0;
        this.ratePerKm = car?.ratePerKm || 0;
        this.minRentalPeriod = car?.minRentalPeriod || 0;
        this.maxRentalPeriod = car?.maxRentalPeriod || 0;
        this.fixedKilometer = car?.fixedKilometer || 0;
        this.location = car?.location || "";
      }

      /**
       * @description Add car to the backend
       */
      addCar() {
        const deferred = $q.defer();
        const formData = new FormData();
        for (const key in this) {
          if (key === "images") {
            for (const i in this.images) {
              formData.append("images", this.images[i]);
            }
          } else if (key !== "_id") {
            formData.append(key, this[key]);
          }
        }

        carService
          .addCar(formData)
          .then((response) => {
            deferred.resolve(response);
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }

      /**
       * @description Update car in the backend
       * @param {*} editCarFormData - car object to be updated
       */
      updateCar(editCarFormData) {
        const deferred = $q.defer();
        const formData = new FormData();
        for (const key in editCarFormData) {
          if (key === "images") {
            for (const i in editCarFormData.images) {
              formData.append("images", editCarFormData.images[i]);
            }
          } else {
            formData.append(key, editCarFormData[key]);
          }
        }
        carService
          .updateCar(formData, this._id)
          .then((response) => {
            deferred.resolve(response);
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }
    }
    return {
      createCar: function (car) {
        return new Car(car);
      },
    };
  },
]);
