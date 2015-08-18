var Utils = require('./Utils');
var Constants = require('./Constants');

/**
 * Cloud background item.
 * Similar to an obstacle object but without collision boxes.
 * @param {HTMLCanvasElement} canvas Canvas element.
 * @param {Image} cloudImg
 * @param {number} containerWidth
 */
function Cloud(canvas, cloudImg, containerWidth) {
    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext('2d');
    this.image = cloudImg;
    this.containerWidth = containerWidth;
    this.xPos = containerWidth;
    this.yPos = 0;
    this.remove = false;
    this.cloudGap = Utils.getRandomNum(Cloud.config.MIN_CLOUD_GAP,
        Cloud.config.MAX_CLOUD_GAP);
    this.init();
};

/**
 * Cloud object config.
 * @enum {number}
 */
Cloud.config = {
    HEIGHT: 13,
    MAX_CLOUD_GAP: 400,
    MAX_SKY_LEVEL: 30,
    MIN_CLOUD_GAP: 100,
    MIN_SKY_LEVEL: 71,
    WIDTH: 46
};
Cloud.prototype = {
    /**
     * Initialise the cloud. Sets the Cloud height.
     */
    init: function() {
        this.yPos = Utils.getRandomNum(Cloud.config.MAX_SKY_LEVEL,
            Cloud.config.MIN_SKY_LEVEL);
        this.draw();
    },
    /**
     * Draw the cloud.
     */
    draw: function() {
        this.canvasCtx.save();
        var sourceWidth = Cloud.config.WIDTH;
        var sourceHeight = Cloud.config.HEIGHT;

        if (Constants.IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }
        this.canvasCtx.drawImage(this.image, 0, 0,
            sourceWidth, sourceHeight,
            this.xPos, this.yPos,
            Cloud.config.WIDTH, Cloud.config.HEIGHT);
        this.canvasCtx.restore();
    },
    /**
     * Update the cloud position.
     * @param {number} speed
     */
    update: function(speed) {
        if (!this.remove) {
            this.xPos -= Math.ceil(speed);
            this.draw();

            // Mark as removeable if no longer in the canvas.
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    },
    /**
     * Check if the cloud is visible on the stage.
     * @return {boolean}
     */
    isVisible: function() {
        return this.xPos + Cloud.config.WIDTH > 0;
    }
};

module.exports = Cloud;