/**
 * @description This service is responsible for handling all the chart related operations.
 */

angular.module("rentIT").factory("chartService", [
  "DbService",
  function (DbService) {
    /**
     *
     * @param {*} items - array of items to be grouped
     * @param {*} keyAccessor - function to extract the key for grouping
     * @param {*} options - options object
     * @returns {Object}- grouped data
     */
    async function groupData(
      storeName,
      keyAccessor,
      indexName,
      direction,
      range,
      options = {}
    ) {
      const data = await DbService.getChartData(
        storeName,
        keyAccessor,
        indexName,
        direction,
        range,
        options
      );
      return data;
    }
    /**
     * @description Build chart data for general data
     * @param {*} groupedData
     * @param {*} datasetLabel
     * @returns {object} - chart data
     */
    function buildChartData(groupedData, datasetLabel) {
      const labels = Object.keys(groupedData);
      const dataValues = Object.values(groupedData);
      const numItems = labels.length;
      return {
        labels: labels,
        datasets: [
          {
            label: datasetLabel,
            data: dataValues,
            backgroundColor: generateRandomColors(numItems, 0.5),
            borderColor: generateRandomColors(numItems, 1),
            borderWidth: 1,
          },
        ],
      };
    }
    /**
     * @description Group data into two fields
     */
    async function groupDataBifarcate(
      storeName,
      keyAccessor,
      indexName,
      direction,
      range,
      options = {}
    ) {
      const data = await DbService.getChartDataBifarcate(
        storeName,
        keyAccessor,
        indexName,
        direction,
        range,
        options
      );
      return data;
    }
    /**
     * @description build data for the bifarcate
     * @param {Array<Object>} data
     * @returns {Object}
     */
    function buildChartDataBifarcate(data, label1, label2) {
      const labels = Object.keys(data.partTwo);
      const dataValuesOne = Object.values(data.partOne);
      const dataValuesTwo = Object.values(data.partTwo);
      return {
        labels: labels,
        datasets: [
          {
            label: label1,
            data: dataValuesOne,
            backgroundColor: "rgba(0, 255, 0, 0.5)",
          },
          {
            label: label2,
            data: dataValuesTwo,
            backgroundColor: "rgba(255, 0, 0, 0.5)",
          },
        ],
      };
    }
    // async function getComparisionData(
    //   days,
    //   indexName,
    //   direction,
    //   range,
    //   options = {}
    // ) {
    //   const data = await DbService.getComparisionData(
    //     "bids",
    //     days,
    //     indexName,
    //     direction,
    //     range,
    //     options
    //   );
    //   return data;
    // }
    /**
     * @description Generate random colors
     * @param {*} count - number of colors to generate
     * @param {*} opacity - opacity value
     * @returns {Array} - array of colors
     */
    function generateRandomColors(count, opacity) {
      const colors = [];
      for (let i = 0; i < count; i++) {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        colors.push(`rgba(${r}, ${g}, ${b}, ${opacity})`);
      }
      return colors;
    }
    return {
      groupData,
      buildChartData,
      groupDataBifarcate,
      buildChartDataBifarcate,
      //getComparisionData,
    };
  },
]);
