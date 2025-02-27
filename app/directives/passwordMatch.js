/**
 * @description Directive to validate password match
 */
angular.module("rentIT").directive("passwordMatch", function () {
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      ctrl.$validators.passwordMatch = function (modelValue, viewValue) {
        if (ctrl.$isEmpty(modelValue)) {
          return false;
        }
        if (viewValue === scope.$eval(attrs.passwordMatch)) {
          return true;
        }
        return false;
      };
    },
  };
});
