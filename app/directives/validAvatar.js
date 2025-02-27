/**
 * @description Directive to validate avatar uploaded
 */
angular.module("rentIT").directive("validAvatar", function () {
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      // Listen for file selection changes
      elem.bind("change", function () {
        const file = elem[0].files[0];
        ctrl.$setViewValue(file);
      });

      // Define the custom validator
      ctrl.$validators.validAvatar = function (modelValue, viewValue) {
        const file = modelValue || viewValue;
        if (!file) {
          return true;
        }

        // Define allowed file types
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (allowedTypes.indexOf(file.type) === -1) {
          return false;
        }

        // Check file size (500KB = 500 * 1024 bytes)
        if (file.size > 500 * 1024) {
          return false;
        }
        return true;
      };
    },
  };
});
