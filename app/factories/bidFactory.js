/**
 * @description Factory for Bid
 * @name bidFactory
 * @requires $q
 * @requires bidBookService
 * @requires utilService
 */
angular.module("rentIT").factory("bidFactory", [
  "$q",
  "bidBookService",
  "utilService",
  function ($q, bidBookService, utilService) {
    class Bid {
      constructor(bid) {
        this._id = bid?._id || null;
        this.startDate = bid?.startDate || null;
        this.endDate = bid?.endDate || null;
        this.amount = bid?.amount || 0;
        this.isOutStation = bid?.isOutStation || false;
        this.status = bid?.status || "pending";
        this.tripCompleted = bid?.tripCompleted || false;
        this.startOdometer = bid?.startOdometer || 0;
        this.finalOdometer = bid?.finalOdometer || 0;
      }

      /**
       * @description Add Bid to the given car
       * @param {Object} car - The car object to which the bid is to be added
       */
      addBid(car) {
        const deferred = $q.defer();
        if (!this.startDate || !this.endDate) {
          deferred.reject({ description: "Invalid date range." });
          return deferred.promise;
        }
        if (
          this.amount <
          (this.isOutStation ? car.rentalPriceOutStation : car.rentalPrice)
        ) {
          deferred.reject({
            description:
              "Amount should be greater than or equal to the rental price.",
          });
          return deferred.promise;
        }
        const ndays = utilService.getDaysDiff(this.startDate, this.endDate);
        if (
          ndays < Number(car.minRentalPeriod) ||
          ndays > Number(car.maxRentalPeriod)
        ) {
          deferred.reject({
            description:
              "Rent period should be between min and max rental period.",
          });
          return deferred.promise;
        }
        this.amount = this.isOutStation
          ? ndays * car.rentalPriceOutStation
          : ndays * car.rentalPrice;
        //final bid object
        const finalBid = {
          startDate: this.startDate,
          endDate: this.endDate,
          amount: this.amount,
          isOutStation: this.isOutStation,
          status: this.status,
          tripCompleted: this.tripCompleted,
        };
        bidBookService
          .addBid(finalBid, car._id)
          .then((response) => {
            deferred.resolve(response);
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }

      /**
       *@description Approve the bid
       */
      approveBid() {
        const deferred = $q.defer();
        console.log(this);
        if (this._id === null) {
          deferred.reject({ description: "Bid id is missing." });
          return deferred.promise;
        }
        if (this.status !== "pending") {
          deferred.reject({ description: "Bid is already approved/rejected." });
          return deferred.promise;
        }
        if (this.tripCompleted) {
          deferred.reject({ description: "Trip is already completed." });
          return deferred.promise;
        }
        bidBookService
          .approveBid(this._id)
          .then((response) => {
            deferred.resolve(response);
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }

      /**
       * @description Reject the bid
       */
      rejectBid() {
        const deferred = $q.defer();
        console.log(this);
        if (this._id === null) {
          deferred.reject({ description: "Bid id is missing." });
          return deferred.promise;
        }
        if (this.status !== "pending") {
          deferred.reject({ description: "Bid is already approved/rejected." });
          return deferred.promise;
        }
        if (this.tripCompleted) {
          deferred.reject({ description: "Trip is already completed." });
          return deferred.promise;
        }
        bidBookService
          .rejectBid(this._id)
          .then((response) => {
            deferred.resolve(response);
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }

      /**
       * @description Add odometer reading
       * @param {*} currentOdometer - current odometer reading
       * @param {*} type - start or final
       */
      addOdometerReading(currentOdometer, type) {
        const deferred = $q.defer();
        if (this._id === null) {
          deferred.reject({ description: "Booking id is missing." });
          return deferred.promise;
        }
        if (this.status !== "approved") {
          deferred.reject({ description: "Booking is not approved." });
          return deferred.promise;
        }
        if (this.tripCompleted) {
          deferred.reject({ description: "Trip is already completed." });
          return deferred.promise;
        }
        //assign and check the odometer reading
        if (type === "start") {
          this.startOdometer = currentOdometer;
        } else {
          this.finalOdometer = currentOdometer;
        }
        if (type !== "start" && this.startOdometer > this.finalOdometer) {
          deferred.reject({
            description:
              "Final Odometer reading should be greater than starting one.",
          });
          return deferred.promise;
        }
        //add the odometer reading
        bidBookService
          .addOdometerReading(this._id, currentOdometer, type)
          .then((response) => {
            deferred.resolve(response);
          })
          .catch((error) => {
            deferred.reject(error);
          });
        return deferred.promise;
      }

      /**
       * @description End the trip
       */
      endTrip() {
        const deferred = $q.defer();
        if (this._id === null) {
          deferred.reject({ description: "Booking id is missing." });
          return deferred.promise;
        }
        if (this.status !== "approved") {
          deferred.reject({ description: "Booking is not approved." });
          return deferred.promise;
        }
        if (this.tripCompleted) {
          deferred.reject({ description: "Trip is already completed." });
          return deferred.promise;
        }
        bidBookService
          .endTrip(this._id)
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
      createBid: function (bid) {
        return new Bid(bid);
      },
    };
  },
]);
