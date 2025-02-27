const emailChecker = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; //for email

/**
 * @description: Directive to validate email
 */
angular.module("rentIT").directive("validEmail", function () {
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.validEmail = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return false;
        }
        if (emailChecker.test(viewValue)) {
          return true;
        }
        return false;
      };
    },
  };
});
