/**
 * @description Directive to validate the plate number
 */

const PlateNumberRegex =
  /^[A-Z]{2}[ -][0-9]{1,2}(?: [A-Z])?(?: [A-Z]*)? [0-9]{4}$/;
angular.module("rentIT").directive("validPlate", function () {
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.validPlate = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return false;
        }
        if (PlateNumberRegex.test(viewValue)) {
          return true;
        }
        return false;
      };
    },
  };
});
