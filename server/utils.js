var Utils = {

  /**
   * Get random number.
   * @param {number} min
   * @param {number} max
   * @return {number}
   */
  getRandomNum: function (min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
  }

}

module.exports = Utils;