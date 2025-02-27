const passChecker = /^(?=.*\d)(?=.*[!@#$%^&*])(?=.*[a-z])(?=.*[A-Z]).{8,}$/; //for strong password

/**
 * @description: Directive to validate strong password
 */
angular.module("rentIT").directive("strongPassword", function () {
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.strongPassword = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return false;
        }
        if (passChecker.test(viewValue)) {
          return true;
        }
        return false;
      };
    },
  };
});
