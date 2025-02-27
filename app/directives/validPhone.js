/**
 * @description Directive to validate phone number
 */
angular.module("rentIT").directive("validPhone", function () {
  const phoneChecker = /^[0-9]{10}$/; //for phone number
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.validPhone = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return true;
        }
        if (phoneChecker.test(viewValue)) {
          return true;
        }
        return false;
      };
    },
  };
});
