/**
 *@description This service is used to inject resources like CSS and JS files into the DOM.
 *@param {$q}
 *@param {$document}
 */
angular.module("rentIT").service("resourceInjector", [
  "$q",
  "$document",
  function ($q, $document) {
    /**
     * @description This function is used to load CSS files into the DOM.
     * @param {*} url
     * @returns {promise<void>}
     */
    this.loadCSS = function (url) {
      let deferred = $q.defer();
      let link = $document[0].createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.onload = function () {
        deferred.resolve(url);
      };
      link.onerror = function () {
        deferred.reject("Failed to load CSS: " + url);
      };
      $document[0].head.appendChild(link);
      return deferred.promise;
    };
    /**
     * @description This function is used to load JS files into the DOM.
     * @param {*} url
     * @returns {promise<void>}
     */
    this.loadJS = function (url) {
      let deferred = $q.defer();
      let script = $document[0].createElement("script");
      script.src = url;
      script.async = false; // Ensures the script is executed in order
      script.onload = function () {
        deferred.resolve(url);
      };
      script.onerror = function () {
        deferred.reject("Failed to load JS: " + url);
      };
      $document[0].head.appendChild(script);
      return deferred.promise;
    };
  },
]);
