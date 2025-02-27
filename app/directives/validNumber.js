/**
 * @description Directive to validate the number and check if it is in the range of min and max
 */

angular.module("rentIT").directive("validNumber", function () {
  const INTEGER_REGEXP = /^-?\d+$/;
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.validNumber = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return false;
        }
        if (
          INTEGER_REGEXP.test(viewValue) &&
          viewValue >= Number(attrs.min) &&
          viewValue <= Number(attrs.max)
        ) {
          return true;
        }
        return false;
      };
    },
  };
});
