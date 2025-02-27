/**
 * @description: Directive to validate Adhaar number
 */
angular.module("rentIT").directive("validAdhaar", function () {
  const adhaarChecker = /^[0-9]{12}$/; //for phone number
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.validAdhaar = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return true;
        }
        if (adhaarChecker.test(viewValue)) {
          return true;
        }
        return false;
      };
    },
  };
});
