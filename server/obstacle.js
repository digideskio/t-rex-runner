var Utils = require('./utils');
var Runner = require('./runner');

var Obstacle = function () {
    this.typeIndex = Utils.getRandomNum(0, this.types.length - 1);
    this.typeConfig = this.types[this.typeIndex];
    this.size = Utils.getRandomNum(1, this.MAX_OBSTACLE_LENGTH);
    this.width = this.typeConfig.width * this.size;
}

Obstacle.prototype = {
    /**
     * Maximum obstacle grouping count.
     * @const
     */
    MAX_OBSTACLE_LENGTH: 3,
    /**
     * Coefficient for calculating the maximum gap.
     * @const
     */
    MAX_GAP_COEFFICIENT: 1.5,
    /**
     * Obstacle definitions.
     * minGap: minimum pixel space betweeen obstacles.
     * multipleSpeed: Speed at which multiples are allowed.
     */
    types: [
        {
            type: 'CACTUS_SMALL',
            className: ' cactus cactus-small ',
            width: 17,
            height: 35,
            yPos: 105,
            multipleSpeed: 3,
            minGap: 120
        }, {
            type: 'CACTUS_LARGE',
            className: ' cactus cactus-large ',
            width: 25,
            height: 50,
            yPos: 90,
            multipleSpeed: 6,
            minGap: 120
        }
    ],
    /**
     * Calculate a random gap size.
     * - Minimum gap gets wider as speed increses
     * @param {number} gapCoefficient
     * @param {number} speed
     * @return {number} The gap size.
     */
    getGap: function () {
        var minGap = Math.round(this.width * Runner.SPEED +
            this.typeConfig.minGap * Runner.GAP_COEFFICIENT);
        var maxGap = Math.round(minGap * this.MAX_GAP_COEFFICIENT);
        return Utils.getRandomNum(minGap, maxGap);
    },
};

module.exports = Obstacle;