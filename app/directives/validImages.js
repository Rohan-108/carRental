/**
 * @directive validImages
 * @description This directive is used to validate the images uploaded by the user. It checks the number of images uploaded, the file type, and the file size.
 */
angular.module("rentIT").directive("validImages", function () {
  return {
    restrict: "A",
    require: "ngModel",
    link: function (scope, elem, attrs, ctrl) {
      elem.bind("change", function () {
        const files = elem[0].files;
        ctrl.$setViewValue(files);
      });
      ctrl.$validators.validImages = function (modelValue, viewValue) {
        const files = modelValue || viewValue;
        if (!files || !files.length) {
          return true;
        }

        // Define allowed file types
        const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
        if (
          files.length > 3 ||
          files.length <= 0 ||
          Array.from(files).some((file) => !allowedTypes.includes(file.type))
        ) {
          return false;
        }

        // Check file size (500KB = 500 * 1024 bytes)
        if (Array.from(files).some((file) => file.size > 500 * 1024)) {
          return false;
        }
        return true;
      };
    },
  };
});
