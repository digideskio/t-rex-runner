(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var Browser = {};

Browser.detect = function () {
    var ua = navigator.userAgent, tem,
    M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i) || [];
    if(/trident/i.test(M[1])){
        tem =  /\brv[ :]+(\d+)/g.exec(ua) || [];
        return 'IE '+(tem[1] || '');
    }
    if(M[1] === 'Chrome'){
        tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
        if(tem != null) return tem.slice(1).join(' ').replace('OPR', 'Opera');
    }
    M = M[2]? [M[1], M[2]]: [navigator.appName, navigator.appVersion, '-?'];
    if((tem = ua.match(/version\/(\d+)/i)) != null)
        M.splice(1, 1, tem[1]);

    return M;
};

module.exports = Browser;
},{}],2:[function(require,module,exports){
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
},{"./Constants":4,"./Utils":13}],3:[function(require,module,exports){
/**
 * Collision box object.
 * @param {number} x X position.
 * @param {number} y Y Position.
 * @param {number} w Width.
 * @param {number} h Height.
 */
function CollisionBox(x, y, w, h) {
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
};

module.exports = CollisionBox;
},{}],4:[function(require,module,exports){
module.exports = {
  /**
   * Default game width.
   */
  DEFAULT_WIDTH: 600,
  DEFAULT_HEIGHT: 150,
  /**
   * Frames per second.
   */
  FPS: 60,
  IS_HIDPI: window.devicePixelRatio > 1,
  IS_MOBILE: window.navigator.userAgent.indexOf('Mobi') > -1,
  IS_TOUCH_ENABLED: 'ontouchstart' in window,
  BOTTOM_PAD: 10,
}
},{}],5:[function(require,module,exports){
var Constants = require('./Constants');

/**
 * Handles displaying the distance meter.
 * @param {!HTMLCanvasElement} canvas
 * @param {!HTMLImage} spriteSheet Image sprite.
 * @param {number} canvasWidth
 * @constructor
 */
function DistanceMeter(canvas, spriteSheet, canvasWidth) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.image = spriteSheet;
    this.x = 0;
    this.y = 5;
    this.currentDistance = 0;
    this.maxScore = 0;
    this.highScore = 0;
    this.container = null;
    this.digits = [];
    this.acheivement = false;
    this.defaultString = '';
    this.flashTimer = 0;
    this.flashIterations = 0;
    this.config = DistanceMeter.config;
    this.init(canvasWidth);
};

/**
 * @enum {number}
 */
DistanceMeter.dimensions = {
    WIDTH: 10,
    HEIGHT: 13,
    DEST_WIDTH: 11
};
/**
 * Y positioning of the digits in the sprite sheet.
 * X position is always 0.
 * @type {array.<number>}
 */
DistanceMeter.yPos = [0, 13, 27, 40, 53, 67, 80, 93, 107, 120];

/**
 * Distance meter config.
 * @enum {number}
 */
DistanceMeter.config = {
    // Number of digits.
    MAX_DISTANCE_UNITS: 5,
    // Distance that causes achievement animation.
    ACHIEVEMENT_DISTANCE: 100,
    // Used for conversion from pixel distance to a scaled unit.
    COEFFICIENT: 0.025,

    // Flash duration in milliseconds.
    FLASH_DURATION: 1000 / 4,
    // Flash iterations for achievement animation.
    FLASH_ITERATIONS: 3
};
DistanceMeter.prototype = {
    /**
     * Initialise the distance meter to '00000'.
     * @param {number} width Canvas width in px.
     */
    init: function(width) {
        var maxDistanceStr = '';

        this.calcXPos(width);
        this.maxScore = this.config.MAX_DISTANCE_UNITS;
        for (var i = 0; i < this.config.MAX_DISTANCE_UNITS; i++) {
            this.draw(i, 0);
            this.defaultString += '0';
            maxDistanceStr += '9';
        }
        this.maxScore = parseInt(maxDistanceStr);
    },
    /**
     * Calculate the xPos in the canvas.
     * @param {number} canvasWidth
     */
    calcXPos: function(canvasWidth) {
        this.x = canvasWidth - (DistanceMeter.dimensions.DEST_WIDTH *
            (this.config.MAX_DISTANCE_UNITS + 1));
    },
    /**
     * Draw a digit to canvas.
     * @param {number} digitPos Position of the digit.
     * @param {number} value Digit value 0-9.
     * @param {boolean} opt_highScore Whether drawing the high score.
     */
    draw: function(digitPos, value, opt_highScore) {
        var sourceWidth = DistanceMeter.dimensions.WIDTH;
        var sourceHeight = DistanceMeter.dimensions.HEIGHT;
        var sourceX = DistanceMeter.dimensions.WIDTH * value;

        var targetX = digitPos * DistanceMeter.dimensions.DEST_WIDTH;
        var targetY = this.y;
        var targetWidth = DistanceMeter.dimensions.WIDTH;
        var targetHeight = DistanceMeter.dimensions.HEIGHT;
        // For high DPI we 2x source values.
        if (Constants.IS_HIDPI) {
            sourceWidth *= 2;
            sourceHeight *= 2;
            sourceX *= 2;
        }
        this.canvasCtx.save();
        if (opt_highScore) {
            // Left of the current score.
            var highScoreX = this.x - (this.config.MAX_DISTANCE_UNITS * 2) *
                DistanceMeter.dimensions.WIDTH;
            this.canvasCtx.translate(highScoreX, this.y);
        } else {
            this.canvasCtx.translate(this.x, this.y);
        }

        this.canvasCtx.drawImage(this.image, sourceX, 0,
            sourceWidth, sourceHeight,
            targetX, targetY,
            targetWidth, targetHeight
        );
        this.canvasCtx.restore();
    },
    /**
     * Covert pixel distance to a 'real' distance.
     * @param {number} distance Pixel distance ran.
     * @return {number} The 'real' distance ran.
     */
    getActualDistance: function(distance) {
        return distance ?
            Math.round(distance * this.config.COEFFICIENT) : 0;
    },
    /**
     * Update the distance meter.
     * @param {number} deltaTime
     * @param {number} distance
     * @return {boolean} Whether the acheivement sound fx should be played.
     */
    update: function(deltaTime, distance) {
        var paint = true;
        var playSound = false;

        if (!this.acheivement) {
            distance = this.getActualDistance(distance);
            if (distance > 0) {
                // Acheivement unlocked
                if (distance % this.config.ACHIEVEMENT_DISTANCE == 0) {
                    // Flash score and play sound.
                    this.acheivement = true;
                    this.flashTimer = 0;
                    playSound = true;
                }
                // Create a string representation of the distance with leading 0.
                var distanceStr = (this.defaultString +
                    distance).substr(-this.config.MAX_DISTANCE_UNITS);
                this.digits = distanceStr.split('');
            } else {
                this.digits = this.defaultString.split('');
            }
        } else {
            // Control flashing of the score on reaching acheivement.
            if (this.flashIterations <= this.config.FLASH_ITERATIONS) {
                this.flashTimer += deltaTime;
                if (this.flashTimer < this.config.FLASH_DURATION) {
                    paint = false;
                } else if (this.flashTimer >
                    this.config.FLASH_DURATION * 2) {
                    this.flashTimer = 0;
                    this.flashIterations++;
                }
            } else {
                this.acheivement = false;
                this.flashIterations = 0;
                this.flashTimer = 0;
            }
        }

        // Draw the digits if not flashing.
        if (paint) {
            for (var i = this.digits.length - 1; i >= 0; i--) {
                this.draw(i, parseInt(this.digits[i]));
            }
        }
        this.drawHighScore();
        return playSound;
    },
    /**
     * Draw the high score.
     */
    drawHighScore: function() {
        this.canvasCtx.save();
        this.canvasCtx.globalAlpha = .8;
        for (var i = this.highScore.length - 1; i >= 0; i--) {
            this.draw(i, parseInt(this.highScore[i], 10), true);
        }
        this.canvasCtx.restore();
    },

    /**
     * Set the highscore as a array string.
     * Position of char in the sprite: H - 10, I - 11.
     * @param {number} distance Distance ran in pixels.
     */
    setHighScore: function(distance) {
        distance = this.getActualDistance(distance);
        var highScoreStr = (this.defaultString +
            distance).substr(-this.config.MAX_DISTANCE_UNITS);
        this.highScore = ['10', '11', ''].concat(highScoreStr.split(''));
    },
    /**
     * Reset the distance meter back to '00000'.
     */
    reset: function() {
        this.update(0);
        this.acheivement = false;
    }
};

module.exports = DistanceMeter;
},{"./Constants":4}],6:[function(require,module,exports){
var Constants = require('./Constants');

/**
 * Game over panel.
 * @param {!HTMLCanvasElement} canvas
 * @param {!HTMLImage} textSprite
 * @param {!HTMLImage} restartImg
 * @param {!Object} dimensions Canvas dimensions.
 * @constructor
 */
function GameOverPanel(canvas, textSprite, restartImg, dimensions) {
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.canvasDimensions = dimensions;
    this.textSprite = textSprite;
    this.restartImg = restartImg;
    this.draw();
};
/**
 * Dimensions used in the panel.
 * @enum {number}
 */
GameOverPanel.dimensions = {
    TEXT_X: 0,
    TEXT_Y: 13,
    TEXT_WIDTH: 191,
    TEXT_HEIGHT: 11,
    RESTART_WIDTH: 36,
    RESTART_HEIGHT: 32
};

GameOverPanel.prototype = {
    /**
     * Update the panel dimensions.
     * @param {number} width New canvas width.
     * @param {number} opt_height Optional new canvas height.
     */
    updateDimensions: function(width, opt_height) {
        this.canvasDimensions.WIDTH = width;
        if (opt_height) {
            this.canvasDimensions.HEIGHT = opt_height;
        }
    },
    /**
     * Draw the panel.
     */
    draw: function() {
        var dimensions = GameOverPanel.dimensions;
        var centerX = this.canvasDimensions.WIDTH / 2;
        // Game over text.
        var textSourceX = dimensions.TEXT_X;
        var textSourceY = dimensions.TEXT_Y;
        var textSourceWidth = dimensions.TEXT_WIDTH;
        var textSourceHeight = dimensions.TEXT_HEIGHT;

        var textTargetX = Math.round(centerX - (dimensions.TEXT_WIDTH / 2));
        var textTargetY = Math.round((this.canvasDimensions.HEIGHT - 25) / 3);
        var textTargetWidth = dimensions.TEXT_WIDTH;
        var textTargetHeight = dimensions.TEXT_HEIGHT;
        var restartSourceWidth = dimensions.RESTART_WIDTH;
        var restartSourceHeight = dimensions.RESTART_HEIGHT;
        var restartTargetX = centerX - (dimensions.RESTART_WIDTH / 2);
        var restartTargetY = this.canvasDimensions.HEIGHT / 2;
        if (Constants.IS_HIDPI) {
            textSourceY *= 2;
            textSourceX *= 2;
            textSourceWidth *= 2;
            textSourceHeight *= 2;
            restartSourceWidth *= 2;
            restartSourceHeight *= 2;
        }
        // Game over text from sprite.
        this.canvasCtx.drawImage(this.textSprite,
            textSourceX, textSourceY, textSourceWidth, textSourceHeight,
            textTargetX, textTargetY, textTargetWidth, textTargetHeight);

        // Restart button.
        this.canvasCtx.drawImage(this.restartImg, 0, 0,
            restartSourceWidth, restartSourceHeight,
            restartTargetX, restartTargetY, dimensions.RESTART_WIDTH,
            dimensions.RESTART_HEIGHT);
    }
};

module.exports = GameOverPanel;
},{"./Constants":4}],7:[function(require,module,exports){
var Utils = require('./Utils');
var Cloud = require('./Cloud');
var Obstacle = require('./Obstacle');
var HorizonLine = require('./HorizonLine');

/**
 * Horizon background class.
 * @param {HTMLCanvasElement} canvas
 * @param {Array.<HTMLImageElement>} images
 * @param {object} dimensions Canvas dimensions.
 * @param {number} gapCoefficient
 * @constructor
 */
function Horizon(canvas, images, dimensions, gapCoefficient) {
    this.canvas = canvas;
    this.canvasCtx = this.canvas.getContext('2d');
    this.config = Horizon.config;
    this.dimensions = dimensions;
    this.gapCoefficient = gapCoefficient;
    this.obstacles = [];
    this.unusedObstacles = [];
    this.horizonOffsets = [0, 0];
    this.cloudFrequency = this.config.CLOUD_FREQUENCY;

    // Cloud
    this.clouds = [];
    this.cloudImg = images.CLOUD;
    this.cloudSpeed = this.config.BG_CLOUD_SPEED;
    // Horizon
    this.horizonImg = images.HORIZON;
    this.horizonLine = null;
    // Obstacles
    this.obstacleImgs = {
        CACTUS_SMALL: images.CACTUS_SMALL,
        CACTUS_LARGE: images.CACTUS_LARGE
    };
    this.init();
};

/**
 * Horizon config.
 * @enum {number}
 */
Horizon.config = {
    BG_CLOUD_SPEED: 0.2,
    BUMPY_THRESHOLD: .3,
    CLOUD_FREQUENCY: .5,
    HORIZON_HEIGHT: 16,
    MAX_CLOUDS: 6
};
Horizon.prototype = {
    /**
     * Initialise the horizon. Just add the line and a cloud. No obstacles.
     */
    init: function() {
        this.addCloud();
        this.horizonLine = new HorizonLine(this.canvas, this.horizonImg);
    },
    /**
     * Push the obstacles from server to local.
     * @param  {Array} obstacles
     */
    pushObstacles: function (obstacles) {
        this.unusedObstacles = obstacles;
    },
    /**
     * @param {number} deltaTime
     * @param {number} currentSpeed
     * @param {boolean} updateObstacles Used as an override to prevent
     *     the obstacles from being updated / added. This happens in the
     *     ease in section.
     */
    update: function(deltaTime, currentSpeed, updateObstacles) {
        this.runningTime += deltaTime;
        this.horizonLine.update(deltaTime, currentSpeed);
        this.updateClouds(deltaTime, currentSpeed);
        if (updateObstacles) {
            this.updateObstacles(deltaTime, currentSpeed);
        }
    },
    /**
     * Update the cloud positions.
     * @param {number} deltaTime
     * @param {number} currentSpeed
     */
    updateClouds: function(deltaTime, speed) {
        var cloudSpeed = this.cloudSpeed / 1000 * deltaTime * speed;
        var numClouds = this.clouds.length;
        if (numClouds) {
            for (var i = numClouds - 1; i >= 0; i--) {
                this.clouds[i].update(cloudSpeed);
            }

            var lastCloud = this.clouds[numClouds - 1];
            // Check for adding a new cloud.
            if (numClouds < this.config.MAX_CLOUDS &&
                (this.dimensions.WIDTH - lastCloud.xPos) > lastCloud.cloudGap &&
                this.cloudFrequency > Math.random()) {
                this.addCloud();
            }
            // Remove expired clouds.
            this.clouds = this.clouds.filter(function(obj) {
                return !obj.remove;
            });
        }
    },
    /**
     * Update the obstacle positions.
     * @param {number} deltaTime
     * @param {number} currentSpeed
     */
    updateObstacles: function(deltaTime, currentSpeed) {
        // Obstacles, move to Horizon layer.
        var updatedObstacles = this.obstacles.slice(0);

        for (var i = 0; i < this.obstacles.length; i++) {
            var obstacle = this.obstacles[i];
            obstacle.update(deltaTime, currentSpeed);
            // Clean up existing obstacles.
            if (obstacle.remove) {
                updatedObstacles.shift();
            }
        }
        this.obstacles = updatedObstacles;
        if (this.obstacles.length > 0) {
            var lastObstacle = this.obstacles[this.obstacles.length - 1];
            if (lastObstacle && !lastObstacle.followingObstacleCreated &&
                lastObstacle.isVisible() &&
                (lastObstacle.xPos + lastObstacle.width + lastObstacle.gap) <
                this.dimensions.WIDTH) {
                this.addNewObstacle(currentSpeed);
                lastObstacle.followingObstacleCreated = true;
            }
        } else {
            // Create new obstacles.
            this.addNewObstacle(currentSpeed);
        }
    },

    /**
     * Add a new obstacle.
     * @param {number} currentSpeed
     */
    addNewObstacle: function(currentSpeed) {
        var obstacleSettings = this.unusedObstacles.shift();
        if(!obstacleSettings) {
            return;
        }
        var obstacleTypeIndex = obstacleSettings.type;
        var obstacleType = Obstacle.types[obstacleTypeIndex];
        var obstacleImg = this.obstacleImgs[obstacleType.type];
        var obstacle = new Obstacle(this.canvasCtx, obstacleType,
            obstacleImg, this.dimensions, currentSpeed, obstacleSettings.size,
            obstacleSettings.gap);
        this.obstacles.push(obstacle);
    },
    /**
     * Reset the horizon layer.
     * Remove existing obstacles and reposition the horizon line.
     */
    reset: function() {
        this.obstacles = [];
        this.horizonLine.reset();
    },
    /**
     * Update the canvas width and scaling.
     * @param {number} width Canvas width.
     * @param {number} height Canvas height.
     */
    resize: function(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
    },

    /**
     * Add a new cloud to the horizon.
     */
    addCloud: function() {
        this.clouds.push(new Cloud(this.canvas, this.cloudImg,
            this.dimensions.WIDTH));
    }
};

module.exports = Horizon;
},{"./Cloud":2,"./HorizonLine":8,"./Obstacle":9,"./Utils":13}],8:[function(require,module,exports){
var Constants = require('./Constants');

/**
 * Horizon Line.
 * Consists of two connecting lines. Randomly assigns a flat / bumpy horizon.
 * @param {HTMLCanvasElement} canvas
 * @param {HTMLImage} bgImg Horizon line sprite.
 * @constructor
 */
function HorizonLine(canvas, bgImg) {
    this.image = bgImg;
    this.canvas = canvas;
    this.canvasCtx = canvas.getContext('2d');
    this.sourceDimensions = {};
    this.dimensions = HorizonLine.dimensions;
    this.sourceXPos = [0, this.dimensions.WIDTH];
    this.xPos = [];
    this.yPos = 0;
    this.bumpThreshold = 0.5;
    this.setSourceDimensions();
    this.draw();
};
/**
 * Horizon line dimensions.
 * @enum {number}
 */
HorizonLine.dimensions = {
    WIDTH: 600,
    HEIGHT: 12,
    YPOS: 127
};

HorizonLine.prototype = {
    /**
     * Set the source dimensions of the horizon line.
     */
    setSourceDimensions: function() {
        for (var dimension in HorizonLine.dimensions) {
            if (Constants.IS_HIDPI) {
                if (dimension != 'YPOS') {
                    this.sourceDimensions[dimension] =
                        HorizonLine.dimensions[dimension] * 2;
                }
            } else {
                this.sourceDimensions[dimension] =
                    HorizonLine.dimensions[dimension];
            }
            this.dimensions[dimension] = HorizonLine.dimensions[dimension];
        }
        this.xPos = [0, HorizonLine.dimensions.WIDTH];
        this.yPos = HorizonLine.dimensions.YPOS;
    },

    /**
     * Return the crop x position of a type.
     */
    getRandomType: function() {
        return Math.random() > this.bumpThreshold ? this.dimensions.WIDTH : 0;
    },
    /**
     * Draw the horizon line.
     */
    draw: function() {
        this.canvasCtx.drawImage(this.image, this.sourceXPos[0], 0,
            this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
            this.xPos[0], this.yPos,
            this.dimensions.WIDTH, this.dimensions.HEIGHT);
        this.canvasCtx.drawImage(this.image, this.sourceXPos[1], 0,
            this.sourceDimensions.WIDTH, this.sourceDimensions.HEIGHT,
            this.xPos[1], this.yPos,
            this.dimensions.WIDTH, this.dimensions.HEIGHT);
    },
    /**
     * Update the x position of an indivdual piece of the line.
     * @param {number} pos Line position.
     * @param {number} increment
     */
    updateXPos: function(pos, increment) {
        var line1 = pos;
        var line2 = pos == 0 ? 1 : 0;

        this.xPos[line1] -= increment;
        this.xPos[line2] = this.xPos[line1] + this.dimensions.WIDTH;
        if (this.xPos[line1] <= -this.dimensions.WIDTH) {
            this.xPos[line1] += this.dimensions.WIDTH * 2;
            this.xPos[line2] = this.xPos[line1] - this.dimensions.WIDTH;
            this.sourceXPos[line1] = this.getRandomType();
        }
    },
    /**
     * Update the horizon line.
     * @param {number} deltaTime
     * @param {number} speed
     */
    update: function(deltaTime, speed) {
        var increment = Math.floor(speed * (Constants.FPS / 1000) * deltaTime);
        if (this.xPos[0] <= 0) {
            this.updateXPos(0, increment);
        } else {
            this.updateXPos(1, increment);
        }
        this.draw();
    },

    /**
     * Reset horizon to the starting position.
     */
    reset: function() {
        this.xPos[0] = 0;
        this.xPos[1] = HorizonLine.dimensions.WIDTH;
    }
};

module.exports = HorizonLine;
},{"./Constants":4}],9:[function(require,module,exports){
var Utils = require('./Utils');
var Constants = require('./Constants');
var CollisionBox = require('./CollisionBox');

/**
 * Obstacle.
 * @param {HTMLCanvasCtx} canvasCtx
 * @param {Obstacle.type} type
 * @param {image} obstacleImg Image sprite.
 * @param {Object} dimensions
 * @param {number} speed
 */
function Obstacle(canvasCtx, type, obstacleImg, dimensions, speed, size, gap) {
    this.canvasCtx = canvasCtx;
    this.image = obstacleImg;
    this.typeConfig = type;
    this.size = size;
    this.dimensions = dimensions;
    this.remove = false;
    this.xPos = 0;
    this.yPos = this.typeConfig.yPos;
    this.width = 0;
    this.collisionBoxes = [];
    this.gap = gap;

    this.init(speed);
};

Obstacle.prototype = {
    /**
     * Initialise the DOM for the obstacle.
     * @param {number} speed
     */
    init: function(speed) {
        this.cloneCollisionBoxes();
        // Only allow sizing if we're at the right speed.
        if (this.size > 1 && this.typeConfig.multipleSpeed > speed) {
            this.size = 1;
        }
        this.width = this.typeConfig.width * this.size;
        this.xPos = this.dimensions.WIDTH - this.width;
        this.draw();

        // Make collision box adjustments,
        // Central box is adjusted to the size as one box.
        //      ____        ______        ________
        //    _|   |-|    _|     |-|    _|       |-|
        //   | |<->| |   | |<--->| |   | |<----->| |
        //   | | 1 | |   | |  2  | |   | |   3   | |
        //   |_|___|_|   |_|_____|_|   |_|_______|_|
        //
        if (this.size > 1) {
            this.collisionBoxes[1].width = this.width - this.collisionBoxes[0].width -
                this.collisionBoxes[2].width;
            this.collisionBoxes[2].x = this.width - this.collisionBoxes[2].width;
        }
    },
    /**
     * Draw and crop based on size.
     */
    draw: function() {
        var sourceWidth = this.typeConfig.width;
        var sourceHeight = this.typeConfig.height;
        if (Constants.IS_HIDPI) {
            sourceWidth = sourceWidth * 2;
            sourceHeight = sourceHeight * 2;
        }

        // Sprite
        var sourceX = (sourceWidth * this.size) * (0.5 * (this.size - 1));
        this.canvasCtx.drawImage(this.image,
            sourceX, 0,
            sourceWidth * this.size, sourceHeight,
            this.xPos, this.yPos,
            this.typeConfig.width * this.size, this.typeConfig.height);
    },
    /**
     * Obstacle frame update.
     * @param {number} deltaTime
     * @param {number} speed
     */
    update: function(deltaTime, speed) {
        if (!this.remove) {
            this.xPos -= Math.floor((speed * Constants.FPS / 1000) * deltaTime);
            this.draw();
            if (!this.isVisible()) {
                this.remove = true;
            }
        }
    },

    /**
     * Check if obstacle is visible.
     * @return {boolean} Whether the obstacle is in the game area.
     */
    isVisible: function() {
        return this.xPos + this.width > 0;
    },
    /**
     * Make a copy of the collision boxes, since these will change based on
     * obstacle type and size.
     */
    cloneCollisionBoxes: function() {
        var collisionBoxes = this.typeConfig.collisionBoxes;
        for (var i = collisionBoxes.length - 1; i >= 0; i--) {
            this.collisionBoxes[i] = new CollisionBox(collisionBoxes[i].x,
                collisionBoxes[i].y, collisionBoxes[i].width,
                collisionBoxes[i].height);
        }
    }
};

/**
 * Obstacle definitions.
 * minGap: minimum pixel space betweeen obstacles.
 * multipleSpeed: Speed at which multiples are allowed.
 */
Obstacle.types = [{
    type: 'CACTUS_SMALL',
    className: ' cactus cactus-small ',
    width: 17,
    height: 35,
    yPos: 105,
    multipleSpeed: 3,
    minGap: 120,
    collisionBoxes: [
        new CollisionBox(0, 7, 5, 27),
        new CollisionBox(4, 0, 6, 34),
        new CollisionBox(10, 4, 7, 14)
    ]
}, {
    type: 'CACTUS_LARGE',
    className: ' cactus cactus-large ',
    width: 25,
    height: 50,
    yPos: 90,
    multipleSpeed: 6,
    minGap: 120,
    collisionBoxes: [
        new CollisionBox(0, 12, 7, 38),
        new CollisionBox(8, 0, 7, 49),
        new CollisionBox(13, 10, 10, 38)
    ]
}];

module.exports = Obstacle;
},{"./CollisionBox":3,"./Constants":4,"./Utils":13}],10:[function(require,module,exports){
var Trex = require('./Trex');
var Utils = require('./Utils');
var Horizon = require('./Horizon');
var Browser = require('./Browser');
var Constants = require('./Constants');
var CollisionBox = require('./CollisionBox');
var GameOverPanel = require('./GameOverPanel');
var DistanceMeter = require('./DistanceMeter');

var assign = require('../lib/assign');

/**
 * T-Rex runner.
 * @param {string} outerContainerId Outer containing element id.
 * @param {object} opt_config
 * @constructor
 * @export
 */
function Runner(outerContainerId, opt_config) {
    // Singleton
    if (Runner.instance_) {
        return Runner.instance_;
    }
    Runner.instance_ = this;
    this.outerContainerEl = document.querySelector(outerContainerId);
    this.containerEl = null;
    this.config = assign({}, Runner.config, opt_config);

    this.dimensions = Runner.defaultDimensions;
    this.canvas = null;
    this.canvasCtx = null;
    this.tRex = null;
    this.distanceMeter = null;
    this.distanceRan = 0;

    this.highestScore = 0;
    this.time = 0;
    this.runningTime = 0;
    this.msPerFrame = 1000 / Constants.FPS;
    this.currentSpeed = this.config.SPEED;
    this.obstacles = [];
    this.unusedObstacles = [];
    this.started = false;
    this.activated = false;
    this.crashed = false;
    this.paused = false;

    // Multi-player
    this.socket = null;
    this.players = {};

    this.resizeTimerId_ = null;
    this.playCount = 0;
    // Sound FX.
    this.audioBuffer = null;
    this.soundFx = {};
    // Global web audio context for playing sounds.
    this.audioContext = null;

    // Images.
    this.images = {};
    this.imagesLoaded = 0;
    this.loadImages();

    // Crashed players.
    this.crashedPlayers = {};

    // Animation.
    var browser = Browser.detect();
    switch(browser[0].toLowerCase()) {
        case 'chrome':
            this.keyframes = '@-webkit-keyframes intro { ' +
                'from { width:' + Trex.config.WIDTH + 'px }' +
                'to { width: ' + this.dimensions.WIDTH + 'px }' +
                '}';
            this.animationKey = 'webkitAnimation';
            break;
        case 'firefox':
            this.keyframes = '@-moz-keyframes intro { ' +
                'from { width:' + Trex.config.WIDTH + 'px }' +
                'to { width: ' + this.dimensions.WIDTH + 'px }' +
                '}';
            this.animationKey = 'MozAnimation';
            break;
        default:
            this.keyframes = '@keyframes intro { ' +
                'from { width:' + Trex.config.WIDTH + 'px }' +
                'to { width: ' + this.dimensions.WIDTH + 'px }' +
                '}';
            this.animationKey = 'animation';
            break;
    }
}

/**
 * Default game configuration.
 * @enum {number}
 */
Runner.config = {
    // ACCELERATION: 0.001,
    // 为了保证多人游戏时速度同步，这里加速度设为0
    ACCELERATION: 0,
    BG_CLOUD_SPEED: 0.2,
    BOTTOM_PAD: Constants.BOTTOM_PAD,
    CLEAR_TIME: 3000,
    CLOUD_FREQUENCY: 0.5,
    GAMEOVER_CLEAR_TIME: 750,
    GAP_COEFFICIENT: 0.6,
    GRAVITY: 0.6,
    INITIAL_JUMP_VELOCITY: 12,
    MAX_CLOUDS: 6,
    MAX_SPEED: 12,
    MIN_JUMP_HEIGHT: 35,
    MOBILE_SPEED_COEFFICIENT: 1.2,
    RESOURCE_TEMPLATE_ID: 'audio-resources',
    // 初始速度
    SPEED: 8,
    SPEED_DROP_COEFFICIENT: 3
};
/**
 * Default dimensions.
 * @enum {string}
 */
Runner.defaultDimensions = {
    WIDTH: Constants.DEFAULT_WIDTH,
    HEIGHT: Constants.DEFAULT_HEIGHT
};

/**
 * CSS class names.
 * @enum {string}
 */
Runner.classes = {
    CANVAS: 'runner-canvas',
    CONTAINER: 'runner-container',
    CRASHED: 'crashed',
    ICON: 'icon-offline',
    TOUCH_CONTROLLER: 'controller'
};
/**
 * Image source urls.
 * @enum {array.<object>}
 */
Runner.imageSources = {
    LDPI: [{
        name: 'CACTUS_LARGE',
        id: '1x-obstacle-large'
    }, {
        name: 'CACTUS_SMALL',
        id: '1x-obstacle-small'
    }, {
        name: 'CLOUD',
        id: '1x-cloud'
    }, {
        name: 'HORIZON',
        id: '1x-horizon'
    }, {
        name: 'RESTART',
        id: '1x-restart'
    }, {
        name: 'TEXT_SPRITE',
        id: '1x-text'
    }, {
        name: 'TREX',
        id: '1x-trex'
    }],
    HDPI: [{
        name: 'CACTUS_LARGE',
        id: '2x-obstacle-large'
    }, {
        name: 'CACTUS_SMALL',
        id: '2x-obstacle-small'
    }, {
        name: 'CLOUD',
        id: '2x-cloud'
    }, {
        name: 'HORIZON',
        id: '2x-horizon'
    }, {
        name: 'RESTART',
        id: '2x-restart'
    }, {
        name: 'TEXT_SPRITE',
        id: '2x-text'
    }, {
        name: 'TREX',
        id: '2x-trex'
    }]
};

/**
 * Sound FX. Reference to the ID of the audio tag on interstitial page.
 * @enum {string}
 */
Runner.sounds = {
    BUTTON_PRESS: 'offline-sound-press',
    HIT: 'offline-sound-hit',
    SCORE: 'offline-sound-reached'
};
/**
 * Key code mapping.
 * @enum {object}
 */
Runner.keycodes = {
    JUMP: {
        '38': 1,
        '32': 1
    }, // Up, spacebar
    DUCK: {
        '40': 1
    }, // Down
    RESTART: {
        '13': 1
    } // Enter
};

/**
 * Runner event names.
 * @enum {string}
 */
Runner.events = {
    ANIM_END: ['webkitAnimationEnd', 'mozAnimationEnd', 'animationEnd'],
    CLICK: 'click',
    KEYDOWN: 'keydown',
    KEYUP: 'keyup',
    MOUSEDOWN: 'mousedown',
    MOUSEUP: 'mouseup',
    RESIZE: 'resize',
    TOUCHEND: 'touchend',
    TOUCHSTART: 'touchstart',
    VISIBILITY: 'visibilitychange',
    BLUR: 'blur',
    FOCUS: 'focus',
    LOAD: 'load'
};

/**
 * Create canvas element.
 * @param {HTMLElement} container Element to append canvas to.
 * @param {number} width
 * @param {number} height
 * @param {string} opt_classname
 * @return {HTMLCanvasElement}
 */
function createCanvas (container, width, height, opt_classname) {
    var canvas = document.createElement('canvas');
    canvas.className = opt_classname ? Runner.classes.CANVAS + ' ' +
        opt_classname : Runner.classes.CANVAS;
    canvas.width = width;
    canvas.height = height;
    container.appendChild(canvas);
    return canvas;
}

/**
 * Check for a collision.
 * @param {!Obstacle} obstacle
 * @param {!Trex} tRex T-rex object.
 * @param {HTMLCanvasContext} opt_canvasCtx Optional canvas context for drawing
 *    collision boxes.
 * @return {Array.<CollisionBox>}
 */
function checkForCollision (obstacle, tRex, opt_canvasCtx) {
    if(!obstacle) {
        return;
    }
    var obstacleBoxXPos = Runner.defaultDimensions.WIDTH + obstacle.xPos;

    // Adjustments are made to the bounding box as there is a 1 pixel white
    // border around the t-rex and obstacles.
    var tRexBox = new CollisionBox(
        tRex.xPos + 1,
        tRex.yPos + 1,
        tRex.config.WIDTH - 2,
        tRex.config.HEIGHT - 2);
    var obstacleBox = new CollisionBox(
        obstacle.xPos + 1,
        obstacle.yPos + 1,
        obstacle.typeConfig.width * obstacle.size - 2,
        obstacle.typeConfig.height - 2);
    // Debug outer box
    if (opt_canvasCtx) {
        drawCollisionBoxes(opt_canvasCtx, tRexBox, obstacleBox);
    }
    // Simple outer bounds check.
    if (boxCompare(tRexBox, obstacleBox)) {
        var collisionBoxes = obstacle.collisionBoxes;
        var tRexCollisionBoxes = Trex.collisionBoxes;

        // Detailed axis aligned box check.
        for (var t = 0; t < tRexCollisionBoxes.length; t++) {
            for (var i = 0; i < collisionBoxes.length; i++) {
                // Adjust the box to actual positions.
                var adjTrexBox =
                    createAdjustedCollisionBox(tRexCollisionBoxes[t], tRexBox);
                var adjObstacleBox =
                    createAdjustedCollisionBox(collisionBoxes[i], obstacleBox);
                var crashed = boxCompare(adjTrexBox, adjObstacleBox);
                // Draw boxes for debug.
                if (opt_canvasCtx) {
                    drawCollisionBoxes(opt_canvasCtx, adjTrexBox, adjObstacleBox);
                }
                if (crashed) {
                    return [adjTrexBox, adjObstacleBox];
                }
            }
        }
    }
    return false;
};

/**
 * Compare two collision boxes for a collision.
 * @param {CollisionBox} tRexBox
 * @param {CollisionBox} obstacleBox
 * @return {boolean} Whether the boxes intersected.
 */
function boxCompare (tRexBox, obstacleBox) {
    var crashed = false;
    var tRexBoxX = tRexBox.x;
    var tRexBoxY = tRexBox.y;
    var obstacleBoxX = obstacleBox.x;
    var obstacleBoxY = obstacleBox.y;
    // Axis-Aligned Bounding Box method.
    if (tRexBox.x < obstacleBoxX + obstacleBox.width &&
        tRexBox.x + tRexBox.width > obstacleBoxX &&
        tRexBox.y < obstacleBox.y + obstacleBox.height &&
        tRexBox.height + tRexBox.y > obstacleBox.y) {
        crashed = true;
    }

    return crashed;
};

/**
 * Adjust the collision box.
 * @param {!CollisionBox} box The original box.
 * @param {!CollisionBox} adjustment Adjustment box.
 * @return {CollisionBox} The adjusted collision box object.
 */
function createAdjustedCollisionBox (box, adjustment) {
    return new CollisionBox(
        box.x + adjustment.x,
        box.y + adjustment.y,
        box.width,
        box.height);
};

/**
 * Vibrate on mobile devices.
 * @param {number} duration Duration of the vibration in milliseconds.
 */
function vibrate (duration) {
    if (Constants.IS_MOBILE) {
        window.navigator['vibrate'](duration);
    }
}

Runner.prototype = {
    /**
     * Bind a socket to server
     * @param  {WebSocket} socket
     */
    bind: function (socket) {
        this.socket = socket;
        socket.on('player.new', this.addPlayer.bind(this));
        socket.on('player.list', this.addPlayers.bind(this));
        socket.on('player.jump.start', this.playerStartJump.bind(this));
        socket.on('player.jump.end', this.playerEndJump.bind(this));
        socket.on('player.over', this.playerOver.bind(this));
        socket.on('player.disconnected', this.playerDisconnected.bind(this));
        socket.on('game.data', this.updateGameState.bind(this));
    },
    addPlayers: function (players) {
        for(var i = 0; i < players.length; i++) {
            var playerId = players[i];
            if(!this.players[playerId]) {
                this.addPlayer(playerId);
            }
        }
    },
    addPlayer: function (playerId) {
        var tRex;
        if(playerId === this.socket.id) {
            tRex = this.tRex;
        } else {
            tRex = new Trex(this.canvas, this.images.TREX, 0.4);
        }
        tRex.setName(playerId);
        this.players[playerId] = {
            id: playerId,
            tRex: tRex
        }
    },
    /**
     * Walk through all the players.
     * @param {Function} callback
     */
    eachPlayer: function (callback) {
        for(var playerId in this.players) {
            var isMyself = playerId === this.socket.id;
            callback(this.players[playerId], isMyself);
        }
    },
    /**
     * Make certain player's tRex jump.
     * @param {string} playerId
     */
    playerStartJump: function (playerId) {
        if(this.players[playerId]) {
            this.players[playerId].tRex.startJump();
        }
    },
    playerEndJump: function (playerId) {
        if(this.players[playerId]) {
            this.players[playerId].tRex.endJump();
        }
    },
    /**
     * Someone is game over.
     * @param  {string} playerId
     */
    playerOver: function (data) {
        if(this.players[data.playerId]) {
            var player = this.players[data.playerId];
            player.meters = data.meters;
            this.crashedPlayers[data.playerId] = player;
            // Clean this text after 3 seconds
            setTimeout(function() {
                if(this.crashedPlayers[data.playerId]) {
                    delete this.crashedPlayers[data.playerId];
                }
            }.bind(this), 3000);
        }
    },
    playerDisconnected: function (playerId) {
        if(this.players[playerId]) {
            delete this.players[playerId];
        }
    },
    /**
     * When recieving new game data, update playground.
     * @param  {Object} data
     */
    updateGameState: function (data) {
        if(this.crashed) {
            return;
        }
        this.unusedObstacles = data.obstacles;
    },
    /**
     * Setting individual settings for debugging.
     * @param {string} setting
     * @param {*} value
     */
    updateConfigSetting: function(setting, value) {
        if (setting in this.config && value != undefined) {
            this.config[setting] = value;
            switch (setting) {
                case 'GRAVITY':
                case 'MIN_JUMP_HEIGHT':
                case 'SPEED_DROP_COEFFICIENT':
                    this.tRex.config[setting] = value;
                    break;
                case 'INITIAL_JUMP_VELOCITY':
                    this.tRex.setJumpVelocity(value);
                    break;
                case 'SPEED':
                    this.setSpeed(value);
                    break;
            }
        }
    },

    /**
     * Load and cache the image assets from the page.
     */
    loadImages: function() {
        var imageSources = Constants.IS_HIDPI ? Runner.imageSources.HDPI :
            Runner.imageSources.LDPI;
        var numImages = imageSources.length;
        for (var i = numImages - 1; i >= 0; i--) {
            var imgSource = imageSources[i];
            this.images[imgSource.name] = document.getElementById(imgSource.id);
        }
        this.init();
    },
    /**
     * Load and decode base 64 encoded sounds.
     */
    loadSounds: function() {
        this.audioContext = new AudioContext();
        var resourceTemplate =
            document.getElementById(this.config.RESOURCE_TEMPLATE_ID).content;

        for (var sound in Runner.sounds) {
            var soundSrc = resourceTemplate.getElementById(Runner.sounds[sound]).src;
            soundSrc = soundSrc.substr(soundSrc.indexOf(',') + 1);

            var buffer = Utils.decodeBase64ToArrayBuffer(soundSrc);
            // Async, so no guarantee of order in array.
            this.audioContext.decodeAudioData(buffer, function(index, audioData) {
                this.soundFx[index] = audioData;
            }.bind(this, sound));
        }
    },
    /**
     * Sets the game speed. Adjust the speed accordingly if on a smaller screen.
     * @param {number} opt_speed
     */
    setSpeed: function(opt_speed) {
        var speed = opt_speed || this.currentSpeed;
        // Reduce the speed on smaller mobile screens.
        if (this.dimensions.WIDTH < Constants.DEFAULT_WIDTH) {
            var mobileSpeed = speed * this.dimensions.WIDTH / Constants.DEFAULT_WIDTH *
                this.config.MOBILE_SPEED_COEFFICIENT;
            this.currentSpeed = mobileSpeed > speed ? speed : mobileSpeed;
        } else if (opt_speed) {
            this.currentSpeed = opt_speed;
        }
    },

    /**
     * Game initialiser.
     */
    init: function() {
        // Hide the static icon.
        document.querySelector('.' + Runner.classes.ICON).style.visibility =
            'hidden';
        this.adjustDimensions();
        this.setSpeed();
        this.containerEl = document.createElement('div');
        this.containerEl.className = Runner.classes.CONTAINER;
        // Player canvas container.
        this.canvas = createCanvas(this.containerEl, this.dimensions.WIDTH,
            this.dimensions.HEIGHT, Runner.classes.PLAYER);

        this.canvasCtx = this.canvas.getContext('2d');
        this.canvasCtx.fillStyle = '#f7f7f7';
        this.canvasCtx.fill();
        Runner.updateCanvasScaling(this.canvas);
        // Horizon contains clouds, obstacles and the ground.
        this.horizon = new Horizon(this.canvas, this.images, this.dimensions,
            this.config.GAP_COEFFICIENT);
        // Distance meter
        this.distanceMeter = new DistanceMeter(this.canvas,
            this.images.TEXT_SPRITE, this.dimensions.WIDTH);
        // Draw t-rex
        this.canvasCtx.font = "12px Georgia";
        this.canvasCtx.fillStyle = "#333333";
        this.tRex = new Trex(this.canvas, this.images.TREX);

        this.outerContainerEl.appendChild(this.containerEl);
        if (Constants.IS_MOBILE) {
            this.createTouchController();
        }
        this.startListening();
        this.update();
        window.addEventListener(Runner.events.RESIZE,
            this.debounceResize.bind(this));
    },

    /**
     * Create the touch controller. A div that covers whole screen.
     */
    createTouchController: function() {
        this.touchController = document.createElement('div');
        this.touchController.className = Runner.classes.TOUCH_CONTROLLER;
    },
    /**
     * Debounce the resize event.
     */
    debounceResize: function() {
        if (!this.resizeTimerId_) {
            this.resizeTimerId_ =
                setInterval(this.adjustDimensions.bind(this), 250);
        }
    },
    /**
     * Adjust game space dimensions on resize.
     */
    adjustDimensions: function() {
        clearInterval(this.resizeTimerId_);
        this.resizeTimerId_ = null;
        var boxStyles = window.getComputedStyle(this.outerContainerEl);
        var padding = Number(boxStyles.paddingLeft.substr(0,
            boxStyles.paddingLeft.length - 2));

        this.dimensions.WIDTH = this.outerContainerEl.offsetWidth - padding * 2;
        // Redraw the elements back onto the canvas.
        if (this.canvas) {
            this.canvas.width = this.dimensions.WIDTH;
            this.canvas.height = this.dimensions.HEIGHT;
            Runner.updateCanvasScaling(this.canvas);
            this.distanceMeter.calcXPos(this.dimensions.WIDTH);
            this.clearCanvas();
            this.horizon.update(0, 0, true);
            this.eachPlayer(function (player) {
                player.tRex.update(0);
            });

            // Outer container and distance meter.
            if (this.activated || this.crashed) {
                this.containerEl.style.width = this.dimensions.WIDTH + 'px';
                this.containerEl.style.height = this.dimensions.HEIGHT + 'px';
                this.distanceMeter.update(0, Math.ceil(this.distanceRan));
                this.stop();
            } else {
                this.eachPlayer(function (player) {
                    player.tRex.draw(0, 0);
                });
            }
            // Game over panel.
            if (this.crashed && this.gameOverPanel) {
                this.gameOverPanel.updateDimensions(this.dimensions.WIDTH);
                this.gameOverPanel.draw();
            }
        }
    },
    /**
     * Play the game intro.
     * Canvas container width expands out to the full width.
     */
    playIntro: function() {
        if (!this.started && !this.crashed) {
            this.playingIntro = true;
            this.tRex.playingIntro = true;

            // CSS animation definition.
            document.styleSheets[0].insertRule(this.keyframes, 0);

            for(var i = 0; i < Runner.events.ANIM_END.length; i++) {
                this.containerEl.addEventListener(Runner.events.ANIM_END[i],
                    this.startGame.bind(this));
            }

            this.containerEl.style[this.animationKey] = 'intro .4s ease-out 1 both';

            this.containerEl.style.width = this.dimensions.WIDTH + 'px';
            if (this.touchController) {
                this.outerContainerEl.appendChild(this.touchController);
            }
            this.activated = true;
            this.started = true;
        } else if (this.crashed) {
            this.restart();
        }
    },

    /**
     * Update the game status to started.
     */
    startGame: function() {
        this.runningTime = 0;
        this.playingIntro = false;
        this.tRex.playingIntro = false;
        this.containerEl.style[this.animationKey] = '';
        this.playCount++;
        // Handle tabbing off the page. Pause the current game.
        // window.addEventListener(Runner.events.VISIBILITY,
        //     this.onVisibilityChange.bind(this));
        // window.addEventListener(Runner.events.BLUR,
        //     this.onVisibilityChange.bind(this));
        // window.addEventListener(Runner.events.FOCUS,
        //     this.onVisibilityChange.bind(this));
    },

    clearCanvas: function() {
        this.canvasCtx.clearRect(0, 0, this.dimensions.WIDTH,
            this.dimensions.HEIGHT);
    },
    /**
     * Update the game frame.
     */
    update: function() {
        this.drawPending = false;
        var now = performance.now();
        var deltaTime = now - (this.time || now);
        this.time = now;
        if (this.activated) {
            this.clearCanvas();

            this.eachPlayer(function (player) {
                console.log(player.id)
                if (player.tRex.jumping) {
                    player.tRex.updateJump(deltaTime);
                }
            });

            this.runningTime += deltaTime;
            var hasObstacles = this.runningTime > this.config.CLEAR_TIME;
            // First jump triggers the intro.
            if (this.tRex.jumpCount == 1 && !this.playingIntro) {
                this.playIntro();
            }
            // Push new obstacle settings to horizon
            if(this.unusedObstacles.length) {
                this.horizon.pushObstacles(this.unusedObstacles);
                this.unusedObstacles = [];
            }
            // The horizon doesn't move until the intro is over.
            if (this.playingIntro) {
                this.horizon.update(0, this.currentSpeed, hasObstacles);
            } else {
                deltaTime = !this.started ? 0 : deltaTime;
                this.horizon.update(deltaTime, this.currentSpeed, hasObstacles);
            }

            // Check for collisions.
            var collision = hasObstacles &&
                checkForCollision(this.horizon.obstacles[0], this.tRex);
            if (!collision) {
                this.distanceRan += this.currentSpeed * deltaTime / this.msPerFrame;
                if (this.currentSpeed < this.config.MAX_SPEED) {
                    this.currentSpeed += this.config.ACCELERATION;
                }
            } else {
                this.gameOver();
            }
            if (this.distanceMeter.getActualDistance(this.distanceRan) >
                this.distanceMeter.maxScore) {
                this.distanceRan = 0;
            }

            var playAcheivementSound = this.distanceMeter.update(deltaTime,
                Math.ceil(this.distanceRan));
            if (playAcheivementSound) {
                this.playSound(this.soundFx.SCORE);
            }
        }
        this.eachPlayer(function (player, isMyself) {
            if(!isMyself) {
                player.tRex.update(deltaTime);
            }
        });

        // Render game over players text
        var i = 1;
        for(var playerId in this.crashedPlayers) {
            var player = this.crashedPlayers[playerId];
            this.canvasCtx.fillText(player.tRex.name
                + ' crashed at ' + player.meters + ' meters.', 0, 12 * i);
            i++;
        }

        if (!this.crashed) {
            this.tRex.update(deltaTime);
            this.raq();
        }
    },
    /**
     * Event handler.
     */
    handleEvent: function(e) {
        return (function(evtType, events) {
            switch (evtType) {
                case events.KEYDOWN:
                case events.TOUCHSTART:
                case events.MOUSEDOWN:
                    this.onKeyDown(e);
                    break;
                case events.KEYUP:
                case events.TOUCHEND:
                case events.MOUSEUP:
                    this.onKeyUp(e);
                    break;
            }
        }.bind(this))(e.type, Runner.events);
    },

    /**
     * Bind relevant key / mouse / touch listeners.
     */
    startListening: function() {
        // Keys.
        document.addEventListener(Runner.events.KEYDOWN, this);
        document.addEventListener(Runner.events.KEYUP, this);
        if (Constants.IS_MOBILE) {
            // Mobile only touch devices.
            this.touchController.addEventListener(Runner.events.TOUCHSTART, this);
            this.touchController.addEventListener(Runner.events.TOUCHEND, this);
            this.containerEl.addEventListener(Runner.events.TOUCHSTART, this);
        } else {
            // Mouse.
            document.addEventListener(Runner.events.MOUSEDOWN, this);
            document.addEventListener(Runner.events.MOUSEUP, this);
        }
    },
    /**
     * Remove all listeners.
     */
    stopListening: function() {
        document.removeEventListener(Runner.events.KEYDOWN, this);
        document.removeEventListener(Runner.events.KEYUP, this);
        if (Constants.IS_MOBILE) {
            this.touchController.removeEventListener(Runner.events.TOUCHSTART, this);
            this.touchController.removeEventListener(Runner.events.TOUCHEND, this);
            this.containerEl.removeEventListener(Runner.events.TOUCHSTART, this);
        } else {
            document.removeEventListener(Runner.events.MOUSEDOWN, this);
            document.removeEventListener(Runner.events.MOUSEUP, this);
        }
    },

    /**
     * Process keydown.
     * @param {Event} e
     */
    onKeyDown: function(e) {
        if (!this.crashed && (Runner.keycodes.JUMP[String(e.keyCode)] ||
            e.type == Runner.events.TOUCHSTART)) {
            if (!this.activated) {
                this.loadSounds();
                this.activated = true;
            }
            if (!this.tRex.jumping) {
                this.socket.emit('player.jump.start');
                this.playSound(this.soundFx.BUTTON_PRESS);
                this.tRex.startJump();
            }
        }
        if (this.crashed && e.type == Runner.events.TOUCHSTART &&
            e.currentTarget == this.containerEl) {
            this.restart();
        }
        // Speed drop, activated only when jump key is not pressed.
        if (Runner.keycodes.DUCK[e.keyCode] && this.tRex.jumping) {
            e.preventDefault();
            this.tRex.setSpeedDrop();
        }
    },

    /**
     * Process key up.
     * @param {Event} e
     */
    onKeyUp: function(e) {
        var keyCode = String(e.keyCode);
        var isjumpKey = Runner.keycodes.JUMP[keyCode] ||
            e.type == Runner.events.TOUCHEND ||
            e.type == Runner.events.MOUSEDOWN;
        if (this.isRunning() && isjumpKey) {
            this.socket.emit('player.jump.end');
            this.tRex.endJump();
        } else if (Runner.keycodes.DUCK[keyCode]) {
            this.tRex.speedDrop = false;
        } else if (this.crashed) {
            // Check that enough time has elapsed before allowing jump key to restart.
            var deltaTime = performance.now() - this.time;
            if (Runner.keycodes.RESTART[keyCode] ||
                (e.type == Runner.events.MOUSEUP && e.target == this.canvas) ||
                (deltaTime >= this.config.GAMEOVER_CLEAR_TIME &&
                    Runner.keycodes.JUMP[keyCode])) {
                this.restart();
            }
        } else if (this.paused && isjumpKey) {
            this.play();
        }
    },

    /**
     * RequestAnimationFrame wrapper.
     */
    raq: function() {
        if (!this.drawPending) {
            this.drawPending = true;
            this.raqId = requestAnimationFrame(this.update.bind(this));
        }
    },
    /**
     * Whether the game is running.
     * @return {boolean}
     */
    isRunning: function() {
        return !!this.raqId;
    },
    /**
     * Game over state.
     */
    gameOver: function() {
        this.playSound(this.soundFx.HIT);
        vibrate(200);
        this.stop();
        this.crashed = true;
        this.distanceMeter.acheivement = false;

        this.tRex.update(100, Trex.status.CRASHED);
        // Game over panel.
        if (!this.gameOverPanel) {
            this.gameOverPanel = new GameOverPanel(this.canvas,
                this.images.TEXT_SPRITE, this.images.RESTART,
                this.dimensions);
        } else {
            this.gameOverPanel.draw();
        }
        // Update the high score.
        if (this.distanceRan > this.highestScore) {
            this.highestScore = Math.ceil(this.distanceRan);
            this.distanceMeter.setHighScore(this.highestScore);
        }
        // Reset the time clock.
        this.time = performance.now();
        this.socket.emit('player.over', this.distanceMeter.getActualDistance(this.distanceRan));
    },

    stop: function() {
        this.activated = false;
        this.paused = true;
        cancelAnimationFrame(this.raqId);
        this.raqId = 0;
    },
    play: function() {
        if (!this.crashed) {
            this.activated = true;
            this.paused = false;
            this.tRex.update(0, Trex.status.RUNNING);
            this.time = performance.now();
            this.update();
        }
    },
    restart: function() {
        if (!this.raqId) {
            this.playCount++;
            this.runningTime = 0;
            this.activated = false;
            this.crashed = false;
            this.distanceRan = 0;
            this.setSpeed(this.config.SPEED);
            this.time = performance.now();
            this.containerEl.classList.remove(Runner.classes.CRASHED);
            this.clearCanvas();
            this.distanceMeter.reset(this.highestScore);
            this.horizon.reset();
            this.tRex.reset();
            this.playSound(this.soundFx.BUTTON_PRESS);

            this.update();
        }
    },
    /**
     * Pause the game if the tab is not in focus.
     */
    onVisibilityChange: function(e) {
        if (document.hidden || document.webkitHidden || e.type == 'blur') {
            this.stop();
        } else {
            this.play();
        }
    },
    /**
     * Play a sound.
     * @param {SoundBuffer} soundBuffer
     */
    playSound: function(soundBuffer) {
        if (soundBuffer) {
            var sourceNode = this.audioContext.createBufferSource();
            sourceNode.buffer = soundBuffer;
            sourceNode.connect(this.audioContext.destination);
            sourceNode.start(0);
        }
    }
};

/**
 * Updates the canvas size taking into
 * account the backing store pixel ratio and
 * the device pixel ratio.
 *
 * See article by Paul Lewis:
 * http://www.html5rocks.com/en/tutorials/canvas/hidpi/
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} opt_width
 * @param {number} opt_height
 * @return {boolean} Whether the canvas was scaled.
 */
Runner.updateCanvasScaling = function(canvas, opt_width, opt_height) {
    var context = canvas.getContext('2d');
    // Query the various pixel ratios
    var devicePixelRatio = Math.floor(window.devicePixelRatio) || 1;
    var backingStoreRatio = Math.floor(context.webkitBackingStorePixelRatio ||
        context.mozBackingStorePixelRatio || context.backingStorePixelRatio) || 1;
    var ratio = devicePixelRatio / backingStoreRatio;
    // Upscale the canvas if the two ratios don't match
    if (devicePixelRatio !== backingStoreRatio) {
        var oldWidth = opt_width || canvas.width;
        var oldHeight = opt_height || canvas.height;

        canvas.width = oldWidth * ratio;
        canvas.height = oldHeight * ratio;
        canvas.style.width = oldWidth + 'px';
        canvas.style.height = oldHeight + 'px';
        // Scale the context to counter the fact that we've manually scaled
        // our canvas element.
        context.scale(ratio, ratio);
        return true;
    }
    return false;
};

module.exports = Runner;
},{"../lib/assign":15,"./Browser":1,"./CollisionBox":3,"./Constants":4,"./DistanceMeter":5,"./GameOverPanel":6,"./Horizon":7,"./Trex":12,"./Utils":13}],11:[function(require,module,exports){
var Constants = require('./Constants');
var IO = require('../lib/socket.io.js');

var socket = new IO();
var Server = {};

Server.connected = function (callback) {
    socket.emit('client.connect');
    callback(socket);
}

module.exports = Server;
},{"../lib/socket.io.js":16,"./Constants":4}],12:[function(require,module,exports){
var Constants = require('./Constants');
var CollisionBox = require('./CollisionBox');

/**
 * T-rex game character.
 * @param {HTMLCanvas} canvas
 * @param {HTMLImage} image Character image.
 * @constructor
 */
function Trex(canvas, image, opacity, name) {
    this.canvas = canvas;
    this.opacity = opacity;
    this.name = name ? name.substring(0, 6) : '';
    this.canvasCtx = canvas.getContext('2d');
    this.image = image;
    this.xPos = 0;
    this.yPos = 0;
    // Position when on the ground.
    this.groundYPos = 0;
    this.currentFrame = 0;
    this.currentAnimFrames = [];
    this.blinkDelay = 0;
    this.animStartTime = 0;
    this.timer = 0;
    this.msPerFrame = 1000 / Constants.FPS;
    this.config = Trex.config;
    // Current status.
    this.status = Trex.status.WAITING;
    this.jumping = false;
    this.jumpVelocity = 0;
    this.reachedMinHeight = false;
    this.speedDrop = false;
    this.jumpCount = 0;
    this.jumpspotX = 0;

    this.init();
};
/**
 * T-rex player config.
 * @enum {number}
 */
Trex.config = {
    DROP_VELOCITY: -5,
    GRAVITY: 0.6,
    HEIGHT: 47,
    INIITAL_JUMP_VELOCITY: -10,
    INTRO_DURATION: 1500,
    MAX_JUMP_HEIGHT: 30,
    MIN_JUMP_HEIGHT: 30,
    SPEED_DROP_COEFFICIENT: 3,
    SPRITE_WIDTH: 262,
    START_X_POS: 50,
    WIDTH: 44
};

/**
 * Used in collision detection.
 * @type {Array.<CollisionBox>}
 */
Trex.collisionBoxes = [
    new CollisionBox(1, -1, 30, 26),
    new CollisionBox(32, 0, 8, 16),
    new CollisionBox(10, 35, 14, 8),
    new CollisionBox(1, 24, 29, 5),
    new CollisionBox(5, 30, 21, 4),
    new CollisionBox(9, 34, 15, 4)
];
/**
 * Animation states.
 * @enum {string}
 */
Trex.status = {
    CRASHED: 'CRASHED',
    JUMPING: 'JUMPING',
    RUNNING: 'RUNNING',
    WAITING: 'WAITING'
};
/**
 * Blinking coefficient.
 * @const
 */
Trex.BLINK_TIMING = 7000;

/**
 * Animation config for different states.
 * @enum {object}
 */
Trex.animFrames = {
    WAITING: {
        frames: [44, 0],
        msPerFrame: 1000 / 3
    },
    RUNNING: {
        frames: [88, 132],
        msPerFrame: 1000 / 12
    },
    CRASHED: {
        frames: [220],
        msPerFrame: 1000 / 60
    },
    JUMPING: {
        frames: [0],
        msPerFrame: 1000 / 60
    }
};
Trex.prototype = {
    /**
     * T-rex player initaliser.
     * Sets the t-rex to blink at random intervals.
     */
    init: function() {
        this.blinkDelay = this.setBlinkDelay();
        this.groundYPos = Constants.DEFAULT_HEIGHT - this.config.HEIGHT -
            Constants.BOTTOM_PAD;
        this.yPos = this.groundYPos;
        this.minJumpHeight = this.groundYPos - this.config.MIN_JUMP_HEIGHT;

        this.draw(0, 0);
        this.update(0, Trex.status.WAITING);
    },
    setName: function (name) {
        this.name = name ? name.substring(0, 6) : '';
    },
    /**
     * Setter for the jump velocity.
     * The approriate drop velocity is also set.
     */
    setJumpVelocity: function(setting) {
        this.config.INIITAL_JUMP_VELOCITY = -setting;
        this.config.DROP_VELOCITY = -setting / 2;
    },
    /**
     * Set the animation status.
     * @param {!number} deltaTime
     * @param {Trex.status} status Optional status to switch to.
     */
    update: function(deltaTime, opt_status) {
        this.timer += deltaTime;
        // Update the status.
        if (opt_status) {
            this.status = opt_status;
            this.currentFrame = 0;
            this.msPerFrame = Trex.animFrames[opt_status].msPerFrame;
            this.currentAnimFrames = Trex.animFrames[opt_status].frames;

            if (opt_status == Trex.status.WAITING) {
                this.animStartTime = performance.now();
                this.setBlinkDelay();
            }
        }
        // Game intro animation, T-rex moves in from the left.
        if (this.playingIntro && this.xPos < this.config.START_X_POS) {
            this.xPos += Math.round((this.config.START_X_POS /
                this.config.INTRO_DURATION) * deltaTime);
        }
        if (this.status == Trex.status.WAITING) {
            this.blink(performance.now());
        } else {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
        }
        // Update the frame position.
        if (this.timer >= this.msPerFrame) {
            this.currentFrame = this.currentFrame ==
                this.currentAnimFrames.length - 1 ? 0 : this.currentFrame + 1;
            this.timer = 0;
        }
    },

    /**
     * Draw the t-rex to a particular position.
     * @param {number} x
     * @param {number} y
     */
    draw: function(x, y) {
        var sourceX = x;
        var sourceY = y;
        var sourceWidth = this.config.WIDTH;
        var sourceHeight = this.config.HEIGHT;
        if (Constants.IS_HIDPI) {
            sourceX *= 2;
            sourceY *= 2;
            sourceWidth *= 2;
            sourceHeight *= 2;
        }
        this.canvasCtx.globalAlpha = this.opacity || 1;
        this.canvasCtx.fillText (this.name, this.xPos, this.yPos);
        this.canvasCtx.drawImage(this.image, sourceX, sourceY,
            sourceWidth, sourceHeight,
            this.xPos, this.yPos,
            this.config.WIDTH, this.config.HEIGHT);
        this.canvasCtx.globalAlpha = 1;
    },
    /**
     * Sets a random time for the blink to happen.
     */
    setBlinkDelay: function() {
        this.blinkDelay = Math.ceil(Math.random() * Trex.BLINK_TIMING);
    },

    /**
     * Make t-rex blink at random intervals.
     * @param {number} time Current time in milliseconds.
     */
    blink: function(time) {
        var deltaTime = time - this.animStartTime;
        if (deltaTime >= this.blinkDelay) {
            this.draw(this.currentAnimFrames[this.currentFrame], 0);
            if (this.currentFrame == 1) {
                // Set new random delay to blink.
                this.setBlinkDelay();
                this.animStartTime = time;
            }
        }
    },
    /**
     * Initialise a jump.
     */
    startJump: function() {
        if (!this.jumping) {
            this.update(0, Trex.status.JUMPING);
            this.jumpVelocity = this.config.INIITAL_JUMP_VELOCITY;
            this.jumping = true;
            this.reachedMinHeight = false;
            this.speedDrop = false;
        }
    },

    /**
     * Jump is complete, falling down.
     */
    endJump: function() {
        if (this.reachedMinHeight &&
            this.jumpVelocity < this.config.DROP_VELOCITY) {
            this.jumpVelocity = this.config.DROP_VELOCITY;
        }
    },
    /**
     * Update frame for a jump.
     * @param {number} deltaTime
     */
    updateJump: function(deltaTime) {
        var msPerFrame = Trex.animFrames[this.status].msPerFrame;
        var framesElapsed = deltaTime / msPerFrame;
        // Speed drop makes Trex fall faster.
        if (this.speedDrop) {
            this.yPos += Math.round(this.jumpVelocity *
                this.config.SPEED_DROP_COEFFICIENT * framesElapsed);
        } else {
            this.yPos += Math.round(this.jumpVelocity * framesElapsed);
        }
        this.jumpVelocity += this.config.GRAVITY * framesElapsed;

        // Minimum height has been reached.
        if (this.yPos < this.minJumpHeight || this.speedDrop) {
            this.reachedMinHeight = true;
        }
        // Reached max height
        if (this.yPos < this.config.MAX_JUMP_HEIGHT || this.speedDrop) {
            this.endJump();
        }
        // Back down at ground level. Jump completed.
        if (this.yPos > this.groundYPos) {
            this.reset();
            this.jumpCount++;
        }
        this.update(deltaTime);
    },

    /**
     * Set the speed drop. Immediately cancels the current jump.
     */
    setSpeedDrop: function() {
        this.speedDrop = true;
        this.jumpVelocity = 1;
    },
    /**
     * Reset the t-rex to running at start of game.
     */
    reset: function() {
        this.yPos = this.groundYPos;
        this.jumpVelocity = 0;
        this.jumping = false;
        this.update(0, Trex.status.RUNNING);
        this.midair = false;
        this.speedDrop = false;
        this.jumpCount = 0;
    }
};

module.exports = Trex;
},{"./CollisionBox":3,"./Constants":4}],13:[function(require,module,exports){
var Utils = {};
/**
 * Draw the collision boxes for debug.
 */
Utils.drawCollisionBoxes = function (canvasCtx, tRexBox, obstacleBox) {
    canvasCtx.save();
    canvasCtx.strokeStyle = '#f00';
    canvasCtx.strokeRect(tRexBox.x, tRexBox.y,
        tRexBox.width, tRexBox.height);
    canvasCtx.strokeStyle = '#0f0';
    canvasCtx.strokeRect(obstacleBox.x, obstacleBox.y,
        obstacleBox.width, obstacleBox.height);
    canvasCtx.restore();
};

/**
 * Get random number.
 * @param {number} min
 * @param {number} max
 * @param {number}
 */
Utils.getRandomNum = function (min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * Decodes the base 64 audio to ArrayBuffer used by Web Audio.
 * @param {string} base64String
 */
Utils.decodeBase64ToArrayBuffer = function (base64String) {
    var len = (base64String.length / 4) * 3;
    var str = atob(base64String);
    var arrayBuffer = new ArrayBuffer(len);
    var bytes = new Uint8Array(arrayBuffer);

    for (var i = 0; i < len; i++) {
        bytes[i] = str.charCodeAt(i);
    }
    return bytes.buffer;
}

module.exports = Utils;
},{}],14:[function(require,module,exports){
var Runner = require('./components/Runner');
var server = require('./components/Server');

server.connected(function (socket) {
  var runner = new Runner('.interstitial-wrapper');
  runner.bind(socket);
});
},{"./components/Runner":10,"./components/Server":11}],15:[function(require,module,exports){
module.exports = function(target, firstSource) {
  "use strict";
  if (target === undefined || target === null)
    throw new TypeError("Cannot convert first argument to object");
  var to = Object(target);
  for (var i = 1; i < arguments.length; i++) {
    var nextSource = arguments[i];
    if (nextSource === undefined || nextSource === null) continue;
    var keysArray = Object.keys(Object(nextSource));
    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
      var nextKey = keysArray[nextIndex];
      var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
      if (desc !== undefined && desc.enumerable) to[nextKey] = nextSource[nextKey];
    }
  }
  return to;
};
},{}],16:[function(require,module,exports){
(function (global){
!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var f;"undefined"!=typeof window?f=window:"undefined"!=typeof global?f=global:"undefined"!=typeof self&&(f=self),f.io=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){

module.exports = _dereq_('./lib/');

},{"./lib/":2}],2:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var url = _dereq_('./url');
var parser = _dereq_('socket.io-parser');
var Manager = _dereq_('./manager');
var debug = _dereq_('debug')('socket.io-client');

/**
 * Module exports.
 */

module.exports = exports = lookup;

/**
 * Managers cache.
 */

var cache = exports.managers = {};

/**
 * Looks up an existing `Manager` for multiplexing.
 * If the user summons:
 *
 *   `io('http://localhost/a');`
 *   `io('http://localhost/b');`
 *
 * We reuse the existing instance based on same scheme/port/host,
 * and we initialize sockets for each namespace.
 *
 * @api public
 */

function lookup(uri, opts) {
  if (typeof uri == 'object') {
    opts = uri;
    uri = undefined;
  }

  opts = opts || {};

  var parsed = url(uri);
  var source = parsed.source;
  var id = parsed.id;
  var io;

  if (opts.forceNew || opts['force new connection'] || false === opts.multiplex) {
    debug('ignoring socket cache for %s', source);
    io = Manager(source, opts);
  } else {
    if (!cache[id]) {
      debug('new io instance for %s', source);
      cache[id] = Manager(source, opts);
    }
    io = cache[id];
  }

  return io.socket(parsed.path);
}

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = parser.protocol;

/**
 * `connect`.
 *
 * @param {String} uri
 * @api public
 */

exports.connect = lookup;

/**
 * Expose constructors for standalone build.
 *
 * @api public
 */

exports.Manager = _dereq_('./manager');
exports.Socket = _dereq_('./socket');

},{"./manager":3,"./socket":5,"./url":6,"debug":10,"socket.io-parser":46}],3:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var url = _dereq_('./url');
var eio = _dereq_('engine.io-client');
var Socket = _dereq_('./socket');
var Emitter = _dereq_('component-emitter');
var parser = _dereq_('socket.io-parser');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var object = _dereq_('object-component');
var debug = _dereq_('debug')('socket.io-client:manager');
var indexOf = _dereq_('indexof');
var Backoff = _dereq_('backo2');

/**
 * Module exports
 */

module.exports = Manager;

/**
 * `Manager` constructor.
 *
 * @param {String} engine instance or engine uri/opts
 * @param {Object} options
 * @api public
 */

function Manager(uri, opts){
  if (!(this instanceof Manager)) return new Manager(uri, opts);
  if (uri && ('object' == typeof uri)) {
    opts = uri;
    uri = undefined;
  }
  opts = opts || {};

  opts.path = opts.path || '/socket.io';
  this.nsps = {};
  this.subs = [];
  this.opts = opts;
  this.reconnection(opts.reconnection !== false);
  this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
  this.reconnectionDelay(opts.reconnectionDelay || 1000);
  this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
  this.randomizationFactor(opts.randomizationFactor || 0.5);
  this.backoff = new Backoff({
    min: this.reconnectionDelay(),
    max: this.reconnectionDelayMax(),
    jitter: this.randomizationFactor()
  });
  this.timeout(null == opts.timeout ? 20000 : opts.timeout);
  this.readyState = 'closed';
  this.uri = uri;
  this.connected = [];
  this.encoding = false;
  this.packetBuffer = [];
  this.encoder = new parser.Encoder();
  this.decoder = new parser.Decoder();
  this.autoConnect = opts.autoConnect !== false;
  if (this.autoConnect) this.open();
}

/**
 * Propagate given event to sockets and emit on `this`
 *
 * @api private
 */

Manager.prototype.emitAll = function() {
  this.emit.apply(this, arguments);
  for (var nsp in this.nsps) {
    this.nsps[nsp].emit.apply(this.nsps[nsp], arguments);
  }
};

/**
 * Update `socket.id` of all sockets
 *
 * @api private
 */

Manager.prototype.updateSocketIds = function(){
  for (var nsp in this.nsps) {
    this.nsps[nsp].id = this.engine.id;
  }
};

/**
 * Mix in `Emitter`.
 */

Emitter(Manager.prototype);

/**
 * Sets the `reconnection` config.
 *
 * @param {Boolean} true/false if it should automatically reconnect
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnection = function(v){
  if (!arguments.length) return this._reconnection;
  this._reconnection = !!v;
  return this;
};

/**
 * Sets the reconnection attempts config.
 *
 * @param {Number} max reconnection attempts before giving up
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionAttempts = function(v){
  if (!arguments.length) return this._reconnectionAttempts;
  this._reconnectionAttempts = v;
  return this;
};

/**
 * Sets the delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelay = function(v){
  if (!arguments.length) return this._reconnectionDelay;
  this._reconnectionDelay = v;
  this.backoff && this.backoff.setMin(v);
  return this;
};

Manager.prototype.randomizationFactor = function(v){
  if (!arguments.length) return this._randomizationFactor;
  this._randomizationFactor = v;
  this.backoff && this.backoff.setJitter(v);
  return this;
};

/**
 * Sets the maximum delay between reconnections.
 *
 * @param {Number} delay
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.reconnectionDelayMax = function(v){
  if (!arguments.length) return this._reconnectionDelayMax;
  this._reconnectionDelayMax = v;
  this.backoff && this.backoff.setMax(v);
  return this;
};

/**
 * Sets the connection timeout. `false` to disable
 *
 * @return {Manager} self or value
 * @api public
 */

Manager.prototype.timeout = function(v){
  if (!arguments.length) return this._timeout;
  this._timeout = v;
  return this;
};

/**
 * Starts trying to reconnect if reconnection is enabled and we have not
 * started reconnecting yet
 *
 * @api private
 */

Manager.prototype.maybeReconnectOnOpen = function() {
  // Only try to reconnect if it's the first time we're connecting
  if (!this.reconnecting && this._reconnection && this.backoff.attempts === 0) {
    // keeps reconnection from firing twice for the same reconnection loop
    this.reconnect();
  }
};


/**
 * Sets the current transport `socket`.
 *
 * @param {Function} optional, callback
 * @return {Manager} self
 * @api public
 */

Manager.prototype.open =
Manager.prototype.connect = function(fn){
  debug('readyState %s', this.readyState);
  if (~this.readyState.indexOf('open')) return this;

  debug('opening %s', this.uri);
  this.engine = eio(this.uri, this.opts);
  var socket = this.engine;
  var self = this;
  this.readyState = 'opening';
  this.skipReconnect = false;

  // emit `open`
  var openSub = on(socket, 'open', function() {
    self.onopen();
    fn && fn();
  });

  // emit `connect_error`
  var errorSub = on(socket, 'error', function(data){
    debug('connect_error');
    self.cleanup();
    self.readyState = 'closed';
    self.emitAll('connect_error', data);
    if (fn) {
      var err = new Error('Connection error');
      err.data = data;
      fn(err);
    } else {
      // Only do this if there is no fn to handle the error
      self.maybeReconnectOnOpen();
    }
  });

  // emit `connect_timeout`
  if (false !== this._timeout) {
    var timeout = this._timeout;
    debug('connect attempt will timeout after %d', timeout);

    // set timer
    var timer = setTimeout(function(){
      debug('connect attempt timed out after %d', timeout);
      openSub.destroy();
      socket.close();
      socket.emit('error', 'timeout');
      self.emitAll('connect_timeout', timeout);
    }, timeout);

    this.subs.push({
      destroy: function(){
        clearTimeout(timer);
      }
    });
  }

  this.subs.push(openSub);
  this.subs.push(errorSub);

  return this;
};

/**
 * Called upon transport open.
 *
 * @api private
 */

Manager.prototype.onopen = function(){
  debug('open');

  // clear old subs
  this.cleanup();

  // mark as open
  this.readyState = 'open';
  this.emit('open');

  // add new subs
  var socket = this.engine;
  this.subs.push(on(socket, 'data', bind(this, 'ondata')));
  this.subs.push(on(this.decoder, 'decoded', bind(this, 'ondecoded')));
  this.subs.push(on(socket, 'error', bind(this, 'onerror')));
  this.subs.push(on(socket, 'close', bind(this, 'onclose')));
};

/**
 * Called with data.
 *
 * @api private
 */

Manager.prototype.ondata = function(data){
  this.decoder.add(data);
};

/**
 * Called when parser fully decodes a packet.
 *
 * @api private
 */

Manager.prototype.ondecoded = function(packet) {
  this.emit('packet', packet);
};

/**
 * Called upon socket error.
 *
 * @api private
 */

Manager.prototype.onerror = function(err){
  debug('error', err);
  this.emitAll('error', err);
};

/**
 * Creates a new socket for the given `nsp`.
 *
 * @return {Socket}
 * @api public
 */

Manager.prototype.socket = function(nsp){
  var socket = this.nsps[nsp];
  if (!socket) {
    socket = new Socket(this, nsp);
    this.nsps[nsp] = socket;
    var self = this;
    socket.on('connect', function(){
      socket.id = self.engine.id;
      if (!~indexOf(self.connected, socket)) {
        self.connected.push(socket);
      }
    });
  }
  return socket;
};

/**
 * Called upon a socket close.
 *
 * @param {Socket} socket
 */

Manager.prototype.destroy = function(socket){
  var index = indexOf(this.connected, socket);
  if (~index) this.connected.splice(index, 1);
  if (this.connected.length) return;

  this.close();
};

/**
 * Writes a packet.
 *
 * @param {Object} packet
 * @api private
 */

Manager.prototype.packet = function(packet){
  debug('writing packet %j', packet);
  var self = this;

  if (!self.encoding) {
    // encode, then write to engine with result
    self.encoding = true;
    this.encoder.encode(packet, function(encodedPackets) {
      for (var i = 0; i < encodedPackets.length; i++) {
        self.engine.write(encodedPackets[i]);
      }
      self.encoding = false;
      self.processPacketQueue();
    });
  } else { // add packet to the queue
    self.packetBuffer.push(packet);
  }
};

/**
 * If packet buffer is non-empty, begins encoding the
 * next packet in line.
 *
 * @api private
 */

Manager.prototype.processPacketQueue = function() {
  if (this.packetBuffer.length > 0 && !this.encoding) {
    var pack = this.packetBuffer.shift();
    this.packet(pack);
  }
};

/**
 * Clean up transport subscriptions and packet buffer.
 *
 * @api private
 */

Manager.prototype.cleanup = function(){
  var sub;
  while (sub = this.subs.shift()) sub.destroy();

  this.packetBuffer = [];
  this.encoding = false;

  this.decoder.destroy();
};

/**
 * Close the current socket.
 *
 * @api private
 */

Manager.prototype.close =
Manager.prototype.disconnect = function(){
  this.skipReconnect = true;
  this.backoff.reset();
  this.readyState = 'closed';
  this.engine && this.engine.close();
};

/**
 * Called upon engine close.
 *
 * @api private
 */

Manager.prototype.onclose = function(reason){
  debug('close');
  this.cleanup();
  this.backoff.reset();
  this.readyState = 'closed';
  this.emit('close', reason);
  if (this._reconnection && !this.skipReconnect) {
    this.reconnect();
  }
};

/**
 * Attempt a reconnection.
 *
 * @api private
 */

Manager.prototype.reconnect = function(){
  if (this.reconnecting || this.skipReconnect) return this;

  var self = this;

  if (this.backoff.attempts >= this._reconnectionAttempts) {
    debug('reconnect failed');
    this.backoff.reset();
    this.emitAll('reconnect_failed');
    this.reconnecting = false;
  } else {
    var delay = this.backoff.duration();
    debug('will wait %dms before reconnect attempt', delay);

    this.reconnecting = true;
    var timer = setTimeout(function(){
      if (self.skipReconnect) return;

      debug('attempting reconnect');
      self.emitAll('reconnect_attempt', self.backoff.attempts);
      self.emitAll('reconnecting', self.backoff.attempts);

      // check again for the case socket closed in above events
      if (self.skipReconnect) return;

      self.open(function(err){
        if (err) {
          debug('reconnect attempt error');
          self.reconnecting = false;
          self.reconnect();
          self.emitAll('reconnect_error', err.data);
        } else {
          debug('reconnect success');
          self.onreconnect();
        }
      });
    }, delay);

    this.subs.push({
      destroy: function(){
        clearTimeout(timer);
      }
    });
  }
};

/**
 * Called upon successful reconnect.
 *
 * @api private
 */

Manager.prototype.onreconnect = function(){
  var attempt = this.backoff.attempts;
  this.reconnecting = false;
  this.backoff.reset();
  this.updateSocketIds();
  this.emitAll('reconnect', attempt);
};

},{"./on":4,"./socket":5,"./url":6,"backo2":7,"component-bind":8,"component-emitter":9,"debug":10,"engine.io-client":11,"indexof":42,"object-component":43,"socket.io-parser":46}],4:[function(_dereq_,module,exports){

/**
 * Module exports.
 */

module.exports = on;

/**
 * Helper for subscriptions.
 *
 * @param {Object|EventEmitter} obj with `Emitter` mixin or `EventEmitter`
 * @param {String} event name
 * @param {Function} callback
 * @api public
 */

function on(obj, ev, fn) {
  obj.on(ev, fn);
  return {
    destroy: function(){
      obj.removeListener(ev, fn);
    }
  };
}

},{}],5:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var parser = _dereq_('socket.io-parser');
var Emitter = _dereq_('component-emitter');
var toArray = _dereq_('to-array');
var on = _dereq_('./on');
var bind = _dereq_('component-bind');
var debug = _dereq_('debug')('socket.io-client:socket');
var hasBin = _dereq_('has-binary');

/**
 * Module exports.
 */

module.exports = exports = Socket;

/**
 * Internal events (blacklisted).
 * These events can't be emitted by the user.
 *
 * @api private
 */

var events = {
  connect: 1,
  connect_error: 1,
  connect_timeout: 1,
  disconnect: 1,
  error: 1,
  reconnect: 1,
  reconnect_attempt: 1,
  reconnect_failed: 1,
  reconnect_error: 1,
  reconnecting: 1
};

/**
 * Shortcut to `Emitter#emit`.
 */

var emit = Emitter.prototype.emit;

/**
 * `Socket` constructor.
 *
 * @api public
 */

function Socket(io, nsp){
  this.io = io;
  this.nsp = nsp;
  this.json = this; // compat
  this.ids = 0;
  this.acks = {};
  if (this.io.autoConnect) this.open();
  this.receiveBuffer = [];
  this.sendBuffer = [];
  this.connected = false;
  this.disconnected = true;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Subscribe to open, close and packet events
 *
 * @api private
 */

Socket.prototype.subEvents = function() {
  if (this.subs) return;

  var io = this.io;
  this.subs = [
    on(io, 'open', bind(this, 'onopen')),
    on(io, 'packet', bind(this, 'onpacket')),
    on(io, 'close', bind(this, 'onclose'))
  ];
};

/**
 * "Opens" the socket.
 *
 * @api public
 */

Socket.prototype.open =
Socket.prototype.connect = function(){
  if (this.connected) return this;

  this.subEvents();
  this.io.open(); // ensure open
  if ('open' == this.io.readyState) this.onopen();
  return this;
};

/**
 * Sends a `message` event.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.send = function(){
  var args = toArray(arguments);
  args.unshift('message');
  this.emit.apply(this, args);
  return this;
};

/**
 * Override `emit`.
 * If the event is in `events`, it's emitted normally.
 *
 * @param {String} event name
 * @return {Socket} self
 * @api public
 */

Socket.prototype.emit = function(ev){
  if (events.hasOwnProperty(ev)) {
    emit.apply(this, arguments);
    return this;
  }

  var args = toArray(arguments);
  var parserType = parser.EVENT; // default
  if (hasBin(args)) { parserType = parser.BINARY_EVENT; } // binary
  var packet = { type: parserType, data: args };

  // event ack callback
  if ('function' == typeof args[args.length - 1]) {
    debug('emitting packet with ack id %d', this.ids);
    this.acks[this.ids] = args.pop();
    packet.id = this.ids++;
  }

  if (this.connected) {
    this.packet(packet);
  } else {
    this.sendBuffer.push(packet);
  }

  return this;
};

/**
 * Sends a packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.packet = function(packet){
  packet.nsp = this.nsp;
  this.io.packet(packet);
};

/**
 * Called upon engine `open`.
 *
 * @api private
 */

Socket.prototype.onopen = function(){
  debug('transport is open - connecting');

  // write connect packet if necessary
  if ('/' != this.nsp) {
    this.packet({ type: parser.CONNECT });
  }
};

/**
 * Called upon engine `close`.
 *
 * @param {String} reason
 * @api private
 */

Socket.prototype.onclose = function(reason){
  debug('close (%s)', reason);
  this.connected = false;
  this.disconnected = true;
  delete this.id;
  this.emit('disconnect', reason);
};

/**
 * Called with socket packet.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onpacket = function(packet){
  if (packet.nsp != this.nsp) return;

  switch (packet.type) {
    case parser.CONNECT:
      this.onconnect();
      break;

    case parser.EVENT:
      this.onevent(packet);
      break;

    case parser.BINARY_EVENT:
      this.onevent(packet);
      break;

    case parser.ACK:
      this.onack(packet);
      break;

    case parser.BINARY_ACK:
      this.onack(packet);
      break;

    case parser.DISCONNECT:
      this.ondisconnect();
      break;

    case parser.ERROR:
      this.emit('error', packet.data);
      break;
  }
};

/**
 * Called upon a server event.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onevent = function(packet){
  var args = packet.data || [];
  debug('emitting event %j', args);

  if (null != packet.id) {
    debug('attaching ack callback to event');
    args.push(this.ack(packet.id));
  }

  if (this.connected) {
    emit.apply(this, args);
  } else {
    this.receiveBuffer.push(args);
  }
};

/**
 * Produces an ack callback to emit with an event.
 *
 * @api private
 */

Socket.prototype.ack = function(id){
  var self = this;
  var sent = false;
  return function(){
    // prevent double callbacks
    if (sent) return;
    sent = true;
    var args = toArray(arguments);
    debug('sending ack %j', args);

    var type = hasBin(args) ? parser.BINARY_ACK : parser.ACK;
    self.packet({
      type: type,
      id: id,
      data: args
    });
  };
};

/**
 * Called upon a server acknowlegement.
 *
 * @param {Object} packet
 * @api private
 */

Socket.prototype.onack = function(packet){
  debug('calling ack %s with %j', packet.id, packet.data);
  var fn = this.acks[packet.id];
  fn.apply(this, packet.data);
  delete this.acks[packet.id];
};

/**
 * Called upon server connect.
 *
 * @api private
 */

Socket.prototype.onconnect = function(){
  this.connected = true;
  this.disconnected = false;
  this.emit('connect');
  this.emitBuffered();
};

/**
 * Emit buffered events (received and emitted).
 *
 * @api private
 */

Socket.prototype.emitBuffered = function(){
  var i;
  for (i = 0; i < this.receiveBuffer.length; i++) {
    emit.apply(this, this.receiveBuffer[i]);
  }
  this.receiveBuffer = [];

  for (i = 0; i < this.sendBuffer.length; i++) {
    this.packet(this.sendBuffer[i]);
  }
  this.sendBuffer = [];
};

/**
 * Called upon server disconnect.
 *
 * @api private
 */

Socket.prototype.ondisconnect = function(){
  debug('server disconnect (%s)', this.nsp);
  this.destroy();
  this.onclose('io server disconnect');
};

/**
 * Called upon forced client/server side disconnections,
 * this method ensures the manager stops tracking us and
 * that reconnections don't get triggered for this.
 *
 * @api private.
 */

Socket.prototype.destroy = function(){
  if (this.subs) {
    // clean subscriptions to avoid reconnections
    for (var i = 0; i < this.subs.length; i++) {
      this.subs[i].destroy();
    }
    this.subs = null;
  }

  this.io.destroy(this);
};

/**
 * Disconnects the socket manually.
 *
 * @return {Socket} self
 * @api public
 */

Socket.prototype.close =
Socket.prototype.disconnect = function(){
  if (this.connected) {
    debug('performing disconnect (%s)', this.nsp);
    this.packet({ type: parser.DISCONNECT });
  }

  // remove socket from pool
  this.destroy();

  if (this.connected) {
    // fire events
    this.onclose('io client disconnect');
  }
  return this;
};

},{"./on":4,"component-bind":8,"component-emitter":9,"debug":10,"has-binary":38,"socket.io-parser":46,"to-array":50}],6:[function(_dereq_,module,exports){
(function (global){

/**
 * Module dependencies.
 */

var parseuri = _dereq_('parseuri');
var debug = _dereq_('debug')('socket.io-client:url');

/**
 * Module exports.
 */

module.exports = url;

/**
 * URL parser.
 *
 * @param {String} url
 * @param {Object} An object meant to mimic window.location.
 *                 Defaults to window.location.
 * @api public
 */

function url(uri, loc){
  var obj = uri;

  // default to window.location
  var loc = loc || global.location;
  if (null == uri) uri = loc.protocol + '//' + loc.host;

  // relative path support
  if ('string' == typeof uri) {
    if ('/' == uri.charAt(0)) {
      if ('/' == uri.charAt(1)) {
        uri = loc.protocol + uri;
      } else {
        uri = loc.hostname + uri;
      }
    }

    if (!/^(https?|wss?):\/\//.test(uri)) {
      debug('protocol-less url %s', uri);
      if ('undefined' != typeof loc) {
        uri = loc.protocol + '//' + uri;
      } else {
        uri = 'https://' + uri;
      }
    }

    // parse
    debug('parse %s', uri);
    obj = parseuri(uri);
  }

  // make sure we treat `localhost:80` and `localhost` equally
  if (!obj.port) {
    if (/^(http|ws)$/.test(obj.protocol)) {
      obj.port = '80';
    }
    else if (/^(http|ws)s$/.test(obj.protocol)) {
      obj.port = '443';
    }
  }

  obj.path = obj.path || '/';

  // define unique id
  obj.id = obj.protocol + '://' + obj.host + ':' + obj.port;
  // define href
  obj.href = obj.protocol + '://' + obj.host + (loc && loc.port == obj.port ? '' : (':' + obj.port));

  return obj;
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"debug":10,"parseuri":44}],7:[function(_dereq_,module,exports){

/**
 * Expose `Backoff`.
 */

module.exports = Backoff;

/**
 * Initialize backoff timer with `opts`.
 *
 * - `min` initial timeout in milliseconds [100]
 * - `max` max timeout [10000]
 * - `jitter` [0]
 * - `factor` [2]
 *
 * @param {Object} opts
 * @api public
 */

function Backoff(opts) {
  opts = opts || {};
  this.ms = opts.min || 100;
  this.max = opts.max || 10000;
  this.factor = opts.factor || 2;
  this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
  this.attempts = 0;
}

/**
 * Return the backoff duration.
 *
 * @return {Number}
 * @api public
 */

Backoff.prototype.duration = function(){
  var ms = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var rand =  Math.random();
    var deviation = Math.floor(rand * this.jitter * ms);
    ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
  }
  return Math.min(ms, this.max) | 0;
};

/**
 * Reset the number of attempts.
 *
 * @api public
 */

Backoff.prototype.reset = function(){
  this.attempts = 0;
};

/**
 * Set the minimum duration
 *
 * @api public
 */

Backoff.prototype.setMin = function(min){
  this.ms = min;
};

/**
 * Set the maximum duration
 *
 * @api public
 */

Backoff.prototype.setMax = function(max){
  this.max = max;
};

/**
 * Set the jitter
 *
 * @api public
 */

Backoff.prototype.setJitter = function(jitter){
  this.jitter = jitter;
};


},{}],8:[function(_dereq_,module,exports){
/**
 * Slice reference.
 */

var slice = [].slice;

/**
 * Bind `obj` to `fn`.
 *
 * @param {Object} obj
 * @param {Function|String} fn or string
 * @return {Function}
 * @api public
 */

module.exports = function(obj, fn){
  if ('string' == typeof fn) fn = obj[fn];
  if ('function' != typeof fn) throw new Error('bind() requires a function');
  var args = slice.call(arguments, 2);
  return function(){
    return fn.apply(obj, args.concat(slice.call(arguments)));
  }
};

},{}],9:[function(_dereq_,module,exports){

/**
 * Expose `Emitter`.
 */

module.exports = Emitter;

/**
 * Initialize a new `Emitter`.
 *
 * @api public
 */

function Emitter(obj) {
  if (obj) return mixin(obj);
};

/**
 * Mixin the emitter properties.
 *
 * @param {Object} obj
 * @return {Object}
 * @api private
 */

function mixin(obj) {
  for (var key in Emitter.prototype) {
    obj[key] = Emitter.prototype[key];
  }
  return obj;
}

/**
 * Listen on the given `event` with `fn`.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.on =
Emitter.prototype.addEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};
  (this._callbacks[event] = this._callbacks[event] || [])
    .push(fn);
  return this;
};

/**
 * Adds an `event` listener that will be invoked a single
 * time then automatically removed.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.once = function(event, fn){
  var self = this;
  this._callbacks = this._callbacks || {};

  function on() {
    self.off(event, on);
    fn.apply(this, arguments);
  }

  on.fn = fn;
  this.on(event, on);
  return this;
};

/**
 * Remove the given callback for `event` or all
 * registered callbacks.
 *
 * @param {String} event
 * @param {Function} fn
 * @return {Emitter}
 * @api public
 */

Emitter.prototype.off =
Emitter.prototype.removeListener =
Emitter.prototype.removeAllListeners =
Emitter.prototype.removeEventListener = function(event, fn){
  this._callbacks = this._callbacks || {};

  // all
  if (0 == arguments.length) {
    this._callbacks = {};
    return this;
  }

  // specific event
  var callbacks = this._callbacks[event];
  if (!callbacks) return this;

  // remove all handlers
  if (1 == arguments.length) {
    delete this._callbacks[event];
    return this;
  }

  // remove specific handler
  var cb;
  for (var i = 0; i < callbacks.length; i++) {
    cb = callbacks[i];
    if (cb === fn || cb.fn === fn) {
      callbacks.splice(i, 1);
      break;
    }
  }
  return this;
};

/**
 * Emit `event` with the given args.
 *
 * @param {String} event
 * @param {Mixed} ...
 * @return {Emitter}
 */

Emitter.prototype.emit = function(event){
  this._callbacks = this._callbacks || {};
  var args = [].slice.call(arguments, 1)
    , callbacks = this._callbacks[event];

  if (callbacks) {
    callbacks = callbacks.slice(0);
    for (var i = 0, len = callbacks.length; i < len; ++i) {
      callbacks[i].apply(this, args);
    }
  }

  return this;
};

/**
 * Return array of callbacks for `event`.
 *
 * @param {String} event
 * @return {Array}
 * @api public
 */

Emitter.prototype.listeners = function(event){
  this._callbacks = this._callbacks || {};
  return this._callbacks[event] || [];
};

/**
 * Check if this emitter has `event` handlers.
 *
 * @param {String} event
 * @return {Boolean}
 * @api public
 */

Emitter.prototype.hasListeners = function(event){
  return !! this.listeners(event).length;
};

},{}],10:[function(_dereq_,module,exports){

/**
 * Expose `debug()` as the module.
 */

module.exports = debug;

/**
 * Create a debugger with the given `name`.
 *
 * @param {String} name
 * @return {Type}
 * @api public
 */

function debug(name) {
  if (!debug.enabled(name)) return function(){};

  return function(fmt){
    fmt = coerce(fmt);

    var curr = new Date;
    var ms = curr - (debug[name] || curr);
    debug[name] = curr;

    fmt = name
      + ' '
      + fmt
      + ' +' + debug.humanize(ms);

    // This hackery is required for IE8
    // where `console.log` doesn't have 'apply'
    window.console
      && console.log
      && Function.prototype.apply.call(console.log, console, arguments);
  }
}

/**
 * The currently active debug mode names.
 */

debug.names = [];
debug.skips = [];

/**
 * Enables a debug mode by name. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} name
 * @api public
 */

debug.enable = function(name) {
  try {
    localStorage.debug = name;
  } catch(e){}

  var split = (name || '').split(/[\s,]+/)
    , len = split.length;

  for (var i = 0; i < len; i++) {
    name = split[i].replace('*', '.*?');
    if (name[0] === '-') {
      debug.skips.push(new RegExp('^' + name.substr(1) + '$'));
    }
    else {
      debug.names.push(new RegExp('^' + name + '$'));
    }
  }
};

/**
 * Disable debug output.
 *
 * @api public
 */

debug.disable = function(){
  debug.enable('');
};

/**
 * Humanize the given `ms`.
 *
 * @param {Number} m
 * @return {String}
 * @api private
 */

debug.humanize = function(ms) {
  var sec = 1000
    , min = 60 * 1000
    , hour = 60 * min;

  if (ms >= hour) return (ms / hour).toFixed(1) + 'h';
  if (ms >= min) return (ms / min).toFixed(1) + 'm';
  if (ms >= sec) return (ms / sec | 0) + 's';
  return ms + 'ms';
};

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

debug.enabled = function(name) {
  for (var i = 0, len = debug.skips.length; i < len; i++) {
    if (debug.skips[i].test(name)) {
      return false;
    }
  }
  for (var i = 0, len = debug.names.length; i < len; i++) {
    if (debug.names[i].test(name)) {
      return true;
    }
  }
  return false;
};

/**
 * Coerce `val`.
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

// persist

try {
  if (window.localStorage) debug.enable(localStorage.debug);
} catch(e){}

},{}],11:[function(_dereq_,module,exports){

module.exports =  _dereq_('./lib/');

},{"./lib/":12}],12:[function(_dereq_,module,exports){

module.exports = _dereq_('./socket');

/**
 * Exports parser
 *
 * @api public
 *
 */
module.exports.parser = _dereq_('engine.io-parser');

},{"./socket":13,"engine.io-parser":25}],13:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var transports = _dereq_('./transports');
var Emitter = _dereq_('component-emitter');
var debug = _dereq_('debug')('engine.io-client:socket');
var index = _dereq_('indexof');
var parser = _dereq_('engine.io-parser');
var parseuri = _dereq_('parseuri');
var parsejson = _dereq_('parsejson');
var parseqs = _dereq_('parseqs');

/**
 * Module exports.
 */

module.exports = Socket;

/**
 * Noop function.
 *
 * @api private
 */

function noop(){}

/**
 * Socket constructor.
 *
 * @param {String|Object} uri or options
 * @param {Object} options
 * @api public
 */

function Socket(uri, opts){
  if (!(this instanceof Socket)) return new Socket(uri, opts);

  opts = opts || {};

  if (uri && 'object' == typeof uri) {
    opts = uri;
    uri = null;
  }

  if (uri) {
    uri = parseuri(uri);
    opts.host = uri.host;
    opts.secure = uri.protocol == 'https' || uri.protocol == 'wss';
    opts.port = uri.port;
    if (uri.query) opts.query = uri.query;
  }

  this.secure = null != opts.secure ? opts.secure :
    (global.location && 'https:' == location.protocol);

  if (opts.host) {
    var pieces = opts.host.split(':');
    opts.hostname = pieces.shift();
    if (pieces.length) {
      opts.port = pieces.pop();
    } else if (!opts.port) {
      // if no port is specified manually, use the protocol default
      opts.port = this.secure ? '443' : '80';
    }
  }

  this.agent = opts.agent || false;
  this.hostname = opts.hostname ||
    (global.location ? location.hostname : 'localhost');
  this.port = opts.port || (global.location && location.port ?
       location.port :
       (this.secure ? 443 : 80));
  this.query = opts.query || {};
  if ('string' == typeof this.query) this.query = parseqs.decode(this.query);
  this.upgrade = false !== opts.upgrade;
  this.path = (opts.path || '/engine.io').replace(/\/$/, '') + '/';
  this.forceJSONP = !!opts.forceJSONP;
  this.jsonp = false !== opts.jsonp;
  this.forceBase64 = !!opts.forceBase64;
  this.enablesXDR = !!opts.enablesXDR;
  this.timestampParam = opts.timestampParam || 't';
  this.timestampRequests = opts.timestampRequests;
  this.transports = opts.transports || ['polling', 'websocket'];
  this.readyState = '';
  this.writeBuffer = [];
  this.callbackBuffer = [];
  this.policyPort = opts.policyPort || 843;
  this.rememberUpgrade = opts.rememberUpgrade || false;
  this.binaryType = null;
  this.onlyBinaryUpgrades = opts.onlyBinaryUpgrades;

  // SSL options for Node.js client
  this.pfx = opts.pfx || null;
  this.key = opts.key || null;
  this.passphrase = opts.passphrase || null;
  this.cert = opts.cert || null;
  this.ca = opts.ca || null;
  this.ciphers = opts.ciphers || null;
  this.rejectUnauthorized = opts.rejectUnauthorized || null;

  this.open();
}

Socket.priorWebsocketSuccess = false;

/**
 * Mix in `Emitter`.
 */

Emitter(Socket.prototype);

/**
 * Protocol version.
 *
 * @api public
 */

Socket.protocol = parser.protocol; // this is an int

/**
 * Expose deps for legacy compatibility
 * and standalone browser access.
 */

Socket.Socket = Socket;
Socket.Transport = _dereq_('./transport');
Socket.transports = _dereq_('./transports');
Socket.parser = _dereq_('engine.io-parser');

/**
 * Creates transport of the given type.
 *
 * @param {String} transport name
 * @return {Transport}
 * @api private
 */

Socket.prototype.createTransport = function (name) {
  debug('creating transport "%s"', name);
  var query = clone(this.query);

  // append engine.io protocol identifier
  query.EIO = parser.protocol;

  // transport name
  query.transport = name;

  // session id if we already have one
  if (this.id) query.sid = this.id;

  var transport = new transports[name]({
    agent: this.agent,
    hostname: this.hostname,
    port: this.port,
    secure: this.secure,
    path: this.path,
    query: query,
    forceJSONP: this.forceJSONP,
    jsonp: this.jsonp,
    forceBase64: this.forceBase64,
    enablesXDR: this.enablesXDR,
    timestampRequests: this.timestampRequests,
    timestampParam: this.timestampParam,
    policyPort: this.policyPort,
    socket: this,
    pfx: this.pfx,
    key: this.key,
    passphrase: this.passphrase,
    cert: this.cert,
    ca: this.ca,
    ciphers: this.ciphers,
    rejectUnauthorized: this.rejectUnauthorized
  });

  return transport;
};

function clone (obj) {
  var o = {};
  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      o[i] = obj[i];
    }
  }
  return o;
}

/**
 * Initializes transport to use and starts probe.
 *
 * @api private
 */
Socket.prototype.open = function () {
  var transport;
  if (this.rememberUpgrade && Socket.priorWebsocketSuccess && this.transports.indexOf('websocket') != -1) {
    transport = 'websocket';
  } else if (0 == this.transports.length) {
    // Emit error on next tick so it can be listened to
    var self = this;
    setTimeout(function() {
      self.emit('error', 'No transports available');
    }, 0);
    return;
  } else {
    transport = this.transports[0];
  }
  this.readyState = 'opening';

  // Retry with the next transport if the transport is disabled (jsonp: false)
  var transport;
  try {
    transport = this.createTransport(transport);
  } catch (e) {
    this.transports.shift();
    this.open();
    return;
  }

  transport.open();
  this.setTransport(transport);
};

/**
 * Sets the current transport. Disables the existing one (if any).
 *
 * @api private
 */

Socket.prototype.setTransport = function(transport){
  debug('setting transport %s', transport.name);
  var self = this;

  if (this.transport) {
    debug('clearing existing transport %s', this.transport.name);
    this.transport.removeAllListeners();
  }

  // set up transport
  this.transport = transport;

  // set up transport listeners
  transport
  .on('drain', function(){
    self.onDrain();
  })
  .on('packet', function(packet){
    self.onPacket(packet);
  })
  .on('error', function(e){
    self.onError(e);
  })
  .on('close', function(){
    self.onClose('transport close');
  });
};

/**
 * Probes a transport.
 *
 * @param {String} transport name
 * @api private
 */

Socket.prototype.probe = function (name) {
  debug('probing transport "%s"', name);
  var transport = this.createTransport(name, { probe: 1 })
    , failed = false
    , self = this;

  Socket.priorWebsocketSuccess = false;

  function onTransportOpen(){
    if (self.onlyBinaryUpgrades) {
      var upgradeLosesBinary = !this.supportsBinary && self.transport.supportsBinary;
      failed = failed || upgradeLosesBinary;
    }
    if (failed) return;

    debug('probe transport "%s" opened', name);
    transport.send([{ type: 'ping', data: 'probe' }]);
    transport.once('packet', function (msg) {
      if (failed) return;
      if ('pong' == msg.type && 'probe' == msg.data) {
        debug('probe transport "%s" pong', name);
        self.upgrading = true;
        self.emit('upgrading', transport);
        if (!transport) return;
        Socket.priorWebsocketSuccess = 'websocket' == transport.name;

        debug('pausing current transport "%s"', self.transport.name);
        self.transport.pause(function () {
          if (failed) return;
          if ('closed' == self.readyState) return;
          debug('changing transport and sending upgrade packet');

          cleanup();

          self.setTransport(transport);
          transport.send([{ type: 'upgrade' }]);
          self.emit('upgrade', transport);
          transport = null;
          self.upgrading = false;
          self.flush();
        });
      } else {
        debug('probe transport "%s" failed', name);
        var err = new Error('probe error');
        err.transport = transport.name;
        self.emit('upgradeError', err);
      }
    });
  }

  function freezeTransport() {
    if (failed) return;

    // Any callback called by transport should be ignored since now
    failed = true;

    cleanup();

    transport.close();
    transport = null;
  }

  //Handle any error that happens while probing
  function onerror(err) {
    var error = new Error('probe error: ' + err);
    error.transport = transport.name;

    freezeTransport();

    debug('probe transport "%s" failed because of error: %s', name, err);

    self.emit('upgradeError', error);
  }

  function onTransportClose(){
    onerror("transport closed");
  }

  //When the socket is closed while we're probing
  function onclose(){
    onerror("socket closed");
  }

  //When the socket is upgraded while we're probing
  function onupgrade(to){
    if (transport && to.name != transport.name) {
      debug('"%s" works - aborting "%s"', to.name, transport.name);
      freezeTransport();
    }
  }

  //Remove all listeners on the transport and on self
  function cleanup(){
    transport.removeListener('open', onTransportOpen);
    transport.removeListener('error', onerror);
    transport.removeListener('close', onTransportClose);
    self.removeListener('close', onclose);
    self.removeListener('upgrading', onupgrade);
  }

  transport.once('open', onTransportOpen);
  transport.once('error', onerror);
  transport.once('close', onTransportClose);

  this.once('close', onclose);
  this.once('upgrading', onupgrade);

  transport.open();

};

/**
 * Called when connection is deemed open.
 *
 * @api public
 */

Socket.prototype.onOpen = function () {
  debug('socket open');
  this.readyState = 'open';
  Socket.priorWebsocketSuccess = 'websocket' == this.transport.name;
  this.emit('open');
  this.flush();

  // we check for `readyState` in case an `open`
  // listener already closed the socket
  if ('open' == this.readyState && this.upgrade && this.transport.pause) {
    debug('starting upgrade probes');
    for (var i = 0, l = this.upgrades.length; i < l; i++) {
      this.probe(this.upgrades[i]);
    }
  }
};

/**
 * Handles a packet.
 *
 * @api private
 */

Socket.prototype.onPacket = function (packet) {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    debug('socket receive: type "%s", data "%s"', packet.type, packet.data);

    this.emit('packet', packet);

    // Socket is live - any packet counts
    this.emit('heartbeat');

    switch (packet.type) {
      case 'open':
        this.onHandshake(parsejson(packet.data));
        break;

      case 'pong':
        this.setPing();
        break;

      case 'error':
        var err = new Error('server error');
        err.code = packet.data;
        this.emit('error', err);
        break;

      case 'message':
        this.emit('data', packet.data);
        this.emit('message', packet.data);
        break;
    }
  } else {
    debug('packet received with socket readyState "%s"', this.readyState);
  }
};

/**
 * Called upon handshake completion.
 *
 * @param {Object} handshake obj
 * @api private
 */

Socket.prototype.onHandshake = function (data) {
  this.emit('handshake', data);
  this.id = data.sid;
  this.transport.query.sid = data.sid;
  this.upgrades = this.filterUpgrades(data.upgrades);
  this.pingInterval = data.pingInterval;
  this.pingTimeout = data.pingTimeout;
  this.onOpen();
  // In case open handler closes socket
  if  ('closed' == this.readyState) return;
  this.setPing();

  // Prolong liveness of socket on heartbeat
  this.removeListener('heartbeat', this.onHeartbeat);
  this.on('heartbeat', this.onHeartbeat);
};

/**
 * Resets ping timeout.
 *
 * @api private
 */

Socket.prototype.onHeartbeat = function (timeout) {
  clearTimeout(this.pingTimeoutTimer);
  var self = this;
  self.pingTimeoutTimer = setTimeout(function () {
    if ('closed' == self.readyState) return;
    self.onClose('ping timeout');
  }, timeout || (self.pingInterval + self.pingTimeout));
};

/**
 * Pings server every `this.pingInterval` and expects response
 * within `this.pingTimeout` or closes connection.
 *
 * @api private
 */

Socket.prototype.setPing = function () {
  var self = this;
  clearTimeout(self.pingIntervalTimer);
  self.pingIntervalTimer = setTimeout(function () {
    debug('writing ping packet - expecting pong within %sms', self.pingTimeout);
    self.ping();
    self.onHeartbeat(self.pingTimeout);
  }, self.pingInterval);
};

/**
* Sends a ping packet.
*
* @api public
*/

Socket.prototype.ping = function () {
  this.sendPacket('ping');
};

/**
 * Called on `drain` event
 *
 * @api private
 */

Socket.prototype.onDrain = function() {
  for (var i = 0; i < this.prevBufferLen; i++) {
    if (this.callbackBuffer[i]) {
      this.callbackBuffer[i]();
    }
  }

  this.writeBuffer.splice(0, this.prevBufferLen);
  this.callbackBuffer.splice(0, this.prevBufferLen);

  // setting prevBufferLen = 0 is very important
  // for example, when upgrading, upgrade packet is sent over,
  // and a nonzero prevBufferLen could cause problems on `drain`
  this.prevBufferLen = 0;

  if (this.writeBuffer.length == 0) {
    this.emit('drain');
  } else {
    this.flush();
  }
};

/**
 * Flush write buffers.
 *
 * @api private
 */

Socket.prototype.flush = function () {
  if ('closed' != this.readyState && this.transport.writable &&
    !this.upgrading && this.writeBuffer.length) {
    debug('flushing %d packets in socket', this.writeBuffer.length);
    this.transport.send(this.writeBuffer);
    // keep track of current length of writeBuffer
    // splice writeBuffer and callbackBuffer on `drain`
    this.prevBufferLen = this.writeBuffer.length;
    this.emit('flush');
  }
};

/**
 * Sends a message.
 *
 * @param {String} message.
 * @param {Function} callback function.
 * @return {Socket} for chaining.
 * @api public
 */

Socket.prototype.write =
Socket.prototype.send = function (msg, fn) {
  this.sendPacket('message', msg, fn);
  return this;
};

/**
 * Sends a packet.
 *
 * @param {String} packet type.
 * @param {String} data.
 * @param {Function} callback function.
 * @api private
 */

Socket.prototype.sendPacket = function (type, data, fn) {
  if ('closing' == this.readyState || 'closed' == this.readyState) {
    return;
  }

  var packet = { type: type, data: data };
  this.emit('packetCreate', packet);
  this.writeBuffer.push(packet);
  this.callbackBuffer.push(fn);
  this.flush();
};

/**
 * Closes the connection.
 *
 * @api private
 */

Socket.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.readyState = 'closing';

    var self = this;

    function close() {
      self.onClose('forced close');
      debug('socket closing - telling transport to close');
      self.transport.close();
    }

    function cleanupAndClose() {
      self.removeListener('upgrade', cleanupAndClose);
      self.removeListener('upgradeError', cleanupAndClose);
      close();
    }

    function waitForUpgrade() {
      // wait for upgrade to finish since we can't send packets while pausing a transport
      self.once('upgrade', cleanupAndClose);
      self.once('upgradeError', cleanupAndClose);
    }

    if (this.writeBuffer.length) {
      this.once('drain', function() {
        if (this.upgrading) {
          waitForUpgrade();
        } else {
          close();
        }
      });
    } else if (this.upgrading) {
      waitForUpgrade();
    } else {
      close();
    }
  }

  return this;
};

/**
 * Called upon transport error
 *
 * @api private
 */

Socket.prototype.onError = function (err) {
  debug('socket error %j', err);
  Socket.priorWebsocketSuccess = false;
  this.emit('error', err);
  this.onClose('transport error', err);
};

/**
 * Called upon transport close.
 *
 * @api private
 */

Socket.prototype.onClose = function (reason, desc) {
  if ('opening' == this.readyState || 'open' == this.readyState || 'closing' == this.readyState) {
    debug('socket close with reason: "%s"', reason);
    var self = this;

    // clear timers
    clearTimeout(this.pingIntervalTimer);
    clearTimeout(this.pingTimeoutTimer);

    // clean buffers in next tick, so developers can still
    // grab the buffers on `close` event
    setTimeout(function() {
      self.writeBuffer = [];
      self.callbackBuffer = [];
      self.prevBufferLen = 0;
    }, 0);

    // stop event from firing again for transport
    this.transport.removeAllListeners('close');

    // ensure transport won't stay open
    this.transport.close();

    // ignore further transport communication
    this.transport.removeAllListeners();

    // set ready state
    this.readyState = 'closed';

    // clear session id
    this.id = null;

    // emit close event
    this.emit('close', reason, desc);
  }
};

/**
 * Filters upgrades, returning only those matching client transports.
 *
 * @param {Array} server upgrades
 * @api private
 *
 */

Socket.prototype.filterUpgrades = function (upgrades) {
  var filteredUpgrades = [];
  for (var i = 0, j = upgrades.length; i<j; i++) {
    if (~index(this.transports, upgrades[i])) filteredUpgrades.push(upgrades[i]);
  }
  return filteredUpgrades;
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./transport":14,"./transports":15,"component-emitter":9,"debug":22,"engine.io-parser":25,"indexof":42,"parsejson":34,"parseqs":35,"parseuri":36}],14:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var parser = _dereq_('engine.io-parser');
var Emitter = _dereq_('component-emitter');

/**
 * Module exports.
 */

module.exports = Transport;

/**
 * Transport abstract constructor.
 *
 * @param {Object} options.
 * @api private
 */

function Transport (opts) {
  this.path = opts.path;
  this.hostname = opts.hostname;
  this.port = opts.port;
  this.secure = opts.secure;
  this.query = opts.query;
  this.timestampParam = opts.timestampParam;
  this.timestampRequests = opts.timestampRequests;
  this.readyState = '';
  this.agent = opts.agent || false;
  this.socket = opts.socket;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;
}

/**
 * Mix in `Emitter`.
 */

Emitter(Transport.prototype);

/**
 * A counter used to prevent collisions in the timestamps used
 * for cache busting.
 */

Transport.timestamps = 0;

/**
 * Emits an error.
 *
 * @param {String} str
 * @return {Transport} for chaining
 * @api public
 */

Transport.prototype.onError = function (msg, desc) {
  var err = new Error(msg);
  err.type = 'TransportError';
  err.description = desc;
  this.emit('error', err);
  return this;
};

/**
 * Opens the transport.
 *
 * @api public
 */

Transport.prototype.open = function () {
  if ('closed' == this.readyState || '' == this.readyState) {
    this.readyState = 'opening';
    this.doOpen();
  }

  return this;
};

/**
 * Closes the transport.
 *
 * @api private
 */

Transport.prototype.close = function () {
  if ('opening' == this.readyState || 'open' == this.readyState) {
    this.doClose();
    this.onClose();
  }

  return this;
};

/**
 * Sends multiple packets.
 *
 * @param {Array} packets
 * @api private
 */

Transport.prototype.send = function(packets){
  if ('open' == this.readyState) {
    this.write(packets);
  } else {
    throw new Error('Transport not open');
  }
};

/**
 * Called upon open
 *
 * @api private
 */

Transport.prototype.onOpen = function () {
  this.readyState = 'open';
  this.writable = true;
  this.emit('open');
};

/**
 * Called with data.
 *
 * @param {String} data
 * @api private
 */

Transport.prototype.onData = function(data){
  var packet = parser.decodePacket(data, this.socket.binaryType);
  this.onPacket(packet);
};

/**
 * Called with a decoded packet.
 */

Transport.prototype.onPacket = function (packet) {
  this.emit('packet', packet);
};

/**
 * Called upon close.
 *
 * @api private
 */

Transport.prototype.onClose = function () {
  this.readyState = 'closed';
  this.emit('close');
};

},{"component-emitter":9,"engine.io-parser":25}],15:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies
 */

var XMLHttpRequest = _dereq_('xmlhttprequest');
var XHR = _dereq_('./polling-xhr');
var JSONP = _dereq_('./polling-jsonp');
var websocket = _dereq_('./websocket');

/**
 * Export transports.
 */

exports.polling = polling;
exports.websocket = websocket;

/**
 * Polling transport polymorphic constructor.
 * Decides on xhr vs jsonp based on feature detection.
 *
 * @api private
 */

function polling(opts){
  var xhr;
  var xd = false;
  var xs = false;
  var jsonp = false !== opts.jsonp;

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    xd = opts.hostname != location.hostname || port != opts.port;
    xs = opts.secure != isSSL;
  }

  opts.xdomain = xd;
  opts.xscheme = xs;
  xhr = new XMLHttpRequest(opts);

  if ('open' in xhr && !opts.forceJSONP) {
    return new XHR(opts);
  } else {
    if (!jsonp) throw new Error('JSONP disabled');
    return new JSONP(opts);
  }
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling-jsonp":16,"./polling-xhr":17,"./websocket":19,"xmlhttprequest":20}],16:[function(_dereq_,module,exports){
(function (global){

/**
 * Module requirements.
 */

var Polling = _dereq_('./polling');
var inherit = _dereq_('component-inherit');

/**
 * Module exports.
 */

module.exports = JSONPPolling;

/**
 * Cached regular expressions.
 */

var rNewline = /\n/g;
var rEscapedNewline = /\\n/g;

/**
 * Global JSONP callbacks.
 */

var callbacks;

/**
 * Callbacks count.
 */

var index = 0;

/**
 * Noop.
 */

function empty () { }

/**
 * JSONP Polling constructor.
 *
 * @param {Object} opts.
 * @api public
 */

function JSONPPolling (opts) {
  Polling.call(this, opts);

  this.query = this.query || {};

  // define global callbacks array if not present
  // we do this here (lazily) to avoid unneeded global pollution
  if (!callbacks) {
    // we need to consider multiple engines in the same page
    if (!global.___eio) global.___eio = [];
    callbacks = global.___eio;
  }

  // callback identifier
  this.index = callbacks.length;

  // add callback to jsonp global
  var self = this;
  callbacks.push(function (msg) {
    self.onData(msg);
  });

  // append to query string
  this.query.j = this.index;

  // prevent spurious errors from being emitted when the window is unloaded
  if (global.document && global.addEventListener) {
    global.addEventListener('beforeunload', function () {
      if (self.script) self.script.onerror = empty;
    }, false);
  }
}

/**
 * Inherits from Polling.
 */

inherit(JSONPPolling, Polling);

/*
 * JSONP only supports binary as base64 encoded strings
 */

JSONPPolling.prototype.supportsBinary = false;

/**
 * Closes the socket.
 *
 * @api private
 */

JSONPPolling.prototype.doClose = function () {
  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  if (this.form) {
    this.form.parentNode.removeChild(this.form);
    this.form = null;
    this.iframe = null;
  }

  Polling.prototype.doClose.call(this);
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

JSONPPolling.prototype.doPoll = function () {
  var self = this;
  var script = document.createElement('script');

  if (this.script) {
    this.script.parentNode.removeChild(this.script);
    this.script = null;
  }

  script.async = true;
  script.src = this.uri();
  script.onerror = function(e){
    self.onError('jsonp poll error',e);
  };

  var insertAt = document.getElementsByTagName('script')[0];
  insertAt.parentNode.insertBefore(script, insertAt);
  this.script = script;

  var isUAgecko = 'undefined' != typeof navigator && /gecko/i.test(navigator.userAgent);
  
  if (isUAgecko) {
    setTimeout(function () {
      var iframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      document.body.removeChild(iframe);
    }, 100);
  }
};

/**
 * Writes with a hidden iframe.
 *
 * @param {String} data to send
 * @param {Function} called upon flush.
 * @api private
 */

JSONPPolling.prototype.doWrite = function (data, fn) {
  var self = this;

  if (!this.form) {
    var form = document.createElement('form');
    var area = document.createElement('textarea');
    var id = this.iframeId = 'eio_iframe_' + this.index;
    var iframe;

    form.className = 'socketio';
    form.style.position = 'absolute';
    form.style.top = '-1000px';
    form.style.left = '-1000px';
    form.target = id;
    form.method = 'POST';
    form.setAttribute('accept-charset', 'utf-8');
    area.name = 'd';
    form.appendChild(area);
    document.body.appendChild(form);

    this.form = form;
    this.area = area;
  }

  this.form.action = this.uri();

  function complete () {
    initIframe();
    fn();
  }

  function initIframe () {
    if (self.iframe) {
      try {
        self.form.removeChild(self.iframe);
      } catch (e) {
        self.onError('jsonp polling iframe removal error', e);
      }
    }

    try {
      // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
      var html = '<iframe src="javascript:0" name="'+ self.iframeId +'">';
      iframe = document.createElement(html);
    } catch (e) {
      iframe = document.createElement('iframe');
      iframe.name = self.iframeId;
      iframe.src = 'javascript:0';
    }

    iframe.id = self.iframeId;

    self.form.appendChild(iframe);
    self.iframe = iframe;
  }

  initIframe();

  // escape \n to prevent it from being converted into \r\n by some UAs
  // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
  data = data.replace(rEscapedNewline, '\\\n');
  this.area.value = data.replace(rNewline, '\\n');

  try {
    this.form.submit();
  } catch(e) {}

  if (this.iframe.attachEvent) {
    this.iframe.onreadystatechange = function(){
      if (self.iframe.readyState == 'complete') {
        complete();
      }
    };
  } else {
    this.iframe.onload = complete;
  }
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":18,"component-inherit":21}],17:[function(_dereq_,module,exports){
(function (global){
/**
 * Module requirements.
 */

var XMLHttpRequest = _dereq_('xmlhttprequest');
var Polling = _dereq_('./polling');
var Emitter = _dereq_('component-emitter');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:polling-xhr');

/**
 * Module exports.
 */

module.exports = XHR;
module.exports.Request = Request;

/**
 * Empty function
 */

function empty(){}

/**
 * XHR Polling constructor.
 *
 * @param {Object} opts
 * @api public
 */

function XHR(opts){
  Polling.call(this, opts);

  if (global.location) {
    var isSSL = 'https:' == location.protocol;
    var port = location.port;

    // some user agents have empty `location.port`
    if (!port) {
      port = isSSL ? 443 : 80;
    }

    this.xd = opts.hostname != global.location.hostname ||
      port != opts.port;
    this.xs = opts.secure != isSSL;
  }
}

/**
 * Inherits from Polling.
 */

inherit(XHR, Polling);

/**
 * XHR supports binary
 */

XHR.prototype.supportsBinary = true;

/**
 * Creates a request.
 *
 * @param {String} method
 * @api private
 */

XHR.prototype.request = function(opts){
  opts = opts || {};
  opts.uri = this.uri();
  opts.xd = this.xd;
  opts.xs = this.xs;
  opts.agent = this.agent || false;
  opts.supportsBinary = this.supportsBinary;
  opts.enablesXDR = this.enablesXDR;

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  return new Request(opts);
};

/**
 * Sends data.
 *
 * @param {String} data to send.
 * @param {Function} called upon flush.
 * @api private
 */

XHR.prototype.doWrite = function(data, fn){
  var isBinary = typeof data !== 'string' && data !== undefined;
  var req = this.request({ method: 'POST', data: data, isBinary: isBinary });
  var self = this;
  req.on('success', fn);
  req.on('error', function(err){
    self.onError('xhr post error', err);
  });
  this.sendXhr = req;
};

/**
 * Starts a poll cycle.
 *
 * @api private
 */

XHR.prototype.doPoll = function(){
  debug('xhr poll');
  var req = this.request();
  var self = this;
  req.on('data', function(data){
    self.onData(data);
  });
  req.on('error', function(err){
    self.onError('xhr poll error', err);
  });
  this.pollXhr = req;
};

/**
 * Request constructor
 *
 * @param {Object} options
 * @api public
 */

function Request(opts){
  this.method = opts.method || 'GET';
  this.uri = opts.uri;
  this.xd = !!opts.xd;
  this.xs = !!opts.xs;
  this.async = false !== opts.async;
  this.data = undefined != opts.data ? opts.data : null;
  this.agent = opts.agent;
  this.isBinary = opts.isBinary;
  this.supportsBinary = opts.supportsBinary;
  this.enablesXDR = opts.enablesXDR;

  // SSL options for Node.js client
  this.pfx = opts.pfx;
  this.key = opts.key;
  this.passphrase = opts.passphrase;
  this.cert = opts.cert;
  this.ca = opts.ca;
  this.ciphers = opts.ciphers;
  this.rejectUnauthorized = opts.rejectUnauthorized;

  this.create();
}

/**
 * Mix in `Emitter`.
 */

Emitter(Request.prototype);

/**
 * Creates the XHR object and sends the request.
 *
 * @api private
 */

Request.prototype.create = function(){
  var opts = { agent: this.agent, xdomain: this.xd, xscheme: this.xs, enablesXDR: this.enablesXDR };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  var xhr = this.xhr = new XMLHttpRequest(opts);
  var self = this;

  try {
    debug('xhr open %s: %s', this.method, this.uri);
    xhr.open(this.method, this.uri, this.async);
    if (this.supportsBinary) {
      // This has to be done after open because Firefox is stupid
      // http://stackoverflow.com/questions/13216903/get-binary-data-with-xmlhttprequest-in-a-firefox-extension
      xhr.responseType = 'arraybuffer';
    }

    if ('POST' == this.method) {
      try {
        if (this.isBinary) {
          xhr.setRequestHeader('Content-type', 'application/octet-stream');
        } else {
          xhr.setRequestHeader('Content-type', 'text/plain;charset=UTF-8');
        }
      } catch (e) {}
    }

    // ie6 check
    if ('withCredentials' in xhr) {
      xhr.withCredentials = true;
    }

    if (this.hasXDR()) {
      xhr.onload = function(){
        self.onLoad();
      };
      xhr.onerror = function(){
        self.onError(xhr.responseText);
      };
    } else {
      xhr.onreadystatechange = function(){
        if (4 != xhr.readyState) return;
        if (200 == xhr.status || 1223 == xhr.status) {
          self.onLoad();
        } else {
          // make sure the `error` event handler that's user-set
          // does not throw in the same tick and gets caught here
          setTimeout(function(){
            self.onError(xhr.status);
          }, 0);
        }
      };
    }

    debug('xhr data %s', this.data);
    xhr.send(this.data);
  } catch (e) {
    // Need to defer since .create() is called directly fhrom the constructor
    // and thus the 'error' event can only be only bound *after* this exception
    // occurs.  Therefore, also, we cannot throw here at all.
    setTimeout(function() {
      self.onError(e);
    }, 0);
    return;
  }

  if (global.document) {
    this.index = Request.requestsCount++;
    Request.requests[this.index] = this;
  }
};

/**
 * Called upon successful response.
 *
 * @api private
 */

Request.prototype.onSuccess = function(){
  this.emit('success');
  this.cleanup();
};

/**
 * Called if we have data.
 *
 * @api private
 */

Request.prototype.onData = function(data){
  this.emit('data', data);
  this.onSuccess();
};

/**
 * Called upon error.
 *
 * @api private
 */

Request.prototype.onError = function(err){
  this.emit('error', err);
  this.cleanup(true);
};

/**
 * Cleans up house.
 *
 * @api private
 */

Request.prototype.cleanup = function(fromError){
  if ('undefined' == typeof this.xhr || null === this.xhr) {
    return;
  }
  // xmlhttprequest
  if (this.hasXDR()) {
    this.xhr.onload = this.xhr.onerror = empty;
  } else {
    this.xhr.onreadystatechange = empty;
  }

  if (fromError) {
    try {
      this.xhr.abort();
    } catch(e) {}
  }

  if (global.document) {
    delete Request.requests[this.index];
  }

  this.xhr = null;
};

/**
 * Called upon load.
 *
 * @api private
 */

Request.prototype.onLoad = function(){
  var data;
  try {
    var contentType;
    try {
      contentType = this.xhr.getResponseHeader('Content-Type').split(';')[0];
    } catch (e) {}
    if (contentType === 'application/octet-stream') {
      data = this.xhr.response;
    } else {
      if (!this.supportsBinary) {
        data = this.xhr.responseText;
      } else {
        data = 'ok';
      }
    }
  } catch (e) {
    this.onError(e);
  }
  if (null != data) {
    this.onData(data);
  }
};

/**
 * Check if it has XDomainRequest.
 *
 * @api private
 */

Request.prototype.hasXDR = function(){
  return 'undefined' !== typeof global.XDomainRequest && !this.xs && this.enablesXDR;
};

/**
 * Aborts the request.
 *
 * @api public
 */

Request.prototype.abort = function(){
  this.cleanup();
};

/**
 * Aborts pending requests when unloading the window. This is needed to prevent
 * memory leaks (e.g. when using IE) and to ensure that no spurious error is
 * emitted.
 */

if (global.document) {
  Request.requestsCount = 0;
  Request.requests = {};
  if (global.attachEvent) {
    global.attachEvent('onunload', unloadHandler);
  } else if (global.addEventListener) {
    global.addEventListener('beforeunload', unloadHandler, false);
  }
}

function unloadHandler() {
  for (var i in Request.requests) {
    if (Request.requests.hasOwnProperty(i)) {
      Request.requests[i].abort();
    }
  }
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./polling":18,"component-emitter":9,"component-inherit":21,"debug":22,"xmlhttprequest":20}],18:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parseqs = _dereq_('parseqs');
var parser = _dereq_('engine.io-parser');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:polling');

/**
 * Module exports.
 */

module.exports = Polling;

/**
 * Is XHR2 supported?
 */

var hasXHR2 = (function() {
  var XMLHttpRequest = _dereq_('xmlhttprequest');
  var xhr = new XMLHttpRequest({ xdomain: false });
  return null != xhr.responseType;
})();

/**
 * Polling interface.
 *
 * @param {Object} opts
 * @api private
 */

function Polling(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (!hasXHR2 || forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(Polling, Transport);

/**
 * Transport name.
 */

Polling.prototype.name = 'polling';

/**
 * Opens the socket (triggers polling). We write a PING message to determine
 * when the transport is open.
 *
 * @api private
 */

Polling.prototype.doOpen = function(){
  this.poll();
};

/**
 * Pauses polling.
 *
 * @param {Function} callback upon buffers are flushed and transport is paused
 * @api private
 */

Polling.prototype.pause = function(onPause){
  var pending = 0;
  var self = this;

  this.readyState = 'pausing';

  function pause(){
    debug('paused');
    self.readyState = 'paused';
    onPause();
  }

  if (this.polling || !this.writable) {
    var total = 0;

    if (this.polling) {
      debug('we are currently polling - waiting to pause');
      total++;
      this.once('pollComplete', function(){
        debug('pre-pause polling complete');
        --total || pause();
      });
    }

    if (!this.writable) {
      debug('we are currently writing - waiting to pause');
      total++;
      this.once('drain', function(){
        debug('pre-pause writing complete');
        --total || pause();
      });
    }
  } else {
    pause();
  }
};

/**
 * Starts polling cycle.
 *
 * @api public
 */

Polling.prototype.poll = function(){
  debug('polling');
  this.polling = true;
  this.doPoll();
  this.emit('poll');
};

/**
 * Overloads onData to detect payloads.
 *
 * @api private
 */

Polling.prototype.onData = function(data){
  var self = this;
  debug('polling got data %s', data);
  var callback = function(packet, index, total) {
    // if its the first message we consider the transport open
    if ('opening' == self.readyState) {
      self.onOpen();
    }

    // if its a close packet, we close the ongoing requests
    if ('close' == packet.type) {
      self.onClose();
      return false;
    }

    // otherwise bypass onData and handle the message
    self.onPacket(packet);
  };

  // decode payload
  parser.decodePayload(data, this.socket.binaryType, callback);

  // if an event did not trigger closing
  if ('closed' != this.readyState) {
    // if we got data we're not polling
    this.polling = false;
    this.emit('pollComplete');

    if ('open' == this.readyState) {
      this.poll();
    } else {
      debug('ignoring poll - transport state "%s"', this.readyState);
    }
  }
};

/**
 * For polling, send a close packet.
 *
 * @api private
 */

Polling.prototype.doClose = function(){
  var self = this;

  function close(){
    debug('writing close packet');
    self.write([{ type: 'close' }]);
  }

  if ('open' == this.readyState) {
    debug('transport open - closing');
    close();
  } else {
    // in case we're trying to close while
    // handshaking is in progress (GH-164)
    debug('transport not open - deferring close');
    this.once('open', close);
  }
};

/**
 * Writes a packets payload.
 *
 * @param {Array} data packets
 * @param {Function} drain callback
 * @api private
 */

Polling.prototype.write = function(packets){
  var self = this;
  this.writable = false;
  var callbackfn = function() {
    self.writable = true;
    self.emit('drain');
  };

  var self = this;
  parser.encodePayload(packets, this.supportsBinary, function(data) {
    self.doWrite(data, callbackfn);
  });
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

Polling.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'https' : 'http';
  var port = '';

  // cache busting is forced
  if (false !== this.timestampRequests) {
    query[this.timestampParam] = +new Date + '-' + Transport.timestamps++;
  }

  if (!this.supportsBinary && !query.sid) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // avoid port if default for schema
  if (this.port && (('https' == schema && this.port != 443) ||
     ('http' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  return schema + '://' + this.hostname + port + this.path + query;
};

},{"../transport":14,"component-inherit":21,"debug":22,"engine.io-parser":25,"parseqs":35,"xmlhttprequest":20}],19:[function(_dereq_,module,exports){
/**
 * Module dependencies.
 */

var Transport = _dereq_('../transport');
var parser = _dereq_('engine.io-parser');
var parseqs = _dereq_('parseqs');
var inherit = _dereq_('component-inherit');
var debug = _dereq_('debug')('engine.io-client:websocket');

/**
 * `ws` exposes a WebSocket-compatible interface in
 * Node, or the `WebSocket` or `MozWebSocket` globals
 * in the browser.
 */

var WebSocket = _dereq_('ws');

/**
 * Module exports.
 */

module.exports = WS;

/**
 * WebSocket transport constructor.
 *
 * @api {Object} connection options
 * @api public
 */

function WS(opts){
  var forceBase64 = (opts && opts.forceBase64);
  if (forceBase64) {
    this.supportsBinary = false;
  }
  Transport.call(this, opts);
}

/**
 * Inherits from Transport.
 */

inherit(WS, Transport);

/**
 * Transport name.
 *
 * @api public
 */

WS.prototype.name = 'websocket';

/*
 * WebSockets support binary
 */

WS.prototype.supportsBinary = true;

/**
 * Opens socket.
 *
 * @api private
 */

WS.prototype.doOpen = function(){
  if (!this.check()) {
    // let probe timeout
    return;
  }

  var self = this;
  var uri = this.uri();
  var protocols = void(0);
  var opts = { agent: this.agent };

  // SSL options for Node.js client
  opts.pfx = this.pfx;
  opts.key = this.key;
  opts.passphrase = this.passphrase;
  opts.cert = this.cert;
  opts.ca = this.ca;
  opts.ciphers = this.ciphers;
  opts.rejectUnauthorized = this.rejectUnauthorized;

  this.ws = new WebSocket(uri, protocols, opts);

  if (this.ws.binaryType === undefined) {
    this.supportsBinary = false;
  }

  this.ws.binaryType = 'arraybuffer';
  this.addEventListeners();
};

/**
 * Adds event listeners to the socket
 *
 * @api private
 */

WS.prototype.addEventListeners = function(){
  var self = this;

  this.ws.onopen = function(){
    self.onOpen();
  };
  this.ws.onclose = function(){
    self.onClose();
  };
  this.ws.onmessage = function(ev){
    self.onData(ev.data);
  };
  this.ws.onerror = function(e){
    self.onError('websocket error', e);
  };
};

/**
 * Override `onData` to use a timer on iOS.
 * See: https://gist.github.com/mloughran/2052006
 *
 * @api private
 */

if ('undefined' != typeof navigator
  && /iPad|iPhone|iPod/i.test(navigator.userAgent)) {
  WS.prototype.onData = function(data){
    var self = this;
    setTimeout(function(){
      Transport.prototype.onData.call(self, data);
    }, 0);
  };
}

/**
 * Writes data to socket.
 *
 * @param {Array} array of packets.
 * @api private
 */

WS.prototype.write = function(packets){
  var self = this;
  this.writable = false;
  // encodePacket efficient as it uses WS framing
  // no need for encodePayload
  for (var i = 0, l = packets.length; i < l; i++) {
    parser.encodePacket(packets[i], this.supportsBinary, function(data) {
      //Sometimes the websocket has already been closed but the browser didn't
      //have a chance of informing us about it yet, in that case send will
      //throw an error
      try {
        self.ws.send(data);
      } catch (e){
        debug('websocket closed before onclose event');
      }
    });
  }

  function ondrain() {
    self.writable = true;
    self.emit('drain');
  }
  // fake drain
  // defer to next tick to allow Socket to clear writeBuffer
  setTimeout(ondrain, 0);
};

/**
 * Called upon close
 *
 * @api private
 */

WS.prototype.onClose = function(){
  Transport.prototype.onClose.call(this);
};

/**
 * Closes socket.
 *
 * @api private
 */

WS.prototype.doClose = function(){
  if (typeof this.ws !== 'undefined') {
    this.ws.close();
  }
};

/**
 * Generates uri for connection.
 *
 * @api private
 */

WS.prototype.uri = function(){
  var query = this.query || {};
  var schema = this.secure ? 'wss' : 'ws';
  var port = '';

  // avoid port if default for schema
  if (this.port && (('wss' == schema && this.port != 443)
    || ('ws' == schema && this.port != 80))) {
    port = ':' + this.port;
  }

  // append timestamp to URI
  if (this.timestampRequests) {
    query[this.timestampParam] = +new Date;
  }

  // communicate binary support capabilities
  if (!this.supportsBinary) {
    query.b64 = 1;
  }

  query = parseqs.encode(query);

  // prepend ? to query
  if (query.length) {
    query = '?' + query;
  }

  return schema + '://' + this.hostname + port + this.path + query;
};

/**
 * Feature detection for WebSocket.
 *
 * @return {Boolean} whether this transport is available.
 * @api public
 */

WS.prototype.check = function(){
  return !!WebSocket && !('__initialize' in WebSocket && this.name === WS.prototype.name);
};

},{"../transport":14,"component-inherit":21,"debug":22,"engine.io-parser":25,"parseqs":35,"ws":37}],20:[function(_dereq_,module,exports){
// browser shim for xmlhttprequest module
var hasCORS = _dereq_('has-cors');

module.exports = function(opts) {
  var xdomain = opts.xdomain;

  // scheme must be same when usign XDomainRequest
  // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
  var xscheme = opts.xscheme;

  // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
  // https://github.com/Automattic/engine.io-client/pull/217
  var enablesXDR = opts.enablesXDR;

  // XMLHttpRequest can be disabled on IE
  try {
    if ('undefined' != typeof XMLHttpRequest && (!xdomain || hasCORS)) {
      return new XMLHttpRequest();
    }
  } catch (e) { }

  // Use XDomainRequest for IE8 if enablesXDR is true
  // because loading bar keeps flashing when using jsonp-polling
  // https://github.com/yujiosaka/socke.io-ie8-loading-example
  try {
    if ('undefined' != typeof XDomainRequest && !xscheme && enablesXDR) {
      return new XDomainRequest();
    }
  } catch (e) { }

  if (!xdomain) {
    try {
      return new ActiveXObject('Microsoft.XMLHTTP');
    } catch(e) { }
  }
}

},{"has-cors":40}],21:[function(_dereq_,module,exports){

module.exports = function(a, b){
  var fn = function(){};
  fn.prototype = b.prototype;
  a.prototype = new fn;
  a.prototype.constructor = a;
};
},{}],22:[function(_dereq_,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = _dereq_('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // This hackery is required for IE8,
  // where the `console.log` function doesn't have 'apply'
  return 'object' == typeof console
    && 'function' == typeof console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      localStorage.removeItem('debug');
    } else {
      localStorage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = localStorage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

},{"./debug":23}],23:[function(_dereq_,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = _dereq_('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":24}],24:[function(_dereq_,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  var match = /^((?:\d+)?\.?\d+) *(ms|seconds?|s|minutes?|m|hours?|h|days?|d|years?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 's':
      return n * s;
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],25:[function(_dereq_,module,exports){
(function (global){
/**
 * Module dependencies.
 */

var keys = _dereq_('./keys');
var hasBinary = _dereq_('has-binary');
var sliceBuffer = _dereq_('arraybuffer.slice');
var base64encoder = _dereq_('base64-arraybuffer');
var after = _dereq_('after');
var utf8 = _dereq_('utf8');

/**
 * Check if we are running an android browser. That requires us to use
 * ArrayBuffer with polling transports...
 *
 * http://ghinda.net/jpeg-blob-ajax-android/
 */

var isAndroid = navigator.userAgent.match(/Android/i);

/**
 * Check if we are running in PhantomJS.
 * Uploading a Blob with PhantomJS does not work correctly, as reported here:
 * https://github.com/ariya/phantomjs/issues/11395
 * @type boolean
 */
var isPhantomJS = /PhantomJS/i.test(navigator.userAgent);

/**
 * When true, avoids using Blobs to encode payloads.
 * @type boolean
 */
var dontSendBlobs = isAndroid || isPhantomJS;

/**
 * Current protocol version.
 */

exports.protocol = 3;

/**
 * Packet types.
 */

var packets = exports.packets = {
    open:     0    // non-ws
  , close:    1    // non-ws
  , ping:     2
  , pong:     3
  , message:  4
  , upgrade:  5
  , noop:     6
};

var packetslist = keys(packets);

/**
 * Premade error packet.
 */

var err = { type: 'error', data: 'parser error' };

/**
 * Create a blob api even for blob builder when vendor prefixes exist
 */

var Blob = _dereq_('blob');

/**
 * Encodes a packet.
 *
 *     <packet type id> [ <data> ]
 *
 * Example:
 *
 *     5hello world
 *     3
 *     4
 *
 * Binary is encoded in an identical principle
 *
 * @api private
 */

exports.encodePacket = function (packet, supportsBinary, utf8encode, callback) {
  if ('function' == typeof supportsBinary) {
    callback = supportsBinary;
    supportsBinary = false;
  }

  if ('function' == typeof utf8encode) {
    callback = utf8encode;
    utf8encode = null;
  }

  var data = (packet.data === undefined)
    ? undefined
    : packet.data.buffer || packet.data;

  if (global.ArrayBuffer && data instanceof ArrayBuffer) {
    return encodeArrayBuffer(packet, supportsBinary, callback);
  } else if (Blob && data instanceof global.Blob) {
    return encodeBlob(packet, supportsBinary, callback);
  }

  // might be an object with { base64: true, data: dataAsBase64String }
  if (data && data.base64) {
    return encodeBase64Object(packet, callback);
  }

  // Sending data as a utf-8 string
  var encoded = packets[packet.type];

  // data fragment is optional
  if (undefined !== packet.data) {
    encoded += utf8encode ? utf8.encode(String(packet.data)) : String(packet.data);
  }

  return callback('' + encoded);

};

function encodeBase64Object(packet, callback) {
  // packet data is an object { base64: true, data: dataAsBase64String }
  var message = 'b' + exports.packets[packet.type] + packet.data.data;
  return callback(message);
}

/**
 * Encode packet helpers for binary types
 */

function encodeArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var data = packet.data;
  var contentArray = new Uint8Array(data);
  var resultBuffer = new Uint8Array(1 + data.byteLength);

  resultBuffer[0] = packets[packet.type];
  for (var i = 0; i < contentArray.length; i++) {
    resultBuffer[i+1] = contentArray[i];
  }

  return callback(resultBuffer.buffer);
}

function encodeBlobAsArrayBuffer(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  var fr = new FileReader();
  fr.onload = function() {
    packet.data = fr.result;
    exports.encodePacket(packet, supportsBinary, true, callback);
  };
  return fr.readAsArrayBuffer(packet.data);
}

function encodeBlob(packet, supportsBinary, callback) {
  if (!supportsBinary) {
    return exports.encodeBase64Packet(packet, callback);
  }

  if (dontSendBlobs) {
    return encodeBlobAsArrayBuffer(packet, supportsBinary, callback);
  }

  var length = new Uint8Array(1);
  length[0] = packets[packet.type];
  var blob = new Blob([length.buffer, packet.data]);

  return callback(blob);
}

/**
 * Encodes a packet with binary data in a base64 string
 *
 * @param {Object} packet, has `type` and `data`
 * @return {String} base64 encoded message
 */

exports.encodeBase64Packet = function(packet, callback) {
  var message = 'b' + exports.packets[packet.type];
  if (Blob && packet.data instanceof Blob) {
    var fr = new FileReader();
    fr.onload = function() {
      var b64 = fr.result.split(',')[1];
      callback(message + b64);
    };
    return fr.readAsDataURL(packet.data);
  }

  var b64data;
  try {
    b64data = String.fromCharCode.apply(null, new Uint8Array(packet.data));
  } catch (e) {
    // iPhone Safari doesn't let you apply with typed arrays
    var typed = new Uint8Array(packet.data);
    var basic = new Array(typed.length);
    for (var i = 0; i < typed.length; i++) {
      basic[i] = typed[i];
    }
    b64data = String.fromCharCode.apply(null, basic);
  }
  message += global.btoa(b64data);
  return callback(message);
};

/**
 * Decodes a packet. Changes format to Blob if requested.
 *
 * @return {Object} with `type` and `data` (if any)
 * @api private
 */

exports.decodePacket = function (data, binaryType, utf8decode) {
  // String data
  if (typeof data == 'string' || data === undefined) {
    if (data.charAt(0) == 'b') {
      return exports.decodeBase64Packet(data.substr(1), binaryType);
    }

    if (utf8decode) {
      try {
        data = utf8.decode(data);
      } catch (e) {
        return err;
      }
    }
    var type = data.charAt(0);

    if (Number(type) != type || !packetslist[type]) {
      return err;
    }

    if (data.length > 1) {
      return { type: packetslist[type], data: data.substring(1) };
    } else {
      return { type: packetslist[type] };
    }
  }

  var asArray = new Uint8Array(data);
  var type = asArray[0];
  var rest = sliceBuffer(data, 1);
  if (Blob && binaryType === 'blob') {
    rest = new Blob([rest]);
  }
  return { type: packetslist[type], data: rest };
};

/**
 * Decodes a packet encoded in a base64 string
 *
 * @param {String} base64 encoded message
 * @return {Object} with `type` and `data` (if any)
 */

exports.decodeBase64Packet = function(msg, binaryType) {
  var type = packetslist[msg.charAt(0)];
  if (!global.ArrayBuffer) {
    return { type: type, data: { base64: true, data: msg.substr(1) } };
  }

  var data = base64encoder.decode(msg.substr(1));

  if (binaryType === 'blob' && Blob) {
    data = new Blob([data]);
  }

  return { type: type, data: data };
};

/**
 * Encodes multiple messages (payload).
 *
 *     <length>:data
 *
 * Example:
 *
 *     11:hello world2:hi
 *
 * If any contents are binary, they will be encoded as base64 strings. Base64
 * encoded strings are marked with a b before the length specifier
 *
 * @param {Array} packets
 * @api private
 */

exports.encodePayload = function (packets, supportsBinary, callback) {
  if (typeof supportsBinary == 'function') {
    callback = supportsBinary;
    supportsBinary = null;
  }

  var isBinary = hasBinary(packets);

  if (supportsBinary && isBinary) {
    if (Blob && !dontSendBlobs) {
      return exports.encodePayloadAsBlob(packets, callback);
    }

    return exports.encodePayloadAsArrayBuffer(packets, callback);
  }

  if (!packets.length) {
    return callback('0:');
  }

  function setLengthHeader(message) {
    return message.length + ':' + message;
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, !isBinary ? false : supportsBinary, true, function(message) {
      doneCallback(null, setLengthHeader(message));
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(results.join(''));
  });
};

/**
 * Async array map using after
 */

function map(ary, each, done) {
  var result = new Array(ary.length);
  var next = after(ary.length, done);

  var eachWithIndex = function(i, el, cb) {
    each(el, function(error, msg) {
      result[i] = msg;
      cb(error, result);
    });
  };

  for (var i = 0; i < ary.length; i++) {
    eachWithIndex(i, ary[i], next);
  }
}

/*
 * Decodes data when a payload is maybe expected. Possible binary contents are
 * decoded from their base64 representation
 *
 * @param {String} data, callback method
 * @api public
 */

exports.decodePayload = function (data, binaryType, callback) {
  if (typeof data != 'string') {
    return exports.decodePayloadAsBinary(data, binaryType, callback);
  }

  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var packet;
  if (data == '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

  var length = ''
    , n, msg;

  for (var i = 0, l = data.length; i < l; i++) {
    var chr = data.charAt(i);

    if (':' != chr) {
      length += chr;
    } else {
      if ('' == length || (length != (n = Number(length)))) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      msg = data.substr(i + 1, n);

      if (length != msg.length) {
        // parser error - ignoring payload
        return callback(err, 0, 1);
      }

      if (msg.length) {
        packet = exports.decodePacket(msg, binaryType, true);

        if (err.type == packet.type && err.data == packet.data) {
          // parser error in individual packet - ignoring payload
          return callback(err, 0, 1);
        }

        var ret = callback(packet, i + n, l);
        if (false === ret) return;
      }

      // advance cursor
      i += n;
      length = '';
    }
  }

  if (length != '') {
    // parser error - ignoring payload
    return callback(err, 0, 1);
  }

};

/**
 * Encodes multiple messages (payload) as binary.
 *
 * <1 = binary, 0 = string><number from 0-9><number from 0-9>[...]<number
 * 255><data>
 *
 * Example:
 * 1 3 255 1 2 3, if the binary contents are interpreted as 8 bit integers
 *
 * @param {Array} packets
 * @return {ArrayBuffer} encoded payload
 * @api private
 */

exports.encodePayloadAsArrayBuffer = function(packets, callback) {
  if (!packets.length) {
    return callback(new ArrayBuffer(0));
  }

  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(data) {
      return doneCallback(null, data);
    });
  }

  map(packets, encodeOne, function(err, encodedPackets) {
    var totalLength = encodedPackets.reduce(function(acc, p) {
      var len;
      if (typeof p === 'string'){
        len = p.length;
      } else {
        len = p.byteLength;
      }
      return acc + len.toString().length + len + 2; // string/binary identifier + separator = 2
    }, 0);

    var resultArray = new Uint8Array(totalLength);

    var bufferIndex = 0;
    encodedPackets.forEach(function(p) {
      var isString = typeof p === 'string';
      var ab = p;
      if (isString) {
        var view = new Uint8Array(p.length);
        for (var i = 0; i < p.length; i++) {
          view[i] = p.charCodeAt(i);
        }
        ab = view.buffer;
      }

      if (isString) { // not true binary
        resultArray[bufferIndex++] = 0;
      } else { // true binary
        resultArray[bufferIndex++] = 1;
      }

      var lenStr = ab.byteLength.toString();
      for (var i = 0; i < lenStr.length; i++) {
        resultArray[bufferIndex++] = parseInt(lenStr[i]);
      }
      resultArray[bufferIndex++] = 255;

      var view = new Uint8Array(ab);
      for (var i = 0; i < view.length; i++) {
        resultArray[bufferIndex++] = view[i];
      }
    });

    return callback(resultArray.buffer);
  });
};

/**
 * Encode as Blob
 */

exports.encodePayloadAsBlob = function(packets, callback) {
  function encodeOne(packet, doneCallback) {
    exports.encodePacket(packet, true, true, function(encoded) {
      var binaryIdentifier = new Uint8Array(1);
      binaryIdentifier[0] = 1;
      if (typeof encoded === 'string') {
        var view = new Uint8Array(encoded.length);
        for (var i = 0; i < encoded.length; i++) {
          view[i] = encoded.charCodeAt(i);
        }
        encoded = view.buffer;
        binaryIdentifier[0] = 0;
      }

      var len = (encoded instanceof ArrayBuffer)
        ? encoded.byteLength
        : encoded.size;

      var lenStr = len.toString();
      var lengthAry = new Uint8Array(lenStr.length + 1);
      for (var i = 0; i < lenStr.length; i++) {
        lengthAry[i] = parseInt(lenStr[i]);
      }
      lengthAry[lenStr.length] = 255;

      if (Blob) {
        var blob = new Blob([binaryIdentifier.buffer, lengthAry.buffer, encoded]);
        doneCallback(null, blob);
      }
    });
  }

  map(packets, encodeOne, function(err, results) {
    return callback(new Blob(results));
  });
};

/*
 * Decodes data when a payload is maybe expected. Strings are decoded by
 * interpreting each byte as a key code for entries marked to start with 0. See
 * description of encodePayloadAsBinary
 *
 * @param {ArrayBuffer} data, callback method
 * @api public
 */

exports.decodePayloadAsBinary = function (data, binaryType, callback) {
  if (typeof binaryType === 'function') {
    callback = binaryType;
    binaryType = null;
  }

  var bufferTail = data;
  var buffers = [];

  var numberTooLong = false;
  while (bufferTail.byteLength > 0) {
    var tailArray = new Uint8Array(bufferTail);
    var isString = tailArray[0] === 0;
    var msgLength = '';

    for (var i = 1; ; i++) {
      if (tailArray[i] == 255) break;

      if (msgLength.length > 310) {
        numberTooLong = true;
        break;
      }

      msgLength += tailArray[i];
    }

    if(numberTooLong) return callback(err, 0, 1);

    bufferTail = sliceBuffer(bufferTail, 2 + msgLength.length);
    msgLength = parseInt(msgLength);

    var msg = sliceBuffer(bufferTail, 0, msgLength);
    if (isString) {
      try {
        msg = String.fromCharCode.apply(null, new Uint8Array(msg));
      } catch (e) {
        // iPhone Safari doesn't let you apply to typed arrays
        var typed = new Uint8Array(msg);
        msg = '';
        for (var i = 0; i < typed.length; i++) {
          msg += String.fromCharCode(typed[i]);
        }
      }
    }

    buffers.push(msg);
    bufferTail = sliceBuffer(bufferTail, msgLength);
  }

  var total = buffers.length;
  buffers.forEach(function(buffer, i) {
    callback(exports.decodePacket(buffer, binaryType, true), i, total);
  });
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./keys":26,"after":27,"arraybuffer.slice":28,"base64-arraybuffer":29,"blob":30,"has-binary":31,"utf8":33}],26:[function(_dereq_,module,exports){

/**
 * Gets the keys for an object.
 *
 * @return {Array} keys
 * @api private
 */

module.exports = Object.keys || function keys (obj){
  var arr = [];
  var has = Object.prototype.hasOwnProperty;

  for (var i in obj) {
    if (has.call(obj, i)) {
      arr.push(i);
    }
  }
  return arr;
};

},{}],27:[function(_dereq_,module,exports){
module.exports = after

function after(count, callback, err_cb) {
    var bail = false
    err_cb = err_cb || noop
    proxy.count = count

    return (count === 0) ? callback() : proxy

    function proxy(err, result) {
        if (proxy.count <= 0) {
            throw new Error('after called too many times')
        }
        --proxy.count

        // after first error, rest are passed to err_cb
        if (err) {
            bail = true
            callback(err)
            // future error callbacks will go to error handler
            callback = err_cb
        } else if (proxy.count === 0 && !bail) {
            callback(null, result)
        }
    }
}

function noop() {}

},{}],28:[function(_dereq_,module,exports){
/**
 * An abstraction for slicing an arraybuffer even when
 * ArrayBuffer.prototype.slice is not supported
 *
 * @api public
 */

module.exports = function(arraybuffer, start, end) {
  var bytes = arraybuffer.byteLength;
  start = start || 0;
  end = end || bytes;

  if (arraybuffer.slice) { return arraybuffer.slice(start, end); }

  if (start < 0) { start += bytes; }
  if (end < 0) { end += bytes; }
  if (end > bytes) { end = bytes; }

  if (start >= bytes || start >= end || bytes === 0) {
    return new ArrayBuffer(0);
  }

  var abv = new Uint8Array(arraybuffer);
  var result = new Uint8Array(end - start);
  for (var i = start, ii = 0; i < end; i++, ii++) {
    result[ii] = abv[i];
  }
  return result.buffer;
};

},{}],29:[function(_dereq_,module,exports){
/*
 * base64-arraybuffer
 * https://github.com/niklasvh/base64-arraybuffer
 *
 * Copyright (c) 2012 Niklas von Hertzen
 * Licensed under the MIT license.
 */
(function(chars){
  "use strict";

  exports.encode = function(arraybuffer) {
    var bytes = new Uint8Array(arraybuffer),
    i, len = bytes.length, base64 = "";

    for (i = 0; i < len; i+=3) {
      base64 += chars[bytes[i] >> 2];
      base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
      base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
      base64 += chars[bytes[i + 2] & 63];
    }

    if ((len % 3) === 2) {
      base64 = base64.substring(0, base64.length - 1) + "=";
    } else if (len % 3 === 1) {
      base64 = base64.substring(0, base64.length - 2) + "==";
    }

    return base64;
  };

  exports.decode =  function(base64) {
    var bufferLength = base64.length * 0.75,
    len = base64.length, i, p = 0,
    encoded1, encoded2, encoded3, encoded4;

    if (base64[base64.length - 1] === "=") {
      bufferLength--;
      if (base64[base64.length - 2] === "=") {
        bufferLength--;
      }
    }

    var arraybuffer = new ArrayBuffer(bufferLength),
    bytes = new Uint8Array(arraybuffer);

    for (i = 0; i < len; i+=4) {
      encoded1 = chars.indexOf(base64[i]);
      encoded2 = chars.indexOf(base64[i+1]);
      encoded3 = chars.indexOf(base64[i+2]);
      encoded4 = chars.indexOf(base64[i+3]);

      bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
      bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
      bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
    }

    return arraybuffer;
  };
})("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");

},{}],30:[function(_dereq_,module,exports){
(function (global){
/**
 * Create a blob builder even when vendor prefixes exist
 */

var BlobBuilder = global.BlobBuilder
  || global.WebKitBlobBuilder
  || global.MSBlobBuilder
  || global.MozBlobBuilder;

/**
 * Check if Blob constructor is supported
 */

var blobSupported = (function() {
  try {
    var b = new Blob(['hi']);
    return b.size == 2;
  } catch(e) {
    return false;
  }
})();

/**
 * Check if BlobBuilder is supported
 */

var blobBuilderSupported = BlobBuilder
  && BlobBuilder.prototype.append
  && BlobBuilder.prototype.getBlob;

function BlobBuilderConstructor(ary, options) {
  options = options || {};

  var bb = new BlobBuilder();
  for (var i = 0; i < ary.length; i++) {
    bb.append(ary[i]);
  }
  return (options.type) ? bb.getBlob(options.type) : bb.getBlob();
};

module.exports = (function() {
  if (blobSupported) {
    return global.Blob;
  } else if (blobBuilderSupported) {
    return BlobBuilderConstructor;
  } else {
    return undefined;
  }
})();

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],31:[function(_dereq_,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      if (obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (obj.hasOwnProperty(key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":32}],32:[function(_dereq_,module,exports){
module.exports = Array.isArray || function (arr) {
  return Object.prototype.toString.call(arr) == '[object Array]';
};

},{}],33:[function(_dereq_,module,exports){
(function (global){
/*! http://mths.be/utf8js v2.0.0 by @mathias */
;(function(root) {

	// Detect free variables `exports`
	var freeExports = typeof exports == 'object' && exports;

	// Detect free variable `module`
	var freeModule = typeof module == 'object' && module &&
		module.exports == freeExports && module;

	// Detect free variable `global`, from Node.js or Browserified code,
	// and use it as `root`
	var freeGlobal = typeof global == 'object' && global;
	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
		root = freeGlobal;
	}

	/*--------------------------------------------------------------------------*/

	var stringFromCharCode = String.fromCharCode;

	// Taken from http://mths.be/punycode
	function ucs2decode(string) {
		var output = [];
		var counter = 0;
		var length = string.length;
		var value;
		var extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	// Taken from http://mths.be/punycode
	function ucs2encode(array) {
		var length = array.length;
		var index = -1;
		var value;
		var output = '';
		while (++index < length) {
			value = array[index];
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
		}
		return output;
	}

	/*--------------------------------------------------------------------------*/

	function createByte(codePoint, shift) {
		return stringFromCharCode(((codePoint >> shift) & 0x3F) | 0x80);
	}

	function encodeCodePoint(codePoint) {
		if ((codePoint & 0xFFFFFF80) == 0) { // 1-byte sequence
			return stringFromCharCode(codePoint);
		}
		var symbol = '';
		if ((codePoint & 0xFFFFF800) == 0) { // 2-byte sequence
			symbol = stringFromCharCode(((codePoint >> 6) & 0x1F) | 0xC0);
		}
		else if ((codePoint & 0xFFFF0000) == 0) { // 3-byte sequence
			symbol = stringFromCharCode(((codePoint >> 12) & 0x0F) | 0xE0);
			symbol += createByte(codePoint, 6);
		}
		else if ((codePoint & 0xFFE00000) == 0) { // 4-byte sequence
			symbol = stringFromCharCode(((codePoint >> 18) & 0x07) | 0xF0);
			symbol += createByte(codePoint, 12);
			symbol += createByte(codePoint, 6);
		}
		symbol += stringFromCharCode((codePoint & 0x3F) | 0x80);
		return symbol;
	}

	function utf8encode(string) {
		var codePoints = ucs2decode(string);

		// console.log(JSON.stringify(codePoints.map(function(x) {
		// 	return 'U+' + x.toString(16).toUpperCase();
		// })));

		var length = codePoints.length;
		var index = -1;
		var codePoint;
		var byteString = '';
		while (++index < length) {
			codePoint = codePoints[index];
			byteString += encodeCodePoint(codePoint);
		}
		return byteString;
	}

	/*--------------------------------------------------------------------------*/

	function readContinuationByte() {
		if (byteIndex >= byteCount) {
			throw Error('Invalid byte index');
		}

		var continuationByte = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		if ((continuationByte & 0xC0) == 0x80) {
			return continuationByte & 0x3F;
		}

		// If we end up here, it’s not a continuation byte
		throw Error('Invalid continuation byte');
	}

	function decodeSymbol() {
		var byte1;
		var byte2;
		var byte3;
		var byte4;
		var codePoint;

		if (byteIndex > byteCount) {
			throw Error('Invalid byte index');
		}

		if (byteIndex == byteCount) {
			return false;
		}

		// Read first byte
		byte1 = byteArray[byteIndex] & 0xFF;
		byteIndex++;

		// 1-byte sequence (no continuation bytes)
		if ((byte1 & 0x80) == 0) {
			return byte1;
		}

		// 2-byte sequence
		if ((byte1 & 0xE0) == 0xC0) {
			var byte2 = readContinuationByte();
			codePoint = ((byte1 & 0x1F) << 6) | byte2;
			if (codePoint >= 0x80) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 3-byte sequence (may include unpaired surrogates)
		if ((byte1 & 0xF0) == 0xE0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 12) | (byte2 << 6) | byte3;
			if (codePoint >= 0x0800) {
				return codePoint;
			} else {
				throw Error('Invalid continuation byte');
			}
		}

		// 4-byte sequence
		if ((byte1 & 0xF8) == 0xF0) {
			byte2 = readContinuationByte();
			byte3 = readContinuationByte();
			byte4 = readContinuationByte();
			codePoint = ((byte1 & 0x0F) << 0x12) | (byte2 << 0x0C) |
				(byte3 << 0x06) | byte4;
			if (codePoint >= 0x010000 && codePoint <= 0x10FFFF) {
				return codePoint;
			}
		}

		throw Error('Invalid UTF-8 detected');
	}

	var byteArray;
	var byteCount;
	var byteIndex;
	function utf8decode(byteString) {
		byteArray = ucs2decode(byteString);
		byteCount = byteArray.length;
		byteIndex = 0;
		var codePoints = [];
		var tmp;
		while ((tmp = decodeSymbol()) !== false) {
			codePoints.push(tmp);
		}
		return ucs2encode(codePoints);
	}

	/*--------------------------------------------------------------------------*/

	var utf8 = {
		'version': '2.0.0',
		'encode': utf8encode,
		'decode': utf8decode
	};

	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define(function() {
			return utf8;
		});
	}	else if (freeExports && !freeExports.nodeType) {
		if (freeModule) { // in Node.js or RingoJS v0.8.0+
			freeModule.exports = utf8;
		} else { // in Narwhal or RingoJS v0.7.0-
			var object = {};
			var hasOwnProperty = object.hasOwnProperty;
			for (var key in utf8) {
				hasOwnProperty.call(utf8, key) && (freeExports[key] = utf8[key]);
			}
		}
	} else { // in Rhino or a web browser
		root.utf8 = utf8;
	}

}(this));

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],34:[function(_dereq_,module,exports){
(function (global){
/**
 * JSON parse.
 *
 * @see Based on jQuery#parseJSON (MIT) and JSON2
 * @api private
 */

var rvalidchars = /^[\],:{}\s]*$/;
var rvalidescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g;
var rvalidtokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g;
var rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g;
var rtrimLeft = /^\s+/;
var rtrimRight = /\s+$/;

module.exports = function parsejson(data) {
  if ('string' != typeof data || !data) {
    return null;
  }

  data = data.replace(rtrimLeft, '').replace(rtrimRight, '');

  // Attempt to parse using the native JSON parser first
  if (global.JSON && JSON.parse) {
    return JSON.parse(data);
  }

  if (rvalidchars.test(data.replace(rvalidescape, '@')
      .replace(rvalidtokens, ']')
      .replace(rvalidbraces, ''))) {
    return (new Function('return ' + data))();
  }
};
}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],35:[function(_dereq_,module,exports){
/**
 * Compiles a querystring
 * Returns string representation of the object
 *
 * @param {Object}
 * @api private
 */

exports.encode = function (obj) {
  var str = '';

  for (var i in obj) {
    if (obj.hasOwnProperty(i)) {
      if (str.length) str += '&';
      str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
    }
  }

  return str;
};

/**
 * Parses a simple querystring into an object
 *
 * @param {String} qs
 * @api private
 */

exports.decode = function(qs){
  var qry = {};
  var pairs = qs.split('&');
  for (var i = 0, l = pairs.length; i < l; i++) {
    var pair = pairs[i].split('=');
    qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
  }
  return qry;
};

},{}],36:[function(_dereq_,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
    var src = str,
        b = str.indexOf('['),
        e = str.indexOf(']');

    if (b != -1 && e != -1) {
        str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
    }

    var m = re.exec(str || ''),
        uri = {},
        i = 14;

    while (i--) {
        uri[parts[i]] = m[i] || '';
    }

    if (b != -1 && e != -1) {
        uri.source = src;
        uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
        uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
        uri.ipv6uri = true;
    }

    return uri;
};

},{}],37:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var global = (function() { return this; })();

/**
 * WebSocket constructor.
 */

var WebSocket = global.WebSocket || global.MozWebSocket;

/**
 * Module exports.
 */

module.exports = WebSocket ? ws : null;

/**
 * WebSocket constructor.
 *
 * The third `opts` options object gets ignored in web browsers, since it's
 * non-standard, and throws a TypeError if passed to the constructor.
 * See: https://github.com/einaros/ws/issues/227
 *
 * @param {String} uri
 * @param {Array} protocols (optional)
 * @param {Object) opts (optional)
 * @api public
 */

function ws(uri, protocols, opts) {
  var instance;
  if (protocols) {
    instance = new WebSocket(uri, protocols);
  } else {
    instance = new WebSocket(uri);
  }
  return instance;
}

if (WebSocket) ws.prototype = WebSocket.prototype;

},{}],38:[function(_dereq_,module,exports){
(function (global){

/*
 * Module requirements.
 */

var isArray = _dereq_('isarray');

/**
 * Module exports.
 */

module.exports = hasBinary;

/**
 * Checks for binary data.
 *
 * Right now only Buffer and ArrayBuffer are supported..
 *
 * @param {Object} anything
 * @api public
 */

function hasBinary(data) {

  function _hasBinary(obj) {
    if (!obj) return false;

    if ( (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer) ||
         (global.Blob && obj instanceof Blob) ||
         (global.File && obj instanceof File)
        ) {
      return true;
    }

    if (isArray(obj)) {
      for (var i = 0; i < obj.length; i++) {
          if (_hasBinary(obj[i])) {
              return true;
          }
      }
    } else if (obj && 'object' == typeof obj) {
      if (obj.toJSON) {
        obj = obj.toJSON();
      }

      for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key) && _hasBinary(obj[key])) {
          return true;
        }
      }
    }

    return false;
  }

  return _hasBinary(data);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"isarray":39}],39:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],40:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var global = _dereq_('global');

/**
 * Module exports.
 *
 * Logic borrowed from Modernizr:
 *
 *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
 */

try {
  module.exports = 'XMLHttpRequest' in global &&
    'withCredentials' in new global.XMLHttpRequest();
} catch (err) {
  // if XMLHttp support is disabled in IE then it will throw
  // when trying to create
  module.exports = false;
}

},{"global":41}],41:[function(_dereq_,module,exports){

/**
 * Returns `this`. Execute this without a "context" (i.e. without it being
 * attached to an object of the left-hand side), and `this` points to the
 * "global" scope of the current JS execution.
 */

module.exports = (function () { return this; })();

},{}],42:[function(_dereq_,module,exports){

var indexOf = [].indexOf;

module.exports = function(arr, obj){
  if (indexOf) return arr.indexOf(obj);
  for (var i = 0; i < arr.length; ++i) {
    if (arr[i] === obj) return i;
  }
  return -1;
};
},{}],43:[function(_dereq_,module,exports){

/**
 * HOP ref.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Return own keys in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.keys = Object.keys || function(obj){
  var keys = [];
  for (var key in obj) {
    if (has.call(obj, key)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Return own values in `obj`.
 *
 * @param {Object} obj
 * @return {Array}
 * @api public
 */

exports.values = function(obj){
  var vals = [];
  for (var key in obj) {
    if (has.call(obj, key)) {
      vals.push(obj[key]);
    }
  }
  return vals;
};

/**
 * Merge `b` into `a`.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api public
 */

exports.merge = function(a, b){
  for (var key in b) {
    if (has.call(b, key)) {
      a[key] = b[key];
    }
  }
  return a;
};

/**
 * Return length of `obj`.
 *
 * @param {Object} obj
 * @return {Number}
 * @api public
 */

exports.length = function(obj){
  return exports.keys(obj).length;
};

/**
 * Check if `obj` is empty.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api public
 */

exports.isEmpty = function(obj){
  return 0 == exports.length(obj);
};
},{}],44:[function(_dereq_,module,exports){
/**
 * Parses an URI
 *
 * @author Steven Levithan <stevenlevithan.com> (MIT license)
 * @api private
 */

var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

var parts = [
    'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host'
  , 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
];

module.exports = function parseuri(str) {
  var m = re.exec(str || '')
    , uri = {}
    , i = 14;

  while (i--) {
    uri[parts[i]] = m[i] || '';
  }

  return uri;
};

},{}],45:[function(_dereq_,module,exports){
(function (global){
/*global Blob,File*/

/**
 * Module requirements
 */

var isArray = _dereq_('isarray');
var isBuf = _dereq_('./is-buffer');

/**
 * Replaces every Buffer | ArrayBuffer in packet with a numbered placeholder.
 * Anything with blobs or files should be fed through removeBlobs before coming
 * here.
 *
 * @param {Object} packet - socket.io event packet
 * @return {Object} with deconstructed packet and list of buffers
 * @api public
 */

exports.deconstructPacket = function(packet){
  var buffers = [];
  var packetData = packet.data;

  function _deconstructPacket(data) {
    if (!data) return data;

    if (isBuf(data)) {
      var placeholder = { _placeholder: true, num: buffers.length };
      buffers.push(data);
      return placeholder;
    } else if (isArray(data)) {
      var newData = new Array(data.length);
      for (var i = 0; i < data.length; i++) {
        newData[i] = _deconstructPacket(data[i]);
      }
      return newData;
    } else if ('object' == typeof data && !(data instanceof Date)) {
      var newData = {};
      for (var key in data) {
        newData[key] = _deconstructPacket(data[key]);
      }
      return newData;
    }
    return data;
  }

  var pack = packet;
  pack.data = _deconstructPacket(packetData);
  pack.attachments = buffers.length; // number of binary 'attachments'
  return {packet: pack, buffers: buffers};
};

/**
 * Reconstructs a binary packet from its placeholder packet and buffers
 *
 * @param {Object} packet - event packet with placeholders
 * @param {Array} buffers - binary buffers to put in placeholder positions
 * @return {Object} reconstructed packet
 * @api public
 */

exports.reconstructPacket = function(packet, buffers) {
  var curPlaceHolder = 0;

  function _reconstructPacket(data) {
    if (data && data._placeholder) {
      var buf = buffers[data.num]; // appropriate buffer (should be natural order anyway)
      return buf;
    } else if (isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        data[i] = _reconstructPacket(data[i]);
      }
      return data;
    } else if (data && 'object' == typeof data) {
      for (var key in data) {
        data[key] = _reconstructPacket(data[key]);
      }
      return data;
    }
    return data;
  }

  packet.data = _reconstructPacket(packet.data);
  packet.attachments = undefined; // no longer useful
  return packet;
};

/**
 * Asynchronously removes Blobs or Files from data via
 * FileReader's readAsArrayBuffer method. Used before encoding
 * data as msgpack. Calls callback with the blobless data.
 *
 * @param {Object} data
 * @param {Function} callback
 * @api private
 */

exports.removeBlobs = function(data, callback) {
  function _removeBlobs(obj, curKey, containingObject) {
    if (!obj) return obj;

    // convert any blob
    if ((global.Blob && obj instanceof Blob) ||
        (global.File && obj instanceof File)) {
      pendingBlobs++;

      // async filereader
      var fileReader = new FileReader();
      fileReader.onload = function() { // this.result == arraybuffer
        if (containingObject) {
          containingObject[curKey] = this.result;
        }
        else {
          bloblessData = this.result;
        }

        // if nothing pending its callback time
        if(! --pendingBlobs) {
          callback(bloblessData);
        }
      };

      fileReader.readAsArrayBuffer(obj); // blob -> arraybuffer
    } else if (isArray(obj)) { // handle array
      for (var i = 0; i < obj.length; i++) {
        _removeBlobs(obj[i], i, obj);
      }
    } else if (obj && 'object' == typeof obj && !isBuf(obj)) { // and object
      for (var key in obj) {
        _removeBlobs(obj[key], key, obj);
      }
    }
  }

  var pendingBlobs = 0;
  var bloblessData = data;
  _removeBlobs(bloblessData);
  if (!pendingBlobs) {
    callback(bloblessData);
  }
};

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./is-buffer":47,"isarray":48}],46:[function(_dereq_,module,exports){

/**
 * Module dependencies.
 */

var debug = _dereq_('debug')('socket.io-parser');
var json = _dereq_('json3');
var isArray = _dereq_('isarray');
var Emitter = _dereq_('component-emitter');
var binary = _dereq_('./binary');
var isBuf = _dereq_('./is-buffer');

/**
 * Protocol version.
 *
 * @api public
 */

exports.protocol = 4;

/**
 * Packet types.
 *
 * @api public
 */

exports.types = [
  'CONNECT',
  'DISCONNECT',
  'EVENT',
  'BINARY_EVENT',
  'ACK',
  'BINARY_ACK',
  'ERROR'
];

/**
 * Packet type `connect`.
 *
 * @api public
 */

exports.CONNECT = 0;

/**
 * Packet type `disconnect`.
 *
 * @api public
 */

exports.DISCONNECT = 1;

/**
 * Packet type `event`.
 *
 * @api public
 */

exports.EVENT = 2;

/**
 * Packet type `ack`.
 *
 * @api public
 */

exports.ACK = 3;

/**
 * Packet type `error`.
 *
 * @api public
 */

exports.ERROR = 4;

/**
 * Packet type 'binary event'
 *
 * @api public
 */

exports.BINARY_EVENT = 5;

/**
 * Packet type `binary ack`. For acks with binary arguments.
 *
 * @api public
 */

exports.BINARY_ACK = 6;

/**
 * Encoder constructor.
 *
 * @api public
 */

exports.Encoder = Encoder;

/**
 * Decoder constructor.
 *
 * @api public
 */

exports.Decoder = Decoder;

/**
 * A socket.io Encoder instance
 *
 * @api public
 */

function Encoder() {}

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function(obj, callback){
  debug('encoding packet %j', obj);

  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    encodeAsBinary(obj, callback);
  }
  else {
    var encoding = encodeAsString(obj);
    callback([encoding]);
  }
};

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {
  var str = '';
  var nsp = false;

  // first is type
  str += obj.type;

  // attachments if we have them
  if (exports.BINARY_EVENT == obj.type || exports.BINARY_ACK == obj.type) {
    str += obj.attachments;
    str += '-';
  }

  // if we have a namespace other than `/`
  // we append it followed by a comma `,`
  if (obj.nsp && '/' != obj.nsp) {
    nsp = true;
    str += obj.nsp;
  }

  // immediately followed by the id
  if (null != obj.id) {
    if (nsp) {
      str += ',';
      nsp = false;
    }
    str += obj.id;
  }

  // json data
  if (null != obj.data) {
    if (nsp) str += ',';
    str += json.stringify(obj.data);
  }

  debug('encoded %j as %s', obj, str);
  return str;
}

/**
 * Encode packet as 'buffer sequence' by removing blobs, and
 * deconstructing packet into object with placeholders and
 * a list of buffers.
 *
 * @param {Object} packet
 * @return {Buffer} encoded
 * @api private
 */

function encodeAsBinary(obj, callback) {

  function writeEncoding(bloblessData) {
    var deconstruction = binary.deconstructPacket(bloblessData);
    var pack = encodeAsString(deconstruction.packet);
    var buffers = deconstruction.buffers;

    buffers.unshift(pack); // add packet info to beginning of data list
    callback(buffers); // write all the buffers
  }

  binary.removeBlobs(obj, writeEncoding);
}

/**
 * A socket.io Decoder instance
 *
 * @return {Object} decoder
 * @api public
 */

function Decoder() {
  this.reconstructor = null;
}

/**
 * Mix in `Emitter` with Decoder.
 */

Emitter(Decoder.prototype);

/**
 * Decodes an ecoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function(obj) {
  var packet;
  if ('string' == typeof obj) {
    packet = decodeString(obj);
    if (exports.BINARY_EVENT == packet.type || exports.BINARY_ACK == packet.type) { // binary packet's json
      this.reconstructor = new BinaryReconstructor(packet);

      // no attachments, labeled binary but no binary data to follow
      if (this.reconstructor.reconPack.attachments === 0) {
        this.emit('decoded', packet);
      }
    } else { // non-binary full packet
      this.emit('decoded', packet);
    }
  }
  else if (isBuf(obj) || obj.base64) { // raw binary data
    if (!this.reconstructor) {
      throw new Error('got binary data when not reconstructing a packet');
    } else {
      packet = this.reconstructor.takeBinaryData(obj);
      if (packet) { // received final buffer
        this.reconstructor = null;
        this.emit('decoded', packet);
      }
    }
  }
  else {
    throw new Error('Unknown type: ' + obj);
  }
};

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
  var p = {};
  var i = 0;

  // look up type
  p.type = Number(str.charAt(0));
  if (null == exports.types[p.type]) return error();

  // look up attachments if type binary
  if (exports.BINARY_EVENT == p.type || exports.BINARY_ACK == p.type) {
    var buf = '';
    while (str.charAt(++i) != '-') {
      buf += str.charAt(i);
      if (i == str.length) break;
    }
    if (buf != Number(buf) || str.charAt(i) != '-') {
      throw new Error('Illegal attachments');
    }
    p.attachments = Number(buf);
  }

  // look up namespace (if any)
  if ('/' == str.charAt(i + 1)) {
    p.nsp = '';
    while (++i) {
      var c = str.charAt(i);
      if (',' == c) break;
      p.nsp += c;
      if (i == str.length) break;
    }
  } else {
    p.nsp = '/';
  }

  // look up id
  var next = str.charAt(i + 1);
  if ('' !== next && Number(next) == next) {
    p.id = '';
    while (++i) {
      var c = str.charAt(i);
      if (null == c || Number(c) != c) {
        --i;
        break;
      }
      p.id += str.charAt(i);
      if (i == str.length) break;
    }
    p.id = Number(p.id);
  }

  // look up json data
  if (str.charAt(++i)) {
    try {
      p.data = json.parse(str.substr(i));
    } catch(e){
      return error();
    }
  }

  debug('decoded %s as %j', str, p);
  return p;
}

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function() {
  if (this.reconstructor) {
    this.reconstructor.finishedReconstruction();
  }
};

/**
 * A manager of a binary event's 'buffer sequence'. Should
 * be constructed whenever a packet of type BINARY_EVENT is
 * decoded.
 *
 * @param {Object} packet
 * @return {BinaryReconstructor} initialized reconstructor
 * @api private
 */

function BinaryReconstructor(packet) {
  this.reconPack = packet;
  this.buffers = [];
}

/**
 * Method to be called when binary data received from connection
 * after a BINARY_EVENT packet.
 *
 * @param {Buffer | ArrayBuffer} binData - the raw binary data received
 * @return {null | Object} returns null if more binary data is expected or
 *   a reconstructed packet object if all buffers have been received.
 * @api private
 */

BinaryReconstructor.prototype.takeBinaryData = function(binData) {
  this.buffers.push(binData);
  if (this.buffers.length == this.reconPack.attachments) { // done with buffer list
    var packet = binary.reconstructPacket(this.reconPack, this.buffers);
    this.finishedReconstruction();
    return packet;
  }
  return null;
};

/**
 * Cleans up binary packet reconstruction variables.
 *
 * @api private
 */

BinaryReconstructor.prototype.finishedReconstruction = function() {
  this.reconPack = null;
  this.buffers = [];
};

function error(data){
  return {
    type: exports.ERROR,
    data: 'parser error'
  };
}

},{"./binary":45,"./is-buffer":47,"component-emitter":9,"debug":10,"isarray":48,"json3":49}],47:[function(_dereq_,module,exports){
(function (global){

module.exports = isBuf;

/**
 * Returns true if obj is a buffer or an arraybuffer.
 *
 * @api private
 */

function isBuf(obj) {
  return (global.Buffer && global.Buffer.isBuffer(obj)) ||
         (global.ArrayBuffer && obj instanceof ArrayBuffer);
}

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],48:[function(_dereq_,module,exports){
module.exports=_dereq_(32)
},{}],49:[function(_dereq_,module,exports){
/*! JSON v3.2.6 | http://bestiejs.github.io/json3 | Copyright 2012-2013, Kit Cambridge | http://kit.mit-license.org */
;(function (window) {
  // Convenience aliases.
  var getClass = {}.toString, isProperty, forEach, undef;

  // Detect the `define` function exposed by asynchronous module loaders. The
  // strict `define` check is necessary for compatibility with `r.js`.
  var isLoader = typeof define === "function" && define.amd;

  // Detect native implementations.
  var nativeJSON = typeof JSON == "object" && JSON;

  // Set up the JSON 3 namespace, preferring the CommonJS `exports` object if
  // available.
  var JSON3 = typeof exports == "object" && exports && !exports.nodeType && exports;

  if (JSON3 && nativeJSON) {
    // Explicitly delegate to the native `stringify` and `parse`
    // implementations in CommonJS environments.
    JSON3.stringify = nativeJSON.stringify;
    JSON3.parse = nativeJSON.parse;
  } else {
    // Export for web browsers, JavaScript engines, and asynchronous module
    // loaders, using the global `JSON` object if available.
    JSON3 = window.JSON = nativeJSON || {};
  }

  // Test the `Date#getUTC*` methods. Based on work by @Yaffle.
  var isExtended = new Date(-3509827334573292);
  try {
    // The `getUTCFullYear`, `Month`, and `Date` methods return nonsensical
    // results for certain dates in Opera >= 10.53.
    isExtended = isExtended.getUTCFullYear() == -109252 && isExtended.getUTCMonth() === 0 && isExtended.getUTCDate() === 1 &&
      // Safari < 2.0.2 stores the internal millisecond time value correctly,
      // but clips the values returned by the date methods to the range of
      // signed 32-bit integers ([-2 ** 31, 2 ** 31 - 1]).
      isExtended.getUTCHours() == 10 && isExtended.getUTCMinutes() == 37 && isExtended.getUTCSeconds() == 6 && isExtended.getUTCMilliseconds() == 708;
  } catch (exception) {}

  // Internal: Determines whether the native `JSON.stringify` and `parse`
  // implementations are spec-compliant. Based on work by Ken Snyder.
  function has(name) {
    if (has[name] !== undef) {
      // Return cached feature test result.
      return has[name];
    }

    var isSupported;
    if (name == "bug-string-char-index") {
      // IE <= 7 doesn't support accessing string characters using square
      // bracket notation. IE 8 only supports this for primitives.
      isSupported = "a"[0] != "a";
    } else if (name == "json") {
      // Indicates whether both `JSON.stringify` and `JSON.parse` are
      // supported.
      isSupported = has("json-stringify") && has("json-parse");
    } else {
      var value, serialized = '{"a":[1,true,false,null,"\\u0000\\b\\n\\f\\r\\t"]}';
      // Test `JSON.stringify`.
      if (name == "json-stringify") {
        var stringify = JSON3.stringify, stringifySupported = typeof stringify == "function" && isExtended;
        if (stringifySupported) {
          // A test function object with a custom `toJSON` method.
          (value = function () {
            return 1;
          }).toJSON = value;
          try {
            stringifySupported =
              // Firefox 3.1b1 and b2 serialize string, number, and boolean
              // primitives as object literals.
              stringify(0) === "0" &&
              // FF 3.1b1, b2, and JSON 2 serialize wrapped primitives as object
              // literals.
              stringify(new Number()) === "0" &&
              stringify(new String()) == '""' &&
              // FF 3.1b1, 2 throw an error if the value is `null`, `undefined`, or
              // does not define a canonical JSON representation (this applies to
              // objects with `toJSON` properties as well, *unless* they are nested
              // within an object or array).
              stringify(getClass) === undef &&
              // IE 8 serializes `undefined` as `"undefined"`. Safari <= 5.1.7 and
              // FF 3.1b3 pass this test.
              stringify(undef) === undef &&
              // Safari <= 5.1.7 and FF 3.1b3 throw `Error`s and `TypeError`s,
              // respectively, if the value is omitted entirely.
              stringify() === undef &&
              // FF 3.1b1, 2 throw an error if the given value is not a number,
              // string, array, object, Boolean, or `null` literal. This applies to
              // objects with custom `toJSON` methods as well, unless they are nested
              // inside object or array literals. YUI 3.0.0b1 ignores custom `toJSON`
              // methods entirely.
              stringify(value) === "1" &&
              stringify([value]) == "[1]" &&
              // Prototype <= 1.6.1 serializes `[undefined]` as `"[]"` instead of
              // `"[null]"`.
              stringify([undef]) == "[null]" &&
              // YUI 3.0.0b1 fails to serialize `null` literals.
              stringify(null) == "null" &&
              // FF 3.1b1, 2 halts serialization if an array contains a function:
              // `[1, true, getClass, 1]` serializes as "[1,true,],". FF 3.1b3
              // elides non-JSON values from objects and arrays, unless they
              // define custom `toJSON` methods.
              stringify([undef, getClass, null]) == "[null,null,null]" &&
              // Simple serialization test. FF 3.1b1 uses Unicode escape sequences
              // where character escape codes are expected (e.g., `\b` => `\u0008`).
              stringify({ "a": [value, true, false, null, "\x00\b\n\f\r\t"] }) == serialized &&
              // FF 3.1b1 and b2 ignore the `filter` and `width` arguments.
              stringify(null, value) === "1" &&
              stringify([1, 2], null, 1) == "[\n 1,\n 2\n]" &&
              // JSON 2, Prototype <= 1.7, and older WebKit builds incorrectly
              // serialize extended years.
              stringify(new Date(-8.64e15)) == '"-271821-04-20T00:00:00.000Z"' &&
              // The milliseconds are optional in ES 5, but required in 5.1.
              stringify(new Date(8.64e15)) == '"+275760-09-13T00:00:00.000Z"' &&
              // Firefox <= 11.0 incorrectly serializes years prior to 0 as negative
              // four-digit years instead of six-digit years. Credits: @Yaffle.
              stringify(new Date(-621987552e5)) == '"-000001-01-01T00:00:00.000Z"' &&
              // Safari <= 5.1.5 and Opera >= 10.53 incorrectly serialize millisecond
              // values less than 1000. Credits: @Yaffle.
              stringify(new Date(-1)) == '"1969-12-31T23:59:59.999Z"';
          } catch (exception) {
            stringifySupported = false;
          }
        }
        isSupported = stringifySupported;
      }
      // Test `JSON.parse`.
      if (name == "json-parse") {
        var parse = JSON3.parse;
        if (typeof parse == "function") {
          try {
            // FF 3.1b1, b2 will throw an exception if a bare literal is provided.
            // Conforming implementations should also coerce the initial argument to
            // a string prior to parsing.
            if (parse("0") === 0 && !parse(false)) {
              // Simple parsing test.
              value = parse(serialized);
              var parseSupported = value["a"].length == 5 && value["a"][0] === 1;
              if (parseSupported) {
                try {
                  // Safari <= 5.1.2 and FF 3.1b1 allow unescaped tabs in strings.
                  parseSupported = !parse('"\t"');
                } catch (exception) {}
                if (parseSupported) {
                  try {
                    // FF 4.0 and 4.0.1 allow leading `+` signs and leading
                    // decimal points. FF 4.0, 4.0.1, and IE 9-10 also allow
                    // certain octal literals.
                    parseSupported = parse("01") !== 1;
                  } catch (exception) {}
                }
                if (parseSupported) {
                  try {
                    // FF 4.0, 4.0.1, and Rhino 1.7R3-R4 allow trailing decimal
                    // points. These environments, along with FF 3.1b1 and 2,
                    // also allow trailing commas in JSON objects and arrays.
                    parseSupported = parse("1.") !== 1;
                  } catch (exception) {}
                }
              }
            }
          } catch (exception) {
            parseSupported = false;
          }
        }
        isSupported = parseSupported;
      }
    }
    return has[name] = !!isSupported;
  }

  if (!has("json")) {
    // Common `[[Class]]` name aliases.
    var functionClass = "[object Function]";
    var dateClass = "[object Date]";
    var numberClass = "[object Number]";
    var stringClass = "[object String]";
    var arrayClass = "[object Array]";
    var booleanClass = "[object Boolean]";

    // Detect incomplete support for accessing string characters by index.
    var charIndexBuggy = has("bug-string-char-index");

    // Define additional utility methods if the `Date` methods are buggy.
    if (!isExtended) {
      var floor = Math.floor;
      // A mapping between the months of the year and the number of days between
      // January 1st and the first of the respective month.
      var Months = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
      // Internal: Calculates the number of days between the Unix epoch and the
      // first day of the given month.
      var getDay = function (year, month) {
        return Months[month] + 365 * (year - 1970) + floor((year - 1969 + (month = +(month > 1))) / 4) - floor((year - 1901 + month) / 100) + floor((year - 1601 + month) / 400);
      };
    }

    // Internal: Determines if a property is a direct property of the given
    // object. Delegates to the native `Object#hasOwnProperty` method.
    if (!(isProperty = {}.hasOwnProperty)) {
      isProperty = function (property) {
        var members = {}, constructor;
        if ((members.__proto__ = null, members.__proto__ = {
          // The *proto* property cannot be set multiple times in recent
          // versions of Firefox and SeaMonkey.
          "toString": 1
        }, members).toString != getClass) {
          // Safari <= 2.0.3 doesn't implement `Object#hasOwnProperty`, but
          // supports the mutable *proto* property.
          isProperty = function (property) {
            // Capture and break the object's prototype chain (see section 8.6.2
            // of the ES 5.1 spec). The parenthesized expression prevents an
            // unsafe transformation by the Closure Compiler.
            var original = this.__proto__, result = property in (this.__proto__ = null, this);
            // Restore the original prototype chain.
            this.__proto__ = original;
            return result;
          };
        } else {
          // Capture a reference to the top-level `Object` constructor.
          constructor = members.constructor;
          // Use the `constructor` property to simulate `Object#hasOwnProperty` in
          // other environments.
          isProperty = function (property) {
            var parent = (this.constructor || constructor).prototype;
            return property in this && !(property in parent && this[property] === parent[property]);
          };
        }
        members = null;
        return isProperty.call(this, property);
      };
    }

    // Internal: A set of primitive types used by `isHostType`.
    var PrimitiveTypes = {
      'boolean': 1,
      'number': 1,
      'string': 1,
      'undefined': 1
    };

    // Internal: Determines if the given object `property` value is a
    // non-primitive.
    var isHostType = function (object, property) {
      var type = typeof object[property];
      return type == 'object' ? !!object[property] : !PrimitiveTypes[type];
    };

    // Internal: Normalizes the `for...in` iteration algorithm across
    // environments. Each enumerated key is yielded to a `callback` function.
    forEach = function (object, callback) {
      var size = 0, Properties, members, property;

      // Tests for bugs in the current environment's `for...in` algorithm. The
      // `valueOf` property inherits the non-enumerable flag from
      // `Object.prototype` in older versions of IE, Netscape, and Mozilla.
      (Properties = function () {
        this.valueOf = 0;
      }).prototype.valueOf = 0;

      // Iterate over a new instance of the `Properties` class.
      members = new Properties();
      for (property in members) {
        // Ignore all properties inherited from `Object.prototype`.
        if (isProperty.call(members, property)) {
          size++;
        }
      }
      Properties = members = null;

      // Normalize the iteration algorithm.
      if (!size) {
        // A list of non-enumerable properties inherited from `Object.prototype`.
        members = ["valueOf", "toString", "toLocaleString", "propertyIsEnumerable", "isPrototypeOf", "hasOwnProperty", "constructor"];
        // IE <= 8, Mozilla 1.0, and Netscape 6.2 ignore shadowed non-enumerable
        // properties.
        forEach = function (object, callback) {
          var isFunction = getClass.call(object) == functionClass, property, length;
          var hasProperty = !isFunction && typeof object.constructor != 'function' && isHostType(object, 'hasOwnProperty') ? object.hasOwnProperty : isProperty;
          for (property in object) {
            // Gecko <= 1.0 enumerates the `prototype` property of functions under
            // certain conditions; IE does not.
            if (!(isFunction && property == "prototype") && hasProperty.call(object, property)) {
              callback(property);
            }
          }
          // Manually invoke the callback for each non-enumerable property.
          for (length = members.length; property = members[--length]; hasProperty.call(object, property) && callback(property));
        };
      } else if (size == 2) {
        // Safari <= 2.0.4 enumerates shadowed properties twice.
        forEach = function (object, callback) {
          // Create a set of iterated properties.
          var members = {}, isFunction = getClass.call(object) == functionClass, property;
          for (property in object) {
            // Store each property name to prevent double enumeration. The
            // `prototype` property of functions is not enumerated due to cross-
            // environment inconsistencies.
            if (!(isFunction && property == "prototype") && !isProperty.call(members, property) && (members[property] = 1) && isProperty.call(object, property)) {
              callback(property);
            }
          }
        };
      } else {
        // No bugs detected; use the standard `for...in` algorithm.
        forEach = function (object, callback) {
          var isFunction = getClass.call(object) == functionClass, property, isConstructor;
          for (property in object) {
            if (!(isFunction && property == "prototype") && isProperty.call(object, property) && !(isConstructor = property === "constructor")) {
              callback(property);
            }
          }
          // Manually invoke the callback for the `constructor` property due to
          // cross-environment inconsistencies.
          if (isConstructor || isProperty.call(object, (property = "constructor"))) {
            callback(property);
          }
        };
      }
      return forEach(object, callback);
    };

    // Public: Serializes a JavaScript `value` as a JSON string. The optional
    // `filter` argument may specify either a function that alters how object and
    // array members are serialized, or an array of strings and numbers that
    // indicates which properties should be serialized. The optional `width`
    // argument may be either a string or number that specifies the indentation
    // level of the output.
    if (!has("json-stringify")) {
      // Internal: A map of control characters and their escaped equivalents.
      var Escapes = {
        92: "\\\\",
        34: '\\"',
        8: "\\b",
        12: "\\f",
        10: "\\n",
        13: "\\r",
        9: "\\t"
      };

      // Internal: Converts `value` into a zero-padded string such that its
      // length is at least equal to `width`. The `width` must be <= 6.
      var leadingZeroes = "000000";
      var toPaddedString = function (width, value) {
        // The `|| 0` expression is necessary to work around a bug in
        // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
        return (leadingZeroes + (value || 0)).slice(-width);
      };

      // Internal: Double-quotes a string `value`, replacing all ASCII control
      // characters (characters with code unit values between 0 and 31) with
      // their escaped equivalents. This is an implementation of the
      // `Quote(value)` operation defined in ES 5.1 section 15.12.3.
      var unicodePrefix = "\\u00";
      var quote = function (value) {
        var result = '"', index = 0, length = value.length, isLarge = length > 10 && charIndexBuggy, symbols;
        if (isLarge) {
          symbols = value.split("");
        }
        for (; index < length; index++) {
          var charCode = value.charCodeAt(index);
          // If the character is a control character, append its Unicode or
          // shorthand escape sequence; otherwise, append the character as-is.
          switch (charCode) {
            case 8: case 9: case 10: case 12: case 13: case 34: case 92:
              result += Escapes[charCode];
              break;
            default:
              if (charCode < 32) {
                result += unicodePrefix + toPaddedString(2, charCode.toString(16));
                break;
              }
              result += isLarge ? symbols[index] : charIndexBuggy ? value.charAt(index) : value[index];
          }
        }
        return result + '"';
      };

      // Internal: Recursively serializes an object. Implements the
      // `Str(key, holder)`, `JO(value)`, and `JA(value)` operations.
      var serialize = function (property, object, callback, properties, whitespace, indentation, stack) {
        var value, className, year, month, date, time, hours, minutes, seconds, milliseconds, results, element, index, length, prefix, result;
        try {
          // Necessary for host object support.
          value = object[property];
        } catch (exception) {}
        if (typeof value == "object" && value) {
          className = getClass.call(value);
          if (className == dateClass && !isProperty.call(value, "toJSON")) {
            if (value > -1 / 0 && value < 1 / 0) {
              // Dates are serialized according to the `Date#toJSON` method
              // specified in ES 5.1 section 15.9.5.44. See section 15.9.1.15
              // for the ISO 8601 date time string format.
              if (getDay) {
                // Manually compute the year, month, date, hours, minutes,
                // seconds, and milliseconds if the `getUTC*` methods are
                // buggy. Adapted from @Yaffle's `date-shim` project.
                date = floor(value / 864e5);
                for (year = floor(date / 365.2425) + 1970 - 1; getDay(year + 1, 0) <= date; year++);
                for (month = floor((date - getDay(year, 0)) / 30.42); getDay(year, month + 1) <= date; month++);
                date = 1 + date - getDay(year, month);
                // The `time` value specifies the time within the day (see ES
                // 5.1 section 15.9.1.2). The formula `(A % B + B) % B` is used
                // to compute `A modulo B`, as the `%` operator does not
                // correspond to the `modulo` operation for negative numbers.
                time = (value % 864e5 + 864e5) % 864e5;
                // The hours, minutes, seconds, and milliseconds are obtained by
                // decomposing the time within the day. See section 15.9.1.10.
                hours = floor(time / 36e5) % 24;
                minutes = floor(time / 6e4) % 60;
                seconds = floor(time / 1e3) % 60;
                milliseconds = time % 1e3;
              } else {
                year = value.getUTCFullYear();
                month = value.getUTCMonth();
                date = value.getUTCDate();
                hours = value.getUTCHours();
                minutes = value.getUTCMinutes();
                seconds = value.getUTCSeconds();
                milliseconds = value.getUTCMilliseconds();
              }
              // Serialize extended years correctly.
              value = (year <= 0 || year >= 1e4 ? (year < 0 ? "-" : "+") + toPaddedString(6, year < 0 ? -year : year) : toPaddedString(4, year)) +
                "-" + toPaddedString(2, month + 1) + "-" + toPaddedString(2, date) +
                // Months, dates, hours, minutes, and seconds should have two
                // digits; milliseconds should have three.
                "T" + toPaddedString(2, hours) + ":" + toPaddedString(2, minutes) + ":" + toPaddedString(2, seconds) +
                // Milliseconds are optional in ES 5.0, but required in 5.1.
                "." + toPaddedString(3, milliseconds) + "Z";
            } else {
              value = null;
            }
          } else if (typeof value.toJSON == "function" && ((className != numberClass && className != stringClass && className != arrayClass) || isProperty.call(value, "toJSON"))) {
            // Prototype <= 1.6.1 adds non-standard `toJSON` methods to the
            // `Number`, `String`, `Date`, and `Array` prototypes. JSON 3
            // ignores all `toJSON` methods on these objects unless they are
            // defined directly on an instance.
            value = value.toJSON(property);
          }
        }
        if (callback) {
          // If a replacement function was provided, call it to obtain the value
          // for serialization.
          value = callback.call(object, property, value);
        }
        if (value === null) {
          return "null";
        }
        className = getClass.call(value);
        if (className == booleanClass) {
          // Booleans are represented literally.
          return "" + value;
        } else if (className == numberClass) {
          // JSON numbers must be finite. `Infinity` and `NaN` are serialized as
          // `"null"`.
          return value > -1 / 0 && value < 1 / 0 ? "" + value : "null";
        } else if (className == stringClass) {
          // Strings are double-quoted and escaped.
          return quote("" + value);
        }
        // Recursively serialize objects and arrays.
        if (typeof value == "object") {
          // Check for cyclic structures. This is a linear search; performance
          // is inversely proportional to the number of unique nested objects.
          for (length = stack.length; length--;) {
            if (stack[length] === value) {
              // Cyclic structures cannot be serialized by `JSON.stringify`.
              throw TypeError();
            }
          }
          // Add the object to the stack of traversed objects.
          stack.push(value);
          results = [];
          // Save the current indentation level and indent one additional level.
          prefix = indentation;
          indentation += whitespace;
          if (className == arrayClass) {
            // Recursively serialize array elements.
            for (index = 0, length = value.length; index < length; index++) {
              element = serialize(index, value, callback, properties, whitespace, indentation, stack);
              results.push(element === undef ? "null" : element);
            }
            result = results.length ? (whitespace ? "[\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "]" : ("[" + results.join(",") + "]")) : "[]";
          } else {
            // Recursively serialize object members. Members are selected from
            // either a user-specified list of property names, or the object
            // itself.
            forEach(properties || value, function (property) {
              var element = serialize(property, value, callback, properties, whitespace, indentation, stack);
              if (element !== undef) {
                // According to ES 5.1 section 15.12.3: "If `gap` {whitespace}
                // is not the empty string, let `member` {quote(property) + ":"}
                // be the concatenation of `member` and the `space` character."
                // The "`space` character" refers to the literal space
                // character, not the `space` {width} argument provided to
                // `JSON.stringify`.
                results.push(quote(property) + ":" + (whitespace ? " " : "") + element);
              }
            });
            result = results.length ? (whitespace ? "{\n" + indentation + results.join(",\n" + indentation) + "\n" + prefix + "}" : ("{" + results.join(",") + "}")) : "{}";
          }
          // Remove the object from the traversed object stack.
          stack.pop();
          return result;
        }
      };

      // Public: `JSON.stringify`. See ES 5.1 section 15.12.3.
      JSON3.stringify = function (source, filter, width) {
        var whitespace, callback, properties, className;
        if (typeof filter == "function" || typeof filter == "object" && filter) {
          if ((className = getClass.call(filter)) == functionClass) {
            callback = filter;
          } else if (className == arrayClass) {
            // Convert the property names array into a makeshift set.
            properties = {};
            for (var index = 0, length = filter.length, value; index < length; value = filter[index++], ((className = getClass.call(value)), className == stringClass || className == numberClass) && (properties[value] = 1));
          }
        }
        if (width) {
          if ((className = getClass.call(width)) == numberClass) {
            // Convert the `width` to an integer and create a string containing
            // `width` number of space characters.
            if ((width -= width % 1) > 0) {
              for (whitespace = "", width > 10 && (width = 10); whitespace.length < width; whitespace += " ");
            }
          } else if (className == stringClass) {
            whitespace = width.length <= 10 ? width : width.slice(0, 10);
          }
        }
        // Opera <= 7.54u2 discards the values associated with empty string keys
        // (`""`) only if they are used directly within an object member list
        // (e.g., `!("" in { "": 1})`).
        return serialize("", (value = {}, value[""] = source, value), callback, properties, whitespace, "", []);
      };
    }

    // Public: Parses a JSON source string.
    if (!has("json-parse")) {
      var fromCharCode = String.fromCharCode;

      // Internal: A map of escaped control characters and their unescaped
      // equivalents.
      var Unescapes = {
        92: "\\",
        34: '"',
        47: "/",
        98: "\b",
        116: "\t",
        110: "\n",
        102: "\f",
        114: "\r"
      };

      // Internal: Stores the parser state.
      var Index, Source;

      // Internal: Resets the parser state and throws a `SyntaxError`.
      var abort = function() {
        Index = Source = null;
        throw SyntaxError();
      };

      // Internal: Returns the next token, or `"$"` if the parser has reached
      // the end of the source string. A token may be a string, number, `null`
      // literal, or Boolean literal.
      var lex = function () {
        var source = Source, length = source.length, value, begin, position, isSigned, charCode;
        while (Index < length) {
          charCode = source.charCodeAt(Index);
          switch (charCode) {
            case 9: case 10: case 13: case 32:
              // Skip whitespace tokens, including tabs, carriage returns, line
              // feeds, and space characters.
              Index++;
              break;
            case 123: case 125: case 91: case 93: case 58: case 44:
              // Parse a punctuator token (`{`, `}`, `[`, `]`, `:`, or `,`) at
              // the current position.
              value = charIndexBuggy ? source.charAt(Index) : source[Index];
              Index++;
              return value;
            case 34:
              // `"` delimits a JSON string; advance to the next character and
              // begin parsing the string. String tokens are prefixed with the
              // sentinel `@` character to distinguish them from punctuators and
              // end-of-string tokens.
              for (value = "@", Index++; Index < length;) {
                charCode = source.charCodeAt(Index);
                if (charCode < 32) {
                  // Unescaped ASCII control characters (those with a code unit
                  // less than the space character) are not permitted.
                  abort();
                } else if (charCode == 92) {
                  // A reverse solidus (`\`) marks the beginning of an escaped
                  // control character (including `"`, `\`, and `/`) or Unicode
                  // escape sequence.
                  charCode = source.charCodeAt(++Index);
                  switch (charCode) {
                    case 92: case 34: case 47: case 98: case 116: case 110: case 102: case 114:
                      // Revive escaped control characters.
                      value += Unescapes[charCode];
                      Index++;
                      break;
                    case 117:
                      // `\u` marks the beginning of a Unicode escape sequence.
                      // Advance to the first character and validate the
                      // four-digit code point.
                      begin = ++Index;
                      for (position = Index + 4; Index < position; Index++) {
                        charCode = source.charCodeAt(Index);
                        // A valid sequence comprises four hexdigits (case-
                        // insensitive) that form a single hexadecimal value.
                        if (!(charCode >= 48 && charCode <= 57 || charCode >= 97 && charCode <= 102 || charCode >= 65 && charCode <= 70)) {
                          // Invalid Unicode escape sequence.
                          abort();
                        }
                      }
                      // Revive the escaped character.
                      value += fromCharCode("0x" + source.slice(begin, Index));
                      break;
                    default:
                      // Invalid escape sequence.
                      abort();
                  }
                } else {
                  if (charCode == 34) {
                    // An unescaped double-quote character marks the end of the
                    // string.
                    break;
                  }
                  charCode = source.charCodeAt(Index);
                  begin = Index;
                  // Optimize for the common case where a string is valid.
                  while (charCode >= 32 && charCode != 92 && charCode != 34) {
                    charCode = source.charCodeAt(++Index);
                  }
                  // Append the string as-is.
                  value += source.slice(begin, Index);
                }
              }
              if (source.charCodeAt(Index) == 34) {
                // Advance to the next character and return the revived string.
                Index++;
                return value;
              }
              // Unterminated string.
              abort();
            default:
              // Parse numbers and literals.
              begin = Index;
              // Advance past the negative sign, if one is specified.
              if (charCode == 45) {
                isSigned = true;
                charCode = source.charCodeAt(++Index);
              }
              // Parse an integer or floating-point value.
              if (charCode >= 48 && charCode <= 57) {
                // Leading zeroes are interpreted as octal literals.
                if (charCode == 48 && ((charCode = source.charCodeAt(Index + 1)), charCode >= 48 && charCode <= 57)) {
                  // Illegal octal literal.
                  abort();
                }
                isSigned = false;
                // Parse the integer component.
                for (; Index < length && ((charCode = source.charCodeAt(Index)), charCode >= 48 && charCode <= 57); Index++);
                // Floats cannot contain a leading decimal point; however, this
                // case is already accounted for by the parser.
                if (source.charCodeAt(Index) == 46) {
                  position = ++Index;
                  // Parse the decimal component.
                  for (; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                  if (position == Index) {
                    // Illegal trailing decimal.
                    abort();
                  }
                  Index = position;
                }
                // Parse exponents. The `e` denoting the exponent is
                // case-insensitive.
                charCode = source.charCodeAt(Index);
                if (charCode == 101 || charCode == 69) {
                  charCode = source.charCodeAt(++Index);
                  // Skip past the sign following the exponent, if one is
                  // specified.
                  if (charCode == 43 || charCode == 45) {
                    Index++;
                  }
                  // Parse the exponential component.
                  for (position = Index; position < length && ((charCode = source.charCodeAt(position)), charCode >= 48 && charCode <= 57); position++);
                  if (position == Index) {
                    // Illegal empty exponent.
                    abort();
                  }
                  Index = position;
                }
                // Coerce the parsed value to a JavaScript number.
                return +source.slice(begin, Index);
              }
              // A negative sign may only precede numbers.
              if (isSigned) {
                abort();
              }
              // `true`, `false`, and `null` literals.
              if (source.slice(Index, Index + 4) == "true") {
                Index += 4;
                return true;
              } else if (source.slice(Index, Index + 5) == "false") {
                Index += 5;
                return false;
              } else if (source.slice(Index, Index + 4) == "null") {
                Index += 4;
                return null;
              }
              // Unrecognized token.
              abort();
          }
        }
        // Return the sentinel `$` character if the parser has reached the end
        // of the source string.
        return "$";
      };

      // Internal: Parses a JSON `value` token.
      var get = function (value) {
        var results, hasMembers;
        if (value == "$") {
          // Unexpected end of input.
          abort();
        }
        if (typeof value == "string") {
          if ((charIndexBuggy ? value.charAt(0) : value[0]) == "@") {
            // Remove the sentinel `@` character.
            return value.slice(1);
          }
          // Parse object and array literals.
          if (value == "[") {
            // Parses a JSON array, returning a new JavaScript array.
            results = [];
            for (;; hasMembers || (hasMembers = true)) {
              value = lex();
              // A closing square bracket marks the end of the array literal.
              if (value == "]") {
                break;
              }
              // If the array literal contains elements, the current token
              // should be a comma separating the previous element from the
              // next.
              if (hasMembers) {
                if (value == ",") {
                  value = lex();
                  if (value == "]") {
                    // Unexpected trailing `,` in array literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each array element.
                  abort();
                }
              }
              // Elisions and leading commas are not permitted.
              if (value == ",") {
                abort();
              }
              results.push(get(value));
            }
            return results;
          } else if (value == "{") {
            // Parses a JSON object, returning a new JavaScript object.
            results = {};
            for (;; hasMembers || (hasMembers = true)) {
              value = lex();
              // A closing curly brace marks the end of the object literal.
              if (value == "}") {
                break;
              }
              // If the object literal contains members, the current token
              // should be a comma separator.
              if (hasMembers) {
                if (value == ",") {
                  value = lex();
                  if (value == "}") {
                    // Unexpected trailing `,` in object literal.
                    abort();
                  }
                } else {
                  // A `,` must separate each object member.
                  abort();
                }
              }
              // Leading commas are not permitted, object property names must be
              // double-quoted strings, and a `:` must separate each property
              // name and value.
              if (value == "," || typeof value != "string" || (charIndexBuggy ? value.charAt(0) : value[0]) != "@" || lex() != ":") {
                abort();
              }
              results[value.slice(1)] = get(lex());
            }
            return results;
          }
          // Unexpected token encountered.
          abort();
        }
        return value;
      };

      // Internal: Updates a traversed object member.
      var update = function(source, property, callback) {
        var element = walk(source, property, callback);
        if (element === undef) {
          delete source[property];
        } else {
          source[property] = element;
        }
      };

      // Internal: Recursively traverses a parsed JSON object, invoking the
      // `callback` function for each value. This is an implementation of the
      // `Walk(holder, name)` operation defined in ES 5.1 section 15.12.2.
      var walk = function (source, property, callback) {
        var value = source[property], length;
        if (typeof value == "object" && value) {
          // `forEach` can't be used to traverse an array in Opera <= 8.54
          // because its `Object#hasOwnProperty` implementation returns `false`
          // for array indices (e.g., `![1, 2, 3].hasOwnProperty("0")`).
          if (getClass.call(value) == arrayClass) {
            for (length = value.length; length--;) {
              update(value, length, callback);
            }
          } else {
            forEach(value, function (property) {
              update(value, property, callback);
            });
          }
        }
        return callback.call(source, property, value);
      };

      // Public: `JSON.parse`. See ES 5.1 section 15.12.2.
      JSON3.parse = function (source, callback) {
        var result, value;
        Index = 0;
        Source = "" + source;
        result = get(lex());
        // If a JSON string contains multiple tokens, it is invalid.
        if (lex() != "$") {
          abort();
        }
        // Reset the parser state.
        Index = Source = null;
        return callback && getClass.call(callback) == functionClass ? walk((value = {}, value[""] = result, value), "", callback) : result;
      };
    }
  }

  // Export for asynchronous module loaders.
  if (isLoader) {
    define(function () {
      return JSON3;
    });
  }
}(this));

},{}],50:[function(_dereq_,module,exports){
module.exports = toArray

function toArray(list, index) {
    var array = []

    index = index || 0

    for (var i = index || 0; i < list.length; i++) {
        array[i - index] = list[i]
    }

    return array
}

},{}]},{},[1])
(1)
});

}).call(this,typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}]},{},[14])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImY6XFxDb2RlXFxOb2RlXFx0LXJleC1ydW5uZXJcXG5vZGVfbW9kdWxlc1xcZ3VscC1icm93c2VyaWZ5XFxub2RlX21vZHVsZXNcXGJyb3dzZXJpZnlcXG5vZGVfbW9kdWxlc1xcYnJvd3Nlci1wYWNrXFxfcHJlbHVkZS5qcyIsImY6L0NvZGUvTm9kZS90LXJleC1ydW5uZXIvc3JjL2NvbXBvbmVudHMvQnJvd3Nlci5qcyIsImY6L0NvZGUvTm9kZS90LXJleC1ydW5uZXIvc3JjL2NvbXBvbmVudHMvQ2xvdWQuanMiLCJmOi9Db2RlL05vZGUvdC1yZXgtcnVubmVyL3NyYy9jb21wb25lbnRzL0NvbGxpc2lvbkJveC5qcyIsImY6L0NvZGUvTm9kZS90LXJleC1ydW5uZXIvc3JjL2NvbXBvbmVudHMvQ29uc3RhbnRzLmpzIiwiZjovQ29kZS9Ob2RlL3QtcmV4LXJ1bm5lci9zcmMvY29tcG9uZW50cy9EaXN0YW5jZU1ldGVyLmpzIiwiZjovQ29kZS9Ob2RlL3QtcmV4LXJ1bm5lci9zcmMvY29tcG9uZW50cy9HYW1lT3ZlclBhbmVsLmpzIiwiZjovQ29kZS9Ob2RlL3QtcmV4LXJ1bm5lci9zcmMvY29tcG9uZW50cy9Ib3Jpem9uLmpzIiwiZjovQ29kZS9Ob2RlL3QtcmV4LXJ1bm5lci9zcmMvY29tcG9uZW50cy9Ib3Jpem9uTGluZS5qcyIsImY6L0NvZGUvTm9kZS90LXJleC1ydW5uZXIvc3JjL2NvbXBvbmVudHMvT2JzdGFjbGUuanMiLCJmOi9Db2RlL05vZGUvdC1yZXgtcnVubmVyL3NyYy9jb21wb25lbnRzL1J1bm5lci5qcyIsImY6L0NvZGUvTm9kZS90LXJleC1ydW5uZXIvc3JjL2NvbXBvbmVudHMvU2VydmVyLmpzIiwiZjovQ29kZS9Ob2RlL3QtcmV4LXJ1bm5lci9zcmMvY29tcG9uZW50cy9UcmV4LmpzIiwiZjovQ29kZS9Ob2RlL3QtcmV4LXJ1bm5lci9zcmMvY29tcG9uZW50cy9VdGlscy5qcyIsImY6L0NvZGUvTm9kZS90LXJleC1ydW5uZXIvc3JjL2Zha2VfZTkwYWYyY2IuanMiLCJmOi9Db2RlL05vZGUvdC1yZXgtcnVubmVyL3NyYy9saWIvYXNzaWduLmpzIiwiZjovQ29kZS9Ob2RlL3QtcmV4LXJ1bm5lci9zcmMvbGliL3NvY2tldC5pby5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeCtCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN4Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIEJyb3dzZXIgPSB7fTtcclxuXHJcbkJyb3dzZXIuZGV0ZWN0ID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIHVhID0gbmF2aWdhdG9yLnVzZXJBZ2VudCwgdGVtLFxyXG4gICAgTSA9IHVhLm1hdGNoKC8ob3BlcmF8Y2hyb21lfHNhZmFyaXxmaXJlZm94fG1zaWV8dHJpZGVudCg/PVxcLykpXFwvP1xccyooXFxkKykvaSkgfHwgW107XHJcbiAgICBpZigvdHJpZGVudC9pLnRlc3QoTVsxXSkpe1xyXG4gICAgICAgIHRlbSA9ICAvXFxicnZbIDpdKyhcXGQrKS9nLmV4ZWModWEpIHx8IFtdO1xyXG4gICAgICAgIHJldHVybiAnSUUgJysodGVtWzFdIHx8ICcnKTtcclxuICAgIH1cclxuICAgIGlmKE1bMV0gPT09ICdDaHJvbWUnKXtcclxuICAgICAgICB0ZW0gPSB1YS5tYXRjaCgvXFxiKE9QUnxFZGdlKVxcLyhcXGQrKS8pO1xyXG4gICAgICAgIGlmKHRlbSAhPSBudWxsKSByZXR1cm4gdGVtLnNsaWNlKDEpLmpvaW4oJyAnKS5yZXBsYWNlKCdPUFInLCAnT3BlcmEnKTtcclxuICAgIH1cclxuICAgIE0gPSBNWzJdPyBbTVsxXSwgTVsyXV06IFtuYXZpZ2F0b3IuYXBwTmFtZSwgbmF2aWdhdG9yLmFwcFZlcnNpb24sICctPyddO1xyXG4gICAgaWYoKHRlbSA9IHVhLm1hdGNoKC92ZXJzaW9uXFwvKFxcZCspL2kpKSAhPSBudWxsKVxyXG4gICAgICAgIE0uc3BsaWNlKDEsIDEsIHRlbVsxXSk7XHJcblxyXG4gICAgcmV0dXJuIE07XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJyb3dzZXI7IiwidmFyIFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xyXG52YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9Db25zdGFudHMnKTtcclxuXHJcbi8qKlxyXG4gKiBDbG91ZCBiYWNrZ3JvdW5kIGl0ZW0uXHJcbiAqIFNpbWlsYXIgdG8gYW4gb2JzdGFjbGUgb2JqZWN0IGJ1dCB3aXRob3V0IGNvbGxpc2lvbiBib3hlcy5cclxuICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzIENhbnZhcyBlbGVtZW50LlxyXG4gKiBAcGFyYW0ge0ltYWdlfSBjbG91ZEltZ1xyXG4gKiBAcGFyYW0ge251bWJlcn0gY29udGFpbmVyV2lkdGhcclxuICovXHJcbmZ1bmN0aW9uIENsb3VkKGNhbnZhcywgY2xvdWRJbWcsIGNvbnRhaW5lcldpZHRoKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMuY2FudmFzQ3R4ID0gdGhpcy5jYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIHRoaXMuaW1hZ2UgPSBjbG91ZEltZztcclxuICAgIHRoaXMuY29udGFpbmVyV2lkdGggPSBjb250YWluZXJXaWR0aDtcclxuICAgIHRoaXMueFBvcyA9IGNvbnRhaW5lcldpZHRoO1xyXG4gICAgdGhpcy55UG9zID0gMDtcclxuICAgIHRoaXMucmVtb3ZlID0gZmFsc2U7XHJcbiAgICB0aGlzLmNsb3VkR2FwID0gVXRpbHMuZ2V0UmFuZG9tTnVtKENsb3VkLmNvbmZpZy5NSU5fQ0xPVURfR0FQLFxyXG4gICAgICAgIENsb3VkLmNvbmZpZy5NQVhfQ0xPVURfR0FQKTtcclxuICAgIHRoaXMuaW5pdCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENsb3VkIG9iamVjdCBjb25maWcuXHJcbiAqIEBlbnVtIHtudW1iZXJ9XHJcbiAqL1xyXG5DbG91ZC5jb25maWcgPSB7XHJcbiAgICBIRUlHSFQ6IDEzLFxyXG4gICAgTUFYX0NMT1VEX0dBUDogNDAwLFxyXG4gICAgTUFYX1NLWV9MRVZFTDogMzAsXHJcbiAgICBNSU5fQ0xPVURfR0FQOiAxMDAsXHJcbiAgICBNSU5fU0tZX0xFVkVMOiA3MSxcclxuICAgIFdJRFRIOiA0NlxyXG59O1xyXG5DbG91ZC5wcm90b3R5cGUgPSB7XHJcbiAgICAvKipcclxuICAgICAqIEluaXRpYWxpc2UgdGhlIGNsb3VkLiBTZXRzIHRoZSBDbG91ZCBoZWlnaHQuXHJcbiAgICAgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMueVBvcyA9IFV0aWxzLmdldFJhbmRvbU51bShDbG91ZC5jb25maWcuTUFYX1NLWV9MRVZFTCxcclxuICAgICAgICAgICAgQ2xvdWQuY29uZmlnLk1JTl9TS1lfTEVWRUwpO1xyXG4gICAgICAgIHRoaXMuZHJhdygpO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogRHJhdyB0aGUgY2xvdWQuXHJcbiAgICAgKi9cclxuICAgIGRyYXc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LnNhdmUoKTtcclxuICAgICAgICB2YXIgc291cmNlV2lkdGggPSBDbG91ZC5jb25maWcuV0lEVEg7XHJcbiAgICAgICAgdmFyIHNvdXJjZUhlaWdodCA9IENsb3VkLmNvbmZpZy5IRUlHSFQ7XHJcblxyXG4gICAgICAgIGlmIChDb25zdGFudHMuSVNfSElEUEkpIHtcclxuICAgICAgICAgICAgc291cmNlV2lkdGggPSBzb3VyY2VXaWR0aCAqIDI7XHJcbiAgICAgICAgICAgIHNvdXJjZUhlaWdodCA9IHNvdXJjZUhlaWdodCAqIDI7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCAwLCAwLFxyXG4gICAgICAgICAgICBzb3VyY2VXaWR0aCwgc291cmNlSGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLnhQb3MsIHRoaXMueVBvcyxcclxuICAgICAgICAgICAgQ2xvdWQuY29uZmlnLldJRFRILCBDbG91ZC5jb25maWcuSEVJR0hUKTtcclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5yZXN0b3JlKCk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdGhlIGNsb3VkIHBvc2l0aW9uLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHNwZWVkXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZTogZnVuY3Rpb24oc3BlZWQpIHtcclxuICAgICAgICBpZiAoIXRoaXMucmVtb3ZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMueFBvcyAtPSBNYXRoLmNlaWwoc3BlZWQpO1xyXG4gICAgICAgICAgICB0aGlzLmRyYXcoKTtcclxuXHJcbiAgICAgICAgICAgIC8vIE1hcmsgYXMgcmVtb3ZlYWJsZSBpZiBubyBsb25nZXIgaW4gdGhlIGNhbnZhcy5cclxuICAgICAgICAgICAgaWYgKCF0aGlzLmlzVmlzaWJsZSgpKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnJlbW92ZSA9IHRydWU7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayBpZiB0aGUgY2xvdWQgaXMgdmlzaWJsZSBvbiB0aGUgc3RhZ2UuXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBpc1Zpc2libGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiB0aGlzLnhQb3MgKyBDbG91ZC5jb25maWcuV0lEVEggPiAwO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBDbG91ZDsiLCIvKipcclxuICogQ29sbGlzaW9uIGJveCBvYmplY3QuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB4IFggcG9zaXRpb24uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB5IFkgUG9zaXRpb24uXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB3IFdpZHRoLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gaCBIZWlnaHQuXHJcbiAqL1xyXG5mdW5jdGlvbiBDb2xsaXNpb25Cb3goeCwgeSwgdywgaCkge1xyXG4gICAgdGhpcy54ID0geDtcclxuICAgIHRoaXMueSA9IHk7XHJcbiAgICB0aGlzLndpZHRoID0gdztcclxuICAgIHRoaXMuaGVpZ2h0ID0gaDtcclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gQ29sbGlzaW9uQm94OyIsIm1vZHVsZS5leHBvcnRzID0ge1xyXG4gIC8qKlxyXG4gICAqIERlZmF1bHQgZ2FtZSB3aWR0aC5cclxuICAgKi9cclxuICBERUZBVUxUX1dJRFRIOiA2MDAsXHJcbiAgREVGQVVMVF9IRUlHSFQ6IDE1MCxcclxuICAvKipcclxuICAgKiBGcmFtZXMgcGVyIHNlY29uZC5cclxuICAgKi9cclxuICBGUFM6IDYwLFxyXG4gIElTX0hJRFBJOiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbyA+IDEsXHJcbiAgSVNfTU9CSUxFOiB3aW5kb3cubmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNb2JpJykgPiAtMSxcclxuICBJU19UT1VDSF9FTkFCTEVEOiAnb250b3VjaHN0YXJ0JyBpbiB3aW5kb3csXHJcbiAgQk9UVE9NX1BBRDogMTAsXHJcbn0iLCJ2YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9Db25zdGFudHMnKTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGVzIGRpc3BsYXlpbmcgdGhlIGRpc3RhbmNlIG1ldGVyLlxyXG4gKiBAcGFyYW0geyFIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzXHJcbiAqIEBwYXJhbSB7IUhUTUxJbWFnZX0gc3ByaXRlU2hlZXQgSW1hZ2Ugc3ByaXRlLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gY2FudmFzV2lkdGhcclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBEaXN0YW5jZU1ldGVyKGNhbnZhcywgc3ByaXRlU2hlZXQsIGNhbnZhc1dpZHRoKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMuY2FudmFzQ3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB0aGlzLmltYWdlID0gc3ByaXRlU2hlZXQ7XHJcbiAgICB0aGlzLnggPSAwO1xyXG4gICAgdGhpcy55ID0gNTtcclxuICAgIHRoaXMuY3VycmVudERpc3RhbmNlID0gMDtcclxuICAgIHRoaXMubWF4U2NvcmUgPSAwO1xyXG4gICAgdGhpcy5oaWdoU2NvcmUgPSAwO1xyXG4gICAgdGhpcy5jb250YWluZXIgPSBudWxsO1xyXG4gICAgdGhpcy5kaWdpdHMgPSBbXTtcclxuICAgIHRoaXMuYWNoZWl2ZW1lbnQgPSBmYWxzZTtcclxuICAgIHRoaXMuZGVmYXVsdFN0cmluZyA9ICcnO1xyXG4gICAgdGhpcy5mbGFzaFRpbWVyID0gMDtcclxuICAgIHRoaXMuZmxhc2hJdGVyYXRpb25zID0gMDtcclxuICAgIHRoaXMuY29uZmlnID0gRGlzdGFuY2VNZXRlci5jb25maWc7XHJcbiAgICB0aGlzLmluaXQoY2FudmFzV2lkdGgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEBlbnVtIHtudW1iZXJ9XHJcbiAqL1xyXG5EaXN0YW5jZU1ldGVyLmRpbWVuc2lvbnMgPSB7XHJcbiAgICBXSURUSDogMTAsXHJcbiAgICBIRUlHSFQ6IDEzLFxyXG4gICAgREVTVF9XSURUSDogMTFcclxufTtcclxuLyoqXHJcbiAqIFkgcG9zaXRpb25pbmcgb2YgdGhlIGRpZ2l0cyBpbiB0aGUgc3ByaXRlIHNoZWV0LlxyXG4gKiBYIHBvc2l0aW9uIGlzIGFsd2F5cyAwLlxyXG4gKiBAdHlwZSB7YXJyYXkuPG51bWJlcj59XHJcbiAqL1xyXG5EaXN0YW5jZU1ldGVyLnlQb3MgPSBbMCwgMTMsIDI3LCA0MCwgNTMsIDY3LCA4MCwgOTMsIDEwNywgMTIwXTtcclxuXHJcbi8qKlxyXG4gKiBEaXN0YW5jZSBtZXRlciBjb25maWcuXHJcbiAqIEBlbnVtIHtudW1iZXJ9XHJcbiAqL1xyXG5EaXN0YW5jZU1ldGVyLmNvbmZpZyA9IHtcclxuICAgIC8vIE51bWJlciBvZiBkaWdpdHMuXHJcbiAgICBNQVhfRElTVEFOQ0VfVU5JVFM6IDUsXHJcbiAgICAvLyBEaXN0YW5jZSB0aGF0IGNhdXNlcyBhY2hpZXZlbWVudCBhbmltYXRpb24uXHJcbiAgICBBQ0hJRVZFTUVOVF9ESVNUQU5DRTogMTAwLFxyXG4gICAgLy8gVXNlZCBmb3IgY29udmVyc2lvbiBmcm9tIHBpeGVsIGRpc3RhbmNlIHRvIGEgc2NhbGVkIHVuaXQuXHJcbiAgICBDT0VGRklDSUVOVDogMC4wMjUsXHJcblxyXG4gICAgLy8gRmxhc2ggZHVyYXRpb24gaW4gbWlsbGlzZWNvbmRzLlxyXG4gICAgRkxBU0hfRFVSQVRJT046IDEwMDAgLyA0LFxyXG4gICAgLy8gRmxhc2ggaXRlcmF0aW9ucyBmb3IgYWNoaWV2ZW1lbnQgYW5pbWF0aW9uLlxyXG4gICAgRkxBU0hfSVRFUkFUSU9OUzogM1xyXG59O1xyXG5EaXN0YW5jZU1ldGVyLnByb3RvdHlwZSA9IHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGlzZSB0aGUgZGlzdGFuY2UgbWV0ZXIgdG8gJzAwMDAwJy5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB3aWR0aCBDYW52YXMgd2lkdGggaW4gcHguXHJcbiAgICAgKi9cclxuICAgIGluaXQ6IGZ1bmN0aW9uKHdpZHRoKSB7XHJcbiAgICAgICAgdmFyIG1heERpc3RhbmNlU3RyID0gJyc7XHJcblxyXG4gICAgICAgIHRoaXMuY2FsY1hQb3Mod2lkdGgpO1xyXG4gICAgICAgIHRoaXMubWF4U2NvcmUgPSB0aGlzLmNvbmZpZy5NQVhfRElTVEFOQ0VfVU5JVFM7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNvbmZpZy5NQVhfRElTVEFOQ0VfVU5JVFM7IGkrKykge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXcoaSwgMCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGVmYXVsdFN0cmluZyArPSAnMCc7XHJcbiAgICAgICAgICAgIG1heERpc3RhbmNlU3RyICs9ICc5JztcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5tYXhTY29yZSA9IHBhcnNlSW50KG1heERpc3RhbmNlU3RyKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIENhbGN1bGF0ZSB0aGUgeFBvcyBpbiB0aGUgY2FudmFzLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGNhbnZhc1dpZHRoXHJcbiAgICAgKi9cclxuICAgIGNhbGNYUG9zOiBmdW5jdGlvbihjYW52YXNXaWR0aCkge1xyXG4gICAgICAgIHRoaXMueCA9IGNhbnZhc1dpZHRoIC0gKERpc3RhbmNlTWV0ZXIuZGltZW5zaW9ucy5ERVNUX1dJRFRIICpcclxuICAgICAgICAgICAgKHRoaXMuY29uZmlnLk1BWF9ESVNUQU5DRV9VTklUUyArIDEpKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIERyYXcgYSBkaWdpdCB0byBjYW52YXMuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGlnaXRQb3MgUG9zaXRpb24gb2YgdGhlIGRpZ2l0LlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHZhbHVlIERpZ2l0IHZhbHVlIDAtOS5cclxuICAgICAqIEBwYXJhbSB7Ym9vbGVhbn0gb3B0X2hpZ2hTY29yZSBXaGV0aGVyIGRyYXdpbmcgdGhlIGhpZ2ggc2NvcmUuXHJcbiAgICAgKi9cclxuICAgIGRyYXc6IGZ1bmN0aW9uKGRpZ2l0UG9zLCB2YWx1ZSwgb3B0X2hpZ2hTY29yZSkge1xyXG4gICAgICAgIHZhciBzb3VyY2VXaWR0aCA9IERpc3RhbmNlTWV0ZXIuZGltZW5zaW9ucy5XSURUSDtcclxuICAgICAgICB2YXIgc291cmNlSGVpZ2h0ID0gRGlzdGFuY2VNZXRlci5kaW1lbnNpb25zLkhFSUdIVDtcclxuICAgICAgICB2YXIgc291cmNlWCA9IERpc3RhbmNlTWV0ZXIuZGltZW5zaW9ucy5XSURUSCAqIHZhbHVlO1xyXG5cclxuICAgICAgICB2YXIgdGFyZ2V0WCA9IGRpZ2l0UG9zICogRGlzdGFuY2VNZXRlci5kaW1lbnNpb25zLkRFU1RfV0lEVEg7XHJcbiAgICAgICAgdmFyIHRhcmdldFkgPSB0aGlzLnk7XHJcbiAgICAgICAgdmFyIHRhcmdldFdpZHRoID0gRGlzdGFuY2VNZXRlci5kaW1lbnNpb25zLldJRFRIO1xyXG4gICAgICAgIHZhciB0YXJnZXRIZWlnaHQgPSBEaXN0YW5jZU1ldGVyLmRpbWVuc2lvbnMuSEVJR0hUO1xyXG4gICAgICAgIC8vIEZvciBoaWdoIERQSSB3ZSAyeCBzb3VyY2UgdmFsdWVzLlxyXG4gICAgICAgIGlmIChDb25zdGFudHMuSVNfSElEUEkpIHtcclxuICAgICAgICAgICAgc291cmNlV2lkdGggKj0gMjtcclxuICAgICAgICAgICAgc291cmNlSGVpZ2h0ICo9IDI7XHJcbiAgICAgICAgICAgIHNvdXJjZVggKj0gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYW52YXNDdHguc2F2ZSgpO1xyXG4gICAgICAgIGlmIChvcHRfaGlnaFNjb3JlKSB7XHJcbiAgICAgICAgICAgIC8vIExlZnQgb2YgdGhlIGN1cnJlbnQgc2NvcmUuXHJcbiAgICAgICAgICAgIHZhciBoaWdoU2NvcmVYID0gdGhpcy54IC0gKHRoaXMuY29uZmlnLk1BWF9ESVNUQU5DRV9VTklUUyAqIDIpICpcclxuICAgICAgICAgICAgICAgIERpc3RhbmNlTWV0ZXIuZGltZW5zaW9ucy5XSURUSDtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXNDdHgudHJhbnNsYXRlKGhpZ2hTY29yZVgsIHRoaXMueSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXNDdHgudHJhbnNsYXRlKHRoaXMueCwgdGhpcy55KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCBzb3VyY2VYLCAwLFxyXG4gICAgICAgICAgICBzb3VyY2VXaWR0aCwgc291cmNlSGVpZ2h0LFxyXG4gICAgICAgICAgICB0YXJnZXRYLCB0YXJnZXRZLFxyXG4gICAgICAgICAgICB0YXJnZXRXaWR0aCwgdGFyZ2V0SGVpZ2h0XHJcbiAgICAgICAgKTtcclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5yZXN0b3JlKCk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBDb3ZlcnQgcGl4ZWwgZGlzdGFuY2UgdG8gYSAncmVhbCcgZGlzdGFuY2UuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGlzdGFuY2UgUGl4ZWwgZGlzdGFuY2UgcmFuLlxyXG4gICAgICogQHJldHVybiB7bnVtYmVyfSBUaGUgJ3JlYWwnIGRpc3RhbmNlIHJhbi5cclxuICAgICAqL1xyXG4gICAgZ2V0QWN0dWFsRGlzdGFuY2U6IGZ1bmN0aW9uKGRpc3RhbmNlKSB7XHJcbiAgICAgICAgcmV0dXJuIGRpc3RhbmNlID9cclxuICAgICAgICAgICAgTWF0aC5yb3VuZChkaXN0YW5jZSAqIHRoaXMuY29uZmlnLkNPRUZGSUNJRU5UKSA6IDA7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdGhlIGRpc3RhbmNlIG1ldGVyLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlbHRhVGltZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRpc3RhbmNlXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBhY2hlaXZlbWVudCBzb3VuZCBmeCBzaG91bGQgYmUgcGxheWVkLlxyXG4gICAgICovXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGRlbHRhVGltZSwgZGlzdGFuY2UpIHtcclxuICAgICAgICB2YXIgcGFpbnQgPSB0cnVlO1xyXG4gICAgICAgIHZhciBwbGF5U291bmQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgaWYgKCF0aGlzLmFjaGVpdmVtZW50KSB7XHJcbiAgICAgICAgICAgIGRpc3RhbmNlID0gdGhpcy5nZXRBY3R1YWxEaXN0YW5jZShkaXN0YW5jZSk7XHJcbiAgICAgICAgICAgIGlmIChkaXN0YW5jZSA+IDApIHtcclxuICAgICAgICAgICAgICAgIC8vIEFjaGVpdmVtZW50IHVubG9ja2VkXHJcbiAgICAgICAgICAgICAgICBpZiAoZGlzdGFuY2UgJSB0aGlzLmNvbmZpZy5BQ0hJRVZFTUVOVF9ESVNUQU5DRSA9PSAwKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRmxhc2ggc2NvcmUgYW5kIHBsYXkgc291bmQuXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5hY2hlaXZlbWVudCA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mbGFzaFRpbWVyID0gMDtcclxuICAgICAgICAgICAgICAgICAgICBwbGF5U291bmQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGEgc3RyaW5nIHJlcHJlc2VudGF0aW9uIG9mIHRoZSBkaXN0YW5jZSB3aXRoIGxlYWRpbmcgMC5cclxuICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZVN0ciA9ICh0aGlzLmRlZmF1bHRTdHJpbmcgK1xyXG4gICAgICAgICAgICAgICAgICAgIGRpc3RhbmNlKS5zdWJzdHIoLXRoaXMuY29uZmlnLk1BWF9ESVNUQU5DRV9VTklUUyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpZ2l0cyA9IGRpc3RhbmNlU3RyLnNwbGl0KCcnKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuZGlnaXRzID0gdGhpcy5kZWZhdWx0U3RyaW5nLnNwbGl0KCcnKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIC8vIENvbnRyb2wgZmxhc2hpbmcgb2YgdGhlIHNjb3JlIG9uIHJlYWNoaW5nIGFjaGVpdmVtZW50LlxyXG4gICAgICAgICAgICBpZiAodGhpcy5mbGFzaEl0ZXJhdGlvbnMgPD0gdGhpcy5jb25maWcuRkxBU0hfSVRFUkFUSU9OUykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mbGFzaFRpbWVyICs9IGRlbHRhVGltZTtcclxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmZsYXNoVGltZXIgPCB0aGlzLmNvbmZpZy5GTEFTSF9EVVJBVElPTikge1xyXG4gICAgICAgICAgICAgICAgICAgIHBhaW50ID0gZmFsc2U7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuZmxhc2hUaW1lciA+XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jb25maWcuRkxBU0hfRFVSQVRJT04gKiAyKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5mbGFzaFRpbWVyID0gMDtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLmZsYXNoSXRlcmF0aW9ucysrO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY2hlaXZlbWVudCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mbGFzaEl0ZXJhdGlvbnMgPSAwO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5mbGFzaFRpbWVyID0gMDtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy8gRHJhdyB0aGUgZGlnaXRzIGlmIG5vdCBmbGFzaGluZy5cclxuICAgICAgICBpZiAocGFpbnQpIHtcclxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuZGlnaXRzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRyYXcoaSwgcGFyc2VJbnQodGhpcy5kaWdpdHNbaV0pKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmRyYXdIaWdoU2NvcmUoKTtcclxuICAgICAgICByZXR1cm4gcGxheVNvdW5kO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogRHJhdyB0aGUgaGlnaCBzY29yZS5cclxuICAgICAqL1xyXG4gICAgZHJhd0hpZ2hTY29yZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXNDdHguc2F2ZSgpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4Lmdsb2JhbEFscGhhID0gLjg7XHJcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMuaGlnaFNjb3JlLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhdyhpLCBwYXJzZUludCh0aGlzLmhpZ2hTY29yZVtpXSwgMTApLCB0cnVlKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYW52YXNDdHgucmVzdG9yZSgpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCB0aGUgaGlnaHNjb3JlIGFzIGEgYXJyYXkgc3RyaW5nLlxyXG4gICAgICogUG9zaXRpb24gb2YgY2hhciBpbiB0aGUgc3ByaXRlOiBIIC0gMTAsIEkgLSAxMS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkaXN0YW5jZSBEaXN0YW5jZSByYW4gaW4gcGl4ZWxzLlxyXG4gICAgICovXHJcbiAgICBzZXRIaWdoU2NvcmU6IGZ1bmN0aW9uKGRpc3RhbmNlKSB7XHJcbiAgICAgICAgZGlzdGFuY2UgPSB0aGlzLmdldEFjdHVhbERpc3RhbmNlKGRpc3RhbmNlKTtcclxuICAgICAgICB2YXIgaGlnaFNjb3JlU3RyID0gKHRoaXMuZGVmYXVsdFN0cmluZyArXHJcbiAgICAgICAgICAgIGRpc3RhbmNlKS5zdWJzdHIoLXRoaXMuY29uZmlnLk1BWF9ESVNUQU5DRV9VTklUUyk7XHJcbiAgICAgICAgdGhpcy5oaWdoU2NvcmUgPSBbJzEwJywgJzExJywgJyddLmNvbmNhdChoaWdoU2NvcmVTdHIuc3BsaXQoJycpKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFJlc2V0IHRoZSBkaXN0YW5jZSBtZXRlciBiYWNrIHRvICcwMDAwMCcuXHJcbiAgICAgKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnVwZGF0ZSgwKTtcclxuICAgICAgICB0aGlzLmFjaGVpdmVtZW50ID0gZmFsc2U7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IERpc3RhbmNlTWV0ZXI7IiwidmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4vQ29uc3RhbnRzJyk7XHJcblxyXG4vKipcclxuICogR2FtZSBvdmVyIHBhbmVsLlxyXG4gKiBAcGFyYW0geyFIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzXHJcbiAqIEBwYXJhbSB7IUhUTUxJbWFnZX0gdGV4dFNwcml0ZVxyXG4gKiBAcGFyYW0geyFIVE1MSW1hZ2V9IHJlc3RhcnRJbWdcclxuICogQHBhcmFtIHshT2JqZWN0fSBkaW1lbnNpb25zIENhbnZhcyBkaW1lbnNpb25zLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEdhbWVPdmVyUGFuZWwoY2FudmFzLCB0ZXh0U3ByaXRlLCByZXN0YXJ0SW1nLCBkaW1lbnNpb25zKSB7XHJcbiAgICB0aGlzLmNhbnZhcyA9IGNhbnZhcztcclxuICAgIHRoaXMuY2FudmFzQ3R4ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICB0aGlzLmNhbnZhc0RpbWVuc2lvbnMgPSBkaW1lbnNpb25zO1xyXG4gICAgdGhpcy50ZXh0U3ByaXRlID0gdGV4dFNwcml0ZTtcclxuICAgIHRoaXMucmVzdGFydEltZyA9IHJlc3RhcnRJbWc7XHJcbiAgICB0aGlzLmRyYXcoKTtcclxufTtcclxuLyoqXHJcbiAqIERpbWVuc2lvbnMgdXNlZCBpbiB0aGUgcGFuZWwuXHJcbiAqIEBlbnVtIHtudW1iZXJ9XHJcbiAqL1xyXG5HYW1lT3ZlclBhbmVsLmRpbWVuc2lvbnMgPSB7XHJcbiAgICBURVhUX1g6IDAsXHJcbiAgICBURVhUX1k6IDEzLFxyXG4gICAgVEVYVF9XSURUSDogMTkxLFxyXG4gICAgVEVYVF9IRUlHSFQ6IDExLFxyXG4gICAgUkVTVEFSVF9XSURUSDogMzYsXHJcbiAgICBSRVNUQVJUX0hFSUdIVDogMzJcclxufTtcclxuXHJcbkdhbWVPdmVyUGFuZWwucHJvdG90eXBlID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdGhlIHBhbmVsIGRpbWVuc2lvbnMuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gd2lkdGggTmV3IGNhbnZhcyB3aWR0aC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcHRfaGVpZ2h0IE9wdGlvbmFsIG5ldyBjYW52YXMgaGVpZ2h0LlxyXG4gICAgICovXHJcbiAgICB1cGRhdGVEaW1lbnNpb25zOiBmdW5jdGlvbih3aWR0aCwgb3B0X2hlaWdodCkge1xyXG4gICAgICAgIHRoaXMuY2FudmFzRGltZW5zaW9ucy5XSURUSCA9IHdpZHRoO1xyXG4gICAgICAgIGlmIChvcHRfaGVpZ2h0KSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzRGltZW5zaW9ucy5IRUlHSFQgPSBvcHRfaGVpZ2h0O1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIERyYXcgdGhlIHBhbmVsLlxyXG4gICAgICovXHJcbiAgICBkcmF3OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgZGltZW5zaW9ucyA9IEdhbWVPdmVyUGFuZWwuZGltZW5zaW9ucztcclxuICAgICAgICB2YXIgY2VudGVyWCA9IHRoaXMuY2FudmFzRGltZW5zaW9ucy5XSURUSCAvIDI7XHJcbiAgICAgICAgLy8gR2FtZSBvdmVyIHRleHQuXHJcbiAgICAgICAgdmFyIHRleHRTb3VyY2VYID0gZGltZW5zaW9ucy5URVhUX1g7XHJcbiAgICAgICAgdmFyIHRleHRTb3VyY2VZID0gZGltZW5zaW9ucy5URVhUX1k7XHJcbiAgICAgICAgdmFyIHRleHRTb3VyY2VXaWR0aCA9IGRpbWVuc2lvbnMuVEVYVF9XSURUSDtcclxuICAgICAgICB2YXIgdGV4dFNvdXJjZUhlaWdodCA9IGRpbWVuc2lvbnMuVEVYVF9IRUlHSFQ7XHJcblxyXG4gICAgICAgIHZhciB0ZXh0VGFyZ2V0WCA9IE1hdGgucm91bmQoY2VudGVyWCAtIChkaW1lbnNpb25zLlRFWFRfV0lEVEggLyAyKSk7XHJcbiAgICAgICAgdmFyIHRleHRUYXJnZXRZID0gTWF0aC5yb3VuZCgodGhpcy5jYW52YXNEaW1lbnNpb25zLkhFSUdIVCAtIDI1KSAvIDMpO1xyXG4gICAgICAgIHZhciB0ZXh0VGFyZ2V0V2lkdGggPSBkaW1lbnNpb25zLlRFWFRfV0lEVEg7XHJcbiAgICAgICAgdmFyIHRleHRUYXJnZXRIZWlnaHQgPSBkaW1lbnNpb25zLlRFWFRfSEVJR0hUO1xyXG4gICAgICAgIHZhciByZXN0YXJ0U291cmNlV2lkdGggPSBkaW1lbnNpb25zLlJFU1RBUlRfV0lEVEg7XHJcbiAgICAgICAgdmFyIHJlc3RhcnRTb3VyY2VIZWlnaHQgPSBkaW1lbnNpb25zLlJFU1RBUlRfSEVJR0hUO1xyXG4gICAgICAgIHZhciByZXN0YXJ0VGFyZ2V0WCA9IGNlbnRlclggLSAoZGltZW5zaW9ucy5SRVNUQVJUX1dJRFRIIC8gMik7XHJcbiAgICAgICAgdmFyIHJlc3RhcnRUYXJnZXRZID0gdGhpcy5jYW52YXNEaW1lbnNpb25zLkhFSUdIVCAvIDI7XHJcbiAgICAgICAgaWYgKENvbnN0YW50cy5JU19ISURQSSkge1xyXG4gICAgICAgICAgICB0ZXh0U291cmNlWSAqPSAyO1xyXG4gICAgICAgICAgICB0ZXh0U291cmNlWCAqPSAyO1xyXG4gICAgICAgICAgICB0ZXh0U291cmNlV2lkdGggKj0gMjtcclxuICAgICAgICAgICAgdGV4dFNvdXJjZUhlaWdodCAqPSAyO1xyXG4gICAgICAgICAgICByZXN0YXJ0U291cmNlV2lkdGggKj0gMjtcclxuICAgICAgICAgICAgcmVzdGFydFNvdXJjZUhlaWdodCAqPSAyO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBHYW1lIG92ZXIgdGV4dCBmcm9tIHNwcml0ZS5cclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5kcmF3SW1hZ2UodGhpcy50ZXh0U3ByaXRlLFxyXG4gICAgICAgICAgICB0ZXh0U291cmNlWCwgdGV4dFNvdXJjZVksIHRleHRTb3VyY2VXaWR0aCwgdGV4dFNvdXJjZUhlaWdodCxcclxuICAgICAgICAgICAgdGV4dFRhcmdldFgsIHRleHRUYXJnZXRZLCB0ZXh0VGFyZ2V0V2lkdGgsIHRleHRUYXJnZXRIZWlnaHQpO1xyXG5cclxuICAgICAgICAvLyBSZXN0YXJ0IGJ1dHRvbi5cclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5kcmF3SW1hZ2UodGhpcy5yZXN0YXJ0SW1nLCAwLCAwLFxyXG4gICAgICAgICAgICByZXN0YXJ0U291cmNlV2lkdGgsIHJlc3RhcnRTb3VyY2VIZWlnaHQsXHJcbiAgICAgICAgICAgIHJlc3RhcnRUYXJnZXRYLCByZXN0YXJ0VGFyZ2V0WSwgZGltZW5zaW9ucy5SRVNUQVJUX1dJRFRILFxyXG4gICAgICAgICAgICBkaW1lbnNpb25zLlJFU1RBUlRfSEVJR0hUKTtcclxuICAgIH1cclxufTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gR2FtZU92ZXJQYW5lbDsiLCJ2YXIgVXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XHJcbnZhciBDbG91ZCA9IHJlcXVpcmUoJy4vQ2xvdWQnKTtcclxudmFyIE9ic3RhY2xlID0gcmVxdWlyZSgnLi9PYnN0YWNsZScpO1xyXG52YXIgSG9yaXpvbkxpbmUgPSByZXF1aXJlKCcuL0hvcml6b25MaW5lJyk7XHJcblxyXG4vKipcclxuICogSG9yaXpvbiBiYWNrZ3JvdW5kIGNsYXNzLlxyXG4gKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcclxuICogQHBhcmFtIHtBcnJheS48SFRNTEltYWdlRWxlbWVudD59IGltYWdlc1xyXG4gKiBAcGFyYW0ge29iamVjdH0gZGltZW5zaW9ucyBDYW52YXMgZGltZW5zaW9ucy5cclxuICogQHBhcmFtIHtudW1iZXJ9IGdhcENvZWZmaWNpZW50XHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKi9cclxuZnVuY3Rpb24gSG9yaXpvbihjYW52YXMsIGltYWdlcywgZGltZW5zaW9ucywgZ2FwQ29lZmZpY2llbnQpIHtcclxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgdGhpcy5jYW52YXNDdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgdGhpcy5jb25maWcgPSBIb3Jpem9uLmNvbmZpZztcclxuICAgIHRoaXMuZGltZW5zaW9ucyA9IGRpbWVuc2lvbnM7XHJcbiAgICB0aGlzLmdhcENvZWZmaWNpZW50ID0gZ2FwQ29lZmZpY2llbnQ7XHJcbiAgICB0aGlzLm9ic3RhY2xlcyA9IFtdO1xyXG4gICAgdGhpcy51bnVzZWRPYnN0YWNsZXMgPSBbXTtcclxuICAgIHRoaXMuaG9yaXpvbk9mZnNldHMgPSBbMCwgMF07XHJcbiAgICB0aGlzLmNsb3VkRnJlcXVlbmN5ID0gdGhpcy5jb25maWcuQ0xPVURfRlJFUVVFTkNZO1xyXG5cclxuICAgIC8vIENsb3VkXHJcbiAgICB0aGlzLmNsb3VkcyA9IFtdO1xyXG4gICAgdGhpcy5jbG91ZEltZyA9IGltYWdlcy5DTE9VRDtcclxuICAgIHRoaXMuY2xvdWRTcGVlZCA9IHRoaXMuY29uZmlnLkJHX0NMT1VEX1NQRUVEO1xyXG4gICAgLy8gSG9yaXpvblxyXG4gICAgdGhpcy5ob3Jpem9uSW1nID0gaW1hZ2VzLkhPUklaT047XHJcbiAgICB0aGlzLmhvcml6b25MaW5lID0gbnVsbDtcclxuICAgIC8vIE9ic3RhY2xlc1xyXG4gICAgdGhpcy5vYnN0YWNsZUltZ3MgPSB7XHJcbiAgICAgICAgQ0FDVFVTX1NNQUxMOiBpbWFnZXMuQ0FDVFVTX1NNQUxMLFxyXG4gICAgICAgIENBQ1RVU19MQVJHRTogaW1hZ2VzLkNBQ1RVU19MQVJHRVxyXG4gICAgfTtcclxuICAgIHRoaXMuaW5pdCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhvcml6b24gY29uZmlnLlxyXG4gKiBAZW51bSB7bnVtYmVyfVxyXG4gKi9cclxuSG9yaXpvbi5jb25maWcgPSB7XHJcbiAgICBCR19DTE9VRF9TUEVFRDogMC4yLFxyXG4gICAgQlVNUFlfVEhSRVNIT0xEOiAuMyxcclxuICAgIENMT1VEX0ZSRVFVRU5DWTogLjUsXHJcbiAgICBIT1JJWk9OX0hFSUdIVDogMTYsXHJcbiAgICBNQVhfQ0xPVURTOiA2XHJcbn07XHJcbkhvcml6b24ucHJvdG90eXBlID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBJbml0aWFsaXNlIHRoZSBob3Jpem9uLiBKdXN0IGFkZCB0aGUgbGluZSBhbmQgYSBjbG91ZC4gTm8gb2JzdGFjbGVzLlxyXG4gICAgICovXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmFkZENsb3VkKCk7XHJcbiAgICAgICAgdGhpcy5ob3Jpem9uTGluZSA9IG5ldyBIb3Jpem9uTGluZSh0aGlzLmNhbnZhcywgdGhpcy5ob3Jpem9uSW1nKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFB1c2ggdGhlIG9ic3RhY2xlcyBmcm9tIHNlcnZlciB0byBsb2NhbC5cclxuICAgICAqIEBwYXJhbSAge0FycmF5fSBvYnN0YWNsZXNcclxuICAgICAqL1xyXG4gICAgcHVzaE9ic3RhY2xlczogZnVuY3Rpb24gKG9ic3RhY2xlcykge1xyXG4gICAgICAgIHRoaXMudW51c2VkT2JzdGFjbGVzID0gb2JzdGFjbGVzO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlbHRhVGltZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRTcGVlZFxyXG4gICAgICogQHBhcmFtIHtib29sZWFufSB1cGRhdGVPYnN0YWNsZXMgVXNlZCBhcyBhbiBvdmVycmlkZSB0byBwcmV2ZW50XHJcbiAgICAgKiAgICAgdGhlIG9ic3RhY2xlcyBmcm9tIGJlaW5nIHVwZGF0ZWQgLyBhZGRlZC4gVGhpcyBoYXBwZW5zIGluIHRoZVxyXG4gICAgICogICAgIGVhc2UgaW4gc2VjdGlvbi5cclxuICAgICAqL1xyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihkZWx0YVRpbWUsIGN1cnJlbnRTcGVlZCwgdXBkYXRlT2JzdGFjbGVzKSB7XHJcbiAgICAgICAgdGhpcy5ydW5uaW5nVGltZSArPSBkZWx0YVRpbWU7XHJcbiAgICAgICAgdGhpcy5ob3Jpem9uTGluZS51cGRhdGUoZGVsdGFUaW1lLCBjdXJyZW50U3BlZWQpO1xyXG4gICAgICAgIHRoaXMudXBkYXRlQ2xvdWRzKGRlbHRhVGltZSwgY3VycmVudFNwZWVkKTtcclxuICAgICAgICBpZiAodXBkYXRlT2JzdGFjbGVzKSB7XHJcbiAgICAgICAgICAgIHRoaXMudXBkYXRlT2JzdGFjbGVzKGRlbHRhVGltZSwgY3VycmVudFNwZWVkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdGhlIGNsb3VkIHBvc2l0aW9ucy5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWx0YVRpbWVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBjdXJyZW50U3BlZWRcclxuICAgICAqL1xyXG4gICAgdXBkYXRlQ2xvdWRzOiBmdW5jdGlvbihkZWx0YVRpbWUsIHNwZWVkKSB7XHJcbiAgICAgICAgdmFyIGNsb3VkU3BlZWQgPSB0aGlzLmNsb3VkU3BlZWQgLyAxMDAwICogZGVsdGFUaW1lICogc3BlZWQ7XHJcbiAgICAgICAgdmFyIG51bUNsb3VkcyA9IHRoaXMuY2xvdWRzLmxlbmd0aDtcclxuICAgICAgICBpZiAobnVtQ2xvdWRzKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBudW1DbG91ZHMgLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jbG91ZHNbaV0udXBkYXRlKGNsb3VkU3BlZWQpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICB2YXIgbGFzdENsb3VkID0gdGhpcy5jbG91ZHNbbnVtQ2xvdWRzIC0gMV07XHJcbiAgICAgICAgICAgIC8vIENoZWNrIGZvciBhZGRpbmcgYSBuZXcgY2xvdWQuXHJcbiAgICAgICAgICAgIGlmIChudW1DbG91ZHMgPCB0aGlzLmNvbmZpZy5NQVhfQ0xPVURTICYmXHJcbiAgICAgICAgICAgICAgICAodGhpcy5kaW1lbnNpb25zLldJRFRIIC0gbGFzdENsb3VkLnhQb3MpID4gbGFzdENsb3VkLmNsb3VkR2FwICYmXHJcbiAgICAgICAgICAgICAgICB0aGlzLmNsb3VkRnJlcXVlbmN5ID4gTWF0aC5yYW5kb20oKSkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hZGRDbG91ZCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIC8vIFJlbW92ZSBleHBpcmVkIGNsb3Vkcy5cclxuICAgICAgICAgICAgdGhpcy5jbG91ZHMgPSB0aGlzLmNsb3Vkcy5maWx0ZXIoZnVuY3Rpb24ob2JqKSB7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gIW9iai5yZW1vdmU7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZSB0aGUgb2JzdGFjbGUgcG9zaXRpb25zLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGRlbHRhVGltZVxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRTcGVlZFxyXG4gICAgICovXHJcbiAgICB1cGRhdGVPYnN0YWNsZXM6IGZ1bmN0aW9uKGRlbHRhVGltZSwgY3VycmVudFNwZWVkKSB7XHJcbiAgICAgICAgLy8gT2JzdGFjbGVzLCBtb3ZlIHRvIEhvcml6b24gbGF5ZXIuXHJcbiAgICAgICAgdmFyIHVwZGF0ZWRPYnN0YWNsZXMgPSB0aGlzLm9ic3RhY2xlcy5zbGljZSgwKTtcclxuXHJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm9ic3RhY2xlcy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICB2YXIgb2JzdGFjbGUgPSB0aGlzLm9ic3RhY2xlc1tpXTtcclxuICAgICAgICAgICAgb2JzdGFjbGUudXBkYXRlKGRlbHRhVGltZSwgY3VycmVudFNwZWVkKTtcclxuICAgICAgICAgICAgLy8gQ2xlYW4gdXAgZXhpc3Rpbmcgb2JzdGFjbGVzLlxyXG4gICAgICAgICAgICBpZiAob2JzdGFjbGUucmVtb3ZlKSB7XHJcbiAgICAgICAgICAgICAgICB1cGRhdGVkT2JzdGFjbGVzLnNoaWZ0KCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5vYnN0YWNsZXMgPSB1cGRhdGVkT2JzdGFjbGVzO1xyXG4gICAgICAgIGlmICh0aGlzLm9ic3RhY2xlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgICAgIHZhciBsYXN0T2JzdGFjbGUgPSB0aGlzLm9ic3RhY2xlc1t0aGlzLm9ic3RhY2xlcy5sZW5ndGggLSAxXTtcclxuICAgICAgICAgICAgaWYgKGxhc3RPYnN0YWNsZSAmJiAhbGFzdE9ic3RhY2xlLmZvbGxvd2luZ09ic3RhY2xlQ3JlYXRlZCAmJlxyXG4gICAgICAgICAgICAgICAgbGFzdE9ic3RhY2xlLmlzVmlzaWJsZSgpICYmXHJcbiAgICAgICAgICAgICAgICAobGFzdE9ic3RhY2xlLnhQb3MgKyBsYXN0T2JzdGFjbGUud2lkdGggKyBsYXN0T2JzdGFjbGUuZ2FwKSA8XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpbWVuc2lvbnMuV0lEVEgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuYWRkTmV3T2JzdGFjbGUoY3VycmVudFNwZWVkKTtcclxuICAgICAgICAgICAgICAgIGxhc3RPYnN0YWNsZS5mb2xsb3dpbmdPYnN0YWNsZUNyZWF0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gQ3JlYXRlIG5ldyBvYnN0YWNsZXMuXHJcbiAgICAgICAgICAgIHRoaXMuYWRkTmV3T2JzdGFjbGUoY3VycmVudFNwZWVkKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIGEgbmV3IG9ic3RhY2xlLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGN1cnJlbnRTcGVlZFxyXG4gICAgICovXHJcbiAgICBhZGROZXdPYnN0YWNsZTogZnVuY3Rpb24oY3VycmVudFNwZWVkKSB7XHJcbiAgICAgICAgdmFyIG9ic3RhY2xlU2V0dGluZ3MgPSB0aGlzLnVudXNlZE9ic3RhY2xlcy5zaGlmdCgpO1xyXG4gICAgICAgIGlmKCFvYnN0YWNsZVNldHRpbmdzKSB7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdmFyIG9ic3RhY2xlVHlwZUluZGV4ID0gb2JzdGFjbGVTZXR0aW5ncy50eXBlO1xyXG4gICAgICAgIHZhciBvYnN0YWNsZVR5cGUgPSBPYnN0YWNsZS50eXBlc1tvYnN0YWNsZVR5cGVJbmRleF07XHJcbiAgICAgICAgdmFyIG9ic3RhY2xlSW1nID0gdGhpcy5vYnN0YWNsZUltZ3Nbb2JzdGFjbGVUeXBlLnR5cGVdO1xyXG4gICAgICAgIHZhciBvYnN0YWNsZSA9IG5ldyBPYnN0YWNsZSh0aGlzLmNhbnZhc0N0eCwgb2JzdGFjbGVUeXBlLFxyXG4gICAgICAgICAgICBvYnN0YWNsZUltZywgdGhpcy5kaW1lbnNpb25zLCBjdXJyZW50U3BlZWQsIG9ic3RhY2xlU2V0dGluZ3Muc2l6ZSxcclxuICAgICAgICAgICAgb2JzdGFjbGVTZXR0aW5ncy5nYXApO1xyXG4gICAgICAgIHRoaXMub2JzdGFjbGVzLnB1c2gob2JzdGFjbGUpO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogUmVzZXQgdGhlIGhvcml6b24gbGF5ZXIuXHJcbiAgICAgKiBSZW1vdmUgZXhpc3Rpbmcgb2JzdGFjbGVzIGFuZCByZXBvc2l0aW9uIHRoZSBob3Jpem9uIGxpbmUuXHJcbiAgICAgKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLm9ic3RhY2xlcyA9IFtdO1xyXG4gICAgICAgIHRoaXMuaG9yaXpvbkxpbmUucmVzZXQoKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZSB0aGUgY2FudmFzIHdpZHRoIGFuZCBzY2FsaW5nLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoIENhbnZhcyB3aWR0aC5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHQgQ2FudmFzIGhlaWdodC5cclxuICAgICAqL1xyXG4gICAgcmVzaXplOiBmdW5jdGlvbih3aWR0aCwgaGVpZ2h0KSB7XHJcbiAgICAgICAgdGhpcy5jYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogQWRkIGEgbmV3IGNsb3VkIHRvIHRoZSBob3Jpem9uLlxyXG4gICAgICovXHJcbiAgICBhZGRDbG91ZDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5jbG91ZHMucHVzaChuZXcgQ2xvdWQodGhpcy5jYW52YXMsIHRoaXMuY2xvdWRJbWcsXHJcbiAgICAgICAgICAgIHRoaXMuZGltZW5zaW9ucy5XSURUSCkpO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBIb3Jpem9uOyIsInZhciBDb25zdGFudHMgPSByZXF1aXJlKCcuL0NvbnN0YW50cycpO1xyXG5cclxuLyoqXHJcbiAqIEhvcml6b24gTGluZS5cclxuICogQ29uc2lzdHMgb2YgdHdvIGNvbm5lY3RpbmcgbGluZXMuIFJhbmRvbWx5IGFzc2lnbnMgYSBmbGF0IC8gYnVtcHkgaG9yaXpvbi5cclxuICogQHBhcmFtIHtIVE1MQ2FudmFzRWxlbWVudH0gY2FudmFzXHJcbiAqIEBwYXJhbSB7SFRNTEltYWdlfSBiZ0ltZyBIb3Jpem9uIGxpbmUgc3ByaXRlLlxyXG4gKiBAY29uc3RydWN0b3JcclxuICovXHJcbmZ1bmN0aW9uIEhvcml6b25MaW5lKGNhbnZhcywgYmdJbWcpIHtcclxuICAgIHRoaXMuaW1hZ2UgPSBiZ0ltZztcclxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgdGhpcy5jYW52YXNDdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIHRoaXMuc291cmNlRGltZW5zaW9ucyA9IHt9O1xyXG4gICAgdGhpcy5kaW1lbnNpb25zID0gSG9yaXpvbkxpbmUuZGltZW5zaW9ucztcclxuICAgIHRoaXMuc291cmNlWFBvcyA9IFswLCB0aGlzLmRpbWVuc2lvbnMuV0lEVEhdO1xyXG4gICAgdGhpcy54UG9zID0gW107XHJcbiAgICB0aGlzLnlQb3MgPSAwO1xyXG4gICAgdGhpcy5idW1wVGhyZXNob2xkID0gMC41O1xyXG4gICAgdGhpcy5zZXRTb3VyY2VEaW1lbnNpb25zKCk7XHJcbiAgICB0aGlzLmRyYXcoKTtcclxufTtcclxuLyoqXHJcbiAqIEhvcml6b24gbGluZSBkaW1lbnNpb25zLlxyXG4gKiBAZW51bSB7bnVtYmVyfVxyXG4gKi9cclxuSG9yaXpvbkxpbmUuZGltZW5zaW9ucyA9IHtcclxuICAgIFdJRFRIOiA2MDAsXHJcbiAgICBIRUlHSFQ6IDEyLFxyXG4gICAgWVBPUzogMTI3XHJcbn07XHJcblxyXG5Ib3Jpem9uTGluZS5wcm90b3R5cGUgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFNldCB0aGUgc291cmNlIGRpbWVuc2lvbnMgb2YgdGhlIGhvcml6b24gbGluZS5cclxuICAgICAqL1xyXG4gICAgc2V0U291cmNlRGltZW5zaW9uczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgZm9yICh2YXIgZGltZW5zaW9uIGluIEhvcml6b25MaW5lLmRpbWVuc2lvbnMpIHtcclxuICAgICAgICAgICAgaWYgKENvbnN0YW50cy5JU19ISURQSSkge1xyXG4gICAgICAgICAgICAgICAgaWYgKGRpbWVuc2lvbiAhPSAnWVBPUycpIHtcclxuICAgICAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZURpbWVuc2lvbnNbZGltZW5zaW9uXSA9XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEhvcml6b25MaW5lLmRpbWVuc2lvbnNbZGltZW5zaW9uXSAqIDI7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNvdXJjZURpbWVuc2lvbnNbZGltZW5zaW9uXSA9XHJcbiAgICAgICAgICAgICAgICAgICAgSG9yaXpvbkxpbmUuZGltZW5zaW9uc1tkaW1lbnNpb25dO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHRoaXMuZGltZW5zaW9uc1tkaW1lbnNpb25dID0gSG9yaXpvbkxpbmUuZGltZW5zaW9uc1tkaW1lbnNpb25dO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnhQb3MgPSBbMCwgSG9yaXpvbkxpbmUuZGltZW5zaW9ucy5XSURUSF07XHJcbiAgICAgICAgdGhpcy55UG9zID0gSG9yaXpvbkxpbmUuZGltZW5zaW9ucy5ZUE9TO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJldHVybiB0aGUgY3JvcCB4IHBvc2l0aW9uIG9mIGEgdHlwZS5cclxuICAgICAqL1xyXG4gICAgZ2V0UmFuZG9tVHlwZTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgPiB0aGlzLmJ1bXBUaHJlc2hvbGQgPyB0aGlzLmRpbWVuc2lvbnMuV0lEVEggOiAwO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogRHJhdyB0aGUgaG9yaXpvbiBsaW5lLlxyXG4gICAgICovXHJcbiAgICBkcmF3OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5kcmF3SW1hZ2UodGhpcy5pbWFnZSwgdGhpcy5zb3VyY2VYUG9zWzBdLCAwLFxyXG4gICAgICAgICAgICB0aGlzLnNvdXJjZURpbWVuc2lvbnMuV0lEVEgsIHRoaXMuc291cmNlRGltZW5zaW9ucy5IRUlHSFQsXHJcbiAgICAgICAgICAgIHRoaXMueFBvc1swXSwgdGhpcy55UG9zLFxyXG4gICAgICAgICAgICB0aGlzLmRpbWVuc2lvbnMuV0lEVEgsIHRoaXMuZGltZW5zaW9ucy5IRUlHSFQpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLCB0aGlzLnNvdXJjZVhQb3NbMV0sIDAsXHJcbiAgICAgICAgICAgIHRoaXMuc291cmNlRGltZW5zaW9ucy5XSURUSCwgdGhpcy5zb3VyY2VEaW1lbnNpb25zLkhFSUdIVCxcclxuICAgICAgICAgICAgdGhpcy54UG9zWzFdLCB0aGlzLnlQb3MsXHJcbiAgICAgICAgICAgIHRoaXMuZGltZW5zaW9ucy5XSURUSCwgdGhpcy5kaW1lbnNpb25zLkhFSUdIVCk7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdGhlIHggcG9zaXRpb24gb2YgYW4gaW5kaXZkdWFsIHBpZWNlIG9mIHRoZSBsaW5lLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHBvcyBMaW5lIHBvc2l0aW9uLlxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IGluY3JlbWVudFxyXG4gICAgICovXHJcbiAgICB1cGRhdGVYUG9zOiBmdW5jdGlvbihwb3MsIGluY3JlbWVudCkge1xyXG4gICAgICAgIHZhciBsaW5lMSA9IHBvcztcclxuICAgICAgICB2YXIgbGluZTIgPSBwb3MgPT0gMCA/IDEgOiAwO1xyXG5cclxuICAgICAgICB0aGlzLnhQb3NbbGluZTFdIC09IGluY3JlbWVudDtcclxuICAgICAgICB0aGlzLnhQb3NbbGluZTJdID0gdGhpcy54UG9zW2xpbmUxXSArIHRoaXMuZGltZW5zaW9ucy5XSURUSDtcclxuICAgICAgICBpZiAodGhpcy54UG9zW2xpbmUxXSA8PSAtdGhpcy5kaW1lbnNpb25zLldJRFRIKSB7XHJcbiAgICAgICAgICAgIHRoaXMueFBvc1tsaW5lMV0gKz0gdGhpcy5kaW1lbnNpb25zLldJRFRIICogMjtcclxuICAgICAgICAgICAgdGhpcy54UG9zW2xpbmUyXSA9IHRoaXMueFBvc1tsaW5lMV0gLSB0aGlzLmRpbWVuc2lvbnMuV0lEVEg7XHJcbiAgICAgICAgICAgIHRoaXMuc291cmNlWFBvc1tsaW5lMV0gPSB0aGlzLmdldFJhbmRvbVR5cGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBVcGRhdGUgdGhlIGhvcml6b24gbGluZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWx0YVRpbWVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGVlZFxyXG4gICAgICovXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGRlbHRhVGltZSwgc3BlZWQpIHtcclxuICAgICAgICB2YXIgaW5jcmVtZW50ID0gTWF0aC5mbG9vcihzcGVlZCAqIChDb25zdGFudHMuRlBTIC8gMTAwMCkgKiBkZWx0YVRpbWUpO1xyXG4gICAgICAgIGlmICh0aGlzLnhQb3NbMF0gPD0gMCkge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVhQb3MoMCwgaW5jcmVtZW50KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVhQb3MoMSwgaW5jcmVtZW50KTtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5kcmF3KCk7XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUmVzZXQgaG9yaXpvbiB0byB0aGUgc3RhcnRpbmcgcG9zaXRpb24uXHJcbiAgICAgKi9cclxuICAgIHJlc2V0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnhQb3NbMF0gPSAwO1xyXG4gICAgICAgIHRoaXMueFBvc1sxXSA9IEhvcml6b25MaW5lLmRpbWVuc2lvbnMuV0lEVEg7XHJcbiAgICB9XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEhvcml6b25MaW5lOyIsInZhciBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcclxudmFyIENvbnN0YW50cyA9IHJlcXVpcmUoJy4vQ29uc3RhbnRzJyk7XHJcbnZhciBDb2xsaXNpb25Cb3ggPSByZXF1aXJlKCcuL0NvbGxpc2lvbkJveCcpO1xyXG5cclxuLyoqXHJcbiAqIE9ic3RhY2xlLlxyXG4gKiBAcGFyYW0ge0hUTUxDYW52YXNDdHh9IGNhbnZhc0N0eFxyXG4gKiBAcGFyYW0ge09ic3RhY2xlLnR5cGV9IHR5cGVcclxuICogQHBhcmFtIHtpbWFnZX0gb2JzdGFjbGVJbWcgSW1hZ2Ugc3ByaXRlLlxyXG4gKiBAcGFyYW0ge09iamVjdH0gZGltZW5zaW9uc1xyXG4gKiBAcGFyYW0ge251bWJlcn0gc3BlZWRcclxuICovXHJcbmZ1bmN0aW9uIE9ic3RhY2xlKGNhbnZhc0N0eCwgdHlwZSwgb2JzdGFjbGVJbWcsIGRpbWVuc2lvbnMsIHNwZWVkLCBzaXplLCBnYXApIHtcclxuICAgIHRoaXMuY2FudmFzQ3R4ID0gY2FudmFzQ3R4O1xyXG4gICAgdGhpcy5pbWFnZSA9IG9ic3RhY2xlSW1nO1xyXG4gICAgdGhpcy50eXBlQ29uZmlnID0gdHlwZTtcclxuICAgIHRoaXMuc2l6ZSA9IHNpemU7XHJcbiAgICB0aGlzLmRpbWVuc2lvbnMgPSBkaW1lbnNpb25zO1xyXG4gICAgdGhpcy5yZW1vdmUgPSBmYWxzZTtcclxuICAgIHRoaXMueFBvcyA9IDA7XHJcbiAgICB0aGlzLnlQb3MgPSB0aGlzLnR5cGVDb25maWcueVBvcztcclxuICAgIHRoaXMud2lkdGggPSAwO1xyXG4gICAgdGhpcy5jb2xsaXNpb25Cb3hlcyA9IFtdO1xyXG4gICAgdGhpcy5nYXAgPSBnYXA7XHJcblxyXG4gICAgdGhpcy5pbml0KHNwZWVkKTtcclxufTtcclxuXHJcbk9ic3RhY2xlLnByb3RvdHlwZSA9IHtcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGlzZSB0aGUgRE9NIGZvciB0aGUgb2JzdGFjbGUuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gc3BlZWRcclxuICAgICAqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24oc3BlZWQpIHtcclxuICAgICAgICB0aGlzLmNsb25lQ29sbGlzaW9uQm94ZXMoKTtcclxuICAgICAgICAvLyBPbmx5IGFsbG93IHNpemluZyBpZiB3ZSdyZSBhdCB0aGUgcmlnaHQgc3BlZWQuXHJcbiAgICAgICAgaWYgKHRoaXMuc2l6ZSA+IDEgJiYgdGhpcy50eXBlQ29uZmlnLm11bHRpcGxlU3BlZWQgPiBzcGVlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnNpemUgPSAxO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLndpZHRoID0gdGhpcy50eXBlQ29uZmlnLndpZHRoICogdGhpcy5zaXplO1xyXG4gICAgICAgIHRoaXMueFBvcyA9IHRoaXMuZGltZW5zaW9ucy5XSURUSCAtIHRoaXMud2lkdGg7XHJcbiAgICAgICAgdGhpcy5kcmF3KCk7XHJcblxyXG4gICAgICAgIC8vIE1ha2UgY29sbGlzaW9uIGJveCBhZGp1c3RtZW50cyxcclxuICAgICAgICAvLyBDZW50cmFsIGJveCBpcyBhZGp1c3RlZCB0byB0aGUgc2l6ZSBhcyBvbmUgYm94LlxyXG4gICAgICAgIC8vICAgICAgX19fXyAgICAgICAgX19fX19fICAgICAgICBfX19fX19fX1xyXG4gICAgICAgIC8vICAgIF98ICAgfC18ICAgIF98ICAgICB8LXwgICAgX3wgICAgICAgfC18XHJcbiAgICAgICAgLy8gICB8IHw8LT58IHwgICB8IHw8LS0tPnwgfCAgIHwgfDwtLS0tLT58IHxcclxuICAgICAgICAvLyAgIHwgfCAxIHwgfCAgIHwgfCAgMiAgfCB8ICAgfCB8ICAgMyAgIHwgfFxyXG4gICAgICAgIC8vICAgfF98X19ffF98ICAgfF98X19fX198X3wgICB8X3xfX19fX19ffF98XHJcbiAgICAgICAgLy9cclxuICAgICAgICBpZiAodGhpcy5zaXplID4gMSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbkJveGVzWzFdLndpZHRoID0gdGhpcy53aWR0aCAtIHRoaXMuY29sbGlzaW9uQm94ZXNbMF0ud2lkdGggLVxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb2xsaXNpb25Cb3hlc1syXS53aWR0aDtcclxuICAgICAgICAgICAgdGhpcy5jb2xsaXNpb25Cb3hlc1syXS54ID0gdGhpcy53aWR0aCAtIHRoaXMuY29sbGlzaW9uQm94ZXNbMl0ud2lkdGg7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogRHJhdyBhbmQgY3JvcCBiYXNlZCBvbiBzaXplLlxyXG4gICAgICovXHJcbiAgICBkcmF3OiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgc291cmNlV2lkdGggPSB0aGlzLnR5cGVDb25maWcud2lkdGg7XHJcbiAgICAgICAgdmFyIHNvdXJjZUhlaWdodCA9IHRoaXMudHlwZUNvbmZpZy5oZWlnaHQ7XHJcbiAgICAgICAgaWYgKENvbnN0YW50cy5JU19ISURQSSkge1xyXG4gICAgICAgICAgICBzb3VyY2VXaWR0aCA9IHNvdXJjZVdpZHRoICogMjtcclxuICAgICAgICAgICAgc291cmNlSGVpZ2h0ID0gc291cmNlSGVpZ2h0ICogMjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIFNwcml0ZVxyXG4gICAgICAgIHZhciBzb3VyY2VYID0gKHNvdXJjZVdpZHRoICogdGhpcy5zaXplKSAqICgwLjUgKiAodGhpcy5zaXplIC0gMSkpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmRyYXdJbWFnZSh0aGlzLmltYWdlLFxyXG4gICAgICAgICAgICBzb3VyY2VYLCAwLFxyXG4gICAgICAgICAgICBzb3VyY2VXaWR0aCAqIHRoaXMuc2l6ZSwgc291cmNlSGVpZ2h0LFxyXG4gICAgICAgICAgICB0aGlzLnhQb3MsIHRoaXMueVBvcyxcclxuICAgICAgICAgICAgdGhpcy50eXBlQ29uZmlnLndpZHRoICogdGhpcy5zaXplLCB0aGlzLnR5cGVDb25maWcuaGVpZ2h0KTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIE9ic3RhY2xlIGZyYW1lIHVwZGF0ZS5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBkZWx0YVRpbWVcclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBzcGVlZFxyXG4gICAgICovXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKGRlbHRhVGltZSwgc3BlZWQpIHtcclxuICAgICAgICBpZiAoIXRoaXMucmVtb3ZlKSB7XHJcbiAgICAgICAgICAgIHRoaXMueFBvcyAtPSBNYXRoLmZsb29yKChzcGVlZCAqIENvbnN0YW50cy5GUFMgLyAxMDAwKSAqIGRlbHRhVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhdygpO1xyXG4gICAgICAgICAgICBpZiAoIXRoaXMuaXNWaXNpYmxlKCkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVtb3ZlID0gdHJ1ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBDaGVjayBpZiBvYnN0YWNsZSBpcyB2aXNpYmxlLlxyXG4gICAgICogQHJldHVybiB7Ym9vbGVhbn0gV2hldGhlciB0aGUgb2JzdGFjbGUgaXMgaW4gdGhlIGdhbWUgYXJlYS5cclxuICAgICAqL1xyXG4gICAgaXNWaXNpYmxlOiBmdW5jdGlvbigpIHtcclxuICAgICAgICByZXR1cm4gdGhpcy54UG9zICsgdGhpcy53aWR0aCA+IDA7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBNYWtlIGEgY29weSBvZiB0aGUgY29sbGlzaW9uIGJveGVzLCBzaW5jZSB0aGVzZSB3aWxsIGNoYW5nZSBiYXNlZCBvblxyXG4gICAgICogb2JzdGFjbGUgdHlwZSBhbmQgc2l6ZS5cclxuICAgICAqL1xyXG4gICAgY2xvbmVDb2xsaXNpb25Cb3hlczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdmFyIGNvbGxpc2lvbkJveGVzID0gdGhpcy50eXBlQ29uZmlnLmNvbGxpc2lvbkJveGVzO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSBjb2xsaXNpb25Cb3hlcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbGxpc2lvbkJveGVzW2ldID0gbmV3IENvbGxpc2lvbkJveChjb2xsaXNpb25Cb3hlc1tpXS54LFxyXG4gICAgICAgICAgICAgICAgY29sbGlzaW9uQm94ZXNbaV0ueSwgY29sbGlzaW9uQm94ZXNbaV0ud2lkdGgsXHJcbiAgICAgICAgICAgICAgICBjb2xsaXNpb25Cb3hlc1tpXS5oZWlnaHQpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBPYnN0YWNsZSBkZWZpbml0aW9ucy5cclxuICogbWluR2FwOiBtaW5pbXVtIHBpeGVsIHNwYWNlIGJldHdlZWVuIG9ic3RhY2xlcy5cclxuICogbXVsdGlwbGVTcGVlZDogU3BlZWQgYXQgd2hpY2ggbXVsdGlwbGVzIGFyZSBhbGxvd2VkLlxyXG4gKi9cclxuT2JzdGFjbGUudHlwZXMgPSBbe1xyXG4gICAgdHlwZTogJ0NBQ1RVU19TTUFMTCcsXHJcbiAgICBjbGFzc05hbWU6ICcgY2FjdHVzIGNhY3R1cy1zbWFsbCAnLFxyXG4gICAgd2lkdGg6IDE3LFxyXG4gICAgaGVpZ2h0OiAzNSxcclxuICAgIHlQb3M6IDEwNSxcclxuICAgIG11bHRpcGxlU3BlZWQ6IDMsXHJcbiAgICBtaW5HYXA6IDEyMCxcclxuICAgIGNvbGxpc2lvbkJveGVzOiBbXHJcbiAgICAgICAgbmV3IENvbGxpc2lvbkJveCgwLCA3LCA1LCAyNyksXHJcbiAgICAgICAgbmV3IENvbGxpc2lvbkJveCg0LCAwLCA2LCAzNCksXHJcbiAgICAgICAgbmV3IENvbGxpc2lvbkJveCgxMCwgNCwgNywgMTQpXHJcbiAgICBdXHJcbn0sIHtcclxuICAgIHR5cGU6ICdDQUNUVVNfTEFSR0UnLFxyXG4gICAgY2xhc3NOYW1lOiAnIGNhY3R1cyBjYWN0dXMtbGFyZ2UgJyxcclxuICAgIHdpZHRoOiAyNSxcclxuICAgIGhlaWdodDogNTAsXHJcbiAgICB5UG9zOiA5MCxcclxuICAgIG11bHRpcGxlU3BlZWQ6IDYsXHJcbiAgICBtaW5HYXA6IDEyMCxcclxuICAgIGNvbGxpc2lvbkJveGVzOiBbXHJcbiAgICAgICAgbmV3IENvbGxpc2lvbkJveCgwLCAxMiwgNywgMzgpLFxyXG4gICAgICAgIG5ldyBDb2xsaXNpb25Cb3goOCwgMCwgNywgNDkpLFxyXG4gICAgICAgIG5ldyBDb2xsaXNpb25Cb3goMTMsIDEwLCAxMCwgMzgpXHJcbiAgICBdXHJcbn1dO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBPYnN0YWNsZTsiLCJ2YXIgVHJleCA9IHJlcXVpcmUoJy4vVHJleCcpO1xyXG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XHJcbnZhciBIb3Jpem9uID0gcmVxdWlyZSgnLi9Ib3Jpem9uJyk7XHJcbnZhciBCcm93c2VyID0gcmVxdWlyZSgnLi9Ccm93c2VyJyk7XHJcbnZhciBDb25zdGFudHMgPSByZXF1aXJlKCcuL0NvbnN0YW50cycpO1xyXG52YXIgQ29sbGlzaW9uQm94ID0gcmVxdWlyZSgnLi9Db2xsaXNpb25Cb3gnKTtcclxudmFyIEdhbWVPdmVyUGFuZWwgPSByZXF1aXJlKCcuL0dhbWVPdmVyUGFuZWwnKTtcclxudmFyIERpc3RhbmNlTWV0ZXIgPSByZXF1aXJlKCcuL0Rpc3RhbmNlTWV0ZXInKTtcclxuXHJcbnZhciBhc3NpZ24gPSByZXF1aXJlKCcuLi9saWIvYXNzaWduJyk7XHJcblxyXG4vKipcclxuICogVC1SZXggcnVubmVyLlxyXG4gKiBAcGFyYW0ge3N0cmluZ30gb3V0ZXJDb250YWluZXJJZCBPdXRlciBjb250YWluaW5nIGVsZW1lbnQgaWQuXHJcbiAqIEBwYXJhbSB7b2JqZWN0fSBvcHRfY29uZmlnXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAZXhwb3J0XHJcbiAqL1xyXG5mdW5jdGlvbiBSdW5uZXIob3V0ZXJDb250YWluZXJJZCwgb3B0X2NvbmZpZykge1xyXG4gICAgLy8gU2luZ2xldG9uXHJcbiAgICBpZiAoUnVubmVyLmluc3RhbmNlXykge1xyXG4gICAgICAgIHJldHVybiBSdW5uZXIuaW5zdGFuY2VfO1xyXG4gICAgfVxyXG4gICAgUnVubmVyLmluc3RhbmNlXyA9IHRoaXM7XHJcbiAgICB0aGlzLm91dGVyQ29udGFpbmVyRWwgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKG91dGVyQ29udGFpbmVySWQpO1xyXG4gICAgdGhpcy5jb250YWluZXJFbCA9IG51bGw7XHJcbiAgICB0aGlzLmNvbmZpZyA9IGFzc2lnbih7fSwgUnVubmVyLmNvbmZpZywgb3B0X2NvbmZpZyk7XHJcblxyXG4gICAgdGhpcy5kaW1lbnNpb25zID0gUnVubmVyLmRlZmF1bHREaW1lbnNpb25zO1xyXG4gICAgdGhpcy5jYW52YXMgPSBudWxsO1xyXG4gICAgdGhpcy5jYW52YXNDdHggPSBudWxsO1xyXG4gICAgdGhpcy50UmV4ID0gbnVsbDtcclxuICAgIHRoaXMuZGlzdGFuY2VNZXRlciA9IG51bGw7XHJcbiAgICB0aGlzLmRpc3RhbmNlUmFuID0gMDtcclxuXHJcbiAgICB0aGlzLmhpZ2hlc3RTY29yZSA9IDA7XHJcbiAgICB0aGlzLnRpbWUgPSAwO1xyXG4gICAgdGhpcy5ydW5uaW5nVGltZSA9IDA7XHJcbiAgICB0aGlzLm1zUGVyRnJhbWUgPSAxMDAwIC8gQ29uc3RhbnRzLkZQUztcclxuICAgIHRoaXMuY3VycmVudFNwZWVkID0gdGhpcy5jb25maWcuU1BFRUQ7XHJcbiAgICB0aGlzLm9ic3RhY2xlcyA9IFtdO1xyXG4gICAgdGhpcy51bnVzZWRPYnN0YWNsZXMgPSBbXTtcclxuICAgIHRoaXMuc3RhcnRlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5hY3RpdmF0ZWQgPSBmYWxzZTtcclxuICAgIHRoaXMuY3Jhc2hlZCA9IGZhbHNlO1xyXG4gICAgdGhpcy5wYXVzZWQgPSBmYWxzZTtcclxuXHJcbiAgICAvLyBNdWx0aS1wbGF5ZXJcclxuICAgIHRoaXMuc29ja2V0ID0gbnVsbDtcclxuICAgIHRoaXMucGxheWVycyA9IHt9O1xyXG5cclxuICAgIHRoaXMucmVzaXplVGltZXJJZF8gPSBudWxsO1xyXG4gICAgdGhpcy5wbGF5Q291bnQgPSAwO1xyXG4gICAgLy8gU291bmQgRlguXHJcbiAgICB0aGlzLmF1ZGlvQnVmZmVyID0gbnVsbDtcclxuICAgIHRoaXMuc291bmRGeCA9IHt9O1xyXG4gICAgLy8gR2xvYmFsIHdlYiBhdWRpbyBjb250ZXh0IGZvciBwbGF5aW5nIHNvdW5kcy5cclxuICAgIHRoaXMuYXVkaW9Db250ZXh0ID0gbnVsbDtcclxuXHJcbiAgICAvLyBJbWFnZXMuXHJcbiAgICB0aGlzLmltYWdlcyA9IHt9O1xyXG4gICAgdGhpcy5pbWFnZXNMb2FkZWQgPSAwO1xyXG4gICAgdGhpcy5sb2FkSW1hZ2VzKCk7XHJcblxyXG4gICAgLy8gQ3Jhc2hlZCBwbGF5ZXJzLlxyXG4gICAgdGhpcy5jcmFzaGVkUGxheWVycyA9IHt9O1xyXG5cclxuICAgIC8vIEFuaW1hdGlvbi5cclxuICAgIHZhciBicm93c2VyID0gQnJvd3Nlci5kZXRlY3QoKTtcclxuICAgIHN3aXRjaChicm93c2VyWzBdLnRvTG93ZXJDYXNlKCkpIHtcclxuICAgICAgICBjYXNlICdjaHJvbWUnOlxyXG4gICAgICAgICAgICB0aGlzLmtleWZyYW1lcyA9ICdALXdlYmtpdC1rZXlmcmFtZXMgaW50cm8geyAnICtcclxuICAgICAgICAgICAgICAgICdmcm9tIHsgd2lkdGg6JyArIFRyZXguY29uZmlnLldJRFRIICsgJ3B4IH0nICtcclxuICAgICAgICAgICAgICAgICd0byB7IHdpZHRoOiAnICsgdGhpcy5kaW1lbnNpb25zLldJRFRIICsgJ3B4IH0nICtcclxuICAgICAgICAgICAgICAgICd9JztcclxuICAgICAgICAgICAgdGhpcy5hbmltYXRpb25LZXkgPSAnd2Via2l0QW5pbWF0aW9uJztcclxuICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgY2FzZSAnZmlyZWZveCc6XHJcbiAgICAgICAgICAgIHRoaXMua2V5ZnJhbWVzID0gJ0AtbW96LWtleWZyYW1lcyBpbnRybyB7ICcgK1xyXG4gICAgICAgICAgICAgICAgJ2Zyb20geyB3aWR0aDonICsgVHJleC5jb25maWcuV0lEVEggKyAncHggfScgK1xyXG4gICAgICAgICAgICAgICAgJ3RvIHsgd2lkdGg6ICcgKyB0aGlzLmRpbWVuc2lvbnMuV0lEVEggKyAncHggfScgK1xyXG4gICAgICAgICAgICAgICAgJ30nO1xyXG4gICAgICAgICAgICB0aGlzLmFuaW1hdGlvbktleSA9ICdNb3pBbmltYXRpb24nO1xyXG4gICAgICAgICAgICBicmVhaztcclxuICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICB0aGlzLmtleWZyYW1lcyA9ICdAa2V5ZnJhbWVzIGludHJvIHsgJyArXHJcbiAgICAgICAgICAgICAgICAnZnJvbSB7IHdpZHRoOicgKyBUcmV4LmNvbmZpZy5XSURUSCArICdweCB9JyArXHJcbiAgICAgICAgICAgICAgICAndG8geyB3aWR0aDogJyArIHRoaXMuZGltZW5zaW9ucy5XSURUSCArICdweCB9JyArXHJcbiAgICAgICAgICAgICAgICAnfSc7XHJcbiAgICAgICAgICAgIHRoaXMuYW5pbWF0aW9uS2V5ID0gJ2FuaW1hdGlvbic7XHJcbiAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogRGVmYXVsdCBnYW1lIGNvbmZpZ3VyYXRpb24uXHJcbiAqIEBlbnVtIHtudW1iZXJ9XHJcbiAqL1xyXG5SdW5uZXIuY29uZmlnID0ge1xyXG4gICAgLy8gQUNDRUxFUkFUSU9OOiAwLjAwMSxcclxuICAgIC8vIOS4uuS6huS/neivgeWkmuS6uua4uOaIj+aXtumAn+W6puWQjOatpe+8jOi/memHjOWKoOmAn+W6puiuvuS4ujBcclxuICAgIEFDQ0VMRVJBVElPTjogMCxcclxuICAgIEJHX0NMT1VEX1NQRUVEOiAwLjIsXHJcbiAgICBCT1RUT01fUEFEOiBDb25zdGFudHMuQk9UVE9NX1BBRCxcclxuICAgIENMRUFSX1RJTUU6IDMwMDAsXHJcbiAgICBDTE9VRF9GUkVRVUVOQ1k6IDAuNSxcclxuICAgIEdBTUVPVkVSX0NMRUFSX1RJTUU6IDc1MCxcclxuICAgIEdBUF9DT0VGRklDSUVOVDogMC42LFxyXG4gICAgR1JBVklUWTogMC42LFxyXG4gICAgSU5JVElBTF9KVU1QX1ZFTE9DSVRZOiAxMixcclxuICAgIE1BWF9DTE9VRFM6IDYsXHJcbiAgICBNQVhfU1BFRUQ6IDEyLFxyXG4gICAgTUlOX0pVTVBfSEVJR0hUOiAzNSxcclxuICAgIE1PQklMRV9TUEVFRF9DT0VGRklDSUVOVDogMS4yLFxyXG4gICAgUkVTT1VSQ0VfVEVNUExBVEVfSUQ6ICdhdWRpby1yZXNvdXJjZXMnLFxyXG4gICAgLy8g5Yid5aeL6YCf5bqmXHJcbiAgICBTUEVFRDogOCxcclxuICAgIFNQRUVEX0RST1BfQ09FRkZJQ0lFTlQ6IDNcclxufTtcclxuLyoqXHJcbiAqIERlZmF1bHQgZGltZW5zaW9ucy5cclxuICogQGVudW0ge3N0cmluZ31cclxuICovXHJcblJ1bm5lci5kZWZhdWx0RGltZW5zaW9ucyA9IHtcclxuICAgIFdJRFRIOiBDb25zdGFudHMuREVGQVVMVF9XSURUSCxcclxuICAgIEhFSUdIVDogQ29uc3RhbnRzLkRFRkFVTFRfSEVJR0hUXHJcbn07XHJcblxyXG4vKipcclxuICogQ1NTIGNsYXNzIG5hbWVzLlxyXG4gKiBAZW51bSB7c3RyaW5nfVxyXG4gKi9cclxuUnVubmVyLmNsYXNzZXMgPSB7XHJcbiAgICBDQU5WQVM6ICdydW5uZXItY2FudmFzJyxcclxuICAgIENPTlRBSU5FUjogJ3J1bm5lci1jb250YWluZXInLFxyXG4gICAgQ1JBU0hFRDogJ2NyYXNoZWQnLFxyXG4gICAgSUNPTjogJ2ljb24tb2ZmbGluZScsXHJcbiAgICBUT1VDSF9DT05UUk9MTEVSOiAnY29udHJvbGxlcidcclxufTtcclxuLyoqXHJcbiAqIEltYWdlIHNvdXJjZSB1cmxzLlxyXG4gKiBAZW51bSB7YXJyYXkuPG9iamVjdD59XHJcbiAqL1xyXG5SdW5uZXIuaW1hZ2VTb3VyY2VzID0ge1xyXG4gICAgTERQSTogW3tcclxuICAgICAgICBuYW1lOiAnQ0FDVFVTX0xBUkdFJyxcclxuICAgICAgICBpZDogJzF4LW9ic3RhY2xlLWxhcmdlJ1xyXG4gICAgfSwge1xyXG4gICAgICAgIG5hbWU6ICdDQUNUVVNfU01BTEwnLFxyXG4gICAgICAgIGlkOiAnMXgtb2JzdGFjbGUtc21hbGwnXHJcbiAgICB9LCB7XHJcbiAgICAgICAgbmFtZTogJ0NMT1VEJyxcclxuICAgICAgICBpZDogJzF4LWNsb3VkJ1xyXG4gICAgfSwge1xyXG4gICAgICAgIG5hbWU6ICdIT1JJWk9OJyxcclxuICAgICAgICBpZDogJzF4LWhvcml6b24nXHJcbiAgICB9LCB7XHJcbiAgICAgICAgbmFtZTogJ1JFU1RBUlQnLFxyXG4gICAgICAgIGlkOiAnMXgtcmVzdGFydCdcclxuICAgIH0sIHtcclxuICAgICAgICBuYW1lOiAnVEVYVF9TUFJJVEUnLFxyXG4gICAgICAgIGlkOiAnMXgtdGV4dCdcclxuICAgIH0sIHtcclxuICAgICAgICBuYW1lOiAnVFJFWCcsXHJcbiAgICAgICAgaWQ6ICcxeC10cmV4J1xyXG4gICAgfV0sXHJcbiAgICBIRFBJOiBbe1xyXG4gICAgICAgIG5hbWU6ICdDQUNUVVNfTEFSR0UnLFxyXG4gICAgICAgIGlkOiAnMngtb2JzdGFjbGUtbGFyZ2UnXHJcbiAgICB9LCB7XHJcbiAgICAgICAgbmFtZTogJ0NBQ1RVU19TTUFMTCcsXHJcbiAgICAgICAgaWQ6ICcyeC1vYnN0YWNsZS1zbWFsbCdcclxuICAgIH0sIHtcclxuICAgICAgICBuYW1lOiAnQ0xPVUQnLFxyXG4gICAgICAgIGlkOiAnMngtY2xvdWQnXHJcbiAgICB9LCB7XHJcbiAgICAgICAgbmFtZTogJ0hPUklaT04nLFxyXG4gICAgICAgIGlkOiAnMngtaG9yaXpvbidcclxuICAgIH0sIHtcclxuICAgICAgICBuYW1lOiAnUkVTVEFSVCcsXHJcbiAgICAgICAgaWQ6ICcyeC1yZXN0YXJ0J1xyXG4gICAgfSwge1xyXG4gICAgICAgIG5hbWU6ICdURVhUX1NQUklURScsXHJcbiAgICAgICAgaWQ6ICcyeC10ZXh0J1xyXG4gICAgfSwge1xyXG4gICAgICAgIG5hbWU6ICdUUkVYJyxcclxuICAgICAgICBpZDogJzJ4LXRyZXgnXHJcbiAgICB9XVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNvdW5kIEZYLiBSZWZlcmVuY2UgdG8gdGhlIElEIG9mIHRoZSBhdWRpbyB0YWcgb24gaW50ZXJzdGl0aWFsIHBhZ2UuXHJcbiAqIEBlbnVtIHtzdHJpbmd9XHJcbiAqL1xyXG5SdW5uZXIuc291bmRzID0ge1xyXG4gICAgQlVUVE9OX1BSRVNTOiAnb2ZmbGluZS1zb3VuZC1wcmVzcycsXHJcbiAgICBISVQ6ICdvZmZsaW5lLXNvdW5kLWhpdCcsXHJcbiAgICBTQ09SRTogJ29mZmxpbmUtc291bmQtcmVhY2hlZCdcclxufTtcclxuLyoqXHJcbiAqIEtleSBjb2RlIG1hcHBpbmcuXHJcbiAqIEBlbnVtIHtvYmplY3R9XHJcbiAqL1xyXG5SdW5uZXIua2V5Y29kZXMgPSB7XHJcbiAgICBKVU1QOiB7XHJcbiAgICAgICAgJzM4JzogMSxcclxuICAgICAgICAnMzInOiAxXHJcbiAgICB9LCAvLyBVcCwgc3BhY2ViYXJcclxuICAgIERVQ0s6IHtcclxuICAgICAgICAnNDAnOiAxXHJcbiAgICB9LCAvLyBEb3duXHJcbiAgICBSRVNUQVJUOiB7XHJcbiAgICAgICAgJzEzJzogMVxyXG4gICAgfSAvLyBFbnRlclxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJ1bm5lciBldmVudCBuYW1lcy5cclxuICogQGVudW0ge3N0cmluZ31cclxuICovXHJcblJ1bm5lci5ldmVudHMgPSB7XHJcbiAgICBBTklNX0VORDogWyd3ZWJraXRBbmltYXRpb25FbmQnLCAnbW96QW5pbWF0aW9uRW5kJywgJ2FuaW1hdGlvbkVuZCddLFxyXG4gICAgQ0xJQ0s6ICdjbGljaycsXHJcbiAgICBLRVlET1dOOiAna2V5ZG93bicsXHJcbiAgICBLRVlVUDogJ2tleXVwJyxcclxuICAgIE1PVVNFRE9XTjogJ21vdXNlZG93bicsXHJcbiAgICBNT1VTRVVQOiAnbW91c2V1cCcsXHJcbiAgICBSRVNJWkU6ICdyZXNpemUnLFxyXG4gICAgVE9VQ0hFTkQ6ICd0b3VjaGVuZCcsXHJcbiAgICBUT1VDSFNUQVJUOiAndG91Y2hzdGFydCcsXHJcbiAgICBWSVNJQklMSVRZOiAndmlzaWJpbGl0eWNoYW5nZScsXHJcbiAgICBCTFVSOiAnYmx1cicsXHJcbiAgICBGT0NVUzogJ2ZvY3VzJyxcclxuICAgIExPQUQ6ICdsb2FkJ1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBjYW52YXMgZWxlbWVudC5cclxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gY29udGFpbmVyIEVsZW1lbnQgdG8gYXBwZW5kIGNhbnZhcyB0by5cclxuICogQHBhcmFtIHtudW1iZXJ9IHdpZHRoXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBoZWlnaHRcclxuICogQHBhcmFtIHtzdHJpbmd9IG9wdF9jbGFzc25hbWVcclxuICogQHJldHVybiB7SFRNTENhbnZhc0VsZW1lbnR9XHJcbiAqL1xyXG5mdW5jdGlvbiBjcmVhdGVDYW52YXMgKGNvbnRhaW5lciwgd2lkdGgsIGhlaWdodCwgb3B0X2NsYXNzbmFtZSkge1xyXG4gICAgdmFyIGNhbnZhcyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2NhbnZhcycpO1xyXG4gICAgY2FudmFzLmNsYXNzTmFtZSA9IG9wdF9jbGFzc25hbWUgPyBSdW5uZXIuY2xhc3Nlcy5DQU5WQVMgKyAnICcgK1xyXG4gICAgICAgIG9wdF9jbGFzc25hbWUgOiBSdW5uZXIuY2xhc3Nlcy5DQU5WQVM7XHJcbiAgICBjYW52YXMud2lkdGggPSB3aWR0aDtcclxuICAgIGNhbnZhcy5oZWlnaHQgPSBoZWlnaHQ7XHJcbiAgICBjb250YWluZXIuYXBwZW5kQ2hpbGQoY2FudmFzKTtcclxuICAgIHJldHVybiBjYW52YXM7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVjayBmb3IgYSBjb2xsaXNpb24uXHJcbiAqIEBwYXJhbSB7IU9ic3RhY2xlfSBvYnN0YWNsZVxyXG4gKiBAcGFyYW0geyFUcmV4fSB0UmV4IFQtcmV4IG9iamVjdC5cclxuICogQHBhcmFtIHtIVE1MQ2FudmFzQ29udGV4dH0gb3B0X2NhbnZhc0N0eCBPcHRpb25hbCBjYW52YXMgY29udGV4dCBmb3IgZHJhd2luZ1xyXG4gKiAgICBjb2xsaXNpb24gYm94ZXMuXHJcbiAqIEByZXR1cm4ge0FycmF5LjxDb2xsaXNpb25Cb3g+fVxyXG4gKi9cclxuZnVuY3Rpb24gY2hlY2tGb3JDb2xsaXNpb24gKG9ic3RhY2xlLCB0UmV4LCBvcHRfY2FudmFzQ3R4KSB7XHJcbiAgICBpZighb2JzdGFjbGUpIHtcclxuICAgICAgICByZXR1cm47XHJcbiAgICB9XHJcbiAgICB2YXIgb2JzdGFjbGVCb3hYUG9zID0gUnVubmVyLmRlZmF1bHREaW1lbnNpb25zLldJRFRIICsgb2JzdGFjbGUueFBvcztcclxuXHJcbiAgICAvLyBBZGp1c3RtZW50cyBhcmUgbWFkZSB0byB0aGUgYm91bmRpbmcgYm94IGFzIHRoZXJlIGlzIGEgMSBwaXhlbCB3aGl0ZVxyXG4gICAgLy8gYm9yZGVyIGFyb3VuZCB0aGUgdC1yZXggYW5kIG9ic3RhY2xlcy5cclxuICAgIHZhciB0UmV4Qm94ID0gbmV3IENvbGxpc2lvbkJveChcclxuICAgICAgICB0UmV4LnhQb3MgKyAxLFxyXG4gICAgICAgIHRSZXgueVBvcyArIDEsXHJcbiAgICAgICAgdFJleC5jb25maWcuV0lEVEggLSAyLFxyXG4gICAgICAgIHRSZXguY29uZmlnLkhFSUdIVCAtIDIpO1xyXG4gICAgdmFyIG9ic3RhY2xlQm94ID0gbmV3IENvbGxpc2lvbkJveChcclxuICAgICAgICBvYnN0YWNsZS54UG9zICsgMSxcclxuICAgICAgICBvYnN0YWNsZS55UG9zICsgMSxcclxuICAgICAgICBvYnN0YWNsZS50eXBlQ29uZmlnLndpZHRoICogb2JzdGFjbGUuc2l6ZSAtIDIsXHJcbiAgICAgICAgb2JzdGFjbGUudHlwZUNvbmZpZy5oZWlnaHQgLSAyKTtcclxuICAgIC8vIERlYnVnIG91dGVyIGJveFxyXG4gICAgaWYgKG9wdF9jYW52YXNDdHgpIHtcclxuICAgICAgICBkcmF3Q29sbGlzaW9uQm94ZXMob3B0X2NhbnZhc0N0eCwgdFJleEJveCwgb2JzdGFjbGVCb3gpO1xyXG4gICAgfVxyXG4gICAgLy8gU2ltcGxlIG91dGVyIGJvdW5kcyBjaGVjay5cclxuICAgIGlmIChib3hDb21wYXJlKHRSZXhCb3gsIG9ic3RhY2xlQm94KSkge1xyXG4gICAgICAgIHZhciBjb2xsaXNpb25Cb3hlcyA9IG9ic3RhY2xlLmNvbGxpc2lvbkJveGVzO1xyXG4gICAgICAgIHZhciB0UmV4Q29sbGlzaW9uQm94ZXMgPSBUcmV4LmNvbGxpc2lvbkJveGVzO1xyXG5cclxuICAgICAgICAvLyBEZXRhaWxlZCBheGlzIGFsaWduZWQgYm94IGNoZWNrLlxyXG4gICAgICAgIGZvciAodmFyIHQgPSAwOyB0IDwgdFJleENvbGxpc2lvbkJveGVzLmxlbmd0aDsgdCsrKSB7XHJcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgY29sbGlzaW9uQm94ZXMubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkanVzdCB0aGUgYm94IHRvIGFjdHVhbCBwb3NpdGlvbnMuXHJcbiAgICAgICAgICAgICAgICB2YXIgYWRqVHJleEJveCA9XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlQWRqdXN0ZWRDb2xsaXNpb25Cb3godFJleENvbGxpc2lvbkJveGVzW3RdLCB0UmV4Qm94KTtcclxuICAgICAgICAgICAgICAgIHZhciBhZGpPYnN0YWNsZUJveCA9XHJcbiAgICAgICAgICAgICAgICAgICAgY3JlYXRlQWRqdXN0ZWRDb2xsaXNpb25Cb3goY29sbGlzaW9uQm94ZXNbaV0sIG9ic3RhY2xlQm94KTtcclxuICAgICAgICAgICAgICAgIHZhciBjcmFzaGVkID0gYm94Q29tcGFyZShhZGpUcmV4Qm94LCBhZGpPYnN0YWNsZUJveCk7XHJcbiAgICAgICAgICAgICAgICAvLyBEcmF3IGJveGVzIGZvciBkZWJ1Zy5cclxuICAgICAgICAgICAgICAgIGlmIChvcHRfY2FudmFzQ3R4KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZHJhd0NvbGxpc2lvbkJveGVzKG9wdF9jYW52YXNDdHgsIGFkalRyZXhCb3gsIGFkak9ic3RhY2xlQm94KTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChjcmFzaGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIFthZGpUcmV4Qm94LCBhZGpPYnN0YWNsZUJveF07XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG4vKipcclxuICogQ29tcGFyZSB0d28gY29sbGlzaW9uIGJveGVzIGZvciBhIGNvbGxpc2lvbi5cclxuICogQHBhcmFtIHtDb2xsaXNpb25Cb3h9IHRSZXhCb3hcclxuICogQHBhcmFtIHtDb2xsaXNpb25Cb3h9IG9ic3RhY2xlQm94XHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgdGhlIGJveGVzIGludGVyc2VjdGVkLlxyXG4gKi9cclxuZnVuY3Rpb24gYm94Q29tcGFyZSAodFJleEJveCwgb2JzdGFjbGVCb3gpIHtcclxuICAgIHZhciBjcmFzaGVkID0gZmFsc2U7XHJcbiAgICB2YXIgdFJleEJveFggPSB0UmV4Qm94Lng7XHJcbiAgICB2YXIgdFJleEJveFkgPSB0UmV4Qm94Lnk7XHJcbiAgICB2YXIgb2JzdGFjbGVCb3hYID0gb2JzdGFjbGVCb3gueDtcclxuICAgIHZhciBvYnN0YWNsZUJveFkgPSBvYnN0YWNsZUJveC55O1xyXG4gICAgLy8gQXhpcy1BbGlnbmVkIEJvdW5kaW5nIEJveCBtZXRob2QuXHJcbiAgICBpZiAodFJleEJveC54IDwgb2JzdGFjbGVCb3hYICsgb2JzdGFjbGVCb3gud2lkdGggJiZcclxuICAgICAgICB0UmV4Qm94LnggKyB0UmV4Qm94LndpZHRoID4gb2JzdGFjbGVCb3hYICYmXHJcbiAgICAgICAgdFJleEJveC55IDwgb2JzdGFjbGVCb3gueSArIG9ic3RhY2xlQm94LmhlaWdodCAmJlxyXG4gICAgICAgIHRSZXhCb3guaGVpZ2h0ICsgdFJleEJveC55ID4gb2JzdGFjbGVCb3gueSkge1xyXG4gICAgICAgIGNyYXNoZWQgPSB0cnVlO1xyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBjcmFzaGVkO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkanVzdCB0aGUgY29sbGlzaW9uIGJveC5cclxuICogQHBhcmFtIHshQ29sbGlzaW9uQm94fSBib3ggVGhlIG9yaWdpbmFsIGJveC5cclxuICogQHBhcmFtIHshQ29sbGlzaW9uQm94fSBhZGp1c3RtZW50IEFkanVzdG1lbnQgYm94LlxyXG4gKiBAcmV0dXJuIHtDb2xsaXNpb25Cb3h9IFRoZSBhZGp1c3RlZCBjb2xsaXNpb24gYm94IG9iamVjdC5cclxuICovXHJcbmZ1bmN0aW9uIGNyZWF0ZUFkanVzdGVkQ29sbGlzaW9uQm94IChib3gsIGFkanVzdG1lbnQpIHtcclxuICAgIHJldHVybiBuZXcgQ29sbGlzaW9uQm94KFxyXG4gICAgICAgIGJveC54ICsgYWRqdXN0bWVudC54LFxyXG4gICAgICAgIGJveC55ICsgYWRqdXN0bWVudC55LFxyXG4gICAgICAgIGJveC53aWR0aCxcclxuICAgICAgICBib3guaGVpZ2h0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBWaWJyYXRlIG9uIG1vYmlsZSBkZXZpY2VzLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gZHVyYXRpb24gRHVyYXRpb24gb2YgdGhlIHZpYnJhdGlvbiBpbiBtaWxsaXNlY29uZHMuXHJcbiAqL1xyXG5mdW5jdGlvbiB2aWJyYXRlIChkdXJhdGlvbikge1xyXG4gICAgaWYgKENvbnN0YW50cy5JU19NT0JJTEUpIHtcclxuICAgICAgICB3aW5kb3cubmF2aWdhdG9yWyd2aWJyYXRlJ10oZHVyYXRpb24pO1xyXG4gICAgfVxyXG59XHJcblxyXG5SdW5uZXIucHJvdG90eXBlID0ge1xyXG4gICAgLyoqXHJcbiAgICAgKiBCaW5kIGEgc29ja2V0IHRvIHNlcnZlclxyXG4gICAgICogQHBhcmFtICB7V2ViU29ja2V0fSBzb2NrZXRcclxuICAgICAqL1xyXG4gICAgYmluZDogZnVuY3Rpb24gKHNvY2tldCkge1xyXG4gICAgICAgIHRoaXMuc29ja2V0ID0gc29ja2V0O1xyXG4gICAgICAgIHNvY2tldC5vbigncGxheWVyLm5ldycsIHRoaXMuYWRkUGxheWVyLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHNvY2tldC5vbigncGxheWVyLmxpc3QnLCB0aGlzLmFkZFBsYXllcnMuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgc29ja2V0Lm9uKCdwbGF5ZXIuanVtcC5zdGFydCcsIHRoaXMucGxheWVyU3RhcnRKdW1wLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHNvY2tldC5vbigncGxheWVyLmp1bXAuZW5kJywgdGhpcy5wbGF5ZXJFbmRKdW1wLmJpbmQodGhpcykpO1xyXG4gICAgICAgIHNvY2tldC5vbigncGxheWVyLm92ZXInLCB0aGlzLnBsYXllck92ZXIuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgc29ja2V0Lm9uKCdwbGF5ZXIuZGlzY29ubmVjdGVkJywgdGhpcy5wbGF5ZXJEaXNjb25uZWN0ZWQuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgc29ja2V0Lm9uKCdnYW1lLmRhdGEnLCB0aGlzLnVwZGF0ZUdhbWVTdGF0ZS5iaW5kKHRoaXMpKTtcclxuICAgIH0sXHJcbiAgICBhZGRQbGF5ZXJzOiBmdW5jdGlvbiAocGxheWVycykge1xyXG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCBwbGF5ZXJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXJJZCA9IHBsYXllcnNbaV07XHJcbiAgICAgICAgICAgIGlmKCF0aGlzLnBsYXllcnNbcGxheWVySWRdKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFkZFBsYXllcihwbGF5ZXJJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgYWRkUGxheWVyOiBmdW5jdGlvbiAocGxheWVySWQpIHtcclxuICAgICAgICB2YXIgdFJleDtcclxuICAgICAgICBpZihwbGF5ZXJJZCA9PT0gdGhpcy5zb2NrZXQuaWQpIHtcclxuICAgICAgICAgICAgdFJleCA9IHRoaXMudFJleDtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0UmV4ID0gbmV3IFRyZXgodGhpcy5jYW52YXMsIHRoaXMuaW1hZ2VzLlRSRVgsIDAuNCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRSZXguc2V0TmFtZShwbGF5ZXJJZCk7XHJcbiAgICAgICAgdGhpcy5wbGF5ZXJzW3BsYXllcklkXSA9IHtcclxuICAgICAgICAgICAgaWQ6IHBsYXllcklkLFxyXG4gICAgICAgICAgICB0UmV4OiB0UmV4XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogV2FsayB0aHJvdWdoIGFsbCB0aGUgcGxheWVycy5cclxuICAgICAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXHJcbiAgICAgKi9cclxuICAgIGVhY2hQbGF5ZXI6IGZ1bmN0aW9uIChjYWxsYmFjaykge1xyXG4gICAgICAgIGZvcih2YXIgcGxheWVySWQgaW4gdGhpcy5wbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIHZhciBpc015c2VsZiA9IHBsYXllcklkID09PSB0aGlzLnNvY2tldC5pZDtcclxuICAgICAgICAgICAgY2FsbGJhY2sodGhpcy5wbGF5ZXJzW3BsYXllcklkXSwgaXNNeXNlbGYpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgY2VydGFpbiBwbGF5ZXIncyB0UmV4IGp1bXAuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gcGxheWVySWRcclxuICAgICAqL1xyXG4gICAgcGxheWVyU3RhcnRKdW1wOiBmdW5jdGlvbiAocGxheWVySWQpIHtcclxuICAgICAgICBpZih0aGlzLnBsYXllcnNbcGxheWVySWRdKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGxheWVyc1twbGF5ZXJJZF0udFJleC5zdGFydEp1bXAoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcGxheWVyRW5kSnVtcDogZnVuY3Rpb24gKHBsYXllcklkKSB7XHJcbiAgICAgICAgaWYodGhpcy5wbGF5ZXJzW3BsYXllcklkXSkge1xyXG4gICAgICAgICAgICB0aGlzLnBsYXllcnNbcGxheWVySWRdLnRSZXguZW5kSnVtcCgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFNvbWVvbmUgaXMgZ2FtZSBvdmVyLlxyXG4gICAgICogQHBhcmFtICB7c3RyaW5nfSBwbGF5ZXJJZFxyXG4gICAgICovXHJcbiAgICBwbGF5ZXJPdmVyOiBmdW5jdGlvbiAoZGF0YSkge1xyXG4gICAgICAgIGlmKHRoaXMucGxheWVyc1tkYXRhLnBsYXllcklkXSkge1xyXG4gICAgICAgICAgICB2YXIgcGxheWVyID0gdGhpcy5wbGF5ZXJzW2RhdGEucGxheWVySWRdO1xyXG4gICAgICAgICAgICBwbGF5ZXIubWV0ZXJzID0gZGF0YS5tZXRlcnM7XHJcbiAgICAgICAgICAgIHRoaXMuY3Jhc2hlZFBsYXllcnNbZGF0YS5wbGF5ZXJJZF0gPSBwbGF5ZXI7XHJcbiAgICAgICAgICAgIC8vIENsZWFuIHRoaXMgdGV4dCBhZnRlciAzIHNlY29uZHNcclxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgICAgICAgICAgIGlmKHRoaXMuY3Jhc2hlZFBsYXllcnNbZGF0YS5wbGF5ZXJJZF0pIHtcclxuICAgICAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5jcmFzaGVkUGxheWVyc1tkYXRhLnBsYXllcklkXTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfS5iaW5kKHRoaXMpLCAzMDAwKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcGxheWVyRGlzY29ubmVjdGVkOiBmdW5jdGlvbiAocGxheWVySWQpIHtcclxuICAgICAgICBpZih0aGlzLnBsYXllcnNbcGxheWVySWRdKSB7XHJcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLnBsYXllcnNbcGxheWVySWRdO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFdoZW4gcmVjaWV2aW5nIG5ldyBnYW1lIGRhdGEsIHVwZGF0ZSBwbGF5Z3JvdW5kLlxyXG4gICAgICogQHBhcmFtICB7T2JqZWN0fSBkYXRhXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZUdhbWVTdGF0ZTogZnVuY3Rpb24gKGRhdGEpIHtcclxuICAgICAgICBpZih0aGlzLmNyYXNoZWQpIHtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVudXNlZE9ic3RhY2xlcyA9IGRhdGEub2JzdGFjbGVzO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogU2V0dGluZyBpbmRpdmlkdWFsIHNldHRpbmdzIGZvciBkZWJ1Z2dpbmcuXHJcbiAgICAgKiBAcGFyYW0ge3N0cmluZ30gc2V0dGluZ1xyXG4gICAgICogQHBhcmFtIHsqfSB2YWx1ZVxyXG4gICAgICovXHJcbiAgICB1cGRhdGVDb25maWdTZXR0aW5nOiBmdW5jdGlvbihzZXR0aW5nLCB2YWx1ZSkge1xyXG4gICAgICAgIGlmIChzZXR0aW5nIGluIHRoaXMuY29uZmlnICYmIHZhbHVlICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICB0aGlzLmNvbmZpZ1tzZXR0aW5nXSA9IHZhbHVlO1xyXG4gICAgICAgICAgICBzd2l0Y2ggKHNldHRpbmcpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ0dSQVZJVFknOlxyXG4gICAgICAgICAgICAgICAgY2FzZSAnTUlOX0pVTVBfSEVJR0hUJzpcclxuICAgICAgICAgICAgICAgIGNhc2UgJ1NQRUVEX0RST1BfQ09FRkZJQ0lFTlQnOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMudFJleC5jb25maWdbc2V0dGluZ10gPSB2YWx1ZTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgIGNhc2UgJ0lOSVRJQUxfSlVNUF9WRUxPQ0lUWSc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy50UmV4LnNldEp1bXBWZWxvY2l0eSh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdTUEVFRCc6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zZXRTcGVlZCh2YWx1ZSk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogTG9hZCBhbmQgY2FjaGUgdGhlIGltYWdlIGFzc2V0cyBmcm9tIHRoZSBwYWdlLlxyXG4gICAgICovXHJcbiAgICBsb2FkSW1hZ2VzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB2YXIgaW1hZ2VTb3VyY2VzID0gQ29uc3RhbnRzLklTX0hJRFBJID8gUnVubmVyLmltYWdlU291cmNlcy5IRFBJIDpcclxuICAgICAgICAgICAgUnVubmVyLmltYWdlU291cmNlcy5MRFBJO1xyXG4gICAgICAgIHZhciBudW1JbWFnZXMgPSBpbWFnZVNvdXJjZXMubGVuZ3RoO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSBudW1JbWFnZXMgLSAxOyBpID49IDA7IGktLSkge1xyXG4gICAgICAgICAgICB2YXIgaW1nU291cmNlID0gaW1hZ2VTb3VyY2VzW2ldO1xyXG4gICAgICAgICAgICB0aGlzLmltYWdlc1tpbWdTb3VyY2UubmFtZV0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChpbWdTb3VyY2UuaWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmluaXQoKTtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIExvYWQgYW5kIGRlY29kZSBiYXNlIDY0IGVuY29kZWQgc291bmRzLlxyXG4gICAgICovXHJcbiAgICBsb2FkU291bmRzOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLmF1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcclxuICAgICAgICB2YXIgcmVzb3VyY2VUZW1wbGF0ZSA9XHJcbiAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMuY29uZmlnLlJFU09VUkNFX1RFTVBMQVRFX0lEKS5jb250ZW50O1xyXG5cclxuICAgICAgICBmb3IgKHZhciBzb3VuZCBpbiBSdW5uZXIuc291bmRzKSB7XHJcbiAgICAgICAgICAgIHZhciBzb3VuZFNyYyA9IHJlc291cmNlVGVtcGxhdGUuZ2V0RWxlbWVudEJ5SWQoUnVubmVyLnNvdW5kc1tzb3VuZF0pLnNyYztcclxuICAgICAgICAgICAgc291bmRTcmMgPSBzb3VuZFNyYy5zdWJzdHIoc291bmRTcmMuaW5kZXhPZignLCcpICsgMSk7XHJcblxyXG4gICAgICAgICAgICB2YXIgYnVmZmVyID0gVXRpbHMuZGVjb2RlQmFzZTY0VG9BcnJheUJ1ZmZlcihzb3VuZFNyYyk7XHJcbiAgICAgICAgICAgIC8vIEFzeW5jLCBzbyBubyBndWFyYW50ZWUgb2Ygb3JkZXIgaW4gYXJyYXkuXHJcbiAgICAgICAgICAgIHRoaXMuYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YShidWZmZXIsIGZ1bmN0aW9uKGluZGV4LCBhdWRpb0RhdGEpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc291bmRGeFtpbmRleF0gPSBhdWRpb0RhdGE7XHJcbiAgICAgICAgICAgIH0uYmluZCh0aGlzLCBzb3VuZCkpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFNldHMgdGhlIGdhbWUgc3BlZWQuIEFkanVzdCB0aGUgc3BlZWQgYWNjb3JkaW5nbHkgaWYgb24gYSBzbWFsbGVyIHNjcmVlbi5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSBvcHRfc3BlZWRcclxuICAgICAqL1xyXG4gICAgc2V0U3BlZWQ6IGZ1bmN0aW9uKG9wdF9zcGVlZCkge1xyXG4gICAgICAgIHZhciBzcGVlZCA9IG9wdF9zcGVlZCB8fCB0aGlzLmN1cnJlbnRTcGVlZDtcclxuICAgICAgICAvLyBSZWR1Y2UgdGhlIHNwZWVkIG9uIHNtYWxsZXIgbW9iaWxlIHNjcmVlbnMuXHJcbiAgICAgICAgaWYgKHRoaXMuZGltZW5zaW9ucy5XSURUSCA8IENvbnN0YW50cy5ERUZBVUxUX1dJRFRIKSB7XHJcbiAgICAgICAgICAgIHZhciBtb2JpbGVTcGVlZCA9IHNwZWVkICogdGhpcy5kaW1lbnNpb25zLldJRFRIIC8gQ29uc3RhbnRzLkRFRkFVTFRfV0lEVEggKlxyXG4gICAgICAgICAgICAgICAgdGhpcy5jb25maWcuTU9CSUxFX1NQRUVEX0NPRUZGSUNJRU5UO1xyXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRTcGVlZCA9IG1vYmlsZVNwZWVkID4gc3BlZWQgPyBzcGVlZCA6IG1vYmlsZVNwZWVkO1xyXG4gICAgICAgIH0gZWxzZSBpZiAob3B0X3NwZWVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFNwZWVkID0gb3B0X3NwZWVkO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBHYW1lIGluaXRpYWxpc2VyLlxyXG4gICAgICovXHJcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBIaWRlIHRoZSBzdGF0aWMgaWNvbi5cclxuICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuJyArIFJ1bm5lci5jbGFzc2VzLklDT04pLnN0eWxlLnZpc2liaWxpdHkgPVxyXG4gICAgICAgICAgICAnaGlkZGVuJztcclxuICAgICAgICB0aGlzLmFkanVzdERpbWVuc2lvbnMoKTtcclxuICAgICAgICB0aGlzLnNldFNwZWVkKCk7XHJcbiAgICAgICAgdGhpcy5jb250YWluZXJFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2RpdicpO1xyXG4gICAgICAgIHRoaXMuY29udGFpbmVyRWwuY2xhc3NOYW1lID0gUnVubmVyLmNsYXNzZXMuQ09OVEFJTkVSO1xyXG4gICAgICAgIC8vIFBsYXllciBjYW52YXMgY29udGFpbmVyLlxyXG4gICAgICAgIHRoaXMuY2FudmFzID0gY3JlYXRlQ2FudmFzKHRoaXMuY29udGFpbmVyRWwsIHRoaXMuZGltZW5zaW9ucy5XSURUSCxcclxuICAgICAgICAgICAgdGhpcy5kaW1lbnNpb25zLkhFSUdIVCwgUnVubmVyLmNsYXNzZXMuUExBWUVSKTtcclxuXHJcbiAgICAgICAgdGhpcy5jYW52YXNDdHggPSB0aGlzLmNhbnZhcy5nZXRDb250ZXh0KCcyZCcpO1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmZpbGxTdHlsZSA9ICcjZjdmN2Y3JztcclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5maWxsKCk7XHJcbiAgICAgICAgUnVubmVyLnVwZGF0ZUNhbnZhc1NjYWxpbmcodGhpcy5jYW52YXMpO1xyXG4gICAgICAgIC8vIEhvcml6b24gY29udGFpbnMgY2xvdWRzLCBvYnN0YWNsZXMgYW5kIHRoZSBncm91bmQuXHJcbiAgICAgICAgdGhpcy5ob3Jpem9uID0gbmV3IEhvcml6b24odGhpcy5jYW52YXMsIHRoaXMuaW1hZ2VzLCB0aGlzLmRpbWVuc2lvbnMsXHJcbiAgICAgICAgICAgIHRoaXMuY29uZmlnLkdBUF9DT0VGRklDSUVOVCk7XHJcbiAgICAgICAgLy8gRGlzdGFuY2UgbWV0ZXJcclxuICAgICAgICB0aGlzLmRpc3RhbmNlTWV0ZXIgPSBuZXcgRGlzdGFuY2VNZXRlcih0aGlzLmNhbnZhcyxcclxuICAgICAgICAgICAgdGhpcy5pbWFnZXMuVEVYVF9TUFJJVEUsIHRoaXMuZGltZW5zaW9ucy5XSURUSCk7XHJcbiAgICAgICAgLy8gRHJhdyB0LXJleFxyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmZvbnQgPSBcIjEycHggR2VvcmdpYVwiO1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmZpbGxTdHlsZSA9IFwiIzMzMzMzM1wiO1xyXG4gICAgICAgIHRoaXMudFJleCA9IG5ldyBUcmV4KHRoaXMuY2FudmFzLCB0aGlzLmltYWdlcy5UUkVYKTtcclxuXHJcbiAgICAgICAgdGhpcy5vdXRlckNvbnRhaW5lckVsLmFwcGVuZENoaWxkKHRoaXMuY29udGFpbmVyRWwpO1xyXG4gICAgICAgIGlmIChDb25zdGFudHMuSVNfTU9CSUxFKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3JlYXRlVG91Y2hDb250cm9sbGVyKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuc3RhcnRMaXN0ZW5pbmcoKTtcclxuICAgICAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuUkVTSVpFLFxyXG4gICAgICAgICAgICB0aGlzLmRlYm91bmNlUmVzaXplLmJpbmQodGhpcykpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIENyZWF0ZSB0aGUgdG91Y2ggY29udHJvbGxlci4gQSBkaXYgdGhhdCBjb3ZlcnMgd2hvbGUgc2NyZWVuLlxyXG4gICAgICovXHJcbiAgICBjcmVhdGVUb3VjaENvbnRyb2xsZXI6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMudG91Y2hDb250cm9sbGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZGl2Jyk7XHJcbiAgICAgICAgdGhpcy50b3VjaENvbnRyb2xsZXIuY2xhc3NOYW1lID0gUnVubmVyLmNsYXNzZXMuVE9VQ0hfQ09OVFJPTExFUjtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIERlYm91bmNlIHRoZSByZXNpemUgZXZlbnQuXHJcbiAgICAgKi9cclxuICAgIGRlYm91bmNlUmVzaXplOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAoIXRoaXMucmVzaXplVGltZXJJZF8pIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNpemVUaW1lcklkXyA9XHJcbiAgICAgICAgICAgICAgICBzZXRJbnRlcnZhbCh0aGlzLmFkanVzdERpbWVuc2lvbnMuYmluZCh0aGlzKSwgMjUwKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBBZGp1c3QgZ2FtZSBzcGFjZSBkaW1lbnNpb25zIG9uIHJlc2l6ZS5cclxuICAgICAqL1xyXG4gICAgYWRqdXN0RGltZW5zaW9uczogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgY2xlYXJJbnRlcnZhbCh0aGlzLnJlc2l6ZVRpbWVySWRfKTtcclxuICAgICAgICB0aGlzLnJlc2l6ZVRpbWVySWRfID0gbnVsbDtcclxuICAgICAgICB2YXIgYm94U3R5bGVzID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUodGhpcy5vdXRlckNvbnRhaW5lckVsKTtcclxuICAgICAgICB2YXIgcGFkZGluZyA9IE51bWJlcihib3hTdHlsZXMucGFkZGluZ0xlZnQuc3Vic3RyKDAsXHJcbiAgICAgICAgICAgIGJveFN0eWxlcy5wYWRkaW5nTGVmdC5sZW5ndGggLSAyKSk7XHJcblxyXG4gICAgICAgIHRoaXMuZGltZW5zaW9ucy5XSURUSCA9IHRoaXMub3V0ZXJDb250YWluZXJFbC5vZmZzZXRXaWR0aCAtIHBhZGRpbmcgKiAyO1xyXG4gICAgICAgIC8vIFJlZHJhdyB0aGUgZWxlbWVudHMgYmFjayBvbnRvIHRoZSBjYW52YXMuXHJcbiAgICAgICAgaWYgKHRoaXMuY2FudmFzKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2FudmFzLndpZHRoID0gdGhpcy5kaW1lbnNpb25zLldJRFRIO1xyXG4gICAgICAgICAgICB0aGlzLmNhbnZhcy5oZWlnaHQgPSB0aGlzLmRpbWVuc2lvbnMuSEVJR0hUO1xyXG4gICAgICAgICAgICBSdW5uZXIudXBkYXRlQ2FudmFzU2NhbGluZyh0aGlzLmNhbnZhcyk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzdGFuY2VNZXRlci5jYWxjWFBvcyh0aGlzLmRpbWVuc2lvbnMuV0lEVEgpO1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFyQ2FudmFzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuaG9yaXpvbi51cGRhdGUoMCwgMCwgdHJ1ZSk7XHJcbiAgICAgICAgICAgIHRoaXMuZWFjaFBsYXllcihmdW5jdGlvbiAocGxheWVyKSB7XHJcbiAgICAgICAgICAgICAgICBwbGF5ZXIudFJleC51cGRhdGUoMCk7XHJcbiAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgLy8gT3V0ZXIgY29udGFpbmVyIGFuZCBkaXN0YW5jZSBtZXRlci5cclxuICAgICAgICAgICAgaWYgKHRoaXMuYWN0aXZhdGVkIHx8IHRoaXMuY3Jhc2hlZCkge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbC5zdHlsZS53aWR0aCA9IHRoaXMuZGltZW5zaW9ucy5XSURUSCArICdweCc7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lckVsLnN0eWxlLmhlaWdodCA9IHRoaXMuZGltZW5zaW9ucy5IRUlHSFQgKyAncHgnO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXN0YW5jZU1ldGVyLnVwZGF0ZSgwLCBNYXRoLmNlaWwodGhpcy5kaXN0YW5jZVJhbikpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmVhY2hQbGF5ZXIoZnVuY3Rpb24gKHBsYXllcikge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYXllci50UmV4LmRyYXcoMCwgMCk7XHJcbiAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAvLyBHYW1lIG92ZXIgcGFuZWwuXHJcbiAgICAgICAgICAgIGlmICh0aGlzLmNyYXNoZWQgJiYgdGhpcy5nYW1lT3ZlclBhbmVsKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmdhbWVPdmVyUGFuZWwudXBkYXRlRGltZW5zaW9ucyh0aGlzLmRpbWVuc2lvbnMuV0lEVEgpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lT3ZlclBhbmVsLmRyYXcoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFBsYXkgdGhlIGdhbWUgaW50cm8uXHJcbiAgICAgKiBDYW52YXMgY29udGFpbmVyIHdpZHRoIGV4cGFuZHMgb3V0IHRvIHRoZSBmdWxsIHdpZHRoLlxyXG4gICAgICovXHJcbiAgICBwbGF5SW50cm86IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5zdGFydGVkICYmICF0aGlzLmNyYXNoZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5wbGF5aW5nSW50cm8gPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnRSZXgucGxheWluZ0ludHJvID0gdHJ1ZTtcclxuXHJcbiAgICAgICAgICAgIC8vIENTUyBhbmltYXRpb24gZGVmaW5pdGlvbi5cclxuICAgICAgICAgICAgZG9jdW1lbnQuc3R5bGVTaGVldHNbMF0uaW5zZXJ0UnVsZSh0aGlzLmtleWZyYW1lcywgMCk7XHJcblxyXG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgUnVubmVyLmV2ZW50cy5BTklNX0VORC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbC5hZGRFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuQU5JTV9FTkRbaV0sXHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5zdGFydEdhbWUuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyRWwuc3R5bGVbdGhpcy5hbmltYXRpb25LZXldID0gJ2ludHJvIC40cyBlYXNlLW91dCAxIGJvdGgnO1xyXG5cclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbC5zdHlsZS53aWR0aCA9IHRoaXMuZGltZW5zaW9ucy5XSURUSCArICdweCc7XHJcbiAgICAgICAgICAgIGlmICh0aGlzLnRvdWNoQ29udHJvbGxlcikge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vdXRlckNvbnRhaW5lckVsLmFwcGVuZENoaWxkKHRoaXMudG91Y2hDb250cm9sbGVyKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB0aGlzLmFjdGl2YXRlZCA9IHRydWU7XHJcbiAgICAgICAgICAgIHRoaXMuc3RhcnRlZCA9IHRydWU7XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLmNyYXNoZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXN0YXJ0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFVwZGF0ZSB0aGUgZ2FtZSBzdGF0dXMgdG8gc3RhcnRlZC5cclxuICAgICAqL1xyXG4gICAgc3RhcnRHYW1lOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnJ1bm5pbmdUaW1lID0gMDtcclxuICAgICAgICB0aGlzLnBsYXlpbmdJbnRybyA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMudFJleC5wbGF5aW5nSW50cm8gPSBmYWxzZTtcclxuICAgICAgICB0aGlzLmNvbnRhaW5lckVsLnN0eWxlW3RoaXMuYW5pbWF0aW9uS2V5XSA9ICcnO1xyXG4gICAgICAgIHRoaXMucGxheUNvdW50Kys7XHJcbiAgICAgICAgLy8gSGFuZGxlIHRhYmJpbmcgb2ZmIHRoZSBwYWdlLiBQYXVzZSB0aGUgY3VycmVudCBnYW1lLlxyXG4gICAgICAgIC8vIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuVklTSUJJTElUWSxcclxuICAgICAgICAvLyAgICAgdGhpcy5vblZpc2liaWxpdHlDaGFuZ2UuYmluZCh0aGlzKSk7XHJcbiAgICAgICAgLy8gd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoUnVubmVyLmV2ZW50cy5CTFVSLFxyXG4gICAgICAgIC8vICAgICB0aGlzLm9uVmlzaWJpbGl0eUNoYW5nZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICAvLyB3aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcihSdW5uZXIuZXZlbnRzLkZPQ1VTLFxyXG4gICAgICAgIC8vICAgICB0aGlzLm9uVmlzaWJpbGl0eUNoYW5nZS5iaW5kKHRoaXMpKTtcclxuICAgIH0sXHJcblxyXG4gICAgY2xlYXJDYW52YXM6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuY2FudmFzQ3R4LmNsZWFyUmVjdCgwLCAwLCB0aGlzLmRpbWVuc2lvbnMuV0lEVEgsXHJcbiAgICAgICAgICAgIHRoaXMuZGltZW5zaW9ucy5IRUlHSFQpO1xyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogVXBkYXRlIHRoZSBnYW1lIGZyYW1lLlxyXG4gICAgICovXHJcbiAgICB1cGRhdGU6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuZHJhd1BlbmRpbmcgPSBmYWxzZTtcclxuICAgICAgICB2YXIgbm93ID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgdmFyIGRlbHRhVGltZSA9IG5vdyAtICh0aGlzLnRpbWUgfHwgbm93KTtcclxuICAgICAgICB0aGlzLnRpbWUgPSBub3c7XHJcbiAgICAgICAgaWYgKHRoaXMuYWN0aXZhdGVkKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY2xlYXJDYW52YXMoKTtcclxuXHJcbiAgICAgICAgICAgIHRoaXMuZWFjaFBsYXllcihmdW5jdGlvbiAocGxheWVyKSB7XHJcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwbGF5ZXIuaWQpXHJcbiAgICAgICAgICAgICAgICBpZiAocGxheWVyLnRSZXguanVtcGluZykge1xyXG4gICAgICAgICAgICAgICAgICAgIHBsYXllci50UmV4LnVwZGF0ZUp1bXAoZGVsdGFUaW1lKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnJ1bm5pbmdUaW1lICs9IGRlbHRhVGltZTtcclxuICAgICAgICAgICAgdmFyIGhhc09ic3RhY2xlcyA9IHRoaXMucnVubmluZ1RpbWUgPiB0aGlzLmNvbmZpZy5DTEVBUl9USU1FO1xyXG4gICAgICAgICAgICAvLyBGaXJzdCBqdW1wIHRyaWdnZXJzIHRoZSBpbnRyby5cclxuICAgICAgICAgICAgaWYgKHRoaXMudFJleC5qdW1wQ291bnQgPT0gMSAmJiAhdGhpcy5wbGF5aW5nSW50cm8pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGxheUludHJvKCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gUHVzaCBuZXcgb2JzdGFjbGUgc2V0dGluZ3MgdG8gaG9yaXpvblxyXG4gICAgICAgICAgICBpZih0aGlzLnVudXNlZE9ic3RhY2xlcy5sZW5ndGgpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaG9yaXpvbi5wdXNoT2JzdGFjbGVzKHRoaXMudW51c2VkT2JzdGFjbGVzKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudW51c2VkT2JzdGFjbGVzID0gW107XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgLy8gVGhlIGhvcml6b24gZG9lc24ndCBtb3ZlIHVudGlsIHRoZSBpbnRybyBpcyBvdmVyLlxyXG4gICAgICAgICAgICBpZiAodGhpcy5wbGF5aW5nSW50cm8pIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuaG9yaXpvbi51cGRhdGUoMCwgdGhpcy5jdXJyZW50U3BlZWQsIGhhc09ic3RhY2xlcyk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBkZWx0YVRpbWUgPSAhdGhpcy5zdGFydGVkID8gMCA6IGRlbHRhVGltZTtcclxuICAgICAgICAgICAgICAgIHRoaXMuaG9yaXpvbi51cGRhdGUoZGVsdGFUaW1lLCB0aGlzLmN1cnJlbnRTcGVlZCwgaGFzT2JzdGFjbGVzKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8gQ2hlY2sgZm9yIGNvbGxpc2lvbnMuXHJcbiAgICAgICAgICAgIHZhciBjb2xsaXNpb24gPSBoYXNPYnN0YWNsZXMgJiZcclxuICAgICAgICAgICAgICAgIGNoZWNrRm9yQ29sbGlzaW9uKHRoaXMuaG9yaXpvbi5vYnN0YWNsZXNbMF0sIHRoaXMudFJleCk7XHJcbiAgICAgICAgICAgIGlmICghY29sbGlzaW9uKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3RhbmNlUmFuICs9IHRoaXMuY3VycmVudFNwZWVkICogZGVsdGFUaW1lIC8gdGhpcy5tc1BlckZyYW1lO1xyXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudFNwZWVkIDwgdGhpcy5jb25maWcuTUFYX1NQRUVEKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jdXJyZW50U3BlZWQgKz0gdGhpcy5jb25maWcuQUNDRUxFUkFUSU9OO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5nYW1lT3ZlcigpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICh0aGlzLmRpc3RhbmNlTWV0ZXIuZ2V0QWN0dWFsRGlzdGFuY2UodGhpcy5kaXN0YW5jZVJhbikgPlxyXG4gICAgICAgICAgICAgICAgdGhpcy5kaXN0YW5jZU1ldGVyLm1heFNjb3JlKSB7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmRpc3RhbmNlUmFuID0gMDtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgdmFyIHBsYXlBY2hlaXZlbWVudFNvdW5kID0gdGhpcy5kaXN0YW5jZU1ldGVyLnVwZGF0ZShkZWx0YVRpbWUsXHJcbiAgICAgICAgICAgICAgICBNYXRoLmNlaWwodGhpcy5kaXN0YW5jZVJhbikpO1xyXG4gICAgICAgICAgICBpZiAocGxheUFjaGVpdmVtZW50U291bmQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucGxheVNvdW5kKHRoaXMuc291bmRGeC5TQ09SRSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5lYWNoUGxheWVyKGZ1bmN0aW9uIChwbGF5ZXIsIGlzTXlzZWxmKSB7XHJcbiAgICAgICAgICAgIGlmKCFpc015c2VsZikge1xyXG4gICAgICAgICAgICAgICAgcGxheWVyLnRSZXgudXBkYXRlKGRlbHRhVGltZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgLy8gUmVuZGVyIGdhbWUgb3ZlciBwbGF5ZXJzIHRleHRcclxuICAgICAgICB2YXIgaSA9IDE7XHJcbiAgICAgICAgZm9yKHZhciBwbGF5ZXJJZCBpbiB0aGlzLmNyYXNoZWRQbGF5ZXJzKSB7XHJcbiAgICAgICAgICAgIHZhciBwbGF5ZXIgPSB0aGlzLmNyYXNoZWRQbGF5ZXJzW3BsYXllcklkXTtcclxuICAgICAgICAgICAgdGhpcy5jYW52YXNDdHguZmlsbFRleHQocGxheWVyLnRSZXgubmFtZVxyXG4gICAgICAgICAgICAgICAgKyAnIGNyYXNoZWQgYXQgJyArIHBsYXllci5tZXRlcnMgKyAnIG1ldGVycy4nLCAwLCAxMiAqIGkpO1xyXG4gICAgICAgICAgICBpKys7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoIXRoaXMuY3Jhc2hlZCkge1xyXG4gICAgICAgICAgICB0aGlzLnRSZXgudXBkYXRlKGRlbHRhVGltZSk7XHJcbiAgICAgICAgICAgIHRoaXMucmFxKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogRXZlbnQgaGFuZGxlci5cclxuICAgICAqL1xyXG4gICAgaGFuZGxlRXZlbnQ6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uKGV2dFR5cGUsIGV2ZW50cykge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGV2dFR5cGUpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgZXZlbnRzLktFWURPV046XHJcbiAgICAgICAgICAgICAgICBjYXNlIGV2ZW50cy5UT1VDSFNUQVJUOlxyXG4gICAgICAgICAgICAgICAgY2FzZSBldmVudHMuTU9VU0VET1dOOlxyXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25LZXlEb3duKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBldmVudHMuS0VZVVA6XHJcbiAgICAgICAgICAgICAgICBjYXNlIGV2ZW50cy5UT1VDSEVORDpcclxuICAgICAgICAgICAgICAgIGNhc2UgZXZlbnRzLk1PVVNFVVA6XHJcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vbktleVVwKGUpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfS5iaW5kKHRoaXMpKShlLnR5cGUsIFJ1bm5lci5ldmVudHMpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIEJpbmQgcmVsZXZhbnQga2V5IC8gbW91c2UgLyB0b3VjaCBsaXN0ZW5lcnMuXHJcbiAgICAgKi9cclxuICAgIHN0YXJ0TGlzdGVuaW5nOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAvLyBLZXlzLlxyXG4gICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoUnVubmVyLmV2ZW50cy5LRVlET1dOLCB0aGlzKTtcclxuICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuS0VZVVAsIHRoaXMpO1xyXG4gICAgICAgIGlmIChDb25zdGFudHMuSVNfTU9CSUxFKSB7XHJcbiAgICAgICAgICAgIC8vIE1vYmlsZSBvbmx5IHRvdWNoIGRldmljZXMuXHJcbiAgICAgICAgICAgIHRoaXMudG91Y2hDb250cm9sbGVyLmFkZEV2ZW50TGlzdGVuZXIoUnVubmVyLmV2ZW50cy5UT1VDSFNUQVJULCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy50b3VjaENvbnRyb2xsZXIuYWRkRXZlbnRMaXN0ZW5lcihSdW5uZXIuZXZlbnRzLlRPVUNIRU5ELCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbC5hZGRFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuVE9VQ0hTVEFSVCwgdGhpcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgLy8gTW91c2UuXHJcbiAgICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoUnVubmVyLmV2ZW50cy5NT1VTRURPV04sIHRoaXMpO1xyXG4gICAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuTU9VU0VVUCwgdGhpcyk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogUmVtb3ZlIGFsbCBsaXN0ZW5lcnMuXHJcbiAgICAgKi9cclxuICAgIHN0b3BMaXN0ZW5pbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoUnVubmVyLmV2ZW50cy5LRVlET1dOLCB0aGlzKTtcclxuICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuS0VZVVAsIHRoaXMpO1xyXG4gICAgICAgIGlmIChDb25zdGFudHMuSVNfTU9CSUxFKSB7XHJcbiAgICAgICAgICAgIHRoaXMudG91Y2hDb250cm9sbGVyLnJlbW92ZUV2ZW50TGlzdGVuZXIoUnVubmVyLmV2ZW50cy5UT1VDSFNUQVJULCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy50b3VjaENvbnRyb2xsZXIucmVtb3ZlRXZlbnRMaXN0ZW5lcihSdW5uZXIuZXZlbnRzLlRPVUNIRU5ELCB0aGlzKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbC5yZW1vdmVFdmVudExpc3RlbmVyKFJ1bm5lci5ldmVudHMuVE9VQ0hTVEFSVCwgdGhpcyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcihSdW5uZXIuZXZlbnRzLk1PVVNFRE9XTiwgdGhpcyk7XHJcbiAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoUnVubmVyLmV2ZW50cy5NT1VTRVVQLCB0aGlzKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogUHJvY2VzcyBrZXlkb3duLlxyXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxyXG4gICAgICovXHJcbiAgICBvbktleURvd246IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoIXRoaXMuY3Jhc2hlZCAmJiAoUnVubmVyLmtleWNvZGVzLkpVTVBbU3RyaW5nKGUua2V5Q29kZSldIHx8XHJcbiAgICAgICAgICAgIGUudHlwZSA9PSBSdW5uZXIuZXZlbnRzLlRPVUNIU1RBUlQpKSB7XHJcbiAgICAgICAgICAgIGlmICghdGhpcy5hY3RpdmF0ZWQpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMubG9hZFNvdW5kcygpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hY3RpdmF0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGlmICghdGhpcy50UmV4Lmp1bXBpbmcpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMuc29ja2V0LmVtaXQoJ3BsYXllci5qdW1wLnN0YXJ0Jyk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnBsYXlTb3VuZCh0aGlzLnNvdW5kRnguQlVUVE9OX1BSRVNTKTtcclxuICAgICAgICAgICAgICAgIHRoaXMudFJleC5zdGFydEp1bXAoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICBpZiAodGhpcy5jcmFzaGVkICYmIGUudHlwZSA9PSBSdW5uZXIuZXZlbnRzLlRPVUNIU1RBUlQgJiZcclxuICAgICAgICAgICAgZS5jdXJyZW50VGFyZ2V0ID09IHRoaXMuY29udGFpbmVyRWwpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXN0YXJ0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFNwZWVkIGRyb3AsIGFjdGl2YXRlZCBvbmx5IHdoZW4ganVtcCBrZXkgaXMgbm90IHByZXNzZWQuXHJcbiAgICAgICAgaWYgKFJ1bm5lci5rZXljb2Rlcy5EVUNLW2Uua2V5Q29kZV0gJiYgdGhpcy50UmV4Lmp1bXBpbmcpIHtcclxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xyXG4gICAgICAgICAgICB0aGlzLnRSZXguc2V0U3BlZWREcm9wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFByb2Nlc3Mga2V5IHVwLlxyXG4gICAgICogQHBhcmFtIHtFdmVudH0gZVxyXG4gICAgICovXHJcbiAgICBvbktleVVwOiBmdW5jdGlvbihlKSB7XHJcbiAgICAgICAgdmFyIGtleUNvZGUgPSBTdHJpbmcoZS5rZXlDb2RlKTtcclxuICAgICAgICB2YXIgaXNqdW1wS2V5ID0gUnVubmVyLmtleWNvZGVzLkpVTVBba2V5Q29kZV0gfHxcclxuICAgICAgICAgICAgZS50eXBlID09IFJ1bm5lci5ldmVudHMuVE9VQ0hFTkQgfHxcclxuICAgICAgICAgICAgZS50eXBlID09IFJ1bm5lci5ldmVudHMuTU9VU0VET1dOO1xyXG4gICAgICAgIGlmICh0aGlzLmlzUnVubmluZygpICYmIGlzanVtcEtleSkge1xyXG4gICAgICAgICAgICB0aGlzLnNvY2tldC5lbWl0KCdwbGF5ZXIuanVtcC5lbmQnKTtcclxuICAgICAgICAgICAgdGhpcy50UmV4LmVuZEp1bXAoKTtcclxuICAgICAgICB9IGVsc2UgaWYgKFJ1bm5lci5rZXljb2Rlcy5EVUNLW2tleUNvZGVdKSB7XHJcbiAgICAgICAgICAgIHRoaXMudFJleC5zcGVlZERyb3AgPSBmYWxzZTtcclxuICAgICAgICB9IGVsc2UgaWYgKHRoaXMuY3Jhc2hlZCkge1xyXG4gICAgICAgICAgICAvLyBDaGVjayB0aGF0IGVub3VnaCB0aW1lIGhhcyBlbGFwc2VkIGJlZm9yZSBhbGxvd2luZyBqdW1wIGtleSB0byByZXN0YXJ0LlxyXG4gICAgICAgICAgICB2YXIgZGVsdGFUaW1lID0gcGVyZm9ybWFuY2Uubm93KCkgLSB0aGlzLnRpbWU7XHJcbiAgICAgICAgICAgIGlmIChSdW5uZXIua2V5Y29kZXMuUkVTVEFSVFtrZXlDb2RlXSB8fFxyXG4gICAgICAgICAgICAgICAgKGUudHlwZSA9PSBSdW5uZXIuZXZlbnRzLk1PVVNFVVAgJiYgZS50YXJnZXQgPT0gdGhpcy5jYW52YXMpIHx8XHJcbiAgICAgICAgICAgICAgICAoZGVsdGFUaW1lID49IHRoaXMuY29uZmlnLkdBTUVPVkVSX0NMRUFSX1RJTUUgJiZcclxuICAgICAgICAgICAgICAgICAgICBSdW5uZXIua2V5Y29kZXMuSlVNUFtrZXlDb2RlXSkpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMucmVzdGFydCgpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfSBlbHNlIGlmICh0aGlzLnBhdXNlZCAmJiBpc2p1bXBLZXkpIHtcclxuICAgICAgICAgICAgdGhpcy5wbGF5KCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFJlcXVlc3RBbmltYXRpb25GcmFtZSB3cmFwcGVyLlxyXG4gICAgICovXHJcbiAgICByYXE6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIGlmICghdGhpcy5kcmF3UGVuZGluZykge1xyXG4gICAgICAgICAgICB0aGlzLmRyYXdQZW5kaW5nID0gdHJ1ZTtcclxuICAgICAgICAgICAgdGhpcy5yYXFJZCA9IHJlcXVlc3RBbmltYXRpb25GcmFtZSh0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBXaGV0aGVyIHRoZSBnYW1lIGlzIHJ1bm5pbmcuXHJcbiAgICAgKiBAcmV0dXJuIHtib29sZWFufVxyXG4gICAgICovXHJcbiAgICBpc1J1bm5pbmc6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHJldHVybiAhIXRoaXMucmFxSWQ7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBHYW1lIG92ZXIgc3RhdGUuXHJcbiAgICAgKi9cclxuICAgIGdhbWVPdmVyOiBmdW5jdGlvbigpIHtcclxuICAgICAgICB0aGlzLnBsYXlTb3VuZCh0aGlzLnNvdW5kRnguSElUKTtcclxuICAgICAgICB2aWJyYXRlKDIwMCk7XHJcbiAgICAgICAgdGhpcy5zdG9wKCk7XHJcbiAgICAgICAgdGhpcy5jcmFzaGVkID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmRpc3RhbmNlTWV0ZXIuYWNoZWl2ZW1lbnQgPSBmYWxzZTtcclxuXHJcbiAgICAgICAgdGhpcy50UmV4LnVwZGF0ZSgxMDAsIFRyZXguc3RhdHVzLkNSQVNIRUQpO1xyXG4gICAgICAgIC8vIEdhbWUgb3ZlciBwYW5lbC5cclxuICAgICAgICBpZiAoIXRoaXMuZ2FtZU92ZXJQYW5lbCkge1xyXG4gICAgICAgICAgICB0aGlzLmdhbWVPdmVyUGFuZWwgPSBuZXcgR2FtZU92ZXJQYW5lbCh0aGlzLmNhbnZhcyxcclxuICAgICAgICAgICAgICAgIHRoaXMuaW1hZ2VzLlRFWFRfU1BSSVRFLCB0aGlzLmltYWdlcy5SRVNUQVJULFxyXG4gICAgICAgICAgICAgICAgdGhpcy5kaW1lbnNpb25zKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLmdhbWVPdmVyUGFuZWwuZHJhdygpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBVcGRhdGUgdGhlIGhpZ2ggc2NvcmUuXHJcbiAgICAgICAgaWYgKHRoaXMuZGlzdGFuY2VSYW4gPiB0aGlzLmhpZ2hlc3RTY29yZSkge1xyXG4gICAgICAgICAgICB0aGlzLmhpZ2hlc3RTY29yZSA9IE1hdGguY2VpbCh0aGlzLmRpc3RhbmNlUmFuKTtcclxuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZU1ldGVyLnNldEhpZ2hTY29yZSh0aGlzLmhpZ2hlc3RTY29yZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFJlc2V0IHRoZSB0aW1lIGNsb2NrLlxyXG4gICAgICAgIHRoaXMudGltZSA9IHBlcmZvcm1hbmNlLm5vdygpO1xyXG4gICAgICAgIHRoaXMuc29ja2V0LmVtaXQoJ3BsYXllci5vdmVyJywgdGhpcy5kaXN0YW5jZU1ldGVyLmdldEFjdHVhbERpc3RhbmNlKHRoaXMuZGlzdGFuY2VSYW4pKTtcclxuICAgIH0sXHJcblxyXG4gICAgc3RvcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5hY3RpdmF0ZWQgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnBhdXNlZCA9IHRydWU7XHJcbiAgICAgICAgY2FuY2VsQW5pbWF0aW9uRnJhbWUodGhpcy5yYXFJZCk7XHJcbiAgICAgICAgdGhpcy5yYXFJZCA9IDA7XHJcbiAgICB9LFxyXG4gICAgcGxheTogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmNyYXNoZWQpIHtcclxuICAgICAgICAgICAgdGhpcy5hY3RpdmF0ZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnBhdXNlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLnRSZXgudXBkYXRlKDAsIFRyZXguc3RhdHVzLlJVTk5JTkcpO1xyXG4gICAgICAgICAgICB0aGlzLnRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGUoKTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG4gICAgcmVzdGFydDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLnJhcUlkKSB7XHJcbiAgICAgICAgICAgIHRoaXMucGxheUNvdW50Kys7XHJcbiAgICAgICAgICAgIHRoaXMucnVubmluZ1RpbWUgPSAwO1xyXG4gICAgICAgICAgICB0aGlzLmFjdGl2YXRlZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICB0aGlzLmNyYXNoZWQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5kaXN0YW5jZVJhbiA9IDA7XHJcbiAgICAgICAgICAgIHRoaXMuc2V0U3BlZWQodGhpcy5jb25maWcuU1BFRUQpO1xyXG4gICAgICAgICAgICB0aGlzLnRpbWUgPSBwZXJmb3JtYW5jZS5ub3coKTtcclxuICAgICAgICAgICAgdGhpcy5jb250YWluZXJFbC5jbGFzc0xpc3QucmVtb3ZlKFJ1bm5lci5jbGFzc2VzLkNSQVNIRUQpO1xyXG4gICAgICAgICAgICB0aGlzLmNsZWFyQ2FudmFzKCk7XHJcbiAgICAgICAgICAgIHRoaXMuZGlzdGFuY2VNZXRlci5yZXNldCh0aGlzLmhpZ2hlc3RTY29yZSk7XHJcbiAgICAgICAgICAgIHRoaXMuaG9yaXpvbi5yZXNldCgpO1xyXG4gICAgICAgICAgICB0aGlzLnRSZXgucmVzZXQoKTtcclxuICAgICAgICAgICAgdGhpcy5wbGF5U291bmQodGhpcy5zb3VuZEZ4LkJVVFRPTl9QUkVTUyk7XHJcblxyXG4gICAgICAgICAgICB0aGlzLnVwZGF0ZSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFBhdXNlIHRoZSBnYW1lIGlmIHRoZSB0YWIgaXMgbm90IGluIGZvY3VzLlxyXG4gICAgICovXHJcbiAgICBvblZpc2liaWxpdHlDaGFuZ2U6IGZ1bmN0aW9uKGUpIHtcclxuICAgICAgICBpZiAoZG9jdW1lbnQuaGlkZGVuIHx8IGRvY3VtZW50LndlYmtpdEhpZGRlbiB8fCBlLnR5cGUgPT0gJ2JsdXInKSB7XHJcbiAgICAgICAgICAgIHRoaXMuc3RvcCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMucGxheSgpO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFBsYXkgYSBzb3VuZC5cclxuICAgICAqIEBwYXJhbSB7U291bmRCdWZmZXJ9IHNvdW5kQnVmZmVyXHJcbiAgICAgKi9cclxuICAgIHBsYXlTb3VuZDogZnVuY3Rpb24oc291bmRCdWZmZXIpIHtcclxuICAgICAgICBpZiAoc291bmRCdWZmZXIpIHtcclxuICAgICAgICAgICAgdmFyIHNvdXJjZU5vZGUgPSB0aGlzLmF1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICAgICAgICAgICAgc291cmNlTm9kZS5idWZmZXIgPSBzb3VuZEJ1ZmZlcjtcclxuICAgICAgICAgICAgc291cmNlTm9kZS5jb25uZWN0KHRoaXMuYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcclxuICAgICAgICAgICAgc291cmNlTm9kZS5zdGFydCgwKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogVXBkYXRlcyB0aGUgY2FudmFzIHNpemUgdGFraW5nIGludG9cclxuICogYWNjb3VudCB0aGUgYmFja2luZyBzdG9yZSBwaXhlbCByYXRpbyBhbmRcclxuICogdGhlIGRldmljZSBwaXhlbCByYXRpby5cclxuICpcclxuICogU2VlIGFydGljbGUgYnkgUGF1bCBMZXdpczpcclxuICogaHR0cDovL3d3dy5odG1sNXJvY2tzLmNvbS9lbi90dXRvcmlhbHMvY2FudmFzL2hpZHBpL1xyXG4gKlxyXG4gKiBAcGFyYW0ge0hUTUxDYW52YXNFbGVtZW50fSBjYW52YXNcclxuICogQHBhcmFtIHtudW1iZXJ9IG9wdF93aWR0aFxyXG4gKiBAcGFyYW0ge251bWJlcn0gb3B0X2hlaWdodFxyXG4gKiBAcmV0dXJuIHtib29sZWFufSBXaGV0aGVyIHRoZSBjYW52YXMgd2FzIHNjYWxlZC5cclxuICovXHJcblJ1bm5lci51cGRhdGVDYW52YXNTY2FsaW5nID0gZnVuY3Rpb24oY2FudmFzLCBvcHRfd2lkdGgsIG9wdF9oZWlnaHQpIHtcclxuICAgIHZhciBjb250ZXh0ID0gY2FudmFzLmdldENvbnRleHQoJzJkJyk7XHJcbiAgICAvLyBRdWVyeSB0aGUgdmFyaW91cyBwaXhlbCByYXRpb3NcclxuICAgIHZhciBkZXZpY2VQaXhlbFJhdGlvID0gTWF0aC5mbG9vcih3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbykgfHwgMTtcclxuICAgIHZhciBiYWNraW5nU3RvcmVSYXRpbyA9IE1hdGguZmxvb3IoY29udGV4dC53ZWJraXRCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8XHJcbiAgICAgICAgY29udGV4dC5tb3pCYWNraW5nU3RvcmVQaXhlbFJhdGlvIHx8IGNvbnRleHQuYmFja2luZ1N0b3JlUGl4ZWxSYXRpbykgfHwgMTtcclxuICAgIHZhciByYXRpbyA9IGRldmljZVBpeGVsUmF0aW8gLyBiYWNraW5nU3RvcmVSYXRpbztcclxuICAgIC8vIFVwc2NhbGUgdGhlIGNhbnZhcyBpZiB0aGUgdHdvIHJhdGlvcyBkb24ndCBtYXRjaFxyXG4gICAgaWYgKGRldmljZVBpeGVsUmF0aW8gIT09IGJhY2tpbmdTdG9yZVJhdGlvKSB7XHJcbiAgICAgICAgdmFyIG9sZFdpZHRoID0gb3B0X3dpZHRoIHx8IGNhbnZhcy53aWR0aDtcclxuICAgICAgICB2YXIgb2xkSGVpZ2h0ID0gb3B0X2hlaWdodCB8fCBjYW52YXMuaGVpZ2h0O1xyXG5cclxuICAgICAgICBjYW52YXMud2lkdGggPSBvbGRXaWR0aCAqIHJhdGlvO1xyXG4gICAgICAgIGNhbnZhcy5oZWlnaHQgPSBvbGRIZWlnaHQgKiByYXRpbztcclxuICAgICAgICBjYW52YXMuc3R5bGUud2lkdGggPSBvbGRXaWR0aCArICdweCc7XHJcbiAgICAgICAgY2FudmFzLnN0eWxlLmhlaWdodCA9IG9sZEhlaWdodCArICdweCc7XHJcbiAgICAgICAgLy8gU2NhbGUgdGhlIGNvbnRleHQgdG8gY291bnRlciB0aGUgZmFjdCB0aGF0IHdlJ3ZlIG1hbnVhbGx5IHNjYWxlZFxyXG4gICAgICAgIC8vIG91ciBjYW52YXMgZWxlbWVudC5cclxuICAgICAgICBjb250ZXh0LnNjYWxlKHJhdGlvLCByYXRpbyk7XHJcbiAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFJ1bm5lcjsiLCJ2YXIgQ29uc3RhbnRzID0gcmVxdWlyZSgnLi9Db25zdGFudHMnKTtcclxudmFyIElPID0gcmVxdWlyZSgnLi4vbGliL3NvY2tldC5pby5qcycpO1xyXG5cclxudmFyIHNvY2tldCA9IG5ldyBJTygpO1xyXG52YXIgU2VydmVyID0ge307XHJcblxyXG5TZXJ2ZXIuY29ubmVjdGVkID0gZnVuY3Rpb24gKGNhbGxiYWNrKSB7XHJcbiAgICBzb2NrZXQuZW1pdCgnY2xpZW50LmNvbm5lY3QnKTtcclxuICAgIGNhbGxiYWNrKHNvY2tldCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU2VydmVyOyIsInZhciBDb25zdGFudHMgPSByZXF1aXJlKCcuL0NvbnN0YW50cycpO1xyXG52YXIgQ29sbGlzaW9uQm94ID0gcmVxdWlyZSgnLi9Db2xsaXNpb25Cb3gnKTtcclxuXHJcbi8qKlxyXG4gKiBULXJleCBnYW1lIGNoYXJhY3Rlci5cclxuICogQHBhcmFtIHtIVE1MQ2FudmFzfSBjYW52YXNcclxuICogQHBhcmFtIHtIVE1MSW1hZ2V9IGltYWdlIENoYXJhY3RlciBpbWFnZS5cclxuICogQGNvbnN0cnVjdG9yXHJcbiAqL1xyXG5mdW5jdGlvbiBUcmV4KGNhbnZhcywgaW1hZ2UsIG9wYWNpdHksIG5hbWUpIHtcclxuICAgIHRoaXMuY2FudmFzID0gY2FudmFzO1xyXG4gICAgdGhpcy5vcGFjaXR5ID0gb3BhY2l0eTtcclxuICAgIHRoaXMubmFtZSA9IG5hbWUgPyBuYW1lLnN1YnN0cmluZygwLCA2KSA6ICcnO1xyXG4gICAgdGhpcy5jYW52YXNDdHggPSBjYW52YXMuZ2V0Q29udGV4dCgnMmQnKTtcclxuICAgIHRoaXMuaW1hZ2UgPSBpbWFnZTtcclxuICAgIHRoaXMueFBvcyA9IDA7XHJcbiAgICB0aGlzLnlQb3MgPSAwO1xyXG4gICAgLy8gUG9zaXRpb24gd2hlbiBvbiB0aGUgZ3JvdW5kLlxyXG4gICAgdGhpcy5ncm91bmRZUG9zID0gMDtcclxuICAgIHRoaXMuY3VycmVudEZyYW1lID0gMDtcclxuICAgIHRoaXMuY3VycmVudEFuaW1GcmFtZXMgPSBbXTtcclxuICAgIHRoaXMuYmxpbmtEZWxheSA9IDA7XHJcbiAgICB0aGlzLmFuaW1TdGFydFRpbWUgPSAwO1xyXG4gICAgdGhpcy50aW1lciA9IDA7XHJcbiAgICB0aGlzLm1zUGVyRnJhbWUgPSAxMDAwIC8gQ29uc3RhbnRzLkZQUztcclxuICAgIHRoaXMuY29uZmlnID0gVHJleC5jb25maWc7XHJcbiAgICAvLyBDdXJyZW50IHN0YXR1cy5cclxuICAgIHRoaXMuc3RhdHVzID0gVHJleC5zdGF0dXMuV0FJVElORztcclxuICAgIHRoaXMuanVtcGluZyA9IGZhbHNlO1xyXG4gICAgdGhpcy5qdW1wVmVsb2NpdHkgPSAwO1xyXG4gICAgdGhpcy5yZWFjaGVkTWluSGVpZ2h0ID0gZmFsc2U7XHJcbiAgICB0aGlzLnNwZWVkRHJvcCA9IGZhbHNlO1xyXG4gICAgdGhpcy5qdW1wQ291bnQgPSAwO1xyXG4gICAgdGhpcy5qdW1wc3BvdFggPSAwO1xyXG5cclxuICAgIHRoaXMuaW5pdCgpO1xyXG59O1xyXG4vKipcclxuICogVC1yZXggcGxheWVyIGNvbmZpZy5cclxuICogQGVudW0ge251bWJlcn1cclxuICovXHJcblRyZXguY29uZmlnID0ge1xyXG4gICAgRFJPUF9WRUxPQ0lUWTogLTUsXHJcbiAgICBHUkFWSVRZOiAwLjYsXHJcbiAgICBIRUlHSFQ6IDQ3LFxyXG4gICAgSU5JSVRBTF9KVU1QX1ZFTE9DSVRZOiAtMTAsXHJcbiAgICBJTlRST19EVVJBVElPTjogMTUwMCxcclxuICAgIE1BWF9KVU1QX0hFSUdIVDogMzAsXHJcbiAgICBNSU5fSlVNUF9IRUlHSFQ6IDMwLFxyXG4gICAgU1BFRURfRFJPUF9DT0VGRklDSUVOVDogMyxcclxuICAgIFNQUklURV9XSURUSDogMjYyLFxyXG4gICAgU1RBUlRfWF9QT1M6IDUwLFxyXG4gICAgV0lEVEg6IDQ0XHJcbn07XHJcblxyXG4vKipcclxuICogVXNlZCBpbiBjb2xsaXNpb24gZGV0ZWN0aW9uLlxyXG4gKiBAdHlwZSB7QXJyYXkuPENvbGxpc2lvbkJveD59XHJcbiAqL1xyXG5UcmV4LmNvbGxpc2lvbkJveGVzID0gW1xyXG4gICAgbmV3IENvbGxpc2lvbkJveCgxLCAtMSwgMzAsIDI2KSxcclxuICAgIG5ldyBDb2xsaXNpb25Cb3goMzIsIDAsIDgsIDE2KSxcclxuICAgIG5ldyBDb2xsaXNpb25Cb3goMTAsIDM1LCAxNCwgOCksXHJcbiAgICBuZXcgQ29sbGlzaW9uQm94KDEsIDI0LCAyOSwgNSksXHJcbiAgICBuZXcgQ29sbGlzaW9uQm94KDUsIDMwLCAyMSwgNCksXHJcbiAgICBuZXcgQ29sbGlzaW9uQm94KDksIDM0LCAxNSwgNClcclxuXTtcclxuLyoqXHJcbiAqIEFuaW1hdGlvbiBzdGF0ZXMuXHJcbiAqIEBlbnVtIHtzdHJpbmd9XHJcbiAqL1xyXG5UcmV4LnN0YXR1cyA9IHtcclxuICAgIENSQVNIRUQ6ICdDUkFTSEVEJyxcclxuICAgIEpVTVBJTkc6ICdKVU1QSU5HJyxcclxuICAgIFJVTk5JTkc6ICdSVU5OSU5HJyxcclxuICAgIFdBSVRJTkc6ICdXQUlUSU5HJ1xyXG59O1xyXG4vKipcclxuICogQmxpbmtpbmcgY29lZmZpY2llbnQuXHJcbiAqIEBjb25zdFxyXG4gKi9cclxuVHJleC5CTElOS19USU1JTkcgPSA3MDAwO1xyXG5cclxuLyoqXHJcbiAqIEFuaW1hdGlvbiBjb25maWcgZm9yIGRpZmZlcmVudCBzdGF0ZXMuXHJcbiAqIEBlbnVtIHtvYmplY3R9XHJcbiAqL1xyXG5UcmV4LmFuaW1GcmFtZXMgPSB7XHJcbiAgICBXQUlUSU5HOiB7XHJcbiAgICAgICAgZnJhbWVzOiBbNDQsIDBdLFxyXG4gICAgICAgIG1zUGVyRnJhbWU6IDEwMDAgLyAzXHJcbiAgICB9LFxyXG4gICAgUlVOTklORzoge1xyXG4gICAgICAgIGZyYW1lczogWzg4LCAxMzJdLFxyXG4gICAgICAgIG1zUGVyRnJhbWU6IDEwMDAgLyAxMlxyXG4gICAgfSxcclxuICAgIENSQVNIRUQ6IHtcclxuICAgICAgICBmcmFtZXM6IFsyMjBdLFxyXG4gICAgICAgIG1zUGVyRnJhbWU6IDEwMDAgLyA2MFxyXG4gICAgfSxcclxuICAgIEpVTVBJTkc6IHtcclxuICAgICAgICBmcmFtZXM6IFswXSxcclxuICAgICAgICBtc1BlckZyYW1lOiAxMDAwIC8gNjBcclxuICAgIH1cclxufTtcclxuVHJleC5wcm90b3R5cGUgPSB7XHJcbiAgICAvKipcclxuICAgICAqIFQtcmV4IHBsYXllciBpbml0YWxpc2VyLlxyXG4gICAgICogU2V0cyB0aGUgdC1yZXggdG8gYmxpbmsgYXQgcmFuZG9tIGludGVydmFscy5cclxuICAgICAqL1xyXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy5ibGlua0RlbGF5ID0gdGhpcy5zZXRCbGlua0RlbGF5KCk7XHJcbiAgICAgICAgdGhpcy5ncm91bmRZUG9zID0gQ29uc3RhbnRzLkRFRkFVTFRfSEVJR0hUIC0gdGhpcy5jb25maWcuSEVJR0hUIC1cclxuICAgICAgICAgICAgQ29uc3RhbnRzLkJPVFRPTV9QQUQ7XHJcbiAgICAgICAgdGhpcy55UG9zID0gdGhpcy5ncm91bmRZUG9zO1xyXG4gICAgICAgIHRoaXMubWluSnVtcEhlaWdodCA9IHRoaXMuZ3JvdW5kWVBvcyAtIHRoaXMuY29uZmlnLk1JTl9KVU1QX0hFSUdIVDtcclxuXHJcbiAgICAgICAgdGhpcy5kcmF3KDAsIDApO1xyXG4gICAgICAgIHRoaXMudXBkYXRlKDAsIFRyZXguc3RhdHVzLldBSVRJTkcpO1xyXG4gICAgfSxcclxuICAgIHNldE5hbWU6IGZ1bmN0aW9uIChuYW1lKSB7XHJcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZSA/IG5hbWUuc3Vic3RyaW5nKDAsIDYpIDogJyc7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXR0ZXIgZm9yIHRoZSBqdW1wIHZlbG9jaXR5LlxyXG4gICAgICogVGhlIGFwcHJvcmlhdGUgZHJvcCB2ZWxvY2l0eSBpcyBhbHNvIHNldC5cclxuICAgICAqL1xyXG4gICAgc2V0SnVtcFZlbG9jaXR5OiBmdW5jdGlvbihzZXR0aW5nKSB7XHJcbiAgICAgICAgdGhpcy5jb25maWcuSU5JSVRBTF9KVU1QX1ZFTE9DSVRZID0gLXNldHRpbmc7XHJcbiAgICAgICAgdGhpcy5jb25maWcuRFJPUF9WRUxPQ0lUWSA9IC1zZXR0aW5nIC8gMjtcclxuICAgIH0sXHJcbiAgICAvKipcclxuICAgICAqIFNldCB0aGUgYW5pbWF0aW9uIHN0YXR1cy5cclxuICAgICAqIEBwYXJhbSB7IW51bWJlcn0gZGVsdGFUaW1lXHJcbiAgICAgKiBAcGFyYW0ge1RyZXguc3RhdHVzfSBzdGF0dXMgT3B0aW9uYWwgc3RhdHVzIHRvIHN3aXRjaCB0by5cclxuICAgICAqL1xyXG4gICAgdXBkYXRlOiBmdW5jdGlvbihkZWx0YVRpbWUsIG9wdF9zdGF0dXMpIHtcclxuICAgICAgICB0aGlzLnRpbWVyICs9IGRlbHRhVGltZTtcclxuICAgICAgICAvLyBVcGRhdGUgdGhlIHN0YXR1cy5cclxuICAgICAgICBpZiAob3B0X3N0YXR1cykge1xyXG4gICAgICAgICAgICB0aGlzLnN0YXR1cyA9IG9wdF9zdGF0dXM7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEZyYW1lID0gMDtcclxuICAgICAgICAgICAgdGhpcy5tc1BlckZyYW1lID0gVHJleC5hbmltRnJhbWVzW29wdF9zdGF0dXNdLm1zUGVyRnJhbWU7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1GcmFtZXMgPSBUcmV4LmFuaW1GcmFtZXNbb3B0X3N0YXR1c10uZnJhbWVzO1xyXG5cclxuICAgICAgICAgICAgaWYgKG9wdF9zdGF0dXMgPT0gVHJleC5zdGF0dXMuV0FJVElORykge1xyXG4gICAgICAgICAgICAgICAgdGhpcy5hbmltU3RhcnRUaW1lID0gcGVyZm9ybWFuY2Uubm93KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLnNldEJsaW5rRGVsYXkoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBHYW1lIGludHJvIGFuaW1hdGlvbiwgVC1yZXggbW92ZXMgaW4gZnJvbSB0aGUgbGVmdC5cclxuICAgICAgICBpZiAodGhpcy5wbGF5aW5nSW50cm8gJiYgdGhpcy54UG9zIDwgdGhpcy5jb25maWcuU1RBUlRfWF9QT1MpIHtcclxuICAgICAgICAgICAgdGhpcy54UG9zICs9IE1hdGgucm91bmQoKHRoaXMuY29uZmlnLlNUQVJUX1hfUE9TIC9cclxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLklOVFJPX0RVUkFUSU9OKSAqIGRlbHRhVGltZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0aGlzLnN0YXR1cyA9PSBUcmV4LnN0YXR1cy5XQUlUSU5HKSB7XHJcbiAgICAgICAgICAgIHRoaXMuYmxpbmsocGVyZm9ybWFuY2Uubm93KCkpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIHRoaXMuZHJhdyh0aGlzLmN1cnJlbnRBbmltRnJhbWVzW3RoaXMuY3VycmVudEZyYW1lXSwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFVwZGF0ZSB0aGUgZnJhbWUgcG9zaXRpb24uXHJcbiAgICAgICAgaWYgKHRoaXMudGltZXIgPj0gdGhpcy5tc1BlckZyYW1lKSB7XHJcbiAgICAgICAgICAgIHRoaXMuY3VycmVudEZyYW1lID0gdGhpcy5jdXJyZW50RnJhbWUgPT1cclxuICAgICAgICAgICAgICAgIHRoaXMuY3VycmVudEFuaW1GcmFtZXMubGVuZ3RoIC0gMSA/IDAgOiB0aGlzLmN1cnJlbnRGcmFtZSArIDE7XHJcbiAgICAgICAgICAgIHRoaXMudGltZXIgPSAwO1xyXG4gICAgICAgIH1cclxuICAgIH0sXHJcblxyXG4gICAgLyoqXHJcbiAgICAgKiBEcmF3IHRoZSB0LXJleCB0byBhIHBhcnRpY3VsYXIgcG9zaXRpb24uXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0geFxyXG4gICAgICogQHBhcmFtIHtudW1iZXJ9IHlcclxuICAgICAqL1xyXG4gICAgZHJhdzogZnVuY3Rpb24oeCwgeSkge1xyXG4gICAgICAgIHZhciBzb3VyY2VYID0geDtcclxuICAgICAgICB2YXIgc291cmNlWSA9IHk7XHJcbiAgICAgICAgdmFyIHNvdXJjZVdpZHRoID0gdGhpcy5jb25maWcuV0lEVEg7XHJcbiAgICAgICAgdmFyIHNvdXJjZUhlaWdodCA9IHRoaXMuY29uZmlnLkhFSUdIVDtcclxuICAgICAgICBpZiAoQ29uc3RhbnRzLklTX0hJRFBJKSB7XHJcbiAgICAgICAgICAgIHNvdXJjZVggKj0gMjtcclxuICAgICAgICAgICAgc291cmNlWSAqPSAyO1xyXG4gICAgICAgICAgICBzb3VyY2VXaWR0aCAqPSAyO1xyXG4gICAgICAgICAgICBzb3VyY2VIZWlnaHQgKj0gMjtcclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5jYW52YXNDdHguZ2xvYmFsQWxwaGEgPSB0aGlzLm9wYWNpdHkgfHwgMTtcclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5maWxsVGV4dCAodGhpcy5uYW1lLCB0aGlzLnhQb3MsIHRoaXMueVBvcyk7XHJcbiAgICAgICAgdGhpcy5jYW52YXNDdHguZHJhd0ltYWdlKHRoaXMuaW1hZ2UsIHNvdXJjZVgsIHNvdXJjZVksXHJcbiAgICAgICAgICAgIHNvdXJjZVdpZHRoLCBzb3VyY2VIZWlnaHQsXHJcbiAgICAgICAgICAgIHRoaXMueFBvcywgdGhpcy55UG9zLFxyXG4gICAgICAgICAgICB0aGlzLmNvbmZpZy5XSURUSCwgdGhpcy5jb25maWcuSEVJR0hUKTtcclxuICAgICAgICB0aGlzLmNhbnZhc0N0eC5nbG9iYWxBbHBoYSA9IDE7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBTZXRzIGEgcmFuZG9tIHRpbWUgZm9yIHRoZSBibGluayB0byBoYXBwZW4uXHJcbiAgICAgKi9cclxuICAgIHNldEJsaW5rRGVsYXk6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuYmxpbmtEZWxheSA9IE1hdGguY2VpbChNYXRoLnJhbmRvbSgpICogVHJleC5CTElOS19USU1JTkcpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIE1ha2UgdC1yZXggYmxpbmsgYXQgcmFuZG9tIGludGVydmFscy5cclxuICAgICAqIEBwYXJhbSB7bnVtYmVyfSB0aW1lIEN1cnJlbnQgdGltZSBpbiBtaWxsaXNlY29uZHMuXHJcbiAgICAgKi9cclxuICAgIGJsaW5rOiBmdW5jdGlvbih0aW1lKSB7XHJcbiAgICAgICAgdmFyIGRlbHRhVGltZSA9IHRpbWUgLSB0aGlzLmFuaW1TdGFydFRpbWU7XHJcbiAgICAgICAgaWYgKGRlbHRhVGltZSA+PSB0aGlzLmJsaW5rRGVsYXkpIHtcclxuICAgICAgICAgICAgdGhpcy5kcmF3KHRoaXMuY3VycmVudEFuaW1GcmFtZXNbdGhpcy5jdXJyZW50RnJhbWVdLCAwKTtcclxuICAgICAgICAgICAgaWYgKHRoaXMuY3VycmVudEZyYW1lID09IDEpIHtcclxuICAgICAgICAgICAgICAgIC8vIFNldCBuZXcgcmFuZG9tIGRlbGF5IHRvIGJsaW5rLlxyXG4gICAgICAgICAgICAgICAgdGhpcy5zZXRCbGlua0RlbGF5KCk7XHJcbiAgICAgICAgICAgICAgICB0aGlzLmFuaW1TdGFydFRpbWUgPSB0aW1lO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogSW5pdGlhbGlzZSBhIGp1bXAuXHJcbiAgICAgKi9cclxuICAgIHN0YXJ0SnVtcDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKCF0aGlzLmp1bXBpbmcpIHtcclxuICAgICAgICAgICAgdGhpcy51cGRhdGUoMCwgVHJleC5zdGF0dXMuSlVNUElORyk7XHJcbiAgICAgICAgICAgIHRoaXMuanVtcFZlbG9jaXR5ID0gdGhpcy5jb25maWcuSU5JSVRBTF9KVU1QX1ZFTE9DSVRZO1xyXG4gICAgICAgICAgICB0aGlzLmp1bXBpbmcgPSB0cnVlO1xyXG4gICAgICAgICAgICB0aGlzLnJlYWNoZWRNaW5IZWlnaHQgPSBmYWxzZTtcclxuICAgICAgICAgICAgdGhpcy5zcGVlZERyb3AgPSBmYWxzZTtcclxuICAgICAgICB9XHJcbiAgICB9LFxyXG5cclxuICAgIC8qKlxyXG4gICAgICogSnVtcCBpcyBjb21wbGV0ZSwgZmFsbGluZyBkb3duLlxyXG4gICAgICovXHJcbiAgICBlbmRKdW1wOiBmdW5jdGlvbigpIHtcclxuICAgICAgICBpZiAodGhpcy5yZWFjaGVkTWluSGVpZ2h0ICYmXHJcbiAgICAgICAgICAgIHRoaXMuanVtcFZlbG9jaXR5IDwgdGhpcy5jb25maWcuRFJPUF9WRUxPQ0lUWSkge1xyXG4gICAgICAgICAgICB0aGlzLmp1bXBWZWxvY2l0eSA9IHRoaXMuY29uZmlnLkRST1BfVkVMT0NJVFk7XHJcbiAgICAgICAgfVxyXG4gICAgfSxcclxuICAgIC8qKlxyXG4gICAgICogVXBkYXRlIGZyYW1lIGZvciBhIGp1bXAuXHJcbiAgICAgKiBAcGFyYW0ge251bWJlcn0gZGVsdGFUaW1lXHJcbiAgICAgKi9cclxuICAgIHVwZGF0ZUp1bXA6IGZ1bmN0aW9uKGRlbHRhVGltZSkge1xyXG4gICAgICAgIHZhciBtc1BlckZyYW1lID0gVHJleC5hbmltRnJhbWVzW3RoaXMuc3RhdHVzXS5tc1BlckZyYW1lO1xyXG4gICAgICAgIHZhciBmcmFtZXNFbGFwc2VkID0gZGVsdGFUaW1lIC8gbXNQZXJGcmFtZTtcclxuICAgICAgICAvLyBTcGVlZCBkcm9wIG1ha2VzIFRyZXggZmFsbCBmYXN0ZXIuXHJcbiAgICAgICAgaWYgKHRoaXMuc3BlZWREcm9wKSB7XHJcbiAgICAgICAgICAgIHRoaXMueVBvcyArPSBNYXRoLnJvdW5kKHRoaXMuanVtcFZlbG9jaXR5ICpcclxuICAgICAgICAgICAgICAgIHRoaXMuY29uZmlnLlNQRUVEX0RST1BfQ09FRkZJQ0lFTlQgKiBmcmFtZXNFbGFwc2VkKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLnlQb3MgKz0gTWF0aC5yb3VuZCh0aGlzLmp1bXBWZWxvY2l0eSAqIGZyYW1lc0VsYXBzZWQpO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLmp1bXBWZWxvY2l0eSArPSB0aGlzLmNvbmZpZy5HUkFWSVRZICogZnJhbWVzRWxhcHNlZDtcclxuXHJcbiAgICAgICAgLy8gTWluaW11bSBoZWlnaHQgaGFzIGJlZW4gcmVhY2hlZC5cclxuICAgICAgICBpZiAodGhpcy55UG9zIDwgdGhpcy5taW5KdW1wSGVpZ2h0IHx8IHRoaXMuc3BlZWREcm9wKSB7XHJcbiAgICAgICAgICAgIHRoaXMucmVhY2hlZE1pbkhlaWdodCA9IHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFJlYWNoZWQgbWF4IGhlaWdodFxyXG4gICAgICAgIGlmICh0aGlzLnlQb3MgPCB0aGlzLmNvbmZpZy5NQVhfSlVNUF9IRUlHSFQgfHwgdGhpcy5zcGVlZERyb3ApIHtcclxuICAgICAgICAgICAgdGhpcy5lbmRKdW1wKCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIEJhY2sgZG93biBhdCBncm91bmQgbGV2ZWwuIEp1bXAgY29tcGxldGVkLlxyXG4gICAgICAgIGlmICh0aGlzLnlQb3MgPiB0aGlzLmdyb3VuZFlQb3MpIHtcclxuICAgICAgICAgICAgdGhpcy5yZXNldCgpO1xyXG4gICAgICAgICAgICB0aGlzLmp1bXBDb3VudCsrO1xyXG4gICAgICAgIH1cclxuICAgICAgICB0aGlzLnVwZGF0ZShkZWx0YVRpbWUpO1xyXG4gICAgfSxcclxuXHJcbiAgICAvKipcclxuICAgICAqIFNldCB0aGUgc3BlZWQgZHJvcC4gSW1tZWRpYXRlbHkgY2FuY2VscyB0aGUgY3VycmVudCBqdW1wLlxyXG4gICAgICovXHJcbiAgICBzZXRTcGVlZERyb3A6IGZ1bmN0aW9uKCkge1xyXG4gICAgICAgIHRoaXMuc3BlZWREcm9wID0gdHJ1ZTtcclxuICAgICAgICB0aGlzLmp1bXBWZWxvY2l0eSA9IDE7XHJcbiAgICB9LFxyXG4gICAgLyoqXHJcbiAgICAgKiBSZXNldCB0aGUgdC1yZXggdG8gcnVubmluZyBhdCBzdGFydCBvZiBnYW1lLlxyXG4gICAgICovXHJcbiAgICByZXNldDogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgdGhpcy55UG9zID0gdGhpcy5ncm91bmRZUG9zO1xyXG4gICAgICAgIHRoaXMuanVtcFZlbG9jaXR5ID0gMDtcclxuICAgICAgICB0aGlzLmp1bXBpbmcgPSBmYWxzZTtcclxuICAgICAgICB0aGlzLnVwZGF0ZSgwLCBUcmV4LnN0YXR1cy5SVU5OSU5HKTtcclxuICAgICAgICB0aGlzLm1pZGFpciA9IGZhbHNlO1xyXG4gICAgICAgIHRoaXMuc3BlZWREcm9wID0gZmFsc2U7XHJcbiAgICAgICAgdGhpcy5qdW1wQ291bnQgPSAwO1xyXG4gICAgfVxyXG59O1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBUcmV4OyIsInZhciBVdGlscyA9IHt9O1xyXG4vKipcclxuICogRHJhdyB0aGUgY29sbGlzaW9uIGJveGVzIGZvciBkZWJ1Zy5cclxuICovXHJcblV0aWxzLmRyYXdDb2xsaXNpb25Cb3hlcyA9IGZ1bmN0aW9uIChjYW52YXNDdHgsIHRSZXhCb3gsIG9ic3RhY2xlQm94KSB7XHJcbiAgICBjYW52YXNDdHguc2F2ZSgpO1xyXG4gICAgY2FudmFzQ3R4LnN0cm9rZVN0eWxlID0gJyNmMDAnO1xyXG4gICAgY2FudmFzQ3R4LnN0cm9rZVJlY3QodFJleEJveC54LCB0UmV4Qm94LnksXHJcbiAgICAgICAgdFJleEJveC53aWR0aCwgdFJleEJveC5oZWlnaHQpO1xyXG4gICAgY2FudmFzQ3R4LnN0cm9rZVN0eWxlID0gJyMwZjAnO1xyXG4gICAgY2FudmFzQ3R4LnN0cm9rZVJlY3Qob2JzdGFjbGVCb3gueCwgb2JzdGFjbGVCb3gueSxcclxuICAgICAgICBvYnN0YWNsZUJveC53aWR0aCwgb2JzdGFjbGVCb3guaGVpZ2h0KTtcclxuICAgIGNhbnZhc0N0eC5yZXN0b3JlKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogR2V0IHJhbmRvbSBudW1iZXIuXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSBtaW5cclxuICogQHBhcmFtIHtudW1iZXJ9IG1heFxyXG4gKiBAcGFyYW0ge251bWJlcn1cclxuICovXHJcblV0aWxzLmdldFJhbmRvbU51bSA9IGZ1bmN0aW9uIChtaW4sIG1heCkge1xyXG4gICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChtYXggLSBtaW4gKyAxKSkgKyBtaW47XHJcbn1cclxuLyoqXHJcbiAqIERlY29kZXMgdGhlIGJhc2UgNjQgYXVkaW8gdG8gQXJyYXlCdWZmZXIgdXNlZCBieSBXZWIgQXVkaW8uXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBiYXNlNjRTdHJpbmdcclxuICovXHJcblV0aWxzLmRlY29kZUJhc2U2NFRvQXJyYXlCdWZmZXIgPSBmdW5jdGlvbiAoYmFzZTY0U3RyaW5nKSB7XHJcbiAgICB2YXIgbGVuID0gKGJhc2U2NFN0cmluZy5sZW5ndGggLyA0KSAqIDM7XHJcbiAgICB2YXIgc3RyID0gYXRvYihiYXNlNjRTdHJpbmcpO1xyXG4gICAgdmFyIGFycmF5QnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGxlbik7XHJcbiAgICB2YXIgYnl0ZXMgPSBuZXcgVWludDhBcnJheShhcnJheUJ1ZmZlcik7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgIGJ5dGVzW2ldID0gc3RyLmNoYXJDb2RlQXQoaSk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gYnl0ZXMuYnVmZmVyO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFV0aWxzOyIsInZhciBSdW5uZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvUnVubmVyJyk7XHJcbnZhciBzZXJ2ZXIgPSByZXF1aXJlKCcuL2NvbXBvbmVudHMvU2VydmVyJyk7XHJcblxyXG5zZXJ2ZXIuY29ubmVjdGVkKGZ1bmN0aW9uIChzb2NrZXQpIHtcclxuICB2YXIgcnVubmVyID0gbmV3IFJ1bm5lcignLmludGVyc3RpdGlhbC13cmFwcGVyJyk7XHJcbiAgcnVubmVyLmJpbmQoc29ja2V0KTtcclxufSk7IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0YXJnZXQsIGZpcnN0U291cmNlKSB7XHJcbiAgXCJ1c2Ugc3RyaWN0XCI7XHJcbiAgaWYgKHRhcmdldCA9PT0gdW5kZWZpbmVkIHx8IHRhcmdldCA9PT0gbnVsbClcclxuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJDYW5ub3QgY29udmVydCBmaXJzdCBhcmd1bWVudCB0byBvYmplY3RcIik7XHJcbiAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XHJcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2ldO1xyXG4gICAgaWYgKG5leHRTb3VyY2UgPT09IHVuZGVmaW5lZCB8fCBuZXh0U291cmNlID09PSBudWxsKSBjb250aW51ZTtcclxuICAgIHZhciBrZXlzQXJyYXkgPSBPYmplY3Qua2V5cyhPYmplY3QobmV4dFNvdXJjZSkpO1xyXG4gICAgZm9yICh2YXIgbmV4dEluZGV4ID0gMCwgbGVuID0ga2V5c0FycmF5Lmxlbmd0aDsgbmV4dEluZGV4IDwgbGVuOyBuZXh0SW5kZXgrKykge1xyXG4gICAgICB2YXIgbmV4dEtleSA9IGtleXNBcnJheVtuZXh0SW5kZXhdO1xyXG4gICAgICB2YXIgZGVzYyA9IE9iamVjdC5nZXRPd25Qcm9wZXJ0eURlc2NyaXB0b3IobmV4dFNvdXJjZSwgbmV4dEtleSk7XHJcbiAgICAgIGlmIChkZXNjICE9PSB1bmRlZmluZWQgJiYgZGVzYy5lbnVtZXJhYmxlKSB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB0bztcclxufTsiLCIoZnVuY3Rpb24gKGdsb2JhbCl7XG4hZnVuY3Rpb24oZSl7aWYoXCJvYmplY3RcIj09dHlwZW9mIGV4cG9ydHMmJlwidW5kZWZpbmVkXCIhPXR5cGVvZiBtb2R1bGUpbW9kdWxlLmV4cG9ydHM9ZSgpO2Vsc2UgaWYoXCJmdW5jdGlvblwiPT10eXBlb2YgZGVmaW5lJiZkZWZpbmUuYW1kKWRlZmluZShbXSxlKTtlbHNle3ZhciBmO1widW5kZWZpbmVkXCIhPXR5cGVvZiB3aW5kb3c/Zj13aW5kb3c6XCJ1bmRlZmluZWRcIiE9dHlwZW9mIGdsb2JhbD9mPWdsb2JhbDpcInVuZGVmaW5lZFwiIT10eXBlb2Ygc2VsZiYmKGY9c2VsZiksZi5pbz1lKCl9fShmdW5jdGlvbigpe3ZhciBkZWZpbmUsbW9kdWxlLGV4cG9ydHM7cmV0dXJuIChmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dGhyb3cgbmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKX12YXIgZj1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwoZi5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxmLGYuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pKHsxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gX2RlcmVxXygnLi9saWIvJyk7XHJcblxyXG59LHtcIi4vbGliL1wiOjJ9XSwyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxyXG4gKi9cclxuXHJcbnZhciB1cmwgPSBfZGVyZXFfKCcuL3VybCcpO1xyXG52YXIgcGFyc2VyID0gX2RlcmVxXygnc29ja2V0LmlvLXBhcnNlcicpO1xyXG52YXIgTWFuYWdlciA9IF9kZXJlcV8oJy4vbWFuYWdlcicpO1xyXG52YXIgZGVidWcgPSBfZGVyZXFfKCdkZWJ1ZycpKCdzb2NrZXQuaW8tY2xpZW50Jyk7XHJcblxyXG4vKipcclxuICogTW9kdWxlIGV4cG9ydHMuXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBleHBvcnRzID0gbG9va3VwO1xyXG5cclxuLyoqXHJcbiAqIE1hbmFnZXJzIGNhY2hlLlxyXG4gKi9cclxuXHJcbnZhciBjYWNoZSA9IGV4cG9ydHMubWFuYWdlcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBMb29rcyB1cCBhbiBleGlzdGluZyBgTWFuYWdlcmAgZm9yIG11bHRpcGxleGluZy5cclxuICogSWYgdGhlIHVzZXIgc3VtbW9uczpcclxuICpcclxuICogICBgaW8oJ2h0dHA6Ly9sb2NhbGhvc3QvYScpO2BcclxuICogICBgaW8oJ2h0dHA6Ly9sb2NhbGhvc3QvYicpO2BcclxuICpcclxuICogV2UgcmV1c2UgdGhlIGV4aXN0aW5nIGluc3RhbmNlIGJhc2VkIG9uIHNhbWUgc2NoZW1lL3BvcnQvaG9zdCxcclxuICogYW5kIHdlIGluaXRpYWxpemUgc29ja2V0cyBmb3IgZWFjaCBuYW1lc3BhY2UuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gbG9va3VwKHVyaSwgb3B0cykge1xyXG4gIGlmICh0eXBlb2YgdXJpID09ICdvYmplY3QnKSB7XHJcbiAgICBvcHRzID0gdXJpO1xyXG4gICAgdXJpID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuXHJcbiAgb3B0cyA9IG9wdHMgfHwge307XHJcblxyXG4gIHZhciBwYXJzZWQgPSB1cmwodXJpKTtcclxuICB2YXIgc291cmNlID0gcGFyc2VkLnNvdXJjZTtcclxuICB2YXIgaWQgPSBwYXJzZWQuaWQ7XHJcbiAgdmFyIGlvO1xyXG5cclxuICBpZiAob3B0cy5mb3JjZU5ldyB8fCBvcHRzWydmb3JjZSBuZXcgY29ubmVjdGlvbiddIHx8IGZhbHNlID09PSBvcHRzLm11bHRpcGxleCkge1xyXG4gICAgZGVidWcoJ2lnbm9yaW5nIHNvY2tldCBjYWNoZSBmb3IgJXMnLCBzb3VyY2UpO1xyXG4gICAgaW8gPSBNYW5hZ2VyKHNvdXJjZSwgb3B0cyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmICghY2FjaGVbaWRdKSB7XHJcbiAgICAgIGRlYnVnKCduZXcgaW8gaW5zdGFuY2UgZm9yICVzJywgc291cmNlKTtcclxuICAgICAgY2FjaGVbaWRdID0gTWFuYWdlcihzb3VyY2UsIG9wdHMpO1xyXG4gICAgfVxyXG4gICAgaW8gPSBjYWNoZVtpZF07XHJcbiAgfVxyXG5cclxuICByZXR1cm4gaW8uc29ja2V0KHBhcnNlZC5wYXRoKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFByb3RvY29sIHZlcnNpb24uXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5wcm90b2NvbCA9IHBhcnNlci5wcm90b2NvbDtcclxuXHJcbi8qKlxyXG4gKiBgY29ubmVjdGAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB1cmlcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5leHBvcnRzLmNvbm5lY3QgPSBsb29rdXA7XHJcblxyXG4vKipcclxuICogRXhwb3NlIGNvbnN0cnVjdG9ycyBmb3Igc3RhbmRhbG9uZSBidWlsZC5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5leHBvcnRzLk1hbmFnZXIgPSBfZGVyZXFfKCcuL21hbmFnZXInKTtcclxuZXhwb3J0cy5Tb2NrZXQgPSBfZGVyZXFfKCcuL3NvY2tldCcpO1xyXG5cclxufSx7XCIuL21hbmFnZXJcIjozLFwiLi9zb2NrZXRcIjo1LFwiLi91cmxcIjo2LFwiZGVidWdcIjoxMCxcInNvY2tldC5pby1wYXJzZXJcIjo0Nn1dLDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG5cclxuLyoqXHJcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXHJcbiAqL1xyXG5cclxudmFyIHVybCA9IF9kZXJlcV8oJy4vdXJsJyk7XHJcbnZhciBlaW8gPSBfZGVyZXFfKCdlbmdpbmUuaW8tY2xpZW50Jyk7XHJcbnZhciBTb2NrZXQgPSBfZGVyZXFfKCcuL3NvY2tldCcpO1xyXG52YXIgRW1pdHRlciA9IF9kZXJlcV8oJ2NvbXBvbmVudC1lbWl0dGVyJyk7XHJcbnZhciBwYXJzZXIgPSBfZGVyZXFfKCdzb2NrZXQuaW8tcGFyc2VyJyk7XHJcbnZhciBvbiA9IF9kZXJlcV8oJy4vb24nKTtcclxudmFyIGJpbmQgPSBfZGVyZXFfKCdjb21wb25lbnQtYmluZCcpO1xyXG52YXIgb2JqZWN0ID0gX2RlcmVxXygnb2JqZWN0LWNvbXBvbmVudCcpO1xyXG52YXIgZGVidWcgPSBfZGVyZXFfKCdkZWJ1ZycpKCdzb2NrZXQuaW8tY2xpZW50Om1hbmFnZXInKTtcclxudmFyIGluZGV4T2YgPSBfZGVyZXFfKCdpbmRleG9mJyk7XHJcbnZhciBCYWNrb2ZmID0gX2RlcmVxXygnYmFja28yJyk7XHJcblxyXG4vKipcclxuICogTW9kdWxlIGV4cG9ydHNcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE1hbmFnZXI7XHJcblxyXG4vKipcclxuICogYE1hbmFnZXJgIGNvbnN0cnVjdG9yLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZW5naW5lIGluc3RhbmNlIG9yIGVuZ2luZSB1cmkvb3B0c1xyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0aW9uc1xyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIE1hbmFnZXIodXJpLCBvcHRzKXtcclxuICBpZiAoISh0aGlzIGluc3RhbmNlb2YgTWFuYWdlcikpIHJldHVybiBuZXcgTWFuYWdlcih1cmksIG9wdHMpO1xyXG4gIGlmICh1cmkgJiYgKCdvYmplY3QnID09IHR5cGVvZiB1cmkpKSB7XHJcbiAgICBvcHRzID0gdXJpO1xyXG4gICAgdXJpID0gdW5kZWZpbmVkO1xyXG4gIH1cclxuICBvcHRzID0gb3B0cyB8fCB7fTtcclxuXHJcbiAgb3B0cy5wYXRoID0gb3B0cy5wYXRoIHx8ICcvc29ja2V0LmlvJztcclxuICB0aGlzLm5zcHMgPSB7fTtcclxuICB0aGlzLnN1YnMgPSBbXTtcclxuICB0aGlzLm9wdHMgPSBvcHRzO1xyXG4gIHRoaXMucmVjb25uZWN0aW9uKG9wdHMucmVjb25uZWN0aW9uICE9PSBmYWxzZSk7XHJcbiAgdGhpcy5yZWNvbm5lY3Rpb25BdHRlbXB0cyhvcHRzLnJlY29ubmVjdGlvbkF0dGVtcHRzIHx8IEluZmluaXR5KTtcclxuICB0aGlzLnJlY29ubmVjdGlvbkRlbGF5KG9wdHMucmVjb25uZWN0aW9uRGVsYXkgfHwgMTAwMCk7XHJcbiAgdGhpcy5yZWNvbm5lY3Rpb25EZWxheU1heChvcHRzLnJlY29ubmVjdGlvbkRlbGF5TWF4IHx8IDUwMDApO1xyXG4gIHRoaXMucmFuZG9taXphdGlvbkZhY3RvcihvcHRzLnJhbmRvbWl6YXRpb25GYWN0b3IgfHwgMC41KTtcclxuICB0aGlzLmJhY2tvZmYgPSBuZXcgQmFja29mZih7XHJcbiAgICBtaW46IHRoaXMucmVjb25uZWN0aW9uRGVsYXkoKSxcclxuICAgIG1heDogdGhpcy5yZWNvbm5lY3Rpb25EZWxheU1heCgpLFxyXG4gICAgaml0dGVyOiB0aGlzLnJhbmRvbWl6YXRpb25GYWN0b3IoKVxyXG4gIH0pO1xyXG4gIHRoaXMudGltZW91dChudWxsID09IG9wdHMudGltZW91dCA/IDIwMDAwIDogb3B0cy50aW1lb3V0KTtcclxuICB0aGlzLnJlYWR5U3RhdGUgPSAnY2xvc2VkJztcclxuICB0aGlzLnVyaSA9IHVyaTtcclxuICB0aGlzLmNvbm5lY3RlZCA9IFtdO1xyXG4gIHRoaXMuZW5jb2RpbmcgPSBmYWxzZTtcclxuICB0aGlzLnBhY2tldEJ1ZmZlciA9IFtdO1xyXG4gIHRoaXMuZW5jb2RlciA9IG5ldyBwYXJzZXIuRW5jb2RlcigpO1xyXG4gIHRoaXMuZGVjb2RlciA9IG5ldyBwYXJzZXIuRGVjb2RlcigpO1xyXG4gIHRoaXMuYXV0b0Nvbm5lY3QgPSBvcHRzLmF1dG9Db25uZWN0ICE9PSBmYWxzZTtcclxuICBpZiAodGhpcy5hdXRvQ29ubmVjdCkgdGhpcy5vcGVuKCk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBQcm9wYWdhdGUgZ2l2ZW4gZXZlbnQgdG8gc29ja2V0cyBhbmQgZW1pdCBvbiBgdGhpc2BcclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuTWFuYWdlci5wcm90b3R5cGUuZW1pdEFsbCA9IGZ1bmN0aW9uKCkge1xyXG4gIHRoaXMuZW1pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gIGZvciAodmFyIG5zcCBpbiB0aGlzLm5zcHMpIHtcclxuICAgIHRoaXMubnNwc1tuc3BdLmVtaXQuYXBwbHkodGhpcy5uc3BzW25zcF0sIGFyZ3VtZW50cyk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFVwZGF0ZSBgc29ja2V0LmlkYCBvZiBhbGwgc29ja2V0c1xyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS51cGRhdGVTb2NrZXRJZHMgPSBmdW5jdGlvbigpe1xyXG4gIGZvciAodmFyIG5zcCBpbiB0aGlzLm5zcHMpIHtcclxuICAgIHRoaXMubnNwc1tuc3BdLmlkID0gdGhpcy5lbmdpbmUuaWQ7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1peCBpbiBgRW1pdHRlcmAuXHJcbiAqL1xyXG5cclxuRW1pdHRlcihNYW5hZ2VyLnByb3RvdHlwZSk7XHJcblxyXG4vKipcclxuICogU2V0cyB0aGUgYHJlY29ubmVjdGlvbmAgY29uZmlnLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHRydWUvZmFsc2UgaWYgaXQgc2hvdWxkIGF1dG9tYXRpY2FsbHkgcmVjb25uZWN0XHJcbiAqIEByZXR1cm4ge01hbmFnZXJ9IHNlbGYgb3IgdmFsdWVcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5yZWNvbm5lY3Rpb24gPSBmdW5jdGlvbih2KXtcclxuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9yZWNvbm5lY3Rpb247XHJcbiAgdGhpcy5fcmVjb25uZWN0aW9uID0gISF2O1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIHJlY29ubmVjdGlvbiBhdHRlbXB0cyBjb25maWcuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtYXggcmVjb25uZWN0aW9uIGF0dGVtcHRzIGJlZm9yZSBnaXZpbmcgdXBcclxuICogQHJldHVybiB7TWFuYWdlcn0gc2VsZiBvciB2YWx1ZVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbk1hbmFnZXIucHJvdG90eXBlLnJlY29ubmVjdGlvbkF0dGVtcHRzID0gZnVuY3Rpb24odil7XHJcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHM7XHJcbiAgdGhpcy5fcmVjb25uZWN0aW9uQXR0ZW1wdHMgPSB2O1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGRlbGF5IGJldHdlZW4gcmVjb25uZWN0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtOdW1iZXJ9IGRlbGF5XHJcbiAqIEByZXR1cm4ge01hbmFnZXJ9IHNlbGYgb3IgdmFsdWVcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5yZWNvbm5lY3Rpb25EZWxheSA9IGZ1bmN0aW9uKHYpe1xyXG4gIGlmICghYXJndW1lbnRzLmxlbmd0aCkgcmV0dXJuIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5O1xyXG4gIHRoaXMuX3JlY29ubmVjdGlvbkRlbGF5ID0gdjtcclxuICB0aGlzLmJhY2tvZmYgJiYgdGhpcy5iYWNrb2ZmLnNldE1pbih2KTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbk1hbmFnZXIucHJvdG90eXBlLnJhbmRvbWl6YXRpb25GYWN0b3IgPSBmdW5jdGlvbih2KXtcclxuICBpZiAoIWFyZ3VtZW50cy5sZW5ndGgpIHJldHVybiB0aGlzLl9yYW5kb21pemF0aW9uRmFjdG9yO1xyXG4gIHRoaXMuX3JhbmRvbWl6YXRpb25GYWN0b3IgPSB2O1xyXG4gIHRoaXMuYmFja29mZiAmJiB0aGlzLmJhY2tvZmYuc2V0Sml0dGVyKHYpO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIG1heGltdW0gZGVsYXkgYmV0d2VlbiByZWNvbm5lY3Rpb25zLlxyXG4gKlxyXG4gKiBAcGFyYW0ge051bWJlcn0gZGVsYXlcclxuICogQHJldHVybiB7TWFuYWdlcn0gc2VsZiBvciB2YWx1ZVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbk1hbmFnZXIucHJvdG90eXBlLnJlY29ubmVjdGlvbkRlbGF5TWF4ID0gZnVuY3Rpb24odil7XHJcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fcmVjb25uZWN0aW9uRGVsYXlNYXg7XHJcbiAgdGhpcy5fcmVjb25uZWN0aW9uRGVsYXlNYXggPSB2O1xyXG4gIHRoaXMuYmFja29mZiAmJiB0aGlzLmJhY2tvZmYuc2V0TWF4KHYpO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGNvbm5lY3Rpb24gdGltZW91dC4gYGZhbHNlYCB0byBkaXNhYmxlXHJcbiAqXHJcbiAqIEByZXR1cm4ge01hbmFnZXJ9IHNlbGYgb3IgdmFsdWVcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS50aW1lb3V0ID0gZnVuY3Rpb24odil7XHJcbiAgaWYgKCFhcmd1bWVudHMubGVuZ3RoKSByZXR1cm4gdGhpcy5fdGltZW91dDtcclxuICB0aGlzLl90aW1lb3V0ID0gdjtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgdHJ5aW5nIHRvIHJlY29ubmVjdCBpZiByZWNvbm5lY3Rpb24gaXMgZW5hYmxlZCBhbmQgd2UgaGF2ZSBub3RcclxuICogc3RhcnRlZCByZWNvbm5lY3RpbmcgeWV0XHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbk1hbmFnZXIucHJvdG90eXBlLm1heWJlUmVjb25uZWN0T25PcGVuID0gZnVuY3Rpb24oKSB7XHJcbiAgLy8gT25seSB0cnkgdG8gcmVjb25uZWN0IGlmIGl0J3MgdGhlIGZpcnN0IHRpbWUgd2UncmUgY29ubmVjdGluZ1xyXG4gIGlmICghdGhpcy5yZWNvbm5lY3RpbmcgJiYgdGhpcy5fcmVjb25uZWN0aW9uICYmIHRoaXMuYmFja29mZi5hdHRlbXB0cyA9PT0gMCkge1xyXG4gICAgLy8ga2VlcHMgcmVjb25uZWN0aW9uIGZyb20gZmlyaW5nIHR3aWNlIGZvciB0aGUgc2FtZSByZWNvbm5lY3Rpb24gbG9vcFxyXG4gICAgdGhpcy5yZWNvbm5lY3QoKTtcclxuICB9XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGN1cnJlbnQgdHJhbnNwb3J0IGBzb2NrZXRgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBvcHRpb25hbCwgY2FsbGJhY2tcclxuICogQHJldHVybiB7TWFuYWdlcn0gc2VsZlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbk1hbmFnZXIucHJvdG90eXBlLm9wZW4gPVxyXG5NYW5hZ2VyLnByb3RvdHlwZS5jb25uZWN0ID0gZnVuY3Rpb24oZm4pe1xyXG4gIGRlYnVnKCdyZWFkeVN0YXRlICVzJywgdGhpcy5yZWFkeVN0YXRlKTtcclxuICBpZiAofnRoaXMucmVhZHlTdGF0ZS5pbmRleE9mKCdvcGVuJykpIHJldHVybiB0aGlzO1xyXG5cclxuICBkZWJ1Zygnb3BlbmluZyAlcycsIHRoaXMudXJpKTtcclxuICB0aGlzLmVuZ2luZSA9IGVpbyh0aGlzLnVyaSwgdGhpcy5vcHRzKTtcclxuICB2YXIgc29ja2V0ID0gdGhpcy5lbmdpbmU7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMucmVhZHlTdGF0ZSA9ICdvcGVuaW5nJztcclxuICB0aGlzLnNraXBSZWNvbm5lY3QgPSBmYWxzZTtcclxuXHJcbiAgLy8gZW1pdCBgb3BlbmBcclxuICB2YXIgb3BlblN1YiA9IG9uKHNvY2tldCwgJ29wZW4nLCBmdW5jdGlvbigpIHtcclxuICAgIHNlbGYub25vcGVuKCk7XHJcbiAgICBmbiAmJiBmbigpO1xyXG4gIH0pO1xyXG5cclxuICAvLyBlbWl0IGBjb25uZWN0X2Vycm9yYFxyXG4gIHZhciBlcnJvclN1YiA9IG9uKHNvY2tldCwgJ2Vycm9yJywgZnVuY3Rpb24oZGF0YSl7XHJcbiAgICBkZWJ1ZygnY29ubmVjdF9lcnJvcicpO1xyXG4gICAgc2VsZi5jbGVhbnVwKCk7XHJcbiAgICBzZWxmLnJlYWR5U3RhdGUgPSAnY2xvc2VkJztcclxuICAgIHNlbGYuZW1pdEFsbCgnY29ubmVjdF9lcnJvcicsIGRhdGEpO1xyXG4gICAgaWYgKGZuKSB7XHJcbiAgICAgIHZhciBlcnIgPSBuZXcgRXJyb3IoJ0Nvbm5lY3Rpb24gZXJyb3InKTtcclxuICAgICAgZXJyLmRhdGEgPSBkYXRhO1xyXG4gICAgICBmbihlcnIpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgLy8gT25seSBkbyB0aGlzIGlmIHRoZXJlIGlzIG5vIGZuIHRvIGhhbmRsZSB0aGUgZXJyb3JcclxuICAgICAgc2VsZi5tYXliZVJlY29ubmVjdE9uT3BlbigpO1xyXG4gICAgfVxyXG4gIH0pO1xyXG5cclxuICAvLyBlbWl0IGBjb25uZWN0X3RpbWVvdXRgXHJcbiAgaWYgKGZhbHNlICE9PSB0aGlzLl90aW1lb3V0KSB7XHJcbiAgICB2YXIgdGltZW91dCA9IHRoaXMuX3RpbWVvdXQ7XHJcbiAgICBkZWJ1ZygnY29ubmVjdCBhdHRlbXB0IHdpbGwgdGltZW91dCBhZnRlciAlZCcsIHRpbWVvdXQpO1xyXG5cclxuICAgIC8vIHNldCB0aW1lclxyXG4gICAgdmFyIHRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBkZWJ1ZygnY29ubmVjdCBhdHRlbXB0IHRpbWVkIG91dCBhZnRlciAlZCcsIHRpbWVvdXQpO1xyXG4gICAgICBvcGVuU3ViLmRlc3Ryb3koKTtcclxuICAgICAgc29ja2V0LmNsb3NlKCk7XHJcbiAgICAgIHNvY2tldC5lbWl0KCdlcnJvcicsICd0aW1lb3V0Jyk7XHJcbiAgICAgIHNlbGYuZW1pdEFsbCgnY29ubmVjdF90aW1lb3V0JywgdGltZW91dCk7XHJcbiAgICB9LCB0aW1lb3V0KTtcclxuXHJcbiAgICB0aGlzLnN1YnMucHVzaCh7XHJcbiAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICB0aGlzLnN1YnMucHVzaChvcGVuU3ViKTtcclxuICB0aGlzLnN1YnMucHVzaChlcnJvclN1Yik7XHJcblxyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIHRyYW5zcG9ydCBvcGVuLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5vbm9wZW4gPSBmdW5jdGlvbigpe1xyXG4gIGRlYnVnKCdvcGVuJyk7XHJcblxyXG4gIC8vIGNsZWFyIG9sZCBzdWJzXHJcbiAgdGhpcy5jbGVhbnVwKCk7XHJcblxyXG4gIC8vIG1hcmsgYXMgb3BlblxyXG4gIHRoaXMucmVhZHlTdGF0ZSA9ICdvcGVuJztcclxuICB0aGlzLmVtaXQoJ29wZW4nKTtcclxuXHJcbiAgLy8gYWRkIG5ldyBzdWJzXHJcbiAgdmFyIHNvY2tldCA9IHRoaXMuZW5naW5lO1xyXG4gIHRoaXMuc3Vicy5wdXNoKG9uKHNvY2tldCwgJ2RhdGEnLCBiaW5kKHRoaXMsICdvbmRhdGEnKSkpO1xyXG4gIHRoaXMuc3Vicy5wdXNoKG9uKHRoaXMuZGVjb2RlciwgJ2RlY29kZWQnLCBiaW5kKHRoaXMsICdvbmRlY29kZWQnKSkpO1xyXG4gIHRoaXMuc3Vicy5wdXNoKG9uKHNvY2tldCwgJ2Vycm9yJywgYmluZCh0aGlzLCAnb25lcnJvcicpKSk7XHJcbiAgdGhpcy5zdWJzLnB1c2gob24oc29ja2V0LCAnY2xvc2UnLCBiaW5kKHRoaXMsICdvbmNsb3NlJykpKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgd2l0aCBkYXRhLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5vbmRhdGEgPSBmdW5jdGlvbihkYXRhKXtcclxuICB0aGlzLmRlY29kZXIuYWRkKGRhdGEpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB3aGVuIHBhcnNlciBmdWxseSBkZWNvZGVzIGEgcGFja2V0LlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5vbmRlY29kZWQgPSBmdW5jdGlvbihwYWNrZXQpIHtcclxuICB0aGlzLmVtaXQoJ3BhY2tldCcsIHBhY2tldCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHVwb24gc29ja2V0IGVycm9yLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5vbmVycm9yID0gZnVuY3Rpb24oZXJyKXtcclxuICBkZWJ1ZygnZXJyb3InLCBlcnIpO1xyXG4gIHRoaXMuZW1pdEFsbCgnZXJyb3InLCBlcnIpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSBuZXcgc29ja2V0IGZvciB0aGUgZ2l2ZW4gYG5zcGAuXHJcbiAqXHJcbiAqIEByZXR1cm4ge1NvY2tldH1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5zb2NrZXQgPSBmdW5jdGlvbihuc3Ape1xyXG4gIHZhciBzb2NrZXQgPSB0aGlzLm5zcHNbbnNwXTtcclxuICBpZiAoIXNvY2tldCkge1xyXG4gICAgc29ja2V0ID0gbmV3IFNvY2tldCh0aGlzLCBuc3ApO1xyXG4gICAgdGhpcy5uc3BzW25zcF0gPSBzb2NrZXQ7XHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgICBzb2NrZXQub24oJ2Nvbm5lY3QnLCBmdW5jdGlvbigpe1xyXG4gICAgICBzb2NrZXQuaWQgPSBzZWxmLmVuZ2luZS5pZDtcclxuICAgICAgaWYgKCF+aW5kZXhPZihzZWxmLmNvbm5lY3RlZCwgc29ja2V0KSkge1xyXG4gICAgICAgIHNlbGYuY29ubmVjdGVkLnB1c2goc29ja2V0KTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG4gIHJldHVybiBzb2NrZXQ7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHVwb24gYSBzb2NrZXQgY2xvc2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U29ja2V0fSBzb2NrZXRcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oc29ja2V0KXtcclxuICB2YXIgaW5kZXggPSBpbmRleE9mKHRoaXMuY29ubmVjdGVkLCBzb2NrZXQpO1xyXG4gIGlmICh+aW5kZXgpIHRoaXMuY29ubmVjdGVkLnNwbGljZShpbmRleCwgMSk7XHJcbiAgaWYgKHRoaXMuY29ubmVjdGVkLmxlbmd0aCkgcmV0dXJuO1xyXG5cclxuICB0aGlzLmNsb3NlKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgcGFja2V0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbk1hbmFnZXIucHJvdG90eXBlLnBhY2tldCA9IGZ1bmN0aW9uKHBhY2tldCl7XHJcbiAgZGVidWcoJ3dyaXRpbmcgcGFja2V0ICVqJywgcGFja2V0KTtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIGlmICghc2VsZi5lbmNvZGluZykge1xyXG4gICAgLy8gZW5jb2RlLCB0aGVuIHdyaXRlIHRvIGVuZ2luZSB3aXRoIHJlc3VsdFxyXG4gICAgc2VsZi5lbmNvZGluZyA9IHRydWU7XHJcbiAgICB0aGlzLmVuY29kZXIuZW5jb2RlKHBhY2tldCwgZnVuY3Rpb24oZW5jb2RlZFBhY2tldHMpIHtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBlbmNvZGVkUGFja2V0cy5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHNlbGYuZW5naW5lLndyaXRlKGVuY29kZWRQYWNrZXRzW2ldKTtcclxuICAgICAgfVxyXG4gICAgICBzZWxmLmVuY29kaW5nID0gZmFsc2U7XHJcbiAgICAgIHNlbGYucHJvY2Vzc1BhY2tldFF1ZXVlKCk7XHJcbiAgICB9KTtcclxuICB9IGVsc2UgeyAvLyBhZGQgcGFja2V0IHRvIHRoZSBxdWV1ZVxyXG4gICAgc2VsZi5wYWNrZXRCdWZmZXIucHVzaChwYWNrZXQpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBJZiBwYWNrZXQgYnVmZmVyIGlzIG5vbi1lbXB0eSwgYmVnaW5zIGVuY29kaW5nIHRoZVxyXG4gKiBuZXh0IHBhY2tldCBpbiBsaW5lLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5wcm9jZXNzUGFja2V0UXVldWUgPSBmdW5jdGlvbigpIHtcclxuICBpZiAodGhpcy5wYWNrZXRCdWZmZXIubGVuZ3RoID4gMCAmJiAhdGhpcy5lbmNvZGluZykge1xyXG4gICAgdmFyIHBhY2sgPSB0aGlzLnBhY2tldEJ1ZmZlci5zaGlmdCgpO1xyXG4gICAgdGhpcy5wYWNrZXQocGFjayk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENsZWFuIHVwIHRyYW5zcG9ydCBzdWJzY3JpcHRpb25zIGFuZCBwYWNrZXQgYnVmZmVyLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5jbGVhbnVwID0gZnVuY3Rpb24oKXtcclxuICB2YXIgc3ViO1xyXG4gIHdoaWxlIChzdWIgPSB0aGlzLnN1YnMuc2hpZnQoKSkgc3ViLmRlc3Ryb3koKTtcclxuXHJcbiAgdGhpcy5wYWNrZXRCdWZmZXIgPSBbXTtcclxuICB0aGlzLmVuY29kaW5nID0gZmFsc2U7XHJcblxyXG4gIHRoaXMuZGVjb2Rlci5kZXN0cm95KCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2xvc2UgdGhlIGN1cnJlbnQgc29ja2V0LlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5jbG9zZSA9XHJcbk1hbmFnZXIucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpe1xyXG4gIHRoaXMuc2tpcFJlY29ubmVjdCA9IHRydWU7XHJcbiAgdGhpcy5iYWNrb2ZmLnJlc2V0KCk7XHJcbiAgdGhpcy5yZWFkeVN0YXRlID0gJ2Nsb3NlZCc7XHJcbiAgdGhpcy5lbmdpbmUgJiYgdGhpcy5lbmdpbmUuY2xvc2UoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgdXBvbiBlbmdpbmUgY2xvc2UuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbk1hbmFnZXIucHJvdG90eXBlLm9uY2xvc2UgPSBmdW5jdGlvbihyZWFzb24pe1xyXG4gIGRlYnVnKCdjbG9zZScpO1xyXG4gIHRoaXMuY2xlYW51cCgpO1xyXG4gIHRoaXMuYmFja29mZi5yZXNldCgpO1xyXG4gIHRoaXMucmVhZHlTdGF0ZSA9ICdjbG9zZWQnO1xyXG4gIHRoaXMuZW1pdCgnY2xvc2UnLCByZWFzb24pO1xyXG4gIGlmICh0aGlzLl9yZWNvbm5lY3Rpb24gJiYgIXRoaXMuc2tpcFJlY29ubmVjdCkge1xyXG4gICAgdGhpcy5yZWNvbm5lY3QoKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQXR0ZW1wdCBhIHJlY29ubmVjdGlvbi5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuTWFuYWdlci5wcm90b3R5cGUucmVjb25uZWN0ID0gZnVuY3Rpb24oKXtcclxuICBpZiAodGhpcy5yZWNvbm5lY3RpbmcgfHwgdGhpcy5za2lwUmVjb25uZWN0KSByZXR1cm4gdGhpcztcclxuXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG5cclxuICBpZiAodGhpcy5iYWNrb2ZmLmF0dGVtcHRzID49IHRoaXMuX3JlY29ubmVjdGlvbkF0dGVtcHRzKSB7XHJcbiAgICBkZWJ1ZygncmVjb25uZWN0IGZhaWxlZCcpO1xyXG4gICAgdGhpcy5iYWNrb2ZmLnJlc2V0KCk7XHJcbiAgICB0aGlzLmVtaXRBbGwoJ3JlY29ubmVjdF9mYWlsZWQnKTtcclxuICAgIHRoaXMucmVjb25uZWN0aW5nID0gZmFsc2U7XHJcbiAgfSBlbHNlIHtcclxuICAgIHZhciBkZWxheSA9IHRoaXMuYmFja29mZi5kdXJhdGlvbigpO1xyXG4gICAgZGVidWcoJ3dpbGwgd2FpdCAlZG1zIGJlZm9yZSByZWNvbm5lY3QgYXR0ZW1wdCcsIGRlbGF5KTtcclxuXHJcbiAgICB0aGlzLnJlY29ubmVjdGluZyA9IHRydWU7XHJcbiAgICB2YXIgdGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XHJcbiAgICAgIGlmIChzZWxmLnNraXBSZWNvbm5lY3QpIHJldHVybjtcclxuXHJcbiAgICAgIGRlYnVnKCdhdHRlbXB0aW5nIHJlY29ubmVjdCcpO1xyXG4gICAgICBzZWxmLmVtaXRBbGwoJ3JlY29ubmVjdF9hdHRlbXB0Jywgc2VsZi5iYWNrb2ZmLmF0dGVtcHRzKTtcclxuICAgICAgc2VsZi5lbWl0QWxsKCdyZWNvbm5lY3RpbmcnLCBzZWxmLmJhY2tvZmYuYXR0ZW1wdHMpO1xyXG5cclxuICAgICAgLy8gY2hlY2sgYWdhaW4gZm9yIHRoZSBjYXNlIHNvY2tldCBjbG9zZWQgaW4gYWJvdmUgZXZlbnRzXHJcbiAgICAgIGlmIChzZWxmLnNraXBSZWNvbm5lY3QpIHJldHVybjtcclxuXHJcbiAgICAgIHNlbGYub3BlbihmdW5jdGlvbihlcnIpe1xyXG4gICAgICAgIGlmIChlcnIpIHtcclxuICAgICAgICAgIGRlYnVnKCdyZWNvbm5lY3QgYXR0ZW1wdCBlcnJvcicpO1xyXG4gICAgICAgICAgc2VsZi5yZWNvbm5lY3RpbmcgPSBmYWxzZTtcclxuICAgICAgICAgIHNlbGYucmVjb25uZWN0KCk7XHJcbiAgICAgICAgICBzZWxmLmVtaXRBbGwoJ3JlY29ubmVjdF9lcnJvcicsIGVyci5kYXRhKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgZGVidWcoJ3JlY29ubmVjdCBzdWNjZXNzJyk7XHJcbiAgICAgICAgICBzZWxmLm9ucmVjb25uZWN0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9KTtcclxuICAgIH0sIGRlbGF5KTtcclxuXHJcbiAgICB0aGlzLnN1YnMucHVzaCh7XHJcbiAgICAgIGRlc3Ryb3k6IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgY2xlYXJUaW1lb3V0KHRpbWVyKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIHN1Y2Nlc3NmdWwgcmVjb25uZWN0LlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5NYW5hZ2VyLnByb3RvdHlwZS5vbnJlY29ubmVjdCA9IGZ1bmN0aW9uKCl7XHJcbiAgdmFyIGF0dGVtcHQgPSB0aGlzLmJhY2tvZmYuYXR0ZW1wdHM7XHJcbiAgdGhpcy5yZWNvbm5lY3RpbmcgPSBmYWxzZTtcclxuICB0aGlzLmJhY2tvZmYucmVzZXQoKTtcclxuICB0aGlzLnVwZGF0ZVNvY2tldElkcygpO1xyXG4gIHRoaXMuZW1pdEFsbCgncmVjb25uZWN0JywgYXR0ZW1wdCk7XHJcbn07XHJcblxyXG59LHtcIi4vb25cIjo0LFwiLi9zb2NrZXRcIjo1LFwiLi91cmxcIjo2LFwiYmFja28yXCI6NyxcImNvbXBvbmVudC1iaW5kXCI6OCxcImNvbXBvbmVudC1lbWl0dGVyXCI6OSxcImRlYnVnXCI6MTAsXCJlbmdpbmUuaW8tY2xpZW50XCI6MTEsXCJpbmRleG9mXCI6NDIsXCJvYmplY3QtY29tcG9uZW50XCI6NDMsXCJzb2NrZXQuaW8tcGFyc2VyXCI6NDZ9XSw0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IG9uO1xyXG5cclxuLyoqXHJcbiAqIEhlbHBlciBmb3Igc3Vic2NyaXB0aW9ucy5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R8RXZlbnRFbWl0dGVyfSBvYmogd2l0aCBgRW1pdHRlcmAgbWl4aW4gb3IgYEV2ZW50RW1pdHRlcmBcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50IG5hbWVcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2tcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBvbihvYmosIGV2LCBmbikge1xyXG4gIG9iai5vbihldiwgZm4pO1xyXG4gIHJldHVybiB7XHJcbiAgICBkZXN0cm95OiBmdW5jdGlvbigpe1xyXG4gICAgICBvYmoucmVtb3ZlTGlzdGVuZXIoZXYsIGZuKTtcclxuICAgIH1cclxuICB9O1xyXG59XHJcblxyXG59LHt9XSw1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxyXG4gKi9cclxuXHJcbnZhciBwYXJzZXIgPSBfZGVyZXFfKCdzb2NrZXQuaW8tcGFyc2VyJyk7XHJcbnZhciBFbWl0dGVyID0gX2RlcmVxXygnY29tcG9uZW50LWVtaXR0ZXInKTtcclxudmFyIHRvQXJyYXkgPSBfZGVyZXFfKCd0by1hcnJheScpO1xyXG52YXIgb24gPSBfZGVyZXFfKCcuL29uJyk7XHJcbnZhciBiaW5kID0gX2RlcmVxXygnY29tcG9uZW50LWJpbmQnKTtcclxudmFyIGRlYnVnID0gX2RlcmVxXygnZGVidWcnKSgnc29ja2V0LmlvLWNsaWVudDpzb2NrZXQnKTtcclxudmFyIGhhc0JpbiA9IF9kZXJlcV8oJ2hhcy1iaW5hcnknKTtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGV4cG9ydHMgPSBTb2NrZXQ7XHJcblxyXG4vKipcclxuICogSW50ZXJuYWwgZXZlbnRzIChibGFja2xpc3RlZCkuXHJcbiAqIFRoZXNlIGV2ZW50cyBjYW4ndCBiZSBlbWl0dGVkIGJ5IHRoZSB1c2VyLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG52YXIgZXZlbnRzID0ge1xyXG4gIGNvbm5lY3Q6IDEsXHJcbiAgY29ubmVjdF9lcnJvcjogMSxcclxuICBjb25uZWN0X3RpbWVvdXQ6IDEsXHJcbiAgZGlzY29ubmVjdDogMSxcclxuICBlcnJvcjogMSxcclxuICByZWNvbm5lY3Q6IDEsXHJcbiAgcmVjb25uZWN0X2F0dGVtcHQ6IDEsXHJcbiAgcmVjb25uZWN0X2ZhaWxlZDogMSxcclxuICByZWNvbm5lY3RfZXJyb3I6IDEsXHJcbiAgcmVjb25uZWN0aW5nOiAxXHJcbn07XHJcblxyXG4vKipcclxuICogU2hvcnRjdXQgdG8gYEVtaXR0ZXIjZW1pdGAuXHJcbiAqL1xyXG5cclxudmFyIGVtaXQgPSBFbWl0dGVyLnByb3RvdHlwZS5lbWl0O1xyXG5cclxuLyoqXHJcbiAqIGBTb2NrZXRgIGNvbnN0cnVjdG9yLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIFNvY2tldChpbywgbnNwKXtcclxuICB0aGlzLmlvID0gaW87XHJcbiAgdGhpcy5uc3AgPSBuc3A7XHJcbiAgdGhpcy5qc29uID0gdGhpczsgLy8gY29tcGF0XHJcbiAgdGhpcy5pZHMgPSAwO1xyXG4gIHRoaXMuYWNrcyA9IHt9O1xyXG4gIGlmICh0aGlzLmlvLmF1dG9Db25uZWN0KSB0aGlzLm9wZW4oKTtcclxuICB0aGlzLnJlY2VpdmVCdWZmZXIgPSBbXTtcclxuICB0aGlzLnNlbmRCdWZmZXIgPSBbXTtcclxuICB0aGlzLmNvbm5lY3RlZCA9IGZhbHNlO1xyXG4gIHRoaXMuZGlzY29ubmVjdGVkID0gdHJ1ZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIE1peCBpbiBgRW1pdHRlcmAuXHJcbiAqL1xyXG5cclxuRW1pdHRlcihTb2NrZXQucHJvdG90eXBlKTtcclxuXHJcbi8qKlxyXG4gKiBTdWJzY3JpYmUgdG8gb3BlbiwgY2xvc2UgYW5kIHBhY2tldCBldmVudHNcclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5zdWJFdmVudHMgPSBmdW5jdGlvbigpIHtcclxuICBpZiAodGhpcy5zdWJzKSByZXR1cm47XHJcblxyXG4gIHZhciBpbyA9IHRoaXMuaW87XHJcbiAgdGhpcy5zdWJzID0gW1xyXG4gICAgb24oaW8sICdvcGVuJywgYmluZCh0aGlzLCAnb25vcGVuJykpLFxyXG4gICAgb24oaW8sICdwYWNrZXQnLCBiaW5kKHRoaXMsICdvbnBhY2tldCcpKSxcclxuICAgIG9uKGlvLCAnY2xvc2UnLCBiaW5kKHRoaXMsICdvbmNsb3NlJykpXHJcbiAgXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBcIk9wZW5zXCIgdGhlIHNvY2tldC5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLm9wZW4gPVxyXG5Tb2NrZXQucHJvdG90eXBlLmNvbm5lY3QgPSBmdW5jdGlvbigpe1xyXG4gIGlmICh0aGlzLmNvbm5lY3RlZCkgcmV0dXJuIHRoaXM7XHJcblxyXG4gIHRoaXMuc3ViRXZlbnRzKCk7XHJcbiAgdGhpcy5pby5vcGVuKCk7IC8vIGVuc3VyZSBvcGVuXHJcbiAgaWYgKCdvcGVuJyA9PSB0aGlzLmlvLnJlYWR5U3RhdGUpIHRoaXMub25vcGVuKCk7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgYSBgbWVzc2FnZWAgZXZlbnQuXHJcbiAqXHJcbiAqIEByZXR1cm4ge1NvY2tldH0gc2VsZlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uKCl7XHJcbiAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgYXJncy51bnNoaWZ0KCdtZXNzYWdlJyk7XHJcbiAgdGhpcy5lbWl0LmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE92ZXJyaWRlIGBlbWl0YC5cclxuICogSWYgdGhlIGV2ZW50IGlzIGluIGBldmVudHNgLCBpdCdzIGVtaXR0ZWQgbm9ybWFsbHkuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudCBuYW1lXHJcbiAqIEByZXR1cm4ge1NvY2tldH0gc2VsZlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uKGV2KXtcclxuICBpZiAoZXZlbnRzLmhhc093blByb3BlcnR5KGV2KSkge1xyXG4gICAgZW1pdC5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xyXG4gICAgcmV0dXJuIHRoaXM7XHJcbiAgfVxyXG5cclxuICB2YXIgYXJncyA9IHRvQXJyYXkoYXJndW1lbnRzKTtcclxuICB2YXIgcGFyc2VyVHlwZSA9IHBhcnNlci5FVkVOVDsgLy8gZGVmYXVsdFxyXG4gIGlmIChoYXNCaW4oYXJncykpIHsgcGFyc2VyVHlwZSA9IHBhcnNlci5CSU5BUllfRVZFTlQ7IH0gLy8gYmluYXJ5XHJcbiAgdmFyIHBhY2tldCA9IHsgdHlwZTogcGFyc2VyVHlwZSwgZGF0YTogYXJncyB9O1xyXG5cclxuICAvLyBldmVudCBhY2sgY2FsbGJhY2tcclxuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2YgYXJnc1thcmdzLmxlbmd0aCAtIDFdKSB7XHJcbiAgICBkZWJ1ZygnZW1pdHRpbmcgcGFja2V0IHdpdGggYWNrIGlkICVkJywgdGhpcy5pZHMpO1xyXG4gICAgdGhpcy5hY2tzW3RoaXMuaWRzXSA9IGFyZ3MucG9wKCk7XHJcbiAgICBwYWNrZXQuaWQgPSB0aGlzLmlkcysrO1xyXG4gIH1cclxuXHJcbiAgaWYgKHRoaXMuY29ubmVjdGVkKSB7XHJcbiAgICB0aGlzLnBhY2tldChwYWNrZXQpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLnNlbmRCdWZmZXIucHVzaChwYWNrZXQpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgYSBwYWNrZXQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXRcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5wYWNrZXQgPSBmdW5jdGlvbihwYWNrZXQpe1xyXG4gIHBhY2tldC5uc3AgPSB0aGlzLm5zcDtcclxuICB0aGlzLmlvLnBhY2tldChwYWNrZXQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIGVuZ2luZSBgb3BlbmAuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUub25vcGVuID0gZnVuY3Rpb24oKXtcclxuICBkZWJ1ZygndHJhbnNwb3J0IGlzIG9wZW4gLSBjb25uZWN0aW5nJyk7XHJcblxyXG4gIC8vIHdyaXRlIGNvbm5lY3QgcGFja2V0IGlmIG5lY2Vzc2FyeVxyXG4gIGlmICgnLycgIT0gdGhpcy5uc3ApIHtcclxuICAgIHRoaXMucGFja2V0KHsgdHlwZTogcGFyc2VyLkNPTk5FQ1QgfSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIGVuZ2luZSBgY2xvc2VgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gcmVhc29uXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUub25jbG9zZSA9IGZ1bmN0aW9uKHJlYXNvbil7XHJcbiAgZGVidWcoJ2Nsb3NlICglcyknLCByZWFzb24pO1xyXG4gIHRoaXMuY29ubmVjdGVkID0gZmFsc2U7XHJcbiAgdGhpcy5kaXNjb25uZWN0ZWQgPSB0cnVlO1xyXG4gIGRlbGV0ZSB0aGlzLmlkO1xyXG4gIHRoaXMuZW1pdCgnZGlzY29ubmVjdCcsIHJlYXNvbik7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHdpdGggc29ja2V0IHBhY2tldC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldFxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLm9ucGFja2V0ID0gZnVuY3Rpb24ocGFja2V0KXtcclxuICBpZiAocGFja2V0Lm5zcCAhPSB0aGlzLm5zcCkgcmV0dXJuO1xyXG5cclxuICBzd2l0Y2ggKHBhY2tldC50eXBlKSB7XHJcbiAgICBjYXNlIHBhcnNlci5DT05ORUNUOlxyXG4gICAgICB0aGlzLm9uY29ubmVjdCgpO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIHBhcnNlci5FVkVOVDpcclxuICAgICAgdGhpcy5vbmV2ZW50KHBhY2tldCk7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcGFyc2VyLkJJTkFSWV9FVkVOVDpcclxuICAgICAgdGhpcy5vbmV2ZW50KHBhY2tldCk7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcGFyc2VyLkFDSzpcclxuICAgICAgdGhpcy5vbmFjayhwYWNrZXQpO1xyXG4gICAgICBicmVhaztcclxuXHJcbiAgICBjYXNlIHBhcnNlci5CSU5BUllfQUNLOlxyXG4gICAgICB0aGlzLm9uYWNrKHBhY2tldCk7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcGFyc2VyLkRJU0NPTk5FQ1Q6XHJcbiAgICAgIHRoaXMub25kaXNjb25uZWN0KCk7XHJcbiAgICAgIGJyZWFrO1xyXG5cclxuICAgIGNhc2UgcGFyc2VyLkVSUk9SOlxyXG4gICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgcGFja2V0LmRhdGEpO1xyXG4gICAgICBicmVhaztcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHVwb24gYSBzZXJ2ZXIgZXZlbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXRcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5vbmV2ZW50ID0gZnVuY3Rpb24ocGFja2V0KXtcclxuICB2YXIgYXJncyA9IHBhY2tldC5kYXRhIHx8IFtdO1xyXG4gIGRlYnVnKCdlbWl0dGluZyBldmVudCAlaicsIGFyZ3MpO1xyXG5cclxuICBpZiAobnVsbCAhPSBwYWNrZXQuaWQpIHtcclxuICAgIGRlYnVnKCdhdHRhY2hpbmcgYWNrIGNhbGxiYWNrIHRvIGV2ZW50Jyk7XHJcbiAgICBhcmdzLnB1c2godGhpcy5hY2socGFja2V0LmlkKSk7XHJcbiAgfVxyXG5cclxuICBpZiAodGhpcy5jb25uZWN0ZWQpIHtcclxuICAgIGVtaXQuYXBwbHkodGhpcywgYXJncyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMucmVjZWl2ZUJ1ZmZlci5wdXNoKGFyZ3MpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBQcm9kdWNlcyBhbiBhY2sgY2FsbGJhY2sgdG8gZW1pdCB3aXRoIGFuIGV2ZW50LlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLmFjayA9IGZ1bmN0aW9uKGlkKXtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIHNlbnQgPSBmYWxzZTtcclxuICByZXR1cm4gZnVuY3Rpb24oKXtcclxuICAgIC8vIHByZXZlbnQgZG91YmxlIGNhbGxiYWNrc1xyXG4gICAgaWYgKHNlbnQpIHJldHVybjtcclxuICAgIHNlbnQgPSB0cnVlO1xyXG4gICAgdmFyIGFyZ3MgPSB0b0FycmF5KGFyZ3VtZW50cyk7XHJcbiAgICBkZWJ1Zygnc2VuZGluZyBhY2sgJWonLCBhcmdzKTtcclxuXHJcbiAgICB2YXIgdHlwZSA9IGhhc0JpbihhcmdzKSA/IHBhcnNlci5CSU5BUllfQUNLIDogcGFyc2VyLkFDSztcclxuICAgIHNlbGYucGFja2V0KHtcclxuICAgICAgdHlwZTogdHlwZSxcclxuICAgICAgaWQ6IGlkLFxyXG4gICAgICBkYXRhOiBhcmdzXHJcbiAgICB9KTtcclxuICB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIGEgc2VydmVyIGFja25vd2xlZ2VtZW50LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUub25hY2sgPSBmdW5jdGlvbihwYWNrZXQpe1xyXG4gIGRlYnVnKCdjYWxsaW5nIGFjayAlcyB3aXRoICVqJywgcGFja2V0LmlkLCBwYWNrZXQuZGF0YSk7XHJcbiAgdmFyIGZuID0gdGhpcy5hY2tzW3BhY2tldC5pZF07XHJcbiAgZm4uYXBwbHkodGhpcywgcGFja2V0LmRhdGEpO1xyXG4gIGRlbGV0ZSB0aGlzLmFja3NbcGFja2V0LmlkXTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgdXBvbiBzZXJ2ZXIgY29ubmVjdC5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5vbmNvbm5lY3QgPSBmdW5jdGlvbigpe1xyXG4gIHRoaXMuY29ubmVjdGVkID0gdHJ1ZTtcclxuICB0aGlzLmRpc2Nvbm5lY3RlZCA9IGZhbHNlO1xyXG4gIHRoaXMuZW1pdCgnY29ubmVjdCcpO1xyXG4gIHRoaXMuZW1pdEJ1ZmZlcmVkKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogRW1pdCBidWZmZXJlZCBldmVudHMgKHJlY2VpdmVkIGFuZCBlbWl0dGVkKS5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5lbWl0QnVmZmVyZWQgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBpO1xyXG4gIGZvciAoaSA9IDA7IGkgPCB0aGlzLnJlY2VpdmVCdWZmZXIubGVuZ3RoOyBpKyspIHtcclxuICAgIGVtaXQuYXBwbHkodGhpcywgdGhpcy5yZWNlaXZlQnVmZmVyW2ldKTtcclxuICB9XHJcbiAgdGhpcy5yZWNlaXZlQnVmZmVyID0gW107XHJcblxyXG4gIGZvciAoaSA9IDA7IGkgPCB0aGlzLnNlbmRCdWZmZXIubGVuZ3RoOyBpKyspIHtcclxuICAgIHRoaXMucGFja2V0KHRoaXMuc2VuZEJ1ZmZlcltpXSk7XHJcbiAgfVxyXG4gIHRoaXMuc2VuZEJ1ZmZlciA9IFtdO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIHNlcnZlciBkaXNjb25uZWN0LlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLm9uZGlzY29ubmVjdCA9IGZ1bmN0aW9uKCl7XHJcbiAgZGVidWcoJ3NlcnZlciBkaXNjb25uZWN0ICglcyknLCB0aGlzLm5zcCk7XHJcbiAgdGhpcy5kZXN0cm95KCk7XHJcbiAgdGhpcy5vbmNsb3NlKCdpbyBzZXJ2ZXIgZGlzY29ubmVjdCcpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIGZvcmNlZCBjbGllbnQvc2VydmVyIHNpZGUgZGlzY29ubmVjdGlvbnMsXHJcbiAqIHRoaXMgbWV0aG9kIGVuc3VyZXMgdGhlIG1hbmFnZXIgc3RvcHMgdHJhY2tpbmcgdXMgYW5kXHJcbiAqIHRoYXQgcmVjb25uZWN0aW9ucyBkb24ndCBnZXQgdHJpZ2dlcmVkIGZvciB0aGlzLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGUuXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcclxuICBpZiAodGhpcy5zdWJzKSB7XHJcbiAgICAvLyBjbGVhbiBzdWJzY3JpcHRpb25zIHRvIGF2b2lkIHJlY29ubmVjdGlvbnNcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5zdWJzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgIHRoaXMuc3Vic1tpXS5kZXN0cm95KCk7XHJcbiAgICB9XHJcbiAgICB0aGlzLnN1YnMgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgdGhpcy5pby5kZXN0cm95KHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERpc2Nvbm5lY3RzIHRoZSBzb2NrZXQgbWFudWFsbHkuXHJcbiAqXHJcbiAqIEByZXR1cm4ge1NvY2tldH0gc2VsZlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUuY2xvc2UgPVxyXG5Tb2NrZXQucHJvdG90eXBlLmRpc2Nvbm5lY3QgPSBmdW5jdGlvbigpe1xyXG4gIGlmICh0aGlzLmNvbm5lY3RlZCkge1xyXG4gICAgZGVidWcoJ3BlcmZvcm1pbmcgZGlzY29ubmVjdCAoJXMpJywgdGhpcy5uc3ApO1xyXG4gICAgdGhpcy5wYWNrZXQoeyB0eXBlOiBwYXJzZXIuRElTQ09OTkVDVCB9KTtcclxuICB9XHJcblxyXG4gIC8vIHJlbW92ZSBzb2NrZXQgZnJvbSBwb29sXHJcbiAgdGhpcy5kZXN0cm95KCk7XHJcblxyXG4gIGlmICh0aGlzLmNvbm5lY3RlZCkge1xyXG4gICAgLy8gZmlyZSBldmVudHNcclxuICAgIHRoaXMub25jbG9zZSgnaW8gY2xpZW50IGRpc2Nvbm5lY3QnKTtcclxuICB9XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG59LHtcIi4vb25cIjo0LFwiY29tcG9uZW50LWJpbmRcIjo4LFwiY29tcG9uZW50LWVtaXR0ZXJcIjo5LFwiZGVidWdcIjoxMCxcImhhcy1iaW5hcnlcIjozOCxcInNvY2tldC5pby1wYXJzZXJcIjo0NixcInRvLWFycmF5XCI6NTB9XSw2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuKGZ1bmN0aW9uIChnbG9iYWwpe1xyXG5cclxuLyoqXHJcbiAqIE1vZHVsZSBkZXBlbmRlbmNpZXMuXHJcbiAqL1xyXG5cclxudmFyIHBhcnNldXJpID0gX2RlcmVxXygncGFyc2V1cmknKTtcclxudmFyIGRlYnVnID0gX2RlcmVxXygnZGVidWcnKSgnc29ja2V0LmlvLWNsaWVudDp1cmwnKTtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHVybDtcclxuXHJcbi8qKlxyXG4gKiBVUkwgcGFyc2VyLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdXJsXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBBbiBvYmplY3QgbWVhbnQgdG8gbWltaWMgd2luZG93LmxvY2F0aW9uLlxyXG4gKiAgICAgICAgICAgICAgICAgRGVmYXVsdHMgdG8gd2luZG93LmxvY2F0aW9uLlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIHVybCh1cmksIGxvYyl7XHJcbiAgdmFyIG9iaiA9IHVyaTtcclxuXHJcbiAgLy8gZGVmYXVsdCB0byB3aW5kb3cubG9jYXRpb25cclxuICB2YXIgbG9jID0gbG9jIHx8IGdsb2JhbC5sb2NhdGlvbjtcclxuICBpZiAobnVsbCA9PSB1cmkpIHVyaSA9IGxvYy5wcm90b2NvbCArICcvLycgKyBsb2MuaG9zdDtcclxuXHJcbiAgLy8gcmVsYXRpdmUgcGF0aCBzdXBwb3J0XHJcbiAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiB1cmkpIHtcclxuICAgIGlmICgnLycgPT0gdXJpLmNoYXJBdCgwKSkge1xyXG4gICAgICBpZiAoJy8nID09IHVyaS5jaGFyQXQoMSkpIHtcclxuICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyB1cmk7XHJcbiAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgdXJpID0gbG9jLmhvc3RuYW1lICsgdXJpO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCEvXihodHRwcz98d3NzPyk6XFwvXFwvLy50ZXN0KHVyaSkpIHtcclxuICAgICAgZGVidWcoJ3Byb3RvY29sLWxlc3MgdXJsICVzJywgdXJpKTtcclxuICAgICAgaWYgKCd1bmRlZmluZWQnICE9IHR5cGVvZiBsb2MpIHtcclxuICAgICAgICB1cmkgPSBsb2MucHJvdG9jb2wgKyAnLy8nICsgdXJpO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIHVyaSA9ICdodHRwczovLycgKyB1cmk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICAvLyBwYXJzZVxyXG4gICAgZGVidWcoJ3BhcnNlICVzJywgdXJpKTtcclxuICAgIG9iaiA9IHBhcnNldXJpKHVyaSk7XHJcbiAgfVxyXG5cclxuICAvLyBtYWtlIHN1cmUgd2UgdHJlYXQgYGxvY2FsaG9zdDo4MGAgYW5kIGBsb2NhbGhvc3RgIGVxdWFsbHlcclxuICBpZiAoIW9iai5wb3J0KSB7XHJcbiAgICBpZiAoL14oaHR0cHx3cykkLy50ZXN0KG9iai5wcm90b2NvbCkpIHtcclxuICAgICAgb2JqLnBvcnQgPSAnODAnO1xyXG4gICAgfVxyXG4gICAgZWxzZSBpZiAoL14oaHR0cHx3cylzJC8udGVzdChvYmoucHJvdG9jb2wpKSB7XHJcbiAgICAgIG9iai5wb3J0ID0gJzQ0Myc7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICBvYmoucGF0aCA9IG9iai5wYXRoIHx8ICcvJztcclxuXHJcbiAgLy8gZGVmaW5lIHVuaXF1ZSBpZFxyXG4gIG9iai5pZCA9IG9iai5wcm90b2NvbCArICc6Ly8nICsgb2JqLmhvc3QgKyAnOicgKyBvYmoucG9ydDtcclxuICAvLyBkZWZpbmUgaHJlZlxyXG4gIG9iai5ocmVmID0gb2JqLnByb3RvY29sICsgJzovLycgKyBvYmouaG9zdCArIChsb2MgJiYgbG9jLnBvcnQgPT0gb2JqLnBvcnQgPyAnJyA6ICgnOicgKyBvYmoucG9ydCkpO1xyXG5cclxuICByZXR1cm4gb2JqO1xyXG59XHJcblxyXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxyXG59LHtcImRlYnVnXCI6MTAsXCJwYXJzZXVyaVwiOjQ0fV0sNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG4vKipcclxuICogRXhwb3NlIGBCYWNrb2ZmYC5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJhY2tvZmY7XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZSBiYWNrb2ZmIHRpbWVyIHdpdGggYG9wdHNgLlxyXG4gKlxyXG4gKiAtIGBtaW5gIGluaXRpYWwgdGltZW91dCBpbiBtaWxsaXNlY29uZHMgWzEwMF1cclxuICogLSBgbWF4YCBtYXggdGltZW91dCBbMTAwMDBdXHJcbiAqIC0gYGppdHRlcmAgWzBdXHJcbiAqIC0gYGZhY3RvcmAgWzJdXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gQmFja29mZihvcHRzKSB7XHJcbiAgb3B0cyA9IG9wdHMgfHwge307XHJcbiAgdGhpcy5tcyA9IG9wdHMubWluIHx8IDEwMDtcclxuICB0aGlzLm1heCA9IG9wdHMubWF4IHx8IDEwMDAwO1xyXG4gIHRoaXMuZmFjdG9yID0gb3B0cy5mYWN0b3IgfHwgMjtcclxuICB0aGlzLmppdHRlciA9IG9wdHMuaml0dGVyID4gMCAmJiBvcHRzLmppdHRlciA8PSAxID8gb3B0cy5qaXR0ZXIgOiAwO1xyXG4gIHRoaXMuYXR0ZW1wdHMgPSAwO1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJuIHRoZSBiYWNrb2ZmIGR1cmF0aW9uLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuQmFja29mZi5wcm90b3R5cGUuZHVyYXRpb24gPSBmdW5jdGlvbigpe1xyXG4gIHZhciBtcyA9IHRoaXMubXMgKiBNYXRoLnBvdyh0aGlzLmZhY3RvciwgdGhpcy5hdHRlbXB0cysrKTtcclxuICBpZiAodGhpcy5qaXR0ZXIpIHtcclxuICAgIHZhciByYW5kID0gIE1hdGgucmFuZG9tKCk7XHJcbiAgICB2YXIgZGV2aWF0aW9uID0gTWF0aC5mbG9vcihyYW5kICogdGhpcy5qaXR0ZXIgKiBtcyk7XHJcbiAgICBtcyA9IChNYXRoLmZsb29yKHJhbmQgKiAxMCkgJiAxKSA9PSAwICA/IG1zIC0gZGV2aWF0aW9uIDogbXMgKyBkZXZpYXRpb247XHJcbiAgfVxyXG4gIHJldHVybiBNYXRoLm1pbihtcywgdGhpcy5tYXgpIHwgMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldCB0aGUgbnVtYmVyIG9mIGF0dGVtcHRzLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkJhY2tvZmYucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24oKXtcclxuICB0aGlzLmF0dGVtcHRzID0gMDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIG1pbmltdW0gZHVyYXRpb25cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5CYWNrb2ZmLnByb3RvdHlwZS5zZXRNaW4gPSBmdW5jdGlvbihtaW4pe1xyXG4gIHRoaXMubXMgPSBtaW47XHJcbn07XHJcblxyXG4vKipcclxuICogU2V0IHRoZSBtYXhpbXVtIGR1cmF0aW9uXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuQmFja29mZi5wcm90b3R5cGUuc2V0TWF4ID0gZnVuY3Rpb24obWF4KXtcclxuICB0aGlzLm1heCA9IG1heDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZXQgdGhlIGppdHRlclxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkJhY2tvZmYucHJvdG90eXBlLnNldEppdHRlciA9IGZ1bmN0aW9uKGppdHRlcil7XHJcbiAgdGhpcy5qaXR0ZXIgPSBqaXR0ZXI7XHJcbn07XHJcblxyXG5cclxufSx7fV0sODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbi8qKlxyXG4gKiBTbGljZSByZWZlcmVuY2UuXHJcbiAqL1xyXG5cclxudmFyIHNsaWNlID0gW10uc2xpY2U7XHJcblxyXG4vKipcclxuICogQmluZCBgb2JqYCB0byBgZm5gLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb258U3RyaW5nfSBmbiBvciBzdHJpbmdcclxuICogQHJldHVybiB7RnVuY3Rpb259XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihvYmosIGZuKXtcclxuICBpZiAoJ3N0cmluZycgPT0gdHlwZW9mIGZuKSBmbiA9IG9ialtmbl07XHJcbiAgaWYgKCdmdW5jdGlvbicgIT0gdHlwZW9mIGZuKSB0aHJvdyBuZXcgRXJyb3IoJ2JpbmQoKSByZXF1aXJlcyBhIGZ1bmN0aW9uJyk7XHJcbiAgdmFyIGFyZ3MgPSBzbGljZS5jYWxsKGFyZ3VtZW50cywgMik7XHJcbiAgcmV0dXJuIGZ1bmN0aW9uKCl7XHJcbiAgICByZXR1cm4gZm4uYXBwbHkob2JqLCBhcmdzLmNvbmNhdChzbGljZS5jYWxsKGFyZ3VtZW50cykpKTtcclxuICB9XHJcbn07XHJcblxyXG59LHt9XSw5OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbi8qKlxyXG4gKiBFeHBvc2UgYEVtaXR0ZXJgLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gRW1pdHRlcjtcclxuXHJcbi8qKlxyXG4gKiBJbml0aWFsaXplIGEgbmV3IGBFbWl0dGVyYC5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBFbWl0dGVyKG9iaikge1xyXG4gIGlmIChvYmopIHJldHVybiBtaXhpbihvYmopO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1peGluIHRoZSBlbWl0dGVyIHByb3BlcnRpZXMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcclxuICogQHJldHVybiB7T2JqZWN0fVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5mdW5jdGlvbiBtaXhpbihvYmopIHtcclxuICBmb3IgKHZhciBrZXkgaW4gRW1pdHRlci5wcm90b3R5cGUpIHtcclxuICAgIG9ialtrZXldID0gRW1pdHRlci5wcm90b3R5cGVba2V5XTtcclxuICB9XHJcbiAgcmV0dXJuIG9iajtcclxufVxyXG5cclxuLyoqXHJcbiAqIExpc3RlbiBvbiB0aGUgZ2l2ZW4gYGV2ZW50YCB3aXRoIGBmbmAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBldmVudFxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxyXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLm9uID1cclxuRW1pdHRlci5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XHJcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xyXG4gICh0aGlzLl9jYWxsYmFja3NbZXZlbnRdID0gdGhpcy5fY2FsbGJhY2tzW2V2ZW50XSB8fCBbXSlcclxuICAgIC5wdXNoKGZuKTtcclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBBZGRzIGFuIGBldmVudGAgbGlzdGVuZXIgdGhhdCB3aWxsIGJlIGludm9rZWQgYSBzaW5nbGVcclxuICogdGltZSB0aGVuIGF1dG9tYXRpY2FsbHkgcmVtb3ZlZC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGZuXHJcbiAqIEByZXR1cm4ge0VtaXR0ZXJ9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRW1pdHRlci5wcm90b3R5cGUub25jZSA9IGZ1bmN0aW9uKGV2ZW50LCBmbil7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuXHJcbiAgZnVuY3Rpb24gb24oKSB7XHJcbiAgICBzZWxmLm9mZihldmVudCwgb24pO1xyXG4gICAgZm4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcclxuICB9XHJcblxyXG4gIG9uLmZuID0gZm47XHJcbiAgdGhpcy5vbihldmVudCwgb24pO1xyXG4gIHJldHVybiB0aGlzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlbW92ZSB0aGUgZ2l2ZW4gY2FsbGJhY2sgZm9yIGBldmVudGAgb3IgYWxsXHJcbiAqIHJlZ2lzdGVyZWQgY2FsbGJhY2tzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cclxuICogQHJldHVybiB7RW1pdHRlcn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5vZmYgPVxyXG5FbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9XHJcbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUFsbExpc3RlbmVycyA9XHJcbkVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBmdW5jdGlvbihldmVudCwgZm4pe1xyXG4gIHRoaXMuX2NhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrcyB8fCB7fTtcclxuXHJcbiAgLy8gYWxsXHJcbiAgaWYgKDAgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgdGhpcy5fY2FsbGJhY2tzID0ge307XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8vIHNwZWNpZmljIGV2ZW50XHJcbiAgdmFyIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XHJcbiAgaWYgKCFjYWxsYmFja3MpIHJldHVybiB0aGlzO1xyXG5cclxuICAvLyByZW1vdmUgYWxsIGhhbmRsZXJzXHJcbiAgaWYgKDEgPT0gYXJndW1lbnRzLmxlbmd0aCkge1xyXG4gICAgZGVsZXRlIHRoaXMuX2NhbGxiYWNrc1tldmVudF07XHJcbiAgICByZXR1cm4gdGhpcztcclxuICB9XHJcblxyXG4gIC8vIHJlbW92ZSBzcGVjaWZpYyBoYW5kbGVyXHJcbiAgdmFyIGNiO1xyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2FsbGJhY2tzLmxlbmd0aDsgaSsrKSB7XHJcbiAgICBjYiA9IGNhbGxiYWNrc1tpXTtcclxuICAgIGlmIChjYiA9PT0gZm4gfHwgY2IuZm4gPT09IGZuKSB7XHJcbiAgICAgIGNhbGxiYWNrcy5zcGxpY2UoaSwgMSk7XHJcbiAgICAgIGJyZWFrO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbWl0IGBldmVudGAgd2l0aCB0aGUgZ2l2ZW4gYXJncy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEBwYXJhbSB7TWl4ZWR9IC4uLlxyXG4gKiBAcmV0dXJuIHtFbWl0dGVyfVxyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLmVtaXQgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgdGhpcy5fY2FsbGJhY2tzID0gdGhpcy5fY2FsbGJhY2tzIHx8IHt9O1xyXG4gIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpXHJcbiAgICAsIGNhbGxiYWNrcyA9IHRoaXMuX2NhbGxiYWNrc1tldmVudF07XHJcblxyXG4gIGlmIChjYWxsYmFja3MpIHtcclxuICAgIGNhbGxiYWNrcyA9IGNhbGxiYWNrcy5zbGljZSgwKTtcclxuICAgIGZvciAodmFyIGkgPSAwLCBsZW4gPSBjYWxsYmFja3MubGVuZ3RoOyBpIDwgbGVuOyArK2kpIHtcclxuICAgICAgY2FsbGJhY2tzW2ldLmFwcGx5KHRoaXMsIGFyZ3MpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogUmV0dXJuIGFycmF5IG9mIGNhbGxiYWNrcyBmb3IgYGV2ZW50YC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGV2ZW50XHJcbiAqIEByZXR1cm4ge0FycmF5fVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkVtaXR0ZXIucHJvdG90eXBlLmxpc3RlbmVycyA9IGZ1bmN0aW9uKGV2ZW50KXtcclxuICB0aGlzLl9jYWxsYmFja3MgPSB0aGlzLl9jYWxsYmFja3MgfHwge307XHJcbiAgcmV0dXJuIHRoaXMuX2NhbGxiYWNrc1tldmVudF0gfHwgW107XHJcbn07XHJcblxyXG4vKipcclxuICogQ2hlY2sgaWYgdGhpcyBlbWl0dGVyIGhhcyBgZXZlbnRgIGhhbmRsZXJzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZXZlbnRcclxuICogQHJldHVybiB7Qm9vbGVhbn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbWl0dGVyLnByb3RvdHlwZS5oYXNMaXN0ZW5lcnMgPSBmdW5jdGlvbihldmVudCl7XHJcbiAgcmV0dXJuICEhIHRoaXMubGlzdGVuZXJzKGV2ZW50KS5sZW5ndGg7XHJcbn07XHJcblxyXG59LHt9XSwxMDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG4vKipcclxuICogRXhwb3NlIGBkZWJ1ZygpYCBhcyB0aGUgbW9kdWxlLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZGVidWc7XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgZGVidWdnZXIgd2l0aCB0aGUgZ2l2ZW4gYG5hbWVgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtUeXBlfVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIGRlYnVnKG5hbWUpIHtcclxuICBpZiAoIWRlYnVnLmVuYWJsZWQobmFtZSkpIHJldHVybiBmdW5jdGlvbigpe307XHJcblxyXG4gIHJldHVybiBmdW5jdGlvbihmbXQpe1xyXG4gICAgZm10ID0gY29lcmNlKGZtdCk7XHJcblxyXG4gICAgdmFyIGN1cnIgPSBuZXcgRGF0ZTtcclxuICAgIHZhciBtcyA9IGN1cnIgLSAoZGVidWdbbmFtZV0gfHwgY3Vycik7XHJcbiAgICBkZWJ1Z1tuYW1lXSA9IGN1cnI7XHJcblxyXG4gICAgZm10ID0gbmFtZVxyXG4gICAgICArICcgJ1xyXG4gICAgICArIGZtdFxyXG4gICAgICArICcgKycgKyBkZWJ1Zy5odW1hbml6ZShtcyk7XHJcblxyXG4gICAgLy8gVGhpcyBoYWNrZXJ5IGlzIHJlcXVpcmVkIGZvciBJRThcclxuICAgIC8vIHdoZXJlIGBjb25zb2xlLmxvZ2AgZG9lc24ndCBoYXZlICdhcHBseSdcclxuICAgIHdpbmRvdy5jb25zb2xlXHJcbiAgICAgICYmIGNvbnNvbGUubG9nXHJcbiAgICAgICYmIEZ1bmN0aW9uLnByb3RvdHlwZS5hcHBseS5jYWxsKGNvbnNvbGUubG9nLCBjb25zb2xlLCBhcmd1bWVudHMpO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFRoZSBjdXJyZW50bHkgYWN0aXZlIGRlYnVnIG1vZGUgbmFtZXMuXHJcbiAqL1xyXG5cclxuZGVidWcubmFtZXMgPSBbXTtcclxuZGVidWcuc2tpcHMgPSBbXTtcclxuXHJcbi8qKlxyXG4gKiBFbmFibGVzIGEgZGVidWcgbW9kZSBieSBuYW1lLiBUaGlzIGNhbiBpbmNsdWRlIG1vZGVzXHJcbiAqIHNlcGFyYXRlZCBieSBhIGNvbG9uIGFuZCB3aWxkY2FyZHMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZGVidWcuZW5hYmxlID0gZnVuY3Rpb24obmFtZSkge1xyXG4gIHRyeSB7XHJcbiAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lO1xyXG4gIH0gY2F0Y2goZSl7fVxyXG5cclxuICB2YXIgc3BsaXQgPSAobmFtZSB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKVxyXG4gICAgLCBsZW4gPSBzcGxpdC5sZW5ndGg7XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIG5hbWUgPSBzcGxpdFtpXS5yZXBsYWNlKCcqJywgJy4qPycpO1xyXG4gICAgaWYgKG5hbWVbMF0gPT09ICctJykge1xyXG4gICAgICBkZWJ1Zy5za2lwcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZS5zdWJzdHIoMSkgKyAnJCcpKTtcclxuICAgIH1cclxuICAgIGVsc2Uge1xyXG4gICAgICBkZWJ1Zy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZSArICckJykpO1xyXG4gICAgfVxyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBEaXNhYmxlIGRlYnVnIG91dHB1dC5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5kZWJ1Zy5kaXNhYmxlID0gZnVuY3Rpb24oKXtcclxuICBkZWJ1Zy5lbmFibGUoJycpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEh1bWFuaXplIHRoZSBnaXZlbiBgbXNgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge051bWJlcn0gbVxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmRlYnVnLmh1bWFuaXplID0gZnVuY3Rpb24obXMpIHtcclxuICB2YXIgc2VjID0gMTAwMFxyXG4gICAgLCBtaW4gPSA2MCAqIDEwMDBcclxuICAgICwgaG91ciA9IDYwICogbWluO1xyXG5cclxuICBpZiAobXMgPj0gaG91cikgcmV0dXJuIChtcyAvIGhvdXIpLnRvRml4ZWQoMSkgKyAnaCc7XHJcbiAgaWYgKG1zID49IG1pbikgcmV0dXJuIChtcyAvIG1pbikudG9GaXhlZCgxKSArICdtJztcclxuICBpZiAobXMgPj0gc2VjKSByZXR1cm4gKG1zIC8gc2VjIHwgMCkgKyAncyc7XHJcbiAgcmV0dXJuIG1zICsgJ21zJztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIG1vZGUgbmFtZSBpcyBlbmFibGVkLCBmYWxzZSBvdGhlcndpc2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBuYW1lXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZGVidWcuZW5hYmxlZCA9IGZ1bmN0aW9uKG5hbWUpIHtcclxuICBmb3IgKHZhciBpID0gMCwgbGVuID0gZGVidWcuc2tpcHMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIGlmIChkZWJ1Zy5za2lwc1tpXS50ZXN0KG5hbWUpKSB7XHJcbiAgICAgIHJldHVybiBmYWxzZTtcclxuICAgIH1cclxuICB9XHJcbiAgZm9yICh2YXIgaSA9IDAsIGxlbiA9IGRlYnVnLm5hbWVzLmxlbmd0aDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICBpZiAoZGVidWcubmFtZXNbaV0udGVzdChuYW1lKSkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuICB9XHJcbiAgcmV0dXJuIGZhbHNlO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENvZXJjZSBgdmFsYC5cclxuICovXHJcblxyXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XHJcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xyXG4gIHJldHVybiB2YWw7XHJcbn1cclxuXHJcbi8vIHBlcnNpc3RcclxuXHJcbnRyeSB7XHJcbiAgaWYgKHdpbmRvdy5sb2NhbFN0b3JhZ2UpIGRlYnVnLmVuYWJsZShsb2NhbFN0b3JhZ2UuZGVidWcpO1xyXG59IGNhdGNoKGUpe31cclxuXHJcbn0se31dLDExOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gIF9kZXJlcV8oJy4vbGliLycpO1xyXG5cclxufSx7XCIuL2xpYi9cIjoxMn1dLDEyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gX2RlcmVxXygnLi9zb2NrZXQnKTtcclxuXHJcbi8qKlxyXG4gKiBFeHBvcnRzIHBhcnNlclxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMucGFyc2VyID0gX2RlcmVxXygnZW5naW5lLmlvLXBhcnNlcicpO1xyXG5cclxufSx7XCIuL3NvY2tldFwiOjEzLFwiZW5naW5lLmlvLXBhcnNlclwiOjI1fV0sMTM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG4oZnVuY3Rpb24gKGdsb2JhbCl7XHJcbi8qKlxyXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxyXG4gKi9cclxuXHJcbnZhciB0cmFuc3BvcnRzID0gX2RlcmVxXygnLi90cmFuc3BvcnRzJyk7XHJcbnZhciBFbWl0dGVyID0gX2RlcmVxXygnY29tcG9uZW50LWVtaXR0ZXInKTtcclxudmFyIGRlYnVnID0gX2RlcmVxXygnZGVidWcnKSgnZW5naW5lLmlvLWNsaWVudDpzb2NrZXQnKTtcclxudmFyIGluZGV4ID0gX2RlcmVxXygnaW5kZXhvZicpO1xyXG52YXIgcGFyc2VyID0gX2RlcmVxXygnZW5naW5lLmlvLXBhcnNlcicpO1xyXG52YXIgcGFyc2V1cmkgPSBfZGVyZXFfKCdwYXJzZXVyaScpO1xyXG52YXIgcGFyc2Vqc29uID0gX2RlcmVxXygncGFyc2Vqc29uJyk7XHJcbnZhciBwYXJzZXFzID0gX2RlcmVxXygncGFyc2VxcycpO1xyXG5cclxuLyoqXHJcbiAqIE1vZHVsZSBleHBvcnRzLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gU29ja2V0O1xyXG5cclxuLyoqXHJcbiAqIE5vb3AgZnVuY3Rpb24uXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIG5vb3AoKXt9XHJcblxyXG4vKipcclxuICogU29ja2V0IGNvbnN0cnVjdG9yLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ3xPYmplY3R9IHVyaSBvciBvcHRpb25zXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gU29ja2V0KHVyaSwgb3B0cyl7XHJcbiAgaWYgKCEodGhpcyBpbnN0YW5jZW9mIFNvY2tldCkpIHJldHVybiBuZXcgU29ja2V0KHVyaSwgb3B0cyk7XHJcblxyXG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xyXG5cclxuICBpZiAodXJpICYmICdvYmplY3QnID09IHR5cGVvZiB1cmkpIHtcclxuICAgIG9wdHMgPSB1cmk7XHJcbiAgICB1cmkgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgaWYgKHVyaSkge1xyXG4gICAgdXJpID0gcGFyc2V1cmkodXJpKTtcclxuICAgIG9wdHMuaG9zdCA9IHVyaS5ob3N0O1xyXG4gICAgb3B0cy5zZWN1cmUgPSB1cmkucHJvdG9jb2wgPT0gJ2h0dHBzJyB8fCB1cmkucHJvdG9jb2wgPT0gJ3dzcyc7XHJcbiAgICBvcHRzLnBvcnQgPSB1cmkucG9ydDtcclxuICAgIGlmICh1cmkucXVlcnkpIG9wdHMucXVlcnkgPSB1cmkucXVlcnk7XHJcbiAgfVxyXG5cclxuICB0aGlzLnNlY3VyZSA9IG51bGwgIT0gb3B0cy5zZWN1cmUgPyBvcHRzLnNlY3VyZSA6XHJcbiAgICAoZ2xvYmFsLmxvY2F0aW9uICYmICdodHRwczonID09IGxvY2F0aW9uLnByb3RvY29sKTtcclxuXHJcbiAgaWYgKG9wdHMuaG9zdCkge1xyXG4gICAgdmFyIHBpZWNlcyA9IG9wdHMuaG9zdC5zcGxpdCgnOicpO1xyXG4gICAgb3B0cy5ob3N0bmFtZSA9IHBpZWNlcy5zaGlmdCgpO1xyXG4gICAgaWYgKHBpZWNlcy5sZW5ndGgpIHtcclxuICAgICAgb3B0cy5wb3J0ID0gcGllY2VzLnBvcCgpO1xyXG4gICAgfSBlbHNlIGlmICghb3B0cy5wb3J0KSB7XHJcbiAgICAgIC8vIGlmIG5vIHBvcnQgaXMgc3BlY2lmaWVkIG1hbnVhbGx5LCB1c2UgdGhlIHByb3RvY29sIGRlZmF1bHRcclxuICAgICAgb3B0cy5wb3J0ID0gdGhpcy5zZWN1cmUgPyAnNDQzJyA6ICc4MCc7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLmFnZW50ID0gb3B0cy5hZ2VudCB8fCBmYWxzZTtcclxuICB0aGlzLmhvc3RuYW1lID0gb3B0cy5ob3N0bmFtZSB8fFxyXG4gICAgKGdsb2JhbC5sb2NhdGlvbiA/IGxvY2F0aW9uLmhvc3RuYW1lIDogJ2xvY2FsaG9zdCcpO1xyXG4gIHRoaXMucG9ydCA9IG9wdHMucG9ydCB8fCAoZ2xvYmFsLmxvY2F0aW9uICYmIGxvY2F0aW9uLnBvcnQgP1xyXG4gICAgICAgbG9jYXRpb24ucG9ydCA6XHJcbiAgICAgICAodGhpcy5zZWN1cmUgPyA0NDMgOiA4MCkpO1xyXG4gIHRoaXMucXVlcnkgPSBvcHRzLnF1ZXJ5IHx8IHt9O1xyXG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgdGhpcy5xdWVyeSkgdGhpcy5xdWVyeSA9IHBhcnNlcXMuZGVjb2RlKHRoaXMucXVlcnkpO1xyXG4gIHRoaXMudXBncmFkZSA9IGZhbHNlICE9PSBvcHRzLnVwZ3JhZGU7XHJcbiAgdGhpcy5wYXRoID0gKG9wdHMucGF0aCB8fCAnL2VuZ2luZS5pbycpLnJlcGxhY2UoL1xcLyQvLCAnJykgKyAnLyc7XHJcbiAgdGhpcy5mb3JjZUpTT05QID0gISFvcHRzLmZvcmNlSlNPTlA7XHJcbiAgdGhpcy5qc29ucCA9IGZhbHNlICE9PSBvcHRzLmpzb25wO1xyXG4gIHRoaXMuZm9yY2VCYXNlNjQgPSAhIW9wdHMuZm9yY2VCYXNlNjQ7XHJcbiAgdGhpcy5lbmFibGVzWERSID0gISFvcHRzLmVuYWJsZXNYRFI7XHJcbiAgdGhpcy50aW1lc3RhbXBQYXJhbSA9IG9wdHMudGltZXN0YW1wUGFyYW0gfHwgJ3QnO1xyXG4gIHRoaXMudGltZXN0YW1wUmVxdWVzdHMgPSBvcHRzLnRpbWVzdGFtcFJlcXVlc3RzO1xyXG4gIHRoaXMudHJhbnNwb3J0cyA9IG9wdHMudHJhbnNwb3J0cyB8fCBbJ3BvbGxpbmcnLCAnd2Vic29ja2V0J107XHJcbiAgdGhpcy5yZWFkeVN0YXRlID0gJyc7XHJcbiAgdGhpcy53cml0ZUJ1ZmZlciA9IFtdO1xyXG4gIHRoaXMuY2FsbGJhY2tCdWZmZXIgPSBbXTtcclxuICB0aGlzLnBvbGljeVBvcnQgPSBvcHRzLnBvbGljeVBvcnQgfHwgODQzO1xyXG4gIHRoaXMucmVtZW1iZXJVcGdyYWRlID0gb3B0cy5yZW1lbWJlclVwZ3JhZGUgfHwgZmFsc2U7XHJcbiAgdGhpcy5iaW5hcnlUeXBlID0gbnVsbDtcclxuICB0aGlzLm9ubHlCaW5hcnlVcGdyYWRlcyA9IG9wdHMub25seUJpbmFyeVVwZ3JhZGVzO1xyXG5cclxuICAvLyBTU0wgb3B0aW9ucyBmb3IgTm9kZS5qcyBjbGllbnRcclxuICB0aGlzLnBmeCA9IG9wdHMucGZ4IHx8IG51bGw7XHJcbiAgdGhpcy5rZXkgPSBvcHRzLmtleSB8fCBudWxsO1xyXG4gIHRoaXMucGFzc3BocmFzZSA9IG9wdHMucGFzc3BocmFzZSB8fCBudWxsO1xyXG4gIHRoaXMuY2VydCA9IG9wdHMuY2VydCB8fCBudWxsO1xyXG4gIHRoaXMuY2EgPSBvcHRzLmNhIHx8IG51bGw7XHJcbiAgdGhpcy5jaXBoZXJzID0gb3B0cy5jaXBoZXJzIHx8IG51bGw7XHJcbiAgdGhpcy5yZWplY3RVbmF1dGhvcml6ZWQgPSBvcHRzLnJlamVjdFVuYXV0aG9yaXplZCB8fCBudWxsO1xyXG5cclxuICB0aGlzLm9wZW4oKTtcclxufVxyXG5cclxuU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xyXG5cclxuLyoqXHJcbiAqIE1peCBpbiBgRW1pdHRlcmAuXHJcbiAqL1xyXG5cclxuRW1pdHRlcihTb2NrZXQucHJvdG90eXBlKTtcclxuXHJcbi8qKlxyXG4gKiBQcm90b2NvbCB2ZXJzaW9uLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b2NvbCA9IHBhcnNlci5wcm90b2NvbDsgLy8gdGhpcyBpcyBhbiBpbnRcclxuXHJcbi8qKlxyXG4gKiBFeHBvc2UgZGVwcyBmb3IgbGVnYWN5IGNvbXBhdGliaWxpdHlcclxuICogYW5kIHN0YW5kYWxvbmUgYnJvd3NlciBhY2Nlc3MuXHJcbiAqL1xyXG5cclxuU29ja2V0LlNvY2tldCA9IFNvY2tldDtcclxuU29ja2V0LlRyYW5zcG9ydCA9IF9kZXJlcV8oJy4vdHJhbnNwb3J0Jyk7XHJcblNvY2tldC50cmFuc3BvcnRzID0gX2RlcmVxXygnLi90cmFuc3BvcnRzJyk7XHJcblNvY2tldC5wYXJzZXIgPSBfZGVyZXFfKCdlbmdpbmUuaW8tcGFyc2VyJyk7XHJcblxyXG4vKipcclxuICogQ3JlYXRlcyB0cmFuc3BvcnQgb2YgdGhlIGdpdmVuIHR5cGUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSB0cmFuc3BvcnQgbmFtZVxyXG4gKiBAcmV0dXJuIHtUcmFuc3BvcnR9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUuY3JlYXRlVHJhbnNwb3J0ID0gZnVuY3Rpb24gKG5hbWUpIHtcclxuICBkZWJ1ZygnY3JlYXRpbmcgdHJhbnNwb3J0IFwiJXNcIicsIG5hbWUpO1xyXG4gIHZhciBxdWVyeSA9IGNsb25lKHRoaXMucXVlcnkpO1xyXG5cclxuICAvLyBhcHBlbmQgZW5naW5lLmlvIHByb3RvY29sIGlkZW50aWZpZXJcclxuICBxdWVyeS5FSU8gPSBwYXJzZXIucHJvdG9jb2w7XHJcblxyXG4gIC8vIHRyYW5zcG9ydCBuYW1lXHJcbiAgcXVlcnkudHJhbnNwb3J0ID0gbmFtZTtcclxuXHJcbiAgLy8gc2Vzc2lvbiBpZCBpZiB3ZSBhbHJlYWR5IGhhdmUgb25lXHJcbiAgaWYgKHRoaXMuaWQpIHF1ZXJ5LnNpZCA9IHRoaXMuaWQ7XHJcblxyXG4gIHZhciB0cmFuc3BvcnQgPSBuZXcgdHJhbnNwb3J0c1tuYW1lXSh7XHJcbiAgICBhZ2VudDogdGhpcy5hZ2VudCxcclxuICAgIGhvc3RuYW1lOiB0aGlzLmhvc3RuYW1lLFxyXG4gICAgcG9ydDogdGhpcy5wb3J0LFxyXG4gICAgc2VjdXJlOiB0aGlzLnNlY3VyZSxcclxuICAgIHBhdGg6IHRoaXMucGF0aCxcclxuICAgIHF1ZXJ5OiBxdWVyeSxcclxuICAgIGZvcmNlSlNPTlA6IHRoaXMuZm9yY2VKU09OUCxcclxuICAgIGpzb25wOiB0aGlzLmpzb25wLFxyXG4gICAgZm9yY2VCYXNlNjQ6IHRoaXMuZm9yY2VCYXNlNjQsXHJcbiAgICBlbmFibGVzWERSOiB0aGlzLmVuYWJsZXNYRFIsXHJcbiAgICB0aW1lc3RhbXBSZXF1ZXN0czogdGhpcy50aW1lc3RhbXBSZXF1ZXN0cyxcclxuICAgIHRpbWVzdGFtcFBhcmFtOiB0aGlzLnRpbWVzdGFtcFBhcmFtLFxyXG4gICAgcG9saWN5UG9ydDogdGhpcy5wb2xpY3lQb3J0LFxyXG4gICAgc29ja2V0OiB0aGlzLFxyXG4gICAgcGZ4OiB0aGlzLnBmeCxcclxuICAgIGtleTogdGhpcy5rZXksXHJcbiAgICBwYXNzcGhyYXNlOiB0aGlzLnBhc3NwaHJhc2UsXHJcbiAgICBjZXJ0OiB0aGlzLmNlcnQsXHJcbiAgICBjYTogdGhpcy5jYSxcclxuICAgIGNpcGhlcnM6IHRoaXMuY2lwaGVycyxcclxuICAgIHJlamVjdFVuYXV0aG9yaXplZDogdGhpcy5yZWplY3RVbmF1dGhvcml6ZWRcclxuICB9KTtcclxuXHJcbiAgcmV0dXJuIHRyYW5zcG9ydDtcclxufTtcclxuXHJcbmZ1bmN0aW9uIGNsb25lIChvYmopIHtcclxuICB2YXIgbyA9IHt9O1xyXG4gIGZvciAodmFyIGkgaW4gb2JqKSB7XHJcbiAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGkpKSB7XHJcbiAgICAgIG9baV0gPSBvYmpbaV07XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBvO1xyXG59XHJcblxyXG4vKipcclxuICogSW5pdGlhbGl6ZXMgdHJhbnNwb3J0IHRvIHVzZSBhbmQgc3RhcnRzIHByb2JlLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblNvY2tldC5wcm90b3R5cGUub3BlbiA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgdHJhbnNwb3J0O1xyXG4gIGlmICh0aGlzLnJlbWVtYmVyVXBncmFkZSAmJiBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzICYmIHRoaXMudHJhbnNwb3J0cy5pbmRleE9mKCd3ZWJzb2NrZXQnKSAhPSAtMSkge1xyXG4gICAgdHJhbnNwb3J0ID0gJ3dlYnNvY2tldCc7XHJcbiAgfSBlbHNlIGlmICgwID09IHRoaXMudHJhbnNwb3J0cy5sZW5ndGgpIHtcclxuICAgIC8vIEVtaXQgZXJyb3Igb24gbmV4dCB0aWNrIHNvIGl0IGNhbiBiZSBsaXN0ZW5lZCB0b1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcclxuICAgICAgc2VsZi5lbWl0KCdlcnJvcicsICdObyB0cmFuc3BvcnRzIGF2YWlsYWJsZScpO1xyXG4gICAgfSwgMCk7XHJcbiAgICByZXR1cm47XHJcbiAgfSBlbHNlIHtcclxuICAgIHRyYW5zcG9ydCA9IHRoaXMudHJhbnNwb3J0c1swXTtcclxuICB9XHJcbiAgdGhpcy5yZWFkeVN0YXRlID0gJ29wZW5pbmcnO1xyXG5cclxuICAvLyBSZXRyeSB3aXRoIHRoZSBuZXh0IHRyYW5zcG9ydCBpZiB0aGUgdHJhbnNwb3J0IGlzIGRpc2FibGVkIChqc29ucDogZmFsc2UpXHJcbiAgdmFyIHRyYW5zcG9ydDtcclxuICB0cnkge1xyXG4gICAgdHJhbnNwb3J0ID0gdGhpcy5jcmVhdGVUcmFuc3BvcnQodHJhbnNwb3J0KTtcclxuICB9IGNhdGNoIChlKSB7XHJcbiAgICB0aGlzLnRyYW5zcG9ydHMuc2hpZnQoKTtcclxuICAgIHRoaXMub3BlbigpO1xyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdHJhbnNwb3J0Lm9wZW4oKTtcclxuICB0aGlzLnNldFRyYW5zcG9ydCh0cmFuc3BvcnQpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFNldHMgdGhlIGN1cnJlbnQgdHJhbnNwb3J0LiBEaXNhYmxlcyB0aGUgZXhpc3Rpbmcgb25lIChpZiBhbnkpLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLnNldFRyYW5zcG9ydCA9IGZ1bmN0aW9uKHRyYW5zcG9ydCl7XHJcbiAgZGVidWcoJ3NldHRpbmcgdHJhbnNwb3J0ICVzJywgdHJhbnNwb3J0Lm5hbWUpO1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKHRoaXMudHJhbnNwb3J0KSB7XHJcbiAgICBkZWJ1ZygnY2xlYXJpbmcgZXhpc3RpbmcgdHJhbnNwb3J0ICVzJywgdGhpcy50cmFuc3BvcnQubmFtZSk7XHJcbiAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcclxuICB9XHJcblxyXG4gIC8vIHNldCB1cCB0cmFuc3BvcnRcclxuICB0aGlzLnRyYW5zcG9ydCA9IHRyYW5zcG9ydDtcclxuXHJcbiAgLy8gc2V0IHVwIHRyYW5zcG9ydCBsaXN0ZW5lcnNcclxuICB0cmFuc3BvcnRcclxuICAub24oJ2RyYWluJywgZnVuY3Rpb24oKXtcclxuICAgIHNlbGYub25EcmFpbigpO1xyXG4gIH0pXHJcbiAgLm9uKCdwYWNrZXQnLCBmdW5jdGlvbihwYWNrZXQpe1xyXG4gICAgc2VsZi5vblBhY2tldChwYWNrZXQpO1xyXG4gIH0pXHJcbiAgLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGUpe1xyXG4gICAgc2VsZi5vbkVycm9yKGUpO1xyXG4gIH0pXHJcbiAgLm9uKCdjbG9zZScsIGZ1bmN0aW9uKCl7XHJcbiAgICBzZWxmLm9uQ2xvc2UoJ3RyYW5zcG9ydCBjbG9zZScpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFByb2JlcyBhIHRyYW5zcG9ydC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHRyYW5zcG9ydCBuYW1lXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUucHJvYmUgPSBmdW5jdGlvbiAobmFtZSkge1xyXG4gIGRlYnVnKCdwcm9iaW5nIHRyYW5zcG9ydCBcIiVzXCInLCBuYW1lKTtcclxuICB2YXIgdHJhbnNwb3J0ID0gdGhpcy5jcmVhdGVUcmFuc3BvcnQobmFtZSwgeyBwcm9iZTogMSB9KVxyXG4gICAgLCBmYWlsZWQgPSBmYWxzZVxyXG4gICAgLCBzZWxmID0gdGhpcztcclxuXHJcbiAgU29ja2V0LnByaW9yV2Vic29ja2V0U3VjY2VzcyA9IGZhbHNlO1xyXG5cclxuICBmdW5jdGlvbiBvblRyYW5zcG9ydE9wZW4oKXtcclxuICAgIGlmIChzZWxmLm9ubHlCaW5hcnlVcGdyYWRlcykge1xyXG4gICAgICB2YXIgdXBncmFkZUxvc2VzQmluYXJ5ID0gIXRoaXMuc3VwcG9ydHNCaW5hcnkgJiYgc2VsZi50cmFuc3BvcnQuc3VwcG9ydHNCaW5hcnk7XHJcbiAgICAgIGZhaWxlZCA9IGZhaWxlZCB8fCB1cGdyYWRlTG9zZXNCaW5hcnk7XHJcbiAgICB9XHJcbiAgICBpZiAoZmFpbGVkKSByZXR1cm47XHJcblxyXG4gICAgZGVidWcoJ3Byb2JlIHRyYW5zcG9ydCBcIiVzXCIgb3BlbmVkJywgbmFtZSk7XHJcbiAgICB0cmFuc3BvcnQuc2VuZChbeyB0eXBlOiAncGluZycsIGRhdGE6ICdwcm9iZScgfV0pO1xyXG4gICAgdHJhbnNwb3J0Lm9uY2UoJ3BhY2tldCcsIGZ1bmN0aW9uIChtc2cpIHtcclxuICAgICAgaWYgKGZhaWxlZCkgcmV0dXJuO1xyXG4gICAgICBpZiAoJ3BvbmcnID09IG1zZy50eXBlICYmICdwcm9iZScgPT0gbXNnLmRhdGEpIHtcclxuICAgICAgICBkZWJ1ZygncHJvYmUgdHJhbnNwb3J0IFwiJXNcIiBwb25nJywgbmFtZSk7XHJcbiAgICAgICAgc2VsZi51cGdyYWRpbmcgPSB0cnVlO1xyXG4gICAgICAgIHNlbGYuZW1pdCgndXBncmFkaW5nJywgdHJhbnNwb3J0KTtcclxuICAgICAgICBpZiAoIXRyYW5zcG9ydCkgcmV0dXJuO1xyXG4gICAgICAgIFNvY2tldC5wcmlvcldlYnNvY2tldFN1Y2Nlc3MgPSAnd2Vic29ja2V0JyA9PSB0cmFuc3BvcnQubmFtZTtcclxuXHJcbiAgICAgICAgZGVidWcoJ3BhdXNpbmcgY3VycmVudCB0cmFuc3BvcnQgXCIlc1wiJywgc2VsZi50cmFuc3BvcnQubmFtZSk7XHJcbiAgICAgICAgc2VsZi50cmFuc3BvcnQucGF1c2UoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgaWYgKGZhaWxlZCkgcmV0dXJuO1xyXG4gICAgICAgICAgaWYgKCdjbG9zZWQnID09IHNlbGYucmVhZHlTdGF0ZSkgcmV0dXJuO1xyXG4gICAgICAgICAgZGVidWcoJ2NoYW5naW5nIHRyYW5zcG9ydCBhbmQgc2VuZGluZyB1cGdyYWRlIHBhY2tldCcpO1xyXG5cclxuICAgICAgICAgIGNsZWFudXAoKTtcclxuXHJcbiAgICAgICAgICBzZWxmLnNldFRyYW5zcG9ydCh0cmFuc3BvcnQpO1xyXG4gICAgICAgICAgdHJhbnNwb3J0LnNlbmQoW3sgdHlwZTogJ3VwZ3JhZGUnIH1dKTtcclxuICAgICAgICAgIHNlbGYuZW1pdCgndXBncmFkZScsIHRyYW5zcG9ydCk7XHJcbiAgICAgICAgICB0cmFuc3BvcnQgPSBudWxsO1xyXG4gICAgICAgICAgc2VsZi51cGdyYWRpbmcgPSBmYWxzZTtcclxuICAgICAgICAgIHNlbGYuZmx1c2goKTtcclxuICAgICAgICB9KTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBkZWJ1ZygncHJvYmUgdHJhbnNwb3J0IFwiJXNcIiBmYWlsZWQnLCBuYW1lKTtcclxuICAgICAgICB2YXIgZXJyID0gbmV3IEVycm9yKCdwcm9iZSBlcnJvcicpO1xyXG4gICAgICAgIGVyci50cmFuc3BvcnQgPSB0cmFuc3BvcnQubmFtZTtcclxuICAgICAgICBzZWxmLmVtaXQoJ3VwZ3JhZGVFcnJvcicsIGVycik7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gZnJlZXplVHJhbnNwb3J0KCkge1xyXG4gICAgaWYgKGZhaWxlZCkgcmV0dXJuO1xyXG5cclxuICAgIC8vIEFueSBjYWxsYmFjayBjYWxsZWQgYnkgdHJhbnNwb3J0IHNob3VsZCBiZSBpZ25vcmVkIHNpbmNlIG5vd1xyXG4gICAgZmFpbGVkID0gdHJ1ZTtcclxuXHJcbiAgICBjbGVhbnVwKCk7XHJcblxyXG4gICAgdHJhbnNwb3J0LmNsb3NlKCk7XHJcbiAgICB0cmFuc3BvcnQgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgLy9IYW5kbGUgYW55IGVycm9yIHRoYXQgaGFwcGVucyB3aGlsZSBwcm9iaW5nXHJcbiAgZnVuY3Rpb24gb25lcnJvcihlcnIpIHtcclxuICAgIHZhciBlcnJvciA9IG5ldyBFcnJvcigncHJvYmUgZXJyb3I6ICcgKyBlcnIpO1xyXG4gICAgZXJyb3IudHJhbnNwb3J0ID0gdHJhbnNwb3J0Lm5hbWU7XHJcblxyXG4gICAgZnJlZXplVHJhbnNwb3J0KCk7XHJcblxyXG4gICAgZGVidWcoJ3Byb2JlIHRyYW5zcG9ydCBcIiVzXCIgZmFpbGVkIGJlY2F1c2Ugb2YgZXJyb3I6ICVzJywgbmFtZSwgZXJyKTtcclxuXHJcbiAgICBzZWxmLmVtaXQoJ3VwZ3JhZGVFcnJvcicsIGVycm9yKTtcclxuICB9XHJcblxyXG4gIGZ1bmN0aW9uIG9uVHJhbnNwb3J0Q2xvc2UoKXtcclxuICAgIG9uZXJyb3IoXCJ0cmFuc3BvcnQgY2xvc2VkXCIpO1xyXG4gIH1cclxuXHJcbiAgLy9XaGVuIHRoZSBzb2NrZXQgaXMgY2xvc2VkIHdoaWxlIHdlJ3JlIHByb2JpbmdcclxuICBmdW5jdGlvbiBvbmNsb3NlKCl7XHJcbiAgICBvbmVycm9yKFwic29ja2V0IGNsb3NlZFwiKTtcclxuICB9XHJcblxyXG4gIC8vV2hlbiB0aGUgc29ja2V0IGlzIHVwZ3JhZGVkIHdoaWxlIHdlJ3JlIHByb2JpbmdcclxuICBmdW5jdGlvbiBvbnVwZ3JhZGUodG8pe1xyXG4gICAgaWYgKHRyYW5zcG9ydCAmJiB0by5uYW1lICE9IHRyYW5zcG9ydC5uYW1lKSB7XHJcbiAgICAgIGRlYnVnKCdcIiVzXCIgd29ya3MgLSBhYm9ydGluZyBcIiVzXCInLCB0by5uYW1lLCB0cmFuc3BvcnQubmFtZSk7XHJcbiAgICAgIGZyZWV6ZVRyYW5zcG9ydCgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgLy9SZW1vdmUgYWxsIGxpc3RlbmVycyBvbiB0aGUgdHJhbnNwb3J0IGFuZCBvbiBzZWxmXHJcbiAgZnVuY3Rpb24gY2xlYW51cCgpe1xyXG4gICAgdHJhbnNwb3J0LnJlbW92ZUxpc3RlbmVyKCdvcGVuJywgb25UcmFuc3BvcnRPcGVuKTtcclxuICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcignZXJyb3InLCBvbmVycm9yKTtcclxuICAgIHRyYW5zcG9ydC5yZW1vdmVMaXN0ZW5lcignY2xvc2UnLCBvblRyYW5zcG9ydENsb3NlKTtcclxuICAgIHNlbGYucmVtb3ZlTGlzdGVuZXIoJ2Nsb3NlJywgb25jbG9zZSk7XHJcbiAgICBzZWxmLnJlbW92ZUxpc3RlbmVyKCd1cGdyYWRpbmcnLCBvbnVwZ3JhZGUpO1xyXG4gIH1cclxuXHJcbiAgdHJhbnNwb3J0Lm9uY2UoJ29wZW4nLCBvblRyYW5zcG9ydE9wZW4pO1xyXG4gIHRyYW5zcG9ydC5vbmNlKCdlcnJvcicsIG9uZXJyb3IpO1xyXG4gIHRyYW5zcG9ydC5vbmNlKCdjbG9zZScsIG9uVHJhbnNwb3J0Q2xvc2UpO1xyXG5cclxuICB0aGlzLm9uY2UoJ2Nsb3NlJywgb25jbG9zZSk7XHJcbiAgdGhpcy5vbmNlKCd1cGdyYWRpbmcnLCBvbnVwZ3JhZGUpO1xyXG5cclxuICB0cmFuc3BvcnQub3BlbigpO1xyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgd2hlbiBjb25uZWN0aW9uIGlzIGRlZW1lZCBvcGVuLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUub25PcGVuID0gZnVuY3Rpb24gKCkge1xyXG4gIGRlYnVnKCdzb2NrZXQgb3BlbicpO1xyXG4gIHRoaXMucmVhZHlTdGF0ZSA9ICdvcGVuJztcclxuICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gJ3dlYnNvY2tldCcgPT0gdGhpcy50cmFuc3BvcnQubmFtZTtcclxuICB0aGlzLmVtaXQoJ29wZW4nKTtcclxuICB0aGlzLmZsdXNoKCk7XHJcblxyXG4gIC8vIHdlIGNoZWNrIGZvciBgcmVhZHlTdGF0ZWAgaW4gY2FzZSBhbiBgb3BlbmBcclxuICAvLyBsaXN0ZW5lciBhbHJlYWR5IGNsb3NlZCB0aGUgc29ja2V0XHJcbiAgaWYgKCdvcGVuJyA9PSB0aGlzLnJlYWR5U3RhdGUgJiYgdGhpcy51cGdyYWRlICYmIHRoaXMudHJhbnNwb3J0LnBhdXNlKSB7XHJcbiAgICBkZWJ1Zygnc3RhcnRpbmcgdXBncmFkZSBwcm9iZXMnKTtcclxuICAgIGZvciAodmFyIGkgPSAwLCBsID0gdGhpcy51cGdyYWRlcy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuICAgICAgdGhpcy5wcm9iZSh0aGlzLnVwZ3JhZGVzW2ldKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogSGFuZGxlcyBhIHBhY2tldC5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5vblBhY2tldCA9IGZ1bmN0aW9uIChwYWNrZXQpIHtcclxuICBpZiAoJ29wZW5pbmcnID09IHRoaXMucmVhZHlTdGF0ZSB8fCAnb3BlbicgPT0gdGhpcy5yZWFkeVN0YXRlKSB7XHJcbiAgICBkZWJ1Zygnc29ja2V0IHJlY2VpdmU6IHR5cGUgXCIlc1wiLCBkYXRhIFwiJXNcIicsIHBhY2tldC50eXBlLCBwYWNrZXQuZGF0YSk7XHJcblxyXG4gICAgdGhpcy5lbWl0KCdwYWNrZXQnLCBwYWNrZXQpO1xyXG5cclxuICAgIC8vIFNvY2tldCBpcyBsaXZlIC0gYW55IHBhY2tldCBjb3VudHNcclxuICAgIHRoaXMuZW1pdCgnaGVhcnRiZWF0Jyk7XHJcblxyXG4gICAgc3dpdGNoIChwYWNrZXQudHlwZSkge1xyXG4gICAgICBjYXNlICdvcGVuJzpcclxuICAgICAgICB0aGlzLm9uSGFuZHNoYWtlKHBhcnNlanNvbihwYWNrZXQuZGF0YSkpO1xyXG4gICAgICAgIGJyZWFrO1xyXG5cclxuICAgICAgY2FzZSAncG9uZyc6XHJcbiAgICAgICAgdGhpcy5zZXRQaW5nKCk7XHJcbiAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICBjYXNlICdlcnJvcic6XHJcbiAgICAgICAgdmFyIGVyciA9IG5ldyBFcnJvcignc2VydmVyIGVycm9yJyk7XHJcbiAgICAgICAgZXJyLmNvZGUgPSBwYWNrZXQuZGF0YTtcclxuICAgICAgICB0aGlzLmVtaXQoJ2Vycm9yJywgZXJyKTtcclxuICAgICAgICBicmVhaztcclxuXHJcbiAgICAgIGNhc2UgJ21lc3NhZ2UnOlxyXG4gICAgICAgIHRoaXMuZW1pdCgnZGF0YScsIHBhY2tldC5kYXRhKTtcclxuICAgICAgICB0aGlzLmVtaXQoJ21lc3NhZ2UnLCBwYWNrZXQuZGF0YSk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIGRlYnVnKCdwYWNrZXQgcmVjZWl2ZWQgd2l0aCBzb2NrZXQgcmVhZHlTdGF0ZSBcIiVzXCInLCB0aGlzLnJlYWR5U3RhdGUpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgdXBvbiBoYW5kc2hha2UgY29tcGxldGlvbi5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGhhbmRzaGFrZSBvYmpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5vbkhhbmRzaGFrZSA9IGZ1bmN0aW9uIChkYXRhKSB7XHJcbiAgdGhpcy5lbWl0KCdoYW5kc2hha2UnLCBkYXRhKTtcclxuICB0aGlzLmlkID0gZGF0YS5zaWQ7XHJcbiAgdGhpcy50cmFuc3BvcnQucXVlcnkuc2lkID0gZGF0YS5zaWQ7XHJcbiAgdGhpcy51cGdyYWRlcyA9IHRoaXMuZmlsdGVyVXBncmFkZXMoZGF0YS51cGdyYWRlcyk7XHJcbiAgdGhpcy5waW5nSW50ZXJ2YWwgPSBkYXRhLnBpbmdJbnRlcnZhbDtcclxuICB0aGlzLnBpbmdUaW1lb3V0ID0gZGF0YS5waW5nVGltZW91dDtcclxuICB0aGlzLm9uT3BlbigpO1xyXG4gIC8vIEluIGNhc2Ugb3BlbiBoYW5kbGVyIGNsb3NlcyBzb2NrZXRcclxuICBpZiAgKCdjbG9zZWQnID09IHRoaXMucmVhZHlTdGF0ZSkgcmV0dXJuO1xyXG4gIHRoaXMuc2V0UGluZygpO1xyXG5cclxuICAvLyBQcm9sb25nIGxpdmVuZXNzIG9mIHNvY2tldCBvbiBoZWFydGJlYXRcclxuICB0aGlzLnJlbW92ZUxpc3RlbmVyKCdoZWFydGJlYXQnLCB0aGlzLm9uSGVhcnRiZWF0KTtcclxuICB0aGlzLm9uKCdoZWFydGJlYXQnLCB0aGlzLm9uSGVhcnRiZWF0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXNldHMgcGluZyB0aW1lb3V0LlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLm9uSGVhcnRiZWF0ID0gZnVuY3Rpb24gKHRpbWVvdXQpIHtcclxuICBjbGVhclRpbWVvdXQodGhpcy5waW5nVGltZW91dFRpbWVyKTtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgc2VsZi5waW5nVGltZW91dFRpbWVyID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICBpZiAoJ2Nsb3NlZCcgPT0gc2VsZi5yZWFkeVN0YXRlKSByZXR1cm47XHJcbiAgICBzZWxmLm9uQ2xvc2UoJ3BpbmcgdGltZW91dCcpO1xyXG4gIH0sIHRpbWVvdXQgfHwgKHNlbGYucGluZ0ludGVydmFsICsgc2VsZi5waW5nVGltZW91dCkpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFBpbmdzIHNlcnZlciBldmVyeSBgdGhpcy5waW5nSW50ZXJ2YWxgIGFuZCBleHBlY3RzIHJlc3BvbnNlXHJcbiAqIHdpdGhpbiBgdGhpcy5waW5nVGltZW91dGAgb3IgY2xvc2VzIGNvbm5lY3Rpb24uXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUuc2V0UGluZyA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgY2xlYXJUaW1lb3V0KHNlbGYucGluZ0ludGVydmFsVGltZXIpO1xyXG4gIHNlbGYucGluZ0ludGVydmFsVGltZXIgPSBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcclxuICAgIGRlYnVnKCd3cml0aW5nIHBpbmcgcGFja2V0IC0gZXhwZWN0aW5nIHBvbmcgd2l0aGluICVzbXMnLCBzZWxmLnBpbmdUaW1lb3V0KTtcclxuICAgIHNlbGYucGluZygpO1xyXG4gICAgc2VsZi5vbkhlYXJ0YmVhdChzZWxmLnBpbmdUaW1lb3V0KTtcclxuICB9LCBzZWxmLnBpbmdJbnRlcnZhbCk7XHJcbn07XHJcblxyXG4vKipcclxuKiBTZW5kcyBhIHBpbmcgcGFja2V0LlxyXG4qXHJcbiogQGFwaSBwdWJsaWNcclxuKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUucGluZyA9IGZ1bmN0aW9uICgpIHtcclxuICB0aGlzLnNlbmRQYWNrZXQoJ3BpbmcnKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgb24gYGRyYWluYCBldmVudFxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLm9uRHJhaW4gPSBmdW5jdGlvbigpIHtcclxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucHJldkJ1ZmZlckxlbjsgaSsrKSB7XHJcbiAgICBpZiAodGhpcy5jYWxsYmFja0J1ZmZlcltpXSkge1xyXG4gICAgICB0aGlzLmNhbGxiYWNrQnVmZmVyW2ldKCk7XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB0aGlzLndyaXRlQnVmZmVyLnNwbGljZSgwLCB0aGlzLnByZXZCdWZmZXJMZW4pO1xyXG4gIHRoaXMuY2FsbGJhY2tCdWZmZXIuc3BsaWNlKDAsIHRoaXMucHJldkJ1ZmZlckxlbik7XHJcblxyXG4gIC8vIHNldHRpbmcgcHJldkJ1ZmZlckxlbiA9IDAgaXMgdmVyeSBpbXBvcnRhbnRcclxuICAvLyBmb3IgZXhhbXBsZSwgd2hlbiB1cGdyYWRpbmcsIHVwZ3JhZGUgcGFja2V0IGlzIHNlbnQgb3ZlcixcclxuICAvLyBhbmQgYSBub256ZXJvIHByZXZCdWZmZXJMZW4gY291bGQgY2F1c2UgcHJvYmxlbXMgb24gYGRyYWluYFxyXG4gIHRoaXMucHJldkJ1ZmZlckxlbiA9IDA7XHJcblxyXG4gIGlmICh0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCA9PSAwKSB7XHJcbiAgICB0aGlzLmVtaXQoJ2RyYWluJyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIHRoaXMuZmx1c2goKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRmx1c2ggd3JpdGUgYnVmZmVycy5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5mbHVzaCA9IGZ1bmN0aW9uICgpIHtcclxuICBpZiAoJ2Nsb3NlZCcgIT0gdGhpcy5yZWFkeVN0YXRlICYmIHRoaXMudHJhbnNwb3J0LndyaXRhYmxlICYmXHJcbiAgICAhdGhpcy51cGdyYWRpbmcgJiYgdGhpcy53cml0ZUJ1ZmZlci5sZW5ndGgpIHtcclxuICAgIGRlYnVnKCdmbHVzaGluZyAlZCBwYWNrZXRzIGluIHNvY2tldCcsIHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoKTtcclxuICAgIHRoaXMudHJhbnNwb3J0LnNlbmQodGhpcy53cml0ZUJ1ZmZlcik7XHJcbiAgICAvLyBrZWVwIHRyYWNrIG9mIGN1cnJlbnQgbGVuZ3RoIG9mIHdyaXRlQnVmZmVyXHJcbiAgICAvLyBzcGxpY2Ugd3JpdGVCdWZmZXIgYW5kIGNhbGxiYWNrQnVmZmVyIG9uIGBkcmFpbmBcclxuICAgIHRoaXMucHJldkJ1ZmZlckxlbiA9IHRoaXMud3JpdGVCdWZmZXIubGVuZ3RoO1xyXG4gICAgdGhpcy5lbWl0KCdmbHVzaCcpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBTZW5kcyBhIG1lc3NhZ2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBtZXNzYWdlLlxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayBmdW5jdGlvbi5cclxuICogQHJldHVybiB7U29ja2V0fSBmb3IgY2hhaW5pbmcuXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS53cml0ZSA9XHJcblNvY2tldC5wcm90b3R5cGUuc2VuZCA9IGZ1bmN0aW9uIChtc2csIGZuKSB7XHJcbiAgdGhpcy5zZW5kUGFja2V0KCdtZXNzYWdlJywgbXNnLCBmbik7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgYSBwYWNrZXQuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBwYWNrZXQgdHlwZS5cclxuICogQHBhcmFtIHtTdHJpbmd9IGRhdGEuXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrIGZ1bmN0aW9uLlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLnNlbmRQYWNrZXQgPSBmdW5jdGlvbiAodHlwZSwgZGF0YSwgZm4pIHtcclxuICBpZiAoJ2Nsb3NpbmcnID09IHRoaXMucmVhZHlTdGF0ZSB8fCAnY2xvc2VkJyA9PSB0aGlzLnJlYWR5U3RhdGUpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIHZhciBwYWNrZXQgPSB7IHR5cGU6IHR5cGUsIGRhdGE6IGRhdGEgfTtcclxuICB0aGlzLmVtaXQoJ3BhY2tldENyZWF0ZScsIHBhY2tldCk7XHJcbiAgdGhpcy53cml0ZUJ1ZmZlci5wdXNoKHBhY2tldCk7XHJcbiAgdGhpcy5jYWxsYmFja0J1ZmZlci5wdXNoKGZuKTtcclxuICB0aGlzLmZsdXNoKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2xvc2VzIHRoZSBjb25uZWN0aW9uLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Tb2NrZXQucHJvdG90eXBlLmNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gIGlmICgnb3BlbmluZycgPT0gdGhpcy5yZWFkeVN0YXRlIHx8ICdvcGVuJyA9PSB0aGlzLnJlYWR5U3RhdGUpIHtcclxuICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdjbG9zaW5nJztcclxuXHJcbiAgICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gICAgZnVuY3Rpb24gY2xvc2UoKSB7XHJcbiAgICAgIHNlbGYub25DbG9zZSgnZm9yY2VkIGNsb3NlJyk7XHJcbiAgICAgIGRlYnVnKCdzb2NrZXQgY2xvc2luZyAtIHRlbGxpbmcgdHJhbnNwb3J0IHRvIGNsb3NlJyk7XHJcbiAgICAgIHNlbGYudHJhbnNwb3J0LmNsb3NlKCk7XHJcbiAgICB9XHJcblxyXG4gICAgZnVuY3Rpb24gY2xlYW51cEFuZENsb3NlKCkge1xyXG4gICAgICBzZWxmLnJlbW92ZUxpc3RlbmVyKCd1cGdyYWRlJywgY2xlYW51cEFuZENsb3NlKTtcclxuICAgICAgc2VsZi5yZW1vdmVMaXN0ZW5lcigndXBncmFkZUVycm9yJywgY2xlYW51cEFuZENsb3NlKTtcclxuICAgICAgY2xvc2UoKTtcclxuICAgIH1cclxuXHJcbiAgICBmdW5jdGlvbiB3YWl0Rm9yVXBncmFkZSgpIHtcclxuICAgICAgLy8gd2FpdCBmb3IgdXBncmFkZSB0byBmaW5pc2ggc2luY2Ugd2UgY2FuJ3Qgc2VuZCBwYWNrZXRzIHdoaWxlIHBhdXNpbmcgYSB0cmFuc3BvcnRcclxuICAgICAgc2VsZi5vbmNlKCd1cGdyYWRlJywgY2xlYW51cEFuZENsb3NlKTtcclxuICAgICAgc2VsZi5vbmNlKCd1cGdyYWRlRXJyb3InLCBjbGVhbnVwQW5kQ2xvc2UpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0aGlzLndyaXRlQnVmZmVyLmxlbmd0aCkge1xyXG4gICAgICB0aGlzLm9uY2UoJ2RyYWluJywgZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgaWYgKHRoaXMudXBncmFkaW5nKSB7XHJcbiAgICAgICAgICB3YWl0Rm9yVXBncmFkZSgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICBjbG9zZSgpO1xyXG4gICAgICAgIH1cclxuICAgICAgfSk7XHJcbiAgICB9IGVsc2UgaWYgKHRoaXMudXBncmFkaW5nKSB7XHJcbiAgICAgIHdhaXRGb3JVcGdyYWRlKCk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBjbG9zZSgpO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHVwb24gdHJhbnNwb3J0IGVycm9yXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uIChlcnIpIHtcclxuICBkZWJ1Zygnc29ja2V0IGVycm9yICVqJywgZXJyKTtcclxuICBTb2NrZXQucHJpb3JXZWJzb2NrZXRTdWNjZXNzID0gZmFsc2U7XHJcbiAgdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XHJcbiAgdGhpcy5vbkNsb3NlKCd0cmFuc3BvcnQgZXJyb3InLCBlcnIpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCB1cG9uIHRyYW5zcG9ydCBjbG9zZS5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuU29ja2V0LnByb3RvdHlwZS5vbkNsb3NlID0gZnVuY3Rpb24gKHJlYXNvbiwgZGVzYykge1xyXG4gIGlmICgnb3BlbmluZycgPT0gdGhpcy5yZWFkeVN0YXRlIHx8ICdvcGVuJyA9PSB0aGlzLnJlYWR5U3RhdGUgfHwgJ2Nsb3NpbmcnID09IHRoaXMucmVhZHlTdGF0ZSkge1xyXG4gICAgZGVidWcoJ3NvY2tldCBjbG9zZSB3aXRoIHJlYXNvbjogXCIlc1wiJywgcmVhc29uKTtcclxuICAgIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgICAvLyBjbGVhciB0aW1lcnNcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLnBpbmdJbnRlcnZhbFRpbWVyKTtcclxuICAgIGNsZWFyVGltZW91dCh0aGlzLnBpbmdUaW1lb3V0VGltZXIpO1xyXG5cclxuICAgIC8vIGNsZWFuIGJ1ZmZlcnMgaW4gbmV4dCB0aWNrLCBzbyBkZXZlbG9wZXJzIGNhbiBzdGlsbFxyXG4gICAgLy8gZ3JhYiB0aGUgYnVmZmVycyBvbiBgY2xvc2VgIGV2ZW50XHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICBzZWxmLndyaXRlQnVmZmVyID0gW107XHJcbiAgICAgIHNlbGYuY2FsbGJhY2tCdWZmZXIgPSBbXTtcclxuICAgICAgc2VsZi5wcmV2QnVmZmVyTGVuID0gMDtcclxuICAgIH0sIDApO1xyXG5cclxuICAgIC8vIHN0b3AgZXZlbnQgZnJvbSBmaXJpbmcgYWdhaW4gZm9yIHRyYW5zcG9ydFxyXG4gICAgdGhpcy50cmFuc3BvcnQucmVtb3ZlQWxsTGlzdGVuZXJzKCdjbG9zZScpO1xyXG5cclxuICAgIC8vIGVuc3VyZSB0cmFuc3BvcnQgd29uJ3Qgc3RheSBvcGVuXHJcbiAgICB0aGlzLnRyYW5zcG9ydC5jbG9zZSgpO1xyXG5cclxuICAgIC8vIGlnbm9yZSBmdXJ0aGVyIHRyYW5zcG9ydCBjb21tdW5pY2F0aW9uXHJcbiAgICB0aGlzLnRyYW5zcG9ydC5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcclxuXHJcbiAgICAvLyBzZXQgcmVhZHkgc3RhdGVcclxuICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdjbG9zZWQnO1xyXG5cclxuICAgIC8vIGNsZWFyIHNlc3Npb24gaWRcclxuICAgIHRoaXMuaWQgPSBudWxsO1xyXG5cclxuICAgIC8vIGVtaXQgY2xvc2UgZXZlbnRcclxuICAgIHRoaXMuZW1pdCgnY2xvc2UnLCByZWFzb24sIGRlc2MpO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBGaWx0ZXJzIHVwZ3JhZGVzLCByZXR1cm5pbmcgb25seSB0aG9zZSBtYXRjaGluZyBjbGllbnQgdHJhbnNwb3J0cy5cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0gc2VydmVyIHVwZ3JhZGVzXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKlxyXG4gKi9cclxuXHJcblNvY2tldC5wcm90b3R5cGUuZmlsdGVyVXBncmFkZXMgPSBmdW5jdGlvbiAodXBncmFkZXMpIHtcclxuICB2YXIgZmlsdGVyZWRVcGdyYWRlcyA9IFtdO1xyXG4gIGZvciAodmFyIGkgPSAwLCBqID0gdXBncmFkZXMubGVuZ3RoOyBpPGo7IGkrKykge1xyXG4gICAgaWYgKH5pbmRleCh0aGlzLnRyYW5zcG9ydHMsIHVwZ3JhZGVzW2ldKSkgZmlsdGVyZWRVcGdyYWRlcy5wdXNoKHVwZ3JhZGVzW2ldKTtcclxuICB9XHJcbiAgcmV0dXJuIGZpbHRlcmVkVXBncmFkZXM7XHJcbn07XHJcblxyXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxyXG59LHtcIi4vdHJhbnNwb3J0XCI6MTQsXCIuL3RyYW5zcG9ydHNcIjoxNSxcImNvbXBvbmVudC1lbWl0dGVyXCI6OSxcImRlYnVnXCI6MjIsXCJlbmdpbmUuaW8tcGFyc2VyXCI6MjUsXCJpbmRleG9mXCI6NDIsXCJwYXJzZWpzb25cIjozNCxcInBhcnNlcXNcIjozNSxcInBhcnNldXJpXCI6MzZ9XSwxNDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbi8qKlxyXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxyXG4gKi9cclxuXHJcbnZhciBwYXJzZXIgPSBfZGVyZXFfKCdlbmdpbmUuaW8tcGFyc2VyJyk7XHJcbnZhciBFbWl0dGVyID0gX2RlcmVxXygnY29tcG9uZW50LWVtaXR0ZXInKTtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zcG9ydDtcclxuXHJcbi8qKlxyXG4gKiBUcmFuc3BvcnQgYWJzdHJhY3QgY29uc3RydWN0b3IuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zLlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5mdW5jdGlvbiBUcmFuc3BvcnQgKG9wdHMpIHtcclxuICB0aGlzLnBhdGggPSBvcHRzLnBhdGg7XHJcbiAgdGhpcy5ob3N0bmFtZSA9IG9wdHMuaG9zdG5hbWU7XHJcbiAgdGhpcy5wb3J0ID0gb3B0cy5wb3J0O1xyXG4gIHRoaXMuc2VjdXJlID0gb3B0cy5zZWN1cmU7XHJcbiAgdGhpcy5xdWVyeSA9IG9wdHMucXVlcnk7XHJcbiAgdGhpcy50aW1lc3RhbXBQYXJhbSA9IG9wdHMudGltZXN0YW1wUGFyYW07XHJcbiAgdGhpcy50aW1lc3RhbXBSZXF1ZXN0cyA9IG9wdHMudGltZXN0YW1wUmVxdWVzdHM7XHJcbiAgdGhpcy5yZWFkeVN0YXRlID0gJyc7XHJcbiAgdGhpcy5hZ2VudCA9IG9wdHMuYWdlbnQgfHwgZmFsc2U7XHJcbiAgdGhpcy5zb2NrZXQgPSBvcHRzLnNvY2tldDtcclxuICB0aGlzLmVuYWJsZXNYRFIgPSBvcHRzLmVuYWJsZXNYRFI7XHJcblxyXG4gIC8vIFNTTCBvcHRpb25zIGZvciBOb2RlLmpzIGNsaWVudFxyXG4gIHRoaXMucGZ4ID0gb3B0cy5wZng7XHJcbiAgdGhpcy5rZXkgPSBvcHRzLmtleTtcclxuICB0aGlzLnBhc3NwaHJhc2UgPSBvcHRzLnBhc3NwaHJhc2U7XHJcbiAgdGhpcy5jZXJ0ID0gb3B0cy5jZXJ0O1xyXG4gIHRoaXMuY2EgPSBvcHRzLmNhO1xyXG4gIHRoaXMuY2lwaGVycyA9IG9wdHMuY2lwaGVycztcclxuICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IG9wdHMucmVqZWN0VW5hdXRob3JpemVkO1xyXG59XHJcblxyXG4vKipcclxuICogTWl4IGluIGBFbWl0dGVyYC5cclxuICovXHJcblxyXG5FbWl0dGVyKFRyYW5zcG9ydC5wcm90b3R5cGUpO1xyXG5cclxuLyoqXHJcbiAqIEEgY291bnRlciB1c2VkIHRvIHByZXZlbnQgY29sbGlzaW9ucyBpbiB0aGUgdGltZXN0YW1wcyB1c2VkXHJcbiAqIGZvciBjYWNoZSBidXN0aW5nLlxyXG4gKi9cclxuXHJcblRyYW5zcG9ydC50aW1lc3RhbXBzID0gMDtcclxuXHJcbi8qKlxyXG4gKiBFbWl0cyBhbiBlcnJvci5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxyXG4gKiBAcmV0dXJuIHtUcmFuc3BvcnR9IGZvciBjaGFpbmluZ1xyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcblRyYW5zcG9ydC5wcm90b3R5cGUub25FcnJvciA9IGZ1bmN0aW9uIChtc2csIGRlc2MpIHtcclxuICB2YXIgZXJyID0gbmV3IEVycm9yKG1zZyk7XHJcbiAgZXJyLnR5cGUgPSAnVHJhbnNwb3J0RXJyb3InO1xyXG4gIGVyci5kZXNjcmlwdGlvbiA9IGRlc2M7XHJcbiAgdGhpcy5lbWl0KCdlcnJvcicsIGVycik7XHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogT3BlbnMgdGhlIHRyYW5zcG9ydC5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5UcmFuc3BvcnQucHJvdG90eXBlLm9wZW4gPSBmdW5jdGlvbiAoKSB7XHJcbiAgaWYgKCdjbG9zZWQnID09IHRoaXMucmVhZHlTdGF0ZSB8fCAnJyA9PSB0aGlzLnJlYWR5U3RhdGUpIHtcclxuICAgIHRoaXMucmVhZHlTdGF0ZSA9ICdvcGVuaW5nJztcclxuICAgIHRoaXMuZG9PcGVuKCk7XHJcbiAgfVxyXG5cclxuICByZXR1cm4gdGhpcztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDbG9zZXMgdGhlIHRyYW5zcG9ydC5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuVHJhbnNwb3J0LnByb3RvdHlwZS5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcclxuICBpZiAoJ29wZW5pbmcnID09IHRoaXMucmVhZHlTdGF0ZSB8fCAnb3BlbicgPT0gdGhpcy5yZWFkeVN0YXRlKSB7XHJcbiAgICB0aGlzLmRvQ2xvc2UoKTtcclxuICAgIHRoaXMub25DbG9zZSgpO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHRoaXM7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgbXVsdGlwbGUgcGFja2V0cy5cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0gcGFja2V0c1xyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5UcmFuc3BvcnQucHJvdG90eXBlLnNlbmQgPSBmdW5jdGlvbihwYWNrZXRzKXtcclxuICBpZiAoJ29wZW4nID09IHRoaXMucmVhZHlTdGF0ZSkge1xyXG4gICAgdGhpcy53cml0ZShwYWNrZXRzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhyb3cgbmV3IEVycm9yKCdUcmFuc3BvcnQgbm90IG9wZW4nKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHVwb24gb3BlblxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5UcmFuc3BvcnQucHJvdG90eXBlLm9uT3BlbiA9IGZ1bmN0aW9uICgpIHtcclxuICB0aGlzLnJlYWR5U3RhdGUgPSAnb3Blbic7XHJcbiAgdGhpcy53cml0YWJsZSA9IHRydWU7XHJcbiAgdGhpcy5lbWl0KCdvcGVuJyk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHdpdGggZGF0YS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGRhdGFcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuVHJhbnNwb3J0LnByb3RvdHlwZS5vbkRhdGEgPSBmdW5jdGlvbihkYXRhKXtcclxuICB2YXIgcGFja2V0ID0gcGFyc2VyLmRlY29kZVBhY2tldChkYXRhLCB0aGlzLnNvY2tldC5iaW5hcnlUeXBlKTtcclxuICB0aGlzLm9uUGFja2V0KHBhY2tldCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHdpdGggYSBkZWNvZGVkIHBhY2tldC5cclxuICovXHJcblxyXG5UcmFuc3BvcnQucHJvdG90eXBlLm9uUGFja2V0ID0gZnVuY3Rpb24gKHBhY2tldCkge1xyXG4gIHRoaXMuZW1pdCgncGFja2V0JywgcGFja2V0KTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgdXBvbiBjbG9zZS5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuVHJhbnNwb3J0LnByb3RvdHlwZS5vbkNsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gIHRoaXMucmVhZHlTdGF0ZSA9ICdjbG9zZWQnO1xyXG4gIHRoaXMuZW1pdCgnY2xvc2UnKTtcclxufTtcclxuXHJcbn0se1wiY29tcG9uZW50LWVtaXR0ZXJcIjo5LFwiZW5naW5lLmlvLXBhcnNlclwiOjI1fV0sMTU6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG4oZnVuY3Rpb24gKGdsb2JhbCl7XHJcbi8qKlxyXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzXHJcbiAqL1xyXG5cclxudmFyIFhNTEh0dHBSZXF1ZXN0ID0gX2RlcmVxXygneG1saHR0cHJlcXVlc3QnKTtcclxudmFyIFhIUiA9IF9kZXJlcV8oJy4vcG9sbGluZy14aHInKTtcclxudmFyIEpTT05QID0gX2RlcmVxXygnLi9wb2xsaW5nLWpzb25wJyk7XHJcbnZhciB3ZWJzb2NrZXQgPSBfZGVyZXFfKCcuL3dlYnNvY2tldCcpO1xyXG5cclxuLyoqXHJcbiAqIEV4cG9ydCB0cmFuc3BvcnRzLlxyXG4gKi9cclxuXHJcbmV4cG9ydHMucG9sbGluZyA9IHBvbGxpbmc7XHJcbmV4cG9ydHMud2Vic29ja2V0ID0gd2Vic29ja2V0O1xyXG5cclxuLyoqXHJcbiAqIFBvbGxpbmcgdHJhbnNwb3J0IHBvbHltb3JwaGljIGNvbnN0cnVjdG9yLlxyXG4gKiBEZWNpZGVzIG9uIHhociB2cyBqc29ucCBiYXNlZCBvbiBmZWF0dXJlIGRldGVjdGlvbi5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gcG9sbGluZyhvcHRzKXtcclxuICB2YXIgeGhyO1xyXG4gIHZhciB4ZCA9IGZhbHNlO1xyXG4gIHZhciB4cyA9IGZhbHNlO1xyXG4gIHZhciBqc29ucCA9IGZhbHNlICE9PSBvcHRzLmpzb25wO1xyXG5cclxuICBpZiAoZ2xvYmFsLmxvY2F0aW9uKSB7XHJcbiAgICB2YXIgaXNTU0wgPSAnaHR0cHM6JyA9PSBsb2NhdGlvbi5wcm90b2NvbDtcclxuICAgIHZhciBwb3J0ID0gbG9jYXRpb24ucG9ydDtcclxuXHJcbiAgICAvLyBzb21lIHVzZXIgYWdlbnRzIGhhdmUgZW1wdHkgYGxvY2F0aW9uLnBvcnRgXHJcbiAgICBpZiAoIXBvcnQpIHtcclxuICAgICAgcG9ydCA9IGlzU1NMID8gNDQzIDogODA7XHJcbiAgICB9XHJcblxyXG4gICAgeGQgPSBvcHRzLmhvc3RuYW1lICE9IGxvY2F0aW9uLmhvc3RuYW1lIHx8IHBvcnQgIT0gb3B0cy5wb3J0O1xyXG4gICAgeHMgPSBvcHRzLnNlY3VyZSAhPSBpc1NTTDtcclxuICB9XHJcblxyXG4gIG9wdHMueGRvbWFpbiA9IHhkO1xyXG4gIG9wdHMueHNjaGVtZSA9IHhzO1xyXG4gIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdChvcHRzKTtcclxuXHJcbiAgaWYgKCdvcGVuJyBpbiB4aHIgJiYgIW9wdHMuZm9yY2VKU09OUCkge1xyXG4gICAgcmV0dXJuIG5ldyBYSFIob3B0cyk7XHJcbiAgfSBlbHNlIHtcclxuICAgIGlmICghanNvbnApIHRocm93IG5ldyBFcnJvcignSlNPTlAgZGlzYWJsZWQnKTtcclxuICAgIHJldHVybiBuZXcgSlNPTlAob3B0cyk7XHJcbiAgfVxyXG59XHJcblxyXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxyXG59LHtcIi4vcG9sbGluZy1qc29ucFwiOjE2LFwiLi9wb2xsaW5nLXhoclwiOjE3LFwiLi93ZWJzb2NrZXRcIjoxOSxcInhtbGh0dHByZXF1ZXN0XCI6MjB9XSwxNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbihmdW5jdGlvbiAoZ2xvYmFsKXtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgcmVxdWlyZW1lbnRzLlxyXG4gKi9cclxuXHJcbnZhciBQb2xsaW5nID0gX2RlcmVxXygnLi9wb2xsaW5nJyk7XHJcbnZhciBpbmhlcml0ID0gX2RlcmVxXygnY29tcG9uZW50LWluaGVyaXQnKTtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEpTT05QUG9sbGluZztcclxuXHJcbi8qKlxyXG4gKiBDYWNoZWQgcmVndWxhciBleHByZXNzaW9ucy5cclxuICovXHJcblxyXG52YXIgck5ld2xpbmUgPSAvXFxuL2c7XHJcbnZhciByRXNjYXBlZE5ld2xpbmUgPSAvXFxcXG4vZztcclxuXHJcbi8qKlxyXG4gKiBHbG9iYWwgSlNPTlAgY2FsbGJhY2tzLlxyXG4gKi9cclxuXHJcbnZhciBjYWxsYmFja3M7XHJcblxyXG4vKipcclxuICogQ2FsbGJhY2tzIGNvdW50LlxyXG4gKi9cclxuXHJcbnZhciBpbmRleCA9IDA7XHJcblxyXG4vKipcclxuICogTm9vcC5cclxuICovXHJcblxyXG5mdW5jdGlvbiBlbXB0eSAoKSB7IH1cclxuXHJcbi8qKlxyXG4gKiBKU09OUCBQb2xsaW5nIGNvbnN0cnVjdG9yLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb3B0cy5cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBKU09OUFBvbGxpbmcgKG9wdHMpIHtcclxuICBQb2xsaW5nLmNhbGwodGhpcywgb3B0cyk7XHJcblxyXG4gIHRoaXMucXVlcnkgPSB0aGlzLnF1ZXJ5IHx8IHt9O1xyXG5cclxuICAvLyBkZWZpbmUgZ2xvYmFsIGNhbGxiYWNrcyBhcnJheSBpZiBub3QgcHJlc2VudFxyXG4gIC8vIHdlIGRvIHRoaXMgaGVyZSAobGF6aWx5KSB0byBhdm9pZCB1bm5lZWRlZCBnbG9iYWwgcG9sbHV0aW9uXHJcbiAgaWYgKCFjYWxsYmFja3MpIHtcclxuICAgIC8vIHdlIG5lZWQgdG8gY29uc2lkZXIgbXVsdGlwbGUgZW5naW5lcyBpbiB0aGUgc2FtZSBwYWdlXHJcbiAgICBpZiAoIWdsb2JhbC5fX19laW8pIGdsb2JhbC5fX19laW8gPSBbXTtcclxuICAgIGNhbGxiYWNrcyA9IGdsb2JhbC5fX19laW87XHJcbiAgfVxyXG5cclxuICAvLyBjYWxsYmFjayBpZGVudGlmaWVyXHJcbiAgdGhpcy5pbmRleCA9IGNhbGxiYWNrcy5sZW5ndGg7XHJcblxyXG4gIC8vIGFkZCBjYWxsYmFjayB0byBqc29ucCBnbG9iYWxcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgY2FsbGJhY2tzLnB1c2goZnVuY3Rpb24gKG1zZykge1xyXG4gICAgc2VsZi5vbkRhdGEobXNnKTtcclxuICB9KTtcclxuXHJcbiAgLy8gYXBwZW5kIHRvIHF1ZXJ5IHN0cmluZ1xyXG4gIHRoaXMucXVlcnkuaiA9IHRoaXMuaW5kZXg7XHJcblxyXG4gIC8vIHByZXZlbnQgc3B1cmlvdXMgZXJyb3JzIGZyb20gYmVpbmcgZW1pdHRlZCB3aGVuIHRoZSB3aW5kb3cgaXMgdW5sb2FkZWRcclxuICBpZiAoZ2xvYmFsLmRvY3VtZW50ICYmIGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgZnVuY3Rpb24gKCkge1xyXG4gICAgICBpZiAoc2VsZi5zY3JpcHQpIHNlbGYuc2NyaXB0Lm9uZXJyb3IgPSBlbXB0eTtcclxuICAgIH0sIGZhbHNlKTtcclxuICB9XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbmhlcml0cyBmcm9tIFBvbGxpbmcuXHJcbiAqL1xyXG5cclxuaW5oZXJpdChKU09OUFBvbGxpbmcsIFBvbGxpbmcpO1xyXG5cclxuLypcclxuICogSlNPTlAgb25seSBzdXBwb3J0cyBiaW5hcnkgYXMgYmFzZTY0IGVuY29kZWQgc3RyaW5nc1xyXG4gKi9cclxuXHJcbkpTT05QUG9sbGluZy5wcm90b3R5cGUuc3VwcG9ydHNCaW5hcnkgPSBmYWxzZTtcclxuXHJcbi8qKlxyXG4gKiBDbG9zZXMgdGhlIHNvY2tldC5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuSlNPTlBQb2xsaW5nLnByb3RvdHlwZS5kb0Nsb3NlID0gZnVuY3Rpb24gKCkge1xyXG4gIGlmICh0aGlzLnNjcmlwdCkge1xyXG4gICAgdGhpcy5zY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLnNjcmlwdCk7XHJcbiAgICB0aGlzLnNjcmlwdCA9IG51bGw7XHJcbiAgfVxyXG5cclxuICBpZiAodGhpcy5mb3JtKSB7XHJcbiAgICB0aGlzLmZvcm0ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZCh0aGlzLmZvcm0pO1xyXG4gICAgdGhpcy5mb3JtID0gbnVsbDtcclxuICAgIHRoaXMuaWZyYW1lID0gbnVsbDtcclxuICB9XHJcblxyXG4gIFBvbGxpbmcucHJvdG90eXBlLmRvQ2xvc2UuY2FsbCh0aGlzKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBTdGFydHMgYSBwb2xsIGN5Y2xlLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5KU09OUFBvbGxpbmcucHJvdG90eXBlLmRvUG9sbCA9IGZ1bmN0aW9uICgpIHtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdmFyIHNjcmlwdCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpO1xyXG5cclxuICBpZiAodGhpcy5zY3JpcHQpIHtcclxuICAgIHRoaXMuc2NyaXB0LnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQodGhpcy5zY3JpcHQpO1xyXG4gICAgdGhpcy5zY3JpcHQgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgc2NyaXB0LmFzeW5jID0gdHJ1ZTtcclxuICBzY3JpcHQuc3JjID0gdGhpcy51cmkoKTtcclxuICBzY3JpcHQub25lcnJvciA9IGZ1bmN0aW9uKGUpe1xyXG4gICAgc2VsZi5vbkVycm9yKCdqc29ucCBwb2xsIGVycm9yJyxlKTtcclxuICB9O1xyXG5cclxuICB2YXIgaW5zZXJ0QXQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF07XHJcbiAgaW5zZXJ0QXQucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc2NyaXB0LCBpbnNlcnRBdCk7XHJcbiAgdGhpcy5zY3JpcHQgPSBzY3JpcHQ7XHJcblxyXG4gIHZhciBpc1VBZ2Vja28gPSAndW5kZWZpbmVkJyAhPSB0eXBlb2YgbmF2aWdhdG9yICYmIC9nZWNrby9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCk7XHJcbiAgXHJcbiAgaWYgKGlzVUFnZWNrbykge1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XHJcbiAgICAgIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcclxuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xyXG4gICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XHJcbiAgICB9LCAxMDApO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBXcml0ZXMgd2l0aCBhIGhpZGRlbiBpZnJhbWUuXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBkYXRhIHRvIHNlbmRcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGVkIHVwb24gZmx1c2guXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbkpTT05QUG9sbGluZy5wcm90b3R5cGUuZG9Xcml0ZSA9IGZ1bmN0aW9uIChkYXRhLCBmbikge1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgaWYgKCF0aGlzLmZvcm0pIHtcclxuICAgIHZhciBmb3JtID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnZm9ybScpO1xyXG4gICAgdmFyIGFyZWEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCd0ZXh0YXJlYScpO1xyXG4gICAgdmFyIGlkID0gdGhpcy5pZnJhbWVJZCA9ICdlaW9faWZyYW1lXycgKyB0aGlzLmluZGV4O1xyXG4gICAgdmFyIGlmcmFtZTtcclxuXHJcbiAgICBmb3JtLmNsYXNzTmFtZSA9ICdzb2NrZXRpbyc7XHJcbiAgICBmb3JtLnN0eWxlLnBvc2l0aW9uID0gJ2Fic29sdXRlJztcclxuICAgIGZvcm0uc3R5bGUudG9wID0gJy0xMDAwcHgnO1xyXG4gICAgZm9ybS5zdHlsZS5sZWZ0ID0gJy0xMDAwcHgnO1xyXG4gICAgZm9ybS50YXJnZXQgPSBpZDtcclxuICAgIGZvcm0ubWV0aG9kID0gJ1BPU1QnO1xyXG4gICAgZm9ybS5zZXRBdHRyaWJ1dGUoJ2FjY2VwdC1jaGFyc2V0JywgJ3V0Zi04Jyk7XHJcbiAgICBhcmVhLm5hbWUgPSAnZCc7XHJcbiAgICBmb3JtLmFwcGVuZENoaWxkKGFyZWEpO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChmb3JtKTtcclxuXHJcbiAgICB0aGlzLmZvcm0gPSBmb3JtO1xyXG4gICAgdGhpcy5hcmVhID0gYXJlYTtcclxuICB9XHJcblxyXG4gIHRoaXMuZm9ybS5hY3Rpb24gPSB0aGlzLnVyaSgpO1xyXG5cclxuICBmdW5jdGlvbiBjb21wbGV0ZSAoKSB7XHJcbiAgICBpbml0SWZyYW1lKCk7XHJcbiAgICBmbigpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gaW5pdElmcmFtZSAoKSB7XHJcbiAgICBpZiAoc2VsZi5pZnJhbWUpIHtcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBzZWxmLmZvcm0ucmVtb3ZlQ2hpbGQoc2VsZi5pZnJhbWUpO1xyXG4gICAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgICAgc2VsZi5vbkVycm9yKCdqc29ucCBwb2xsaW5nIGlmcmFtZSByZW1vdmFsIGVycm9yJywgZSk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICB0cnkge1xyXG4gICAgICAvLyBpZTYgZHluYW1pYyBpZnJhbWVzIHdpdGggdGFyZ2V0PVwiXCIgc3VwcG9ydCAodGhhbmtzIENocmlzIExhbWJhY2hlcilcclxuICAgICAgdmFyIGh0bWwgPSAnPGlmcmFtZSBzcmM9XCJqYXZhc2NyaXB0OjBcIiBuYW1lPVwiJysgc2VsZi5pZnJhbWVJZCArJ1wiPic7XHJcbiAgICAgIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoaHRtbCk7XHJcbiAgICB9IGNhdGNoIChlKSB7XHJcbiAgICAgIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xyXG4gICAgICBpZnJhbWUubmFtZSA9IHNlbGYuaWZyYW1lSWQ7XHJcbiAgICAgIGlmcmFtZS5zcmMgPSAnamF2YXNjcmlwdDowJztcclxuICAgIH1cclxuXHJcbiAgICBpZnJhbWUuaWQgPSBzZWxmLmlmcmFtZUlkO1xyXG5cclxuICAgIHNlbGYuZm9ybS5hcHBlbmRDaGlsZChpZnJhbWUpO1xyXG4gICAgc2VsZi5pZnJhbWUgPSBpZnJhbWU7XHJcbiAgfVxyXG5cclxuICBpbml0SWZyYW1lKCk7XHJcblxyXG4gIC8vIGVzY2FwZSBcXG4gdG8gcHJldmVudCBpdCBmcm9tIGJlaW5nIGNvbnZlcnRlZCBpbnRvIFxcclxcbiBieSBzb21lIFVBc1xyXG4gIC8vIGRvdWJsZSBlc2NhcGluZyBpcyByZXF1aXJlZCBmb3IgZXNjYXBlZCBuZXcgbGluZXMgYmVjYXVzZSB1bmVzY2FwaW5nIG9mIG5ldyBsaW5lcyBjYW4gYmUgZG9uZSBzYWZlbHkgb24gc2VydmVyLXNpZGVcclxuICBkYXRhID0gZGF0YS5yZXBsYWNlKHJFc2NhcGVkTmV3bGluZSwgJ1xcXFxcXG4nKTtcclxuICB0aGlzLmFyZWEudmFsdWUgPSBkYXRhLnJlcGxhY2Uock5ld2xpbmUsICdcXFxcbicpO1xyXG5cclxuICB0cnkge1xyXG4gICAgdGhpcy5mb3JtLnN1Ym1pdCgpO1xyXG4gIH0gY2F0Y2goZSkge31cclxuXHJcbiAgaWYgKHRoaXMuaWZyYW1lLmF0dGFjaEV2ZW50KSB7XHJcbiAgICB0aGlzLmlmcmFtZS5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpe1xyXG4gICAgICBpZiAoc2VsZi5pZnJhbWUucmVhZHlTdGF0ZSA9PSAnY29tcGxldGUnKSB7XHJcbiAgICAgICAgY29tcGxldGUoKTtcclxuICAgICAgfVxyXG4gICAgfTtcclxuICB9IGVsc2Uge1xyXG4gICAgdGhpcy5pZnJhbWUub25sb2FkID0gY29tcGxldGU7XHJcbiAgfVxyXG59O1xyXG5cclxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcclxufSx7XCIuL3BvbGxpbmdcIjoxOCxcImNvbXBvbmVudC1pbmhlcml0XCI6MjF9XSwxNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbihmdW5jdGlvbiAoZ2xvYmFsKXtcclxuLyoqXHJcbiAqIE1vZHVsZSByZXF1aXJlbWVudHMuXHJcbiAqL1xyXG5cclxudmFyIFhNTEh0dHBSZXF1ZXN0ID0gX2RlcmVxXygneG1saHR0cHJlcXVlc3QnKTtcclxudmFyIFBvbGxpbmcgPSBfZGVyZXFfKCcuL3BvbGxpbmcnKTtcclxudmFyIEVtaXR0ZXIgPSBfZGVyZXFfKCdjb21wb25lbnQtZW1pdHRlcicpO1xyXG52YXIgaW5oZXJpdCA9IF9kZXJlcV8oJ2NvbXBvbmVudC1pbmhlcml0Jyk7XHJcbnZhciBkZWJ1ZyA9IF9kZXJlcV8oJ2RlYnVnJykoJ2VuZ2luZS5pby1jbGllbnQ6cG9sbGluZy14aHInKTtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IFhIUjtcclxubW9kdWxlLmV4cG9ydHMuUmVxdWVzdCA9IFJlcXVlc3Q7XHJcblxyXG4vKipcclxuICogRW1wdHkgZnVuY3Rpb25cclxuICovXHJcblxyXG5mdW5jdGlvbiBlbXB0eSgpe31cclxuXHJcbi8qKlxyXG4gKiBYSFIgUG9sbGluZyBjb25zdHJ1Y3Rvci5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IG9wdHNcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBYSFIob3B0cyl7XHJcbiAgUG9sbGluZy5jYWxsKHRoaXMsIG9wdHMpO1xyXG5cclxuICBpZiAoZ2xvYmFsLmxvY2F0aW9uKSB7XHJcbiAgICB2YXIgaXNTU0wgPSAnaHR0cHM6JyA9PSBsb2NhdGlvbi5wcm90b2NvbDtcclxuICAgIHZhciBwb3J0ID0gbG9jYXRpb24ucG9ydDtcclxuXHJcbiAgICAvLyBzb21lIHVzZXIgYWdlbnRzIGhhdmUgZW1wdHkgYGxvY2F0aW9uLnBvcnRgXHJcbiAgICBpZiAoIXBvcnQpIHtcclxuICAgICAgcG9ydCA9IGlzU1NMID8gNDQzIDogODA7XHJcbiAgICB9XHJcblxyXG4gICAgdGhpcy54ZCA9IG9wdHMuaG9zdG5hbWUgIT0gZ2xvYmFsLmxvY2F0aW9uLmhvc3RuYW1lIHx8XHJcbiAgICAgIHBvcnQgIT0gb3B0cy5wb3J0O1xyXG4gICAgdGhpcy54cyA9IG9wdHMuc2VjdXJlICE9IGlzU1NMO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIEluaGVyaXRzIGZyb20gUG9sbGluZy5cclxuICovXHJcblxyXG5pbmhlcml0KFhIUiwgUG9sbGluZyk7XHJcblxyXG4vKipcclxuICogWEhSIHN1cHBvcnRzIGJpbmFyeVxyXG4gKi9cclxuXHJcblhIUi5wcm90b3R5cGUuc3VwcG9ydHNCaW5hcnkgPSB0cnVlO1xyXG5cclxuLyoqXHJcbiAqIENyZWF0ZXMgYSByZXF1ZXN0LlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbWV0aG9kXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblhIUi5wcm90b3R5cGUucmVxdWVzdCA9IGZ1bmN0aW9uKG9wdHMpe1xyXG4gIG9wdHMgPSBvcHRzIHx8IHt9O1xyXG4gIG9wdHMudXJpID0gdGhpcy51cmkoKTtcclxuICBvcHRzLnhkID0gdGhpcy54ZDtcclxuICBvcHRzLnhzID0gdGhpcy54cztcclxuICBvcHRzLmFnZW50ID0gdGhpcy5hZ2VudCB8fCBmYWxzZTtcclxuICBvcHRzLnN1cHBvcnRzQmluYXJ5ID0gdGhpcy5zdXBwb3J0c0JpbmFyeTtcclxuICBvcHRzLmVuYWJsZXNYRFIgPSB0aGlzLmVuYWJsZXNYRFI7XHJcblxyXG4gIC8vIFNTTCBvcHRpb25zIGZvciBOb2RlLmpzIGNsaWVudFxyXG4gIG9wdHMucGZ4ID0gdGhpcy5wZng7XHJcbiAgb3B0cy5rZXkgPSB0aGlzLmtleTtcclxuICBvcHRzLnBhc3NwaHJhc2UgPSB0aGlzLnBhc3NwaHJhc2U7XHJcbiAgb3B0cy5jZXJ0ID0gdGhpcy5jZXJ0O1xyXG4gIG9wdHMuY2EgPSB0aGlzLmNhO1xyXG4gIG9wdHMuY2lwaGVycyA9IHRoaXMuY2lwaGVycztcclxuICBvcHRzLnJlamVjdFVuYXV0aG9yaXplZCA9IHRoaXMucmVqZWN0VW5hdXRob3JpemVkO1xyXG5cclxuICByZXR1cm4gbmV3IFJlcXVlc3Qob3B0cyk7XHJcbn07XHJcblxyXG4vKipcclxuICogU2VuZHMgZGF0YS5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGRhdGEgdG8gc2VuZC5cclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGVkIHVwb24gZmx1c2guXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblhIUi5wcm90b3R5cGUuZG9Xcml0ZSA9IGZ1bmN0aW9uKGRhdGEsIGZuKXtcclxuICB2YXIgaXNCaW5hcnkgPSB0eXBlb2YgZGF0YSAhPT0gJ3N0cmluZycgJiYgZGF0YSAhPT0gdW5kZWZpbmVkO1xyXG4gIHZhciByZXEgPSB0aGlzLnJlcXVlc3QoeyBtZXRob2Q6ICdQT1NUJywgZGF0YTogZGF0YSwgaXNCaW5hcnk6IGlzQmluYXJ5IH0pO1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuICByZXEub24oJ3N1Y2Nlc3MnLCBmbik7XHJcbiAgcmVxLm9uKCdlcnJvcicsIGZ1bmN0aW9uKGVycil7XHJcbiAgICBzZWxmLm9uRXJyb3IoJ3hociBwb3N0IGVycm9yJywgZXJyKTtcclxuICB9KTtcclxuICB0aGlzLnNlbmRYaHIgPSByZXE7XHJcbn07XHJcblxyXG4vKipcclxuICogU3RhcnRzIGEgcG9sbCBjeWNsZS5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuWEhSLnByb3RvdHlwZS5kb1BvbGwgPSBmdW5jdGlvbigpe1xyXG4gIGRlYnVnKCd4aHIgcG9sbCcpO1xyXG4gIHZhciByZXEgPSB0aGlzLnJlcXVlc3QoKTtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgcmVxLm9uKCdkYXRhJywgZnVuY3Rpb24oZGF0YSl7XHJcbiAgICBzZWxmLm9uRGF0YShkYXRhKTtcclxuICB9KTtcclxuICByZXEub24oJ2Vycm9yJywgZnVuY3Rpb24oZXJyKXtcclxuICAgIHNlbGYub25FcnJvcigneGhyIHBvbGwgZXJyb3InLCBlcnIpO1xyXG4gIH0pO1xyXG4gIHRoaXMucG9sbFhociA9IHJlcTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXF1ZXN0IGNvbnN0cnVjdG9yXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gUmVxdWVzdChvcHRzKXtcclxuICB0aGlzLm1ldGhvZCA9IG9wdHMubWV0aG9kIHx8ICdHRVQnO1xyXG4gIHRoaXMudXJpID0gb3B0cy51cmk7XHJcbiAgdGhpcy54ZCA9ICEhb3B0cy54ZDtcclxuICB0aGlzLnhzID0gISFvcHRzLnhzO1xyXG4gIHRoaXMuYXN5bmMgPSBmYWxzZSAhPT0gb3B0cy5hc3luYztcclxuICB0aGlzLmRhdGEgPSB1bmRlZmluZWQgIT0gb3B0cy5kYXRhID8gb3B0cy5kYXRhIDogbnVsbDtcclxuICB0aGlzLmFnZW50ID0gb3B0cy5hZ2VudDtcclxuICB0aGlzLmlzQmluYXJ5ID0gb3B0cy5pc0JpbmFyeTtcclxuICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gb3B0cy5zdXBwb3J0c0JpbmFyeTtcclxuICB0aGlzLmVuYWJsZXNYRFIgPSBvcHRzLmVuYWJsZXNYRFI7XHJcblxyXG4gIC8vIFNTTCBvcHRpb25zIGZvciBOb2RlLmpzIGNsaWVudFxyXG4gIHRoaXMucGZ4ID0gb3B0cy5wZng7XHJcbiAgdGhpcy5rZXkgPSBvcHRzLmtleTtcclxuICB0aGlzLnBhc3NwaHJhc2UgPSBvcHRzLnBhc3NwaHJhc2U7XHJcbiAgdGhpcy5jZXJ0ID0gb3B0cy5jZXJ0O1xyXG4gIHRoaXMuY2EgPSBvcHRzLmNhO1xyXG4gIHRoaXMuY2lwaGVycyA9IG9wdHMuY2lwaGVycztcclxuICB0aGlzLnJlamVjdFVuYXV0aG9yaXplZCA9IG9wdHMucmVqZWN0VW5hdXRob3JpemVkO1xyXG5cclxuICB0aGlzLmNyZWF0ZSgpO1xyXG59XHJcblxyXG4vKipcclxuICogTWl4IGluIGBFbWl0dGVyYC5cclxuICovXHJcblxyXG5FbWl0dGVyKFJlcXVlc3QucHJvdG90eXBlKTtcclxuXHJcbi8qKlxyXG4gKiBDcmVhdGVzIHRoZSBYSFIgb2JqZWN0IGFuZCBzZW5kcyB0aGUgcmVxdWVzdC5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuUmVxdWVzdC5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24oKXtcclxuICB2YXIgb3B0cyA9IHsgYWdlbnQ6IHRoaXMuYWdlbnQsIHhkb21haW46IHRoaXMueGQsIHhzY2hlbWU6IHRoaXMueHMsIGVuYWJsZXNYRFI6IHRoaXMuZW5hYmxlc1hEUiB9O1xyXG5cclxuICAvLyBTU0wgb3B0aW9ucyBmb3IgTm9kZS5qcyBjbGllbnRcclxuICBvcHRzLnBmeCA9IHRoaXMucGZ4O1xyXG4gIG9wdHMua2V5ID0gdGhpcy5rZXk7XHJcbiAgb3B0cy5wYXNzcGhyYXNlID0gdGhpcy5wYXNzcGhyYXNlO1xyXG4gIG9wdHMuY2VydCA9IHRoaXMuY2VydDtcclxuICBvcHRzLmNhID0gdGhpcy5jYTtcclxuICBvcHRzLmNpcGhlcnMgPSB0aGlzLmNpcGhlcnM7XHJcbiAgb3B0cy5yZWplY3RVbmF1dGhvcml6ZWQgPSB0aGlzLnJlamVjdFVuYXV0aG9yaXplZDtcclxuXHJcbiAgdmFyIHhociA9IHRoaXMueGhyID0gbmV3IFhNTEh0dHBSZXF1ZXN0KG9wdHMpO1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgdHJ5IHtcclxuICAgIGRlYnVnKCd4aHIgb3BlbiAlczogJXMnLCB0aGlzLm1ldGhvZCwgdGhpcy51cmkpO1xyXG4gICAgeGhyLm9wZW4odGhpcy5tZXRob2QsIHRoaXMudXJpLCB0aGlzLmFzeW5jKTtcclxuICAgIGlmICh0aGlzLnN1cHBvcnRzQmluYXJ5KSB7XHJcbiAgICAgIC8vIFRoaXMgaGFzIHRvIGJlIGRvbmUgYWZ0ZXIgb3BlbiBiZWNhdXNlIEZpcmVmb3ggaXMgc3R1cGlkXHJcbiAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTMyMTY5MDMvZ2V0LWJpbmFyeS1kYXRhLXdpdGgteG1saHR0cHJlcXVlc3QtaW4tYS1maXJlZm94LWV4dGVuc2lvblxyXG4gICAgICB4aHIucmVzcG9uc2VUeXBlID0gJ2FycmF5YnVmZmVyJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoJ1BPU1QnID09IHRoaXMubWV0aG9kKSB7XHJcbiAgICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKHRoaXMuaXNCaW5hcnkpIHtcclxuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAnYXBwbGljYXRpb24vb2N0ZXQtc3RyZWFtJyk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHhoci5zZXRSZXF1ZXN0SGVhZGVyKCdDb250ZW50LXR5cGUnLCAndGV4dC9wbGFpbjtjaGFyc2V0PVVURi04Jyk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9IGNhdGNoIChlKSB7fVxyXG4gICAgfVxyXG5cclxuICAgIC8vIGllNiBjaGVja1xyXG4gICAgaWYgKCd3aXRoQ3JlZGVudGlhbHMnIGluIHhocikge1xyXG4gICAgICB4aHIud2l0aENyZWRlbnRpYWxzID0gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGhpcy5oYXNYRFIoKSkge1xyXG4gICAgICB4aHIub25sb2FkID0gZnVuY3Rpb24oKXtcclxuICAgICAgICBzZWxmLm9uTG9hZCgpO1xyXG4gICAgICB9O1xyXG4gICAgICB4aHIub25lcnJvciA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgc2VsZi5vbkVycm9yKHhoci5yZXNwb25zZVRleHQpO1xyXG4gICAgICB9O1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgeGhyLm9ucmVhZHlzdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgaWYgKDQgIT0geGhyLnJlYWR5U3RhdGUpIHJldHVybjtcclxuICAgICAgICBpZiAoMjAwID09IHhoci5zdGF0dXMgfHwgMTIyMyA9PSB4aHIuc3RhdHVzKSB7XHJcbiAgICAgICAgICBzZWxmLm9uTG9hZCgpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAvLyBtYWtlIHN1cmUgdGhlIGBlcnJvcmAgZXZlbnQgaGFuZGxlciB0aGF0J3MgdXNlci1zZXRcclxuICAgICAgICAgIC8vIGRvZXMgbm90IHRocm93IGluIHRoZSBzYW1lIHRpY2sgYW5kIGdldHMgY2F1Z2h0IGhlcmVcclxuICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgc2VsZi5vbkVycm9yKHhoci5zdGF0dXMpO1xyXG4gICAgICAgICAgfSwgMCk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG4gICAgfVxyXG5cclxuICAgIGRlYnVnKCd4aHIgZGF0YSAlcycsIHRoaXMuZGF0YSk7XHJcbiAgICB4aHIuc2VuZCh0aGlzLmRhdGEpO1xyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIC8vIE5lZWQgdG8gZGVmZXIgc2luY2UgLmNyZWF0ZSgpIGlzIGNhbGxlZCBkaXJlY3RseSBmaHJvbSB0aGUgY29uc3RydWN0b3JcclxuICAgIC8vIGFuZCB0aHVzIHRoZSAnZXJyb3InIGV2ZW50IGNhbiBvbmx5IGJlIG9ubHkgYm91bmQgKmFmdGVyKiB0aGlzIGV4Y2VwdGlvblxyXG4gICAgLy8gb2NjdXJzLiAgVGhlcmVmb3JlLCBhbHNvLCB3ZSBjYW5ub3QgdGhyb3cgaGVyZSBhdCBhbGwuXHJcbiAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xyXG4gICAgICBzZWxmLm9uRXJyb3IoZSk7XHJcbiAgICB9LCAwKTtcclxuICAgIHJldHVybjtcclxuICB9XHJcblxyXG4gIGlmIChnbG9iYWwuZG9jdW1lbnQpIHtcclxuICAgIHRoaXMuaW5kZXggPSBSZXF1ZXN0LnJlcXVlc3RzQ291bnQrKztcclxuICAgIFJlcXVlc3QucmVxdWVzdHNbdGhpcy5pbmRleF0gPSB0aGlzO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgdXBvbiBzdWNjZXNzZnVsIHJlc3BvbnNlLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5SZXF1ZXN0LnByb3RvdHlwZS5vblN1Y2Nlc3MgPSBmdW5jdGlvbigpe1xyXG4gIHRoaXMuZW1pdCgnc3VjY2VzcycpO1xyXG4gIHRoaXMuY2xlYW51cCgpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENhbGxlZCBpZiB3ZSBoYXZlIGRhdGEuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblJlcXVlc3QucHJvdG90eXBlLm9uRGF0YSA9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gIHRoaXMuZW1pdCgnZGF0YScsIGRhdGEpO1xyXG4gIHRoaXMub25TdWNjZXNzKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHVwb24gZXJyb3IuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblJlcXVlc3QucHJvdG90eXBlLm9uRXJyb3IgPSBmdW5jdGlvbihlcnIpe1xyXG4gIHRoaXMuZW1pdCgnZXJyb3InLCBlcnIpO1xyXG4gIHRoaXMuY2xlYW51cCh0cnVlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDbGVhbnMgdXAgaG91c2UuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblJlcXVlc3QucHJvdG90eXBlLmNsZWFudXAgPSBmdW5jdGlvbihmcm9tRXJyb3Ipe1xyXG4gIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgdGhpcy54aHIgfHwgbnVsbCA9PT0gdGhpcy54aHIpIHtcclxuICAgIHJldHVybjtcclxuICB9XHJcbiAgLy8geG1saHR0cHJlcXVlc3RcclxuICBpZiAodGhpcy5oYXNYRFIoKSkge1xyXG4gICAgdGhpcy54aHIub25sb2FkID0gdGhpcy54aHIub25lcnJvciA9IGVtcHR5O1xyXG4gIH0gZWxzZSB7XHJcbiAgICB0aGlzLnhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBlbXB0eTtcclxuICB9XHJcblxyXG4gIGlmIChmcm9tRXJyb3IpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHRoaXMueGhyLmFib3J0KCk7XHJcbiAgICB9IGNhdGNoKGUpIHt9XHJcbiAgfVxyXG5cclxuICBpZiAoZ2xvYmFsLmRvY3VtZW50KSB7XHJcbiAgICBkZWxldGUgUmVxdWVzdC5yZXF1ZXN0c1t0aGlzLmluZGV4XTtcclxuICB9XHJcblxyXG4gIHRoaXMueGhyID0gbnVsbDtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBDYWxsZWQgdXBvbiBsb2FkLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5SZXF1ZXN0LnByb3RvdHlwZS5vbkxvYWQgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBkYXRhO1xyXG4gIHRyeSB7XHJcbiAgICB2YXIgY29udGVudFR5cGU7XHJcbiAgICB0cnkge1xyXG4gICAgICBjb250ZW50VHlwZSA9IHRoaXMueGhyLmdldFJlc3BvbnNlSGVhZGVyKCdDb250ZW50LVR5cGUnKS5zcGxpdCgnOycpWzBdO1xyXG4gICAgfSBjYXRjaCAoZSkge31cclxuICAgIGlmIChjb250ZW50VHlwZSA9PT0gJ2FwcGxpY2F0aW9uL29jdGV0LXN0cmVhbScpIHtcclxuICAgICAgZGF0YSA9IHRoaXMueGhyLnJlc3BvbnNlO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgaWYgKCF0aGlzLnN1cHBvcnRzQmluYXJ5KSB7XHJcbiAgICAgICAgZGF0YSA9IHRoaXMueGhyLnJlc3BvbnNlVGV4dDtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICBkYXRhID0gJ29rJztcclxuICAgICAgfVxyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHtcclxuICAgIHRoaXMub25FcnJvcihlKTtcclxuICB9XHJcbiAgaWYgKG51bGwgIT0gZGF0YSkge1xyXG4gICAgdGhpcy5vbkRhdGEoZGF0YSk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIGl0IGhhcyBYRG9tYWluUmVxdWVzdC5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuUmVxdWVzdC5wcm90b3R5cGUuaGFzWERSID0gZnVuY3Rpb24oKXtcclxuICByZXR1cm4gJ3VuZGVmaW5lZCcgIT09IHR5cGVvZiBnbG9iYWwuWERvbWFpblJlcXVlc3QgJiYgIXRoaXMueHMgJiYgdGhpcy5lbmFibGVzWERSO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFib3J0cyB0aGUgcmVxdWVzdC5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5SZXF1ZXN0LnByb3RvdHlwZS5hYm9ydCA9IGZ1bmN0aW9uKCl7XHJcbiAgdGhpcy5jbGVhbnVwKCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQWJvcnRzIHBlbmRpbmcgcmVxdWVzdHMgd2hlbiB1bmxvYWRpbmcgdGhlIHdpbmRvdy4gVGhpcyBpcyBuZWVkZWQgdG8gcHJldmVudFxyXG4gKiBtZW1vcnkgbGVha3MgKGUuZy4gd2hlbiB1c2luZyBJRSkgYW5kIHRvIGVuc3VyZSB0aGF0IG5vIHNwdXJpb3VzIGVycm9yIGlzXHJcbiAqIGVtaXR0ZWQuXHJcbiAqL1xyXG5cclxuaWYgKGdsb2JhbC5kb2N1bWVudCkge1xyXG4gIFJlcXVlc3QucmVxdWVzdHNDb3VudCA9IDA7XHJcbiAgUmVxdWVzdC5yZXF1ZXN0cyA9IHt9O1xyXG4gIGlmIChnbG9iYWwuYXR0YWNoRXZlbnQpIHtcclxuICAgIGdsb2JhbC5hdHRhY2hFdmVudCgnb251bmxvYWQnLCB1bmxvYWRIYW5kbGVyKTtcclxuICB9IGVsc2UgaWYgKGdsb2JhbC5hZGRFdmVudExpc3RlbmVyKSB7XHJcbiAgICBnbG9iYWwuYWRkRXZlbnRMaXN0ZW5lcignYmVmb3JldW5sb2FkJywgdW5sb2FkSGFuZGxlciwgZmFsc2UpO1xyXG4gIH1cclxufVxyXG5cclxuZnVuY3Rpb24gdW5sb2FkSGFuZGxlcigpIHtcclxuICBmb3IgKHZhciBpIGluIFJlcXVlc3QucmVxdWVzdHMpIHtcclxuICAgIGlmIChSZXF1ZXN0LnJlcXVlc3RzLmhhc093blByb3BlcnR5KGkpKSB7XHJcbiAgICAgIFJlcXVlc3QucmVxdWVzdHNbaV0uYWJvcnQoKTtcclxuICAgIH1cclxuICB9XHJcbn1cclxuXHJcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXHJcbn0se1wiLi9wb2xsaW5nXCI6MTgsXCJjb21wb25lbnQtZW1pdHRlclwiOjksXCJjb21wb25lbnQtaW5oZXJpdFwiOjIxLFwiZGVidWdcIjoyMixcInhtbGh0dHByZXF1ZXN0XCI6MjB9XSwxODpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbi8qKlxyXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxyXG4gKi9cclxuXHJcbnZhciBUcmFuc3BvcnQgPSBfZGVyZXFfKCcuLi90cmFuc3BvcnQnKTtcclxudmFyIHBhcnNlcXMgPSBfZGVyZXFfKCdwYXJzZXFzJyk7XHJcbnZhciBwYXJzZXIgPSBfZGVyZXFfKCdlbmdpbmUuaW8tcGFyc2VyJyk7XHJcbnZhciBpbmhlcml0ID0gX2RlcmVxXygnY29tcG9uZW50LWluaGVyaXQnKTtcclxudmFyIGRlYnVnID0gX2RlcmVxXygnZGVidWcnKSgnZW5naW5lLmlvLWNsaWVudDpwb2xsaW5nJyk7XHJcblxyXG4vKipcclxuICogTW9kdWxlIGV4cG9ydHMuXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBQb2xsaW5nO1xyXG5cclxuLyoqXHJcbiAqIElzIFhIUjIgc3VwcG9ydGVkP1xyXG4gKi9cclxuXHJcbnZhciBoYXNYSFIyID0gKGZ1bmN0aW9uKCkge1xyXG4gIHZhciBYTUxIdHRwUmVxdWVzdCA9IF9kZXJlcV8oJ3htbGh0dHByZXF1ZXN0Jyk7XHJcbiAgdmFyIHhociA9IG5ldyBYTUxIdHRwUmVxdWVzdCh7IHhkb21haW46IGZhbHNlIH0pO1xyXG4gIHJldHVybiBudWxsICE9IHhoci5yZXNwb25zZVR5cGU7XHJcbn0pKCk7XHJcblxyXG4vKipcclxuICogUG9sbGluZyBpbnRlcmZhY2UuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRzXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIFBvbGxpbmcob3B0cyl7XHJcbiAgdmFyIGZvcmNlQmFzZTY0ID0gKG9wdHMgJiYgb3B0cy5mb3JjZUJhc2U2NCk7XHJcbiAgaWYgKCFoYXNYSFIyIHx8IGZvcmNlQmFzZTY0KSB7XHJcbiAgICB0aGlzLnN1cHBvcnRzQmluYXJ5ID0gZmFsc2U7XHJcbiAgfVxyXG4gIFRyYW5zcG9ydC5jYWxsKHRoaXMsIG9wdHMpO1xyXG59XHJcblxyXG4vKipcclxuICogSW5oZXJpdHMgZnJvbSBUcmFuc3BvcnQuXHJcbiAqL1xyXG5cclxuaW5oZXJpdChQb2xsaW5nLCBUcmFuc3BvcnQpO1xyXG5cclxuLyoqXHJcbiAqIFRyYW5zcG9ydCBuYW1lLlxyXG4gKi9cclxuXHJcblBvbGxpbmcucHJvdG90eXBlLm5hbWUgPSAncG9sbGluZyc7XHJcblxyXG4vKipcclxuICogT3BlbnMgdGhlIHNvY2tldCAodHJpZ2dlcnMgcG9sbGluZykuIFdlIHdyaXRlIGEgUElORyBtZXNzYWdlIHRvIGRldGVybWluZVxyXG4gKiB3aGVuIHRoZSB0cmFuc3BvcnQgaXMgb3Blbi5cclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuUG9sbGluZy5wcm90b3R5cGUuZG9PcGVuID0gZnVuY3Rpb24oKXtcclxuICB0aGlzLnBvbGwoKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQYXVzZXMgcG9sbGluZy5cclxuICpcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gY2FsbGJhY2sgdXBvbiBidWZmZXJzIGFyZSBmbHVzaGVkIGFuZCB0cmFuc3BvcnQgaXMgcGF1c2VkXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblBvbGxpbmcucHJvdG90eXBlLnBhdXNlID0gZnVuY3Rpb24ob25QYXVzZSl7XHJcbiAgdmFyIHBlbmRpbmcgPSAwO1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgdGhpcy5yZWFkeVN0YXRlID0gJ3BhdXNpbmcnO1xyXG5cclxuICBmdW5jdGlvbiBwYXVzZSgpe1xyXG4gICAgZGVidWcoJ3BhdXNlZCcpO1xyXG4gICAgc2VsZi5yZWFkeVN0YXRlID0gJ3BhdXNlZCc7XHJcbiAgICBvblBhdXNlKCk7XHJcbiAgfVxyXG5cclxuICBpZiAodGhpcy5wb2xsaW5nIHx8ICF0aGlzLndyaXRhYmxlKSB7XHJcbiAgICB2YXIgdG90YWwgPSAwO1xyXG5cclxuICAgIGlmICh0aGlzLnBvbGxpbmcpIHtcclxuICAgICAgZGVidWcoJ3dlIGFyZSBjdXJyZW50bHkgcG9sbGluZyAtIHdhaXRpbmcgdG8gcGF1c2UnKTtcclxuICAgICAgdG90YWwrKztcclxuICAgICAgdGhpcy5vbmNlKCdwb2xsQ29tcGxldGUnLCBmdW5jdGlvbigpe1xyXG4gICAgICAgIGRlYnVnKCdwcmUtcGF1c2UgcG9sbGluZyBjb21wbGV0ZScpO1xyXG4gICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKCF0aGlzLndyaXRhYmxlKSB7XHJcbiAgICAgIGRlYnVnKCd3ZSBhcmUgY3VycmVudGx5IHdyaXRpbmcgLSB3YWl0aW5nIHRvIHBhdXNlJyk7XHJcbiAgICAgIHRvdGFsKys7XHJcbiAgICAgIHRoaXMub25jZSgnZHJhaW4nLCBmdW5jdGlvbigpe1xyXG4gICAgICAgIGRlYnVnKCdwcmUtcGF1c2Ugd3JpdGluZyBjb21wbGV0ZScpO1xyXG4gICAgICAgIC0tdG90YWwgfHwgcGF1c2UoKTtcclxuICAgICAgfSk7XHJcbiAgICB9XHJcbiAgfSBlbHNlIHtcclxuICAgIHBhdXNlKCk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIFN0YXJ0cyBwb2xsaW5nIGN5Y2xlLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcblBvbGxpbmcucHJvdG90eXBlLnBvbGwgPSBmdW5jdGlvbigpe1xyXG4gIGRlYnVnKCdwb2xsaW5nJyk7XHJcbiAgdGhpcy5wb2xsaW5nID0gdHJ1ZTtcclxuICB0aGlzLmRvUG9sbCgpO1xyXG4gIHRoaXMuZW1pdCgncG9sbCcpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE92ZXJsb2FkcyBvbkRhdGEgdG8gZGV0ZWN0IHBheWxvYWRzLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5Qb2xsaW5nLnByb3RvdHlwZS5vbkRhdGEgPSBmdW5jdGlvbihkYXRhKXtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgZGVidWcoJ3BvbGxpbmcgZ290IGRhdGEgJXMnLCBkYXRhKTtcclxuICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbihwYWNrZXQsIGluZGV4LCB0b3RhbCkge1xyXG4gICAgLy8gaWYgaXRzIHRoZSBmaXJzdCBtZXNzYWdlIHdlIGNvbnNpZGVyIHRoZSB0cmFuc3BvcnQgb3BlblxyXG4gICAgaWYgKCdvcGVuaW5nJyA9PSBzZWxmLnJlYWR5U3RhdGUpIHtcclxuICAgICAgc2VsZi5vbk9wZW4oKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBpZiBpdHMgYSBjbG9zZSBwYWNrZXQsIHdlIGNsb3NlIHRoZSBvbmdvaW5nIHJlcXVlc3RzXHJcbiAgICBpZiAoJ2Nsb3NlJyA9PSBwYWNrZXQudHlwZSkge1xyXG4gICAgICBzZWxmLm9uQ2xvc2UoKTtcclxuICAgICAgcmV0dXJuIGZhbHNlO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIG90aGVyd2lzZSBieXBhc3Mgb25EYXRhIGFuZCBoYW5kbGUgdGhlIG1lc3NhZ2VcclxuICAgIHNlbGYub25QYWNrZXQocGFja2V0KTtcclxuICB9O1xyXG5cclxuICAvLyBkZWNvZGUgcGF5bG9hZFxyXG4gIHBhcnNlci5kZWNvZGVQYXlsb2FkKGRhdGEsIHRoaXMuc29ja2V0LmJpbmFyeVR5cGUsIGNhbGxiYWNrKTtcclxuXHJcbiAgLy8gaWYgYW4gZXZlbnQgZGlkIG5vdCB0cmlnZ2VyIGNsb3NpbmdcclxuICBpZiAoJ2Nsb3NlZCcgIT0gdGhpcy5yZWFkeVN0YXRlKSB7XHJcbiAgICAvLyBpZiB3ZSBnb3QgZGF0YSB3ZSdyZSBub3QgcG9sbGluZ1xyXG4gICAgdGhpcy5wb2xsaW5nID0gZmFsc2U7XHJcbiAgICB0aGlzLmVtaXQoJ3BvbGxDb21wbGV0ZScpO1xyXG5cclxuICAgIGlmICgnb3BlbicgPT0gdGhpcy5yZWFkeVN0YXRlKSB7XHJcbiAgICAgIHRoaXMucG9sbCgpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZGVidWcoJ2lnbm9yaW5nIHBvbGwgLSB0cmFuc3BvcnQgc3RhdGUgXCIlc1wiJywgdGhpcy5yZWFkeVN0YXRlKTtcclxuICAgIH1cclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogRm9yIHBvbGxpbmcsIHNlbmQgYSBjbG9zZSBwYWNrZXQuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblBvbGxpbmcucHJvdG90eXBlLmRvQ2xvc2UgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBzZWxmID0gdGhpcztcclxuXHJcbiAgZnVuY3Rpb24gY2xvc2UoKXtcclxuICAgIGRlYnVnKCd3cml0aW5nIGNsb3NlIHBhY2tldCcpO1xyXG4gICAgc2VsZi53cml0ZShbeyB0eXBlOiAnY2xvc2UnIH1dKTtcclxuICB9XHJcblxyXG4gIGlmICgnb3BlbicgPT0gdGhpcy5yZWFkeVN0YXRlKSB7XHJcbiAgICBkZWJ1ZygndHJhbnNwb3J0IG9wZW4gLSBjbG9zaW5nJyk7XHJcbiAgICBjbG9zZSgpO1xyXG4gIH0gZWxzZSB7XHJcbiAgICAvLyBpbiBjYXNlIHdlJ3JlIHRyeWluZyB0byBjbG9zZSB3aGlsZVxyXG4gICAgLy8gaGFuZHNoYWtpbmcgaXMgaW4gcHJvZ3Jlc3MgKEdILTE2NClcclxuICAgIGRlYnVnKCd0cmFuc3BvcnQgbm90IG9wZW4gLSBkZWZlcnJpbmcgY2xvc2UnKTtcclxuICAgIHRoaXMub25jZSgnb3BlbicsIGNsb3NlKTtcclxuICB9XHJcbn07XHJcblxyXG4vKipcclxuICogV3JpdGVzIGEgcGFja2V0cyBwYXlsb2FkLlxyXG4gKlxyXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRhIHBhY2tldHNcclxuICogQHBhcmFtIHtGdW5jdGlvbn0gZHJhaW4gY2FsbGJhY2tcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuUG9sbGluZy5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbihwYWNrZXRzKXtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgdGhpcy53cml0YWJsZSA9IGZhbHNlO1xyXG4gIHZhciBjYWxsYmFja2ZuID0gZnVuY3Rpb24oKSB7XHJcbiAgICBzZWxmLndyaXRhYmxlID0gdHJ1ZTtcclxuICAgIHNlbGYuZW1pdCgnZHJhaW4nKTtcclxuICB9O1xyXG5cclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcbiAgcGFyc2VyLmVuY29kZVBheWxvYWQocGFja2V0cywgdGhpcy5zdXBwb3J0c0JpbmFyeSwgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgc2VsZi5kb1dyaXRlKGRhdGEsIGNhbGxiYWNrZm4pO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlcyB1cmkgZm9yIGNvbm5lY3Rpb24uXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcblBvbGxpbmcucHJvdG90eXBlLnVyaSA9IGZ1bmN0aW9uKCl7XHJcbiAgdmFyIHF1ZXJ5ID0gdGhpcy5xdWVyeSB8fCB7fTtcclxuICB2YXIgc2NoZW1hID0gdGhpcy5zZWN1cmUgPyAnaHR0cHMnIDogJ2h0dHAnO1xyXG4gIHZhciBwb3J0ID0gJyc7XHJcblxyXG4gIC8vIGNhY2hlIGJ1c3RpbmcgaXMgZm9yY2VkXHJcbiAgaWYgKGZhbHNlICE9PSB0aGlzLnRpbWVzdGFtcFJlcXVlc3RzKSB7XHJcbiAgICBxdWVyeVt0aGlzLnRpbWVzdGFtcFBhcmFtXSA9ICtuZXcgRGF0ZSArICctJyArIFRyYW5zcG9ydC50aW1lc3RhbXBzKys7XHJcbiAgfVxyXG5cclxuICBpZiAoIXRoaXMuc3VwcG9ydHNCaW5hcnkgJiYgIXF1ZXJ5LnNpZCkge1xyXG4gICAgcXVlcnkuYjY0ID0gMTtcclxuICB9XHJcblxyXG4gIHF1ZXJ5ID0gcGFyc2Vxcy5lbmNvZGUocXVlcnkpO1xyXG5cclxuICAvLyBhdm9pZCBwb3J0IGlmIGRlZmF1bHQgZm9yIHNjaGVtYVxyXG4gIGlmICh0aGlzLnBvcnQgJiYgKCgnaHR0cHMnID09IHNjaGVtYSAmJiB0aGlzLnBvcnQgIT0gNDQzKSB8fFxyXG4gICAgICgnaHR0cCcgPT0gc2NoZW1hICYmIHRoaXMucG9ydCAhPSA4MCkpKSB7XHJcbiAgICBwb3J0ID0gJzonICsgdGhpcy5wb3J0O1xyXG4gIH1cclxuXHJcbiAgLy8gcHJlcGVuZCA/IHRvIHF1ZXJ5XHJcbiAgaWYgKHF1ZXJ5Lmxlbmd0aCkge1xyXG4gICAgcXVlcnkgPSAnPycgKyBxdWVyeTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzY2hlbWEgKyAnOi8vJyArIHRoaXMuaG9zdG5hbWUgKyBwb3J0ICsgdGhpcy5wYXRoICsgcXVlcnk7XHJcbn07XHJcblxyXG59LHtcIi4uL3RyYW5zcG9ydFwiOjE0LFwiY29tcG9uZW50LWluaGVyaXRcIjoyMSxcImRlYnVnXCI6MjIsXCJlbmdpbmUuaW8tcGFyc2VyXCI6MjUsXCJwYXJzZXFzXCI6MzUsXCJ4bWxodHRwcmVxdWVzdFwiOjIwfV0sMTk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG4vKipcclxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cclxuICovXHJcblxyXG52YXIgVHJhbnNwb3J0ID0gX2RlcmVxXygnLi4vdHJhbnNwb3J0Jyk7XHJcbnZhciBwYXJzZXIgPSBfZGVyZXFfKCdlbmdpbmUuaW8tcGFyc2VyJyk7XHJcbnZhciBwYXJzZXFzID0gX2RlcmVxXygncGFyc2VxcycpO1xyXG52YXIgaW5oZXJpdCA9IF9kZXJlcV8oJ2NvbXBvbmVudC1pbmhlcml0Jyk7XHJcbnZhciBkZWJ1ZyA9IF9kZXJlcV8oJ2RlYnVnJykoJ2VuZ2luZS5pby1jbGllbnQ6d2Vic29ja2V0Jyk7XHJcblxyXG4vKipcclxuICogYHdzYCBleHBvc2VzIGEgV2ViU29ja2V0LWNvbXBhdGlibGUgaW50ZXJmYWNlIGluXHJcbiAqIE5vZGUsIG9yIHRoZSBgV2ViU29ja2V0YCBvciBgTW96V2ViU29ja2V0YCBnbG9iYWxzXHJcbiAqIGluIHRoZSBicm93c2VyLlxyXG4gKi9cclxuXHJcbnZhciBXZWJTb2NrZXQgPSBfZGVyZXFfKCd3cycpO1xyXG5cclxuLyoqXHJcbiAqIE1vZHVsZSBleHBvcnRzLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV1M7XHJcblxyXG4vKipcclxuICogV2ViU29ja2V0IHRyYW5zcG9ydCBjb25zdHJ1Y3Rvci5cclxuICpcclxuICogQGFwaSB7T2JqZWN0fSBjb25uZWN0aW9uIG9wdGlvbnNcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBXUyhvcHRzKXtcclxuICB2YXIgZm9yY2VCYXNlNjQgPSAob3B0cyAmJiBvcHRzLmZvcmNlQmFzZTY0KTtcclxuICBpZiAoZm9yY2VCYXNlNjQpIHtcclxuICAgIHRoaXMuc3VwcG9ydHNCaW5hcnkgPSBmYWxzZTtcclxuICB9XHJcbiAgVHJhbnNwb3J0LmNhbGwodGhpcywgb3B0cyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBJbmhlcml0cyBmcm9tIFRyYW5zcG9ydC5cclxuICovXHJcblxyXG5pbmhlcml0KFdTLCBUcmFuc3BvcnQpO1xyXG5cclxuLyoqXHJcbiAqIFRyYW5zcG9ydCBuYW1lLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbldTLnByb3RvdHlwZS5uYW1lID0gJ3dlYnNvY2tldCc7XHJcblxyXG4vKlxyXG4gKiBXZWJTb2NrZXRzIHN1cHBvcnQgYmluYXJ5XHJcbiAqL1xyXG5cclxuV1MucHJvdG90eXBlLnN1cHBvcnRzQmluYXJ5ID0gdHJ1ZTtcclxuXHJcbi8qKlxyXG4gKiBPcGVucyBzb2NrZXQuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbldTLnByb3RvdHlwZS5kb09wZW4gPSBmdW5jdGlvbigpe1xyXG4gIGlmICghdGhpcy5jaGVjaygpKSB7XHJcbiAgICAvLyBsZXQgcHJvYmUgdGltZW91dFxyXG4gICAgcmV0dXJuO1xyXG4gIH1cclxuXHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHZhciB1cmkgPSB0aGlzLnVyaSgpO1xyXG4gIHZhciBwcm90b2NvbHMgPSB2b2lkKDApO1xyXG4gIHZhciBvcHRzID0geyBhZ2VudDogdGhpcy5hZ2VudCB9O1xyXG5cclxuICAvLyBTU0wgb3B0aW9ucyBmb3IgTm9kZS5qcyBjbGllbnRcclxuICBvcHRzLnBmeCA9IHRoaXMucGZ4O1xyXG4gIG9wdHMua2V5ID0gdGhpcy5rZXk7XHJcbiAgb3B0cy5wYXNzcGhyYXNlID0gdGhpcy5wYXNzcGhyYXNlO1xyXG4gIG9wdHMuY2VydCA9IHRoaXMuY2VydDtcclxuICBvcHRzLmNhID0gdGhpcy5jYTtcclxuICBvcHRzLmNpcGhlcnMgPSB0aGlzLmNpcGhlcnM7XHJcbiAgb3B0cy5yZWplY3RVbmF1dGhvcml6ZWQgPSB0aGlzLnJlamVjdFVuYXV0aG9yaXplZDtcclxuXHJcbiAgdGhpcy53cyA9IG5ldyBXZWJTb2NrZXQodXJpLCBwcm90b2NvbHMsIG9wdHMpO1xyXG5cclxuICBpZiAodGhpcy53cy5iaW5hcnlUeXBlID09PSB1bmRlZmluZWQpIHtcclxuICAgIHRoaXMuc3VwcG9ydHNCaW5hcnkgPSBmYWxzZTtcclxuICB9XHJcblxyXG4gIHRoaXMud3MuYmluYXJ5VHlwZSA9ICdhcnJheWJ1ZmZlcic7XHJcbiAgdGhpcy5hZGRFdmVudExpc3RlbmVycygpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFkZHMgZXZlbnQgbGlzdGVuZXJzIHRvIHRoZSBzb2NrZXRcclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuV1MucHJvdG90eXBlLmFkZEV2ZW50TGlzdGVuZXJzID0gZnVuY3Rpb24oKXtcclxuICB2YXIgc2VsZiA9IHRoaXM7XHJcblxyXG4gIHRoaXMud3Mub25vcGVuID0gZnVuY3Rpb24oKXtcclxuICAgIHNlbGYub25PcGVuKCk7XHJcbiAgfTtcclxuICB0aGlzLndzLm9uY2xvc2UgPSBmdW5jdGlvbigpe1xyXG4gICAgc2VsZi5vbkNsb3NlKCk7XHJcbiAgfTtcclxuICB0aGlzLndzLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2KXtcclxuICAgIHNlbGYub25EYXRhKGV2LmRhdGEpO1xyXG4gIH07XHJcbiAgdGhpcy53cy5vbmVycm9yID0gZnVuY3Rpb24oZSl7XHJcbiAgICBzZWxmLm9uRXJyb3IoJ3dlYnNvY2tldCBlcnJvcicsIGUpO1xyXG4gIH07XHJcbn07XHJcblxyXG4vKipcclxuICogT3ZlcnJpZGUgYG9uRGF0YWAgdG8gdXNlIGEgdGltZXIgb24gaU9TLlxyXG4gKiBTZWU6IGh0dHBzOi8vZ2lzdC5naXRodWIuY29tL21sb3VnaHJhbi8yMDUyMDA2XHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmlmICgndW5kZWZpbmVkJyAhPSB0eXBlb2YgbmF2aWdhdG9yXHJcbiAgJiYgL2lQYWR8aVBob25lfGlQb2QvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XHJcbiAgV1MucHJvdG90eXBlLm9uRGF0YSA9IGZ1bmN0aW9uKGRhdGEpe1xyXG4gICAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gICAgc2V0VGltZW91dChmdW5jdGlvbigpe1xyXG4gICAgICBUcmFuc3BvcnQucHJvdG90eXBlLm9uRGF0YS5jYWxsKHNlbGYsIGRhdGEpO1xyXG4gICAgfSwgMCk7XHJcbiAgfTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFdyaXRlcyBkYXRhIHRvIHNvY2tldC5cclxuICpcclxuICogQHBhcmFtIHtBcnJheX0gYXJyYXkgb2YgcGFja2V0cy5cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuV1MucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24ocGFja2V0cyl7XHJcbiAgdmFyIHNlbGYgPSB0aGlzO1xyXG4gIHRoaXMud3JpdGFibGUgPSBmYWxzZTtcclxuICAvLyBlbmNvZGVQYWNrZXQgZWZmaWNpZW50IGFzIGl0IHVzZXMgV1MgZnJhbWluZ1xyXG4gIC8vIG5vIG5lZWQgZm9yIGVuY29kZVBheWxvYWRcclxuICBmb3IgKHZhciBpID0gMCwgbCA9IHBhY2tldHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICBwYXJzZXIuZW5jb2RlUGFja2V0KHBhY2tldHNbaV0sIHRoaXMuc3VwcG9ydHNCaW5hcnksIGZ1bmN0aW9uKGRhdGEpIHtcclxuICAgICAgLy9Tb21ldGltZXMgdGhlIHdlYnNvY2tldCBoYXMgYWxyZWFkeSBiZWVuIGNsb3NlZCBidXQgdGhlIGJyb3dzZXIgZGlkbid0XHJcbiAgICAgIC8vaGF2ZSBhIGNoYW5jZSBvZiBpbmZvcm1pbmcgdXMgYWJvdXQgaXQgeWV0LCBpbiB0aGF0IGNhc2Ugc2VuZCB3aWxsXHJcbiAgICAgIC8vdGhyb3cgYW4gZXJyb3JcclxuICAgICAgdHJ5IHtcclxuICAgICAgICBzZWxmLndzLnNlbmQoZGF0YSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpe1xyXG4gICAgICAgIGRlYnVnKCd3ZWJzb2NrZXQgY2xvc2VkIGJlZm9yZSBvbmNsb3NlIGV2ZW50Jyk7XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gb25kcmFpbigpIHtcclxuICAgIHNlbGYud3JpdGFibGUgPSB0cnVlO1xyXG4gICAgc2VsZi5lbWl0KCdkcmFpbicpO1xyXG4gIH1cclxuICAvLyBmYWtlIGRyYWluXHJcbiAgLy8gZGVmZXIgdG8gbmV4dCB0aWNrIHRvIGFsbG93IFNvY2tldCB0byBjbGVhciB3cml0ZUJ1ZmZlclxyXG4gIHNldFRpbWVvdXQob25kcmFpbiwgMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2FsbGVkIHVwb24gY2xvc2VcclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuV1MucHJvdG90eXBlLm9uQ2xvc2UgPSBmdW5jdGlvbigpe1xyXG4gIFRyYW5zcG9ydC5wcm90b3R5cGUub25DbG9zZS5jYWxsKHRoaXMpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENsb3NlcyBzb2NrZXQuXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbldTLnByb3RvdHlwZS5kb0Nsb3NlID0gZnVuY3Rpb24oKXtcclxuICBpZiAodHlwZW9mIHRoaXMud3MgIT09ICd1bmRlZmluZWQnKSB7XHJcbiAgICB0aGlzLndzLmNsb3NlKCk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEdlbmVyYXRlcyB1cmkgZm9yIGNvbm5lY3Rpb24uXHJcbiAqXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbldTLnByb3RvdHlwZS51cmkgPSBmdW5jdGlvbigpe1xyXG4gIHZhciBxdWVyeSA9IHRoaXMucXVlcnkgfHwge307XHJcbiAgdmFyIHNjaGVtYSA9IHRoaXMuc2VjdXJlID8gJ3dzcycgOiAnd3MnO1xyXG4gIHZhciBwb3J0ID0gJyc7XHJcblxyXG4gIC8vIGF2b2lkIHBvcnQgaWYgZGVmYXVsdCBmb3Igc2NoZW1hXHJcbiAgaWYgKHRoaXMucG9ydCAmJiAoKCd3c3MnID09IHNjaGVtYSAmJiB0aGlzLnBvcnQgIT0gNDQzKVxyXG4gICAgfHwgKCd3cycgPT0gc2NoZW1hICYmIHRoaXMucG9ydCAhPSA4MCkpKSB7XHJcbiAgICBwb3J0ID0gJzonICsgdGhpcy5wb3J0O1xyXG4gIH1cclxuXHJcbiAgLy8gYXBwZW5kIHRpbWVzdGFtcCB0byBVUklcclxuICBpZiAodGhpcy50aW1lc3RhbXBSZXF1ZXN0cykge1xyXG4gICAgcXVlcnlbdGhpcy50aW1lc3RhbXBQYXJhbV0gPSArbmV3IERhdGU7XHJcbiAgfVxyXG5cclxuICAvLyBjb21tdW5pY2F0ZSBiaW5hcnkgc3VwcG9ydCBjYXBhYmlsaXRpZXNcclxuICBpZiAoIXRoaXMuc3VwcG9ydHNCaW5hcnkpIHtcclxuICAgIHF1ZXJ5LmI2NCA9IDE7XHJcbiAgfVxyXG5cclxuICBxdWVyeSA9IHBhcnNlcXMuZW5jb2RlKHF1ZXJ5KTtcclxuXHJcbiAgLy8gcHJlcGVuZCA/IHRvIHF1ZXJ5XHJcbiAgaWYgKHF1ZXJ5Lmxlbmd0aCkge1xyXG4gICAgcXVlcnkgPSAnPycgKyBxdWVyeTtcclxuICB9XHJcblxyXG4gIHJldHVybiBzY2hlbWEgKyAnOi8vJyArIHRoaXMuaG9zdG5hbWUgKyBwb3J0ICsgdGhpcy5wYXRoICsgcXVlcnk7XHJcbn07XHJcblxyXG4vKipcclxuICogRmVhdHVyZSBkZXRlY3Rpb24gZm9yIFdlYlNvY2tldC5cclxuICpcclxuICogQHJldHVybiB7Qm9vbGVhbn0gd2hldGhlciB0aGlzIHRyYW5zcG9ydCBpcyBhdmFpbGFibGUuXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuV1MucHJvdG90eXBlLmNoZWNrID0gZnVuY3Rpb24oKXtcclxuICByZXR1cm4gISFXZWJTb2NrZXQgJiYgISgnX19pbml0aWFsaXplJyBpbiBXZWJTb2NrZXQgJiYgdGhpcy5uYW1lID09PSBXUy5wcm90b3R5cGUubmFtZSk7XHJcbn07XHJcblxyXG59LHtcIi4uL3RyYW5zcG9ydFwiOjE0LFwiY29tcG9uZW50LWluaGVyaXRcIjoyMSxcImRlYnVnXCI6MjIsXCJlbmdpbmUuaW8tcGFyc2VyXCI6MjUsXCJwYXJzZXFzXCI6MzUsXCJ3c1wiOjM3fV0sMjA6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG4vLyBicm93c2VyIHNoaW0gZm9yIHhtbGh0dHByZXF1ZXN0IG1vZHVsZVxyXG52YXIgaGFzQ09SUyA9IF9kZXJlcV8oJ2hhcy1jb3JzJyk7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKG9wdHMpIHtcclxuICB2YXIgeGRvbWFpbiA9IG9wdHMueGRvbWFpbjtcclxuXHJcbiAgLy8gc2NoZW1lIG11c3QgYmUgc2FtZSB3aGVuIHVzaWduIFhEb21haW5SZXF1ZXN0XHJcbiAgLy8gaHR0cDovL2Jsb2dzLm1zZG4uY29tL2IvaWVpbnRlcm5hbHMvYXJjaGl2ZS8yMDEwLzA1LzEzL3hkb21haW5yZXF1ZXN0LXJlc3RyaWN0aW9ucy1saW1pdGF0aW9ucy1hbmQtd29ya2Fyb3VuZHMuYXNweFxyXG4gIHZhciB4c2NoZW1lID0gb3B0cy54c2NoZW1lO1xyXG5cclxuICAvLyBYRG9tYWluUmVxdWVzdCBoYXMgYSBmbG93IG9mIG5vdCBzZW5kaW5nIGNvb2tpZSwgdGhlcmVmb3JlIGl0IHNob3VsZCBiZSBkaXNhYmxlZCBhcyBhIGRlZmF1bHQuXHJcbiAgLy8gaHR0cHM6Ly9naXRodWIuY29tL0F1dG9tYXR0aWMvZW5naW5lLmlvLWNsaWVudC9wdWxsLzIxN1xyXG4gIHZhciBlbmFibGVzWERSID0gb3B0cy5lbmFibGVzWERSO1xyXG5cclxuICAvLyBYTUxIdHRwUmVxdWVzdCBjYW4gYmUgZGlzYWJsZWQgb24gSUVcclxuICB0cnkge1xyXG4gICAgaWYgKCd1bmRlZmluZWQnICE9IHR5cGVvZiBYTUxIdHRwUmVxdWVzdCAmJiAoIXhkb21haW4gfHwgaGFzQ09SUykpIHtcclxuICAgICAgcmV0dXJuIG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHsgfVxyXG5cclxuICAvLyBVc2UgWERvbWFpblJlcXVlc3QgZm9yIElFOCBpZiBlbmFibGVzWERSIGlzIHRydWVcclxuICAvLyBiZWNhdXNlIGxvYWRpbmcgYmFyIGtlZXBzIGZsYXNoaW5nIHdoZW4gdXNpbmcganNvbnAtcG9sbGluZ1xyXG4gIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS95dWppb3Nha2Evc29ja2UuaW8taWU4LWxvYWRpbmctZXhhbXBsZVxyXG4gIHRyeSB7XHJcbiAgICBpZiAoJ3VuZGVmaW5lZCcgIT0gdHlwZW9mIFhEb21haW5SZXF1ZXN0ICYmICF4c2NoZW1lICYmIGVuYWJsZXNYRFIpIHtcclxuICAgICAgcmV0dXJuIG5ldyBYRG9tYWluUmVxdWVzdCgpO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2ggKGUpIHsgfVxyXG5cclxuICBpZiAoIXhkb21haW4pIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHJldHVybiBuZXcgQWN0aXZlWE9iamVjdCgnTWljcm9zb2Z0LlhNTEhUVFAnKTtcclxuICAgIH0gY2F0Y2goZSkgeyB9XHJcbiAgfVxyXG59XHJcblxyXG59LHtcImhhcy1jb3JzXCI6NDB9XSwyMTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGEsIGIpe1xyXG4gIHZhciBmbiA9IGZ1bmN0aW9uKCl7fTtcclxuICBmbi5wcm90b3R5cGUgPSBiLnByb3RvdHlwZTtcclxuICBhLnByb3RvdHlwZSA9IG5ldyBmbjtcclxuICBhLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IGE7XHJcbn07XHJcbn0se31dLDIyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbi8qKlxyXG4gKiBUaGlzIGlzIHRoZSB3ZWIgYnJvd3NlciBpbXBsZW1lbnRhdGlvbiBvZiBgZGVidWcoKWAuXHJcbiAqXHJcbiAqIEV4cG9zZSBgZGVidWcoKWAgYXMgdGhlIG1vZHVsZS5cclxuICovXHJcblxyXG5leHBvcnRzID0gbW9kdWxlLmV4cG9ydHMgPSBfZGVyZXFfKCcuL2RlYnVnJyk7XHJcbmV4cG9ydHMubG9nID0gbG9nO1xyXG5leHBvcnRzLmZvcm1hdEFyZ3MgPSBmb3JtYXRBcmdzO1xyXG5leHBvcnRzLnNhdmUgPSBzYXZlO1xyXG5leHBvcnRzLmxvYWQgPSBsb2FkO1xyXG5leHBvcnRzLnVzZUNvbG9ycyA9IHVzZUNvbG9ycztcclxuXHJcbi8qKlxyXG4gKiBDb2xvcnMuXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5jb2xvcnMgPSBbXHJcbiAgJ2xpZ2h0c2VhZ3JlZW4nLFxyXG4gICdmb3Jlc3RncmVlbicsXHJcbiAgJ2dvbGRlbnJvZCcsXHJcbiAgJ2RvZGdlcmJsdWUnLFxyXG4gICdkYXJrb3JjaGlkJyxcclxuICAnY3JpbXNvbidcclxuXTtcclxuXHJcbi8qKlxyXG4gKiBDdXJyZW50bHkgb25seSBXZWJLaXQtYmFzZWQgV2ViIEluc3BlY3RvcnMsIEZpcmVmb3ggPj0gdjMxLFxyXG4gKiBhbmQgdGhlIEZpcmVidWcgZXh0ZW5zaW9uIChhbnkgRmlyZWZveCB2ZXJzaW9uKSBhcmUga25vd25cclxuICogdG8gc3VwcG9ydCBcIiVjXCIgQ1NTIGN1c3RvbWl6YXRpb25zLlxyXG4gKlxyXG4gKiBUT0RPOiBhZGQgYSBgbG9jYWxTdG9yYWdlYCB2YXJpYWJsZSB0byBleHBsaWNpdGx5IGVuYWJsZS9kaXNhYmxlIGNvbG9yc1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIHVzZUNvbG9ycygpIHtcclxuICAvLyBpcyB3ZWJraXQ/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzE2NDU5NjA2LzM3Njc3M1xyXG4gIHJldHVybiAoJ1dlYmtpdEFwcGVhcmFuY2UnIGluIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZSkgfHxcclxuICAgIC8vIGlzIGZpcmVidWc/IGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9hLzM5ODEyMC8zNzY3NzNcclxuICAgICh3aW5kb3cuY29uc29sZSAmJiAoY29uc29sZS5maXJlYnVnIHx8IChjb25zb2xlLmV4Y2VwdGlvbiAmJiBjb25zb2xlLnRhYmxlKSkpIHx8XHJcbiAgICAvLyBpcyBmaXJlZm94ID49IHYzMT9cclxuICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1vemlsbGEub3JnL2VuLVVTL2RvY3MvVG9vbHMvV2ViX0NvbnNvbGUjU3R5bGluZ19tZXNzYWdlc1xyXG4gICAgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5tYXRjaCgvZmlyZWZveFxcLyhcXGQrKS8pICYmIHBhcnNlSW50KFJlZ0V4cC4kMSwgMTApID49IDMxKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIE1hcCAlaiB0byBgSlNPTi5zdHJpbmdpZnkoKWAsIHNpbmNlIG5vIFdlYiBJbnNwZWN0b3JzIGRvIHRoYXQgYnkgZGVmYXVsdC5cclxuICovXHJcblxyXG5leHBvcnRzLmZvcm1hdHRlcnMuaiA9IGZ1bmN0aW9uKHYpIHtcclxuICByZXR1cm4gSlNPTi5zdHJpbmdpZnkodik7XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIENvbG9yaXplIGxvZyBhcmd1bWVudHMgaWYgZW5hYmxlZC5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBmb3JtYXRBcmdzKCkge1xyXG4gIHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG4gIHZhciB1c2VDb2xvcnMgPSB0aGlzLnVzZUNvbG9ycztcclxuXHJcbiAgYXJnc1swXSA9ICh1c2VDb2xvcnMgPyAnJWMnIDogJycpXHJcbiAgICArIHRoaXMubmFtZXNwYWNlXHJcbiAgICArICh1c2VDb2xvcnMgPyAnICVjJyA6ICcgJylcclxuICAgICsgYXJnc1swXVxyXG4gICAgKyAodXNlQ29sb3JzID8gJyVjICcgOiAnICcpXHJcbiAgICArICcrJyArIGV4cG9ydHMuaHVtYW5pemUodGhpcy5kaWZmKTtcclxuXHJcbiAgaWYgKCF1c2VDb2xvcnMpIHJldHVybiBhcmdzO1xyXG5cclxuICB2YXIgYyA9ICdjb2xvcjogJyArIHRoaXMuY29sb3I7XHJcbiAgYXJncyA9IFthcmdzWzBdLCBjLCAnY29sb3I6IGluaGVyaXQnXS5jb25jYXQoQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJncywgMSkpO1xyXG5cclxuICAvLyB0aGUgZmluYWwgXCIlY1wiIGlzIHNvbWV3aGF0IHRyaWNreSwgYmVjYXVzZSB0aGVyZSBjb3VsZCBiZSBvdGhlclxyXG4gIC8vIGFyZ3VtZW50cyBwYXNzZWQgZWl0aGVyIGJlZm9yZSBvciBhZnRlciB0aGUgJWMsIHNvIHdlIG5lZWQgdG9cclxuICAvLyBmaWd1cmUgb3V0IHRoZSBjb3JyZWN0IGluZGV4IHRvIGluc2VydCB0aGUgQ1NTIGludG9cclxuICB2YXIgaW5kZXggPSAwO1xyXG4gIHZhciBsYXN0QyA9IDA7XHJcbiAgYXJnc1swXS5yZXBsYWNlKC8lW2EteiVdL2csIGZ1bmN0aW9uKG1hdGNoKSB7XHJcbiAgICBpZiAoJyUnID09PSBtYXRjaCkgcmV0dXJuO1xyXG4gICAgaW5kZXgrKztcclxuICAgIGlmICgnJWMnID09PSBtYXRjaCkge1xyXG4gICAgICAvLyB3ZSBvbmx5IGFyZSBpbnRlcmVzdGVkIGluIHRoZSAqbGFzdCogJWNcclxuICAgICAgLy8gKHRoZSB1c2VyIG1heSBoYXZlIHByb3ZpZGVkIHRoZWlyIG93bilcclxuICAgICAgbGFzdEMgPSBpbmRleDtcclxuICAgIH1cclxuICB9KTtcclxuXHJcbiAgYXJncy5zcGxpY2UobGFzdEMsIDAsIGMpO1xyXG4gIHJldHVybiBhcmdzO1xyXG59XHJcblxyXG4vKipcclxuICogSW52b2tlcyBgY29uc29sZS5sb2coKWAgd2hlbiBhdmFpbGFibGUuXHJcbiAqIE5vLW9wIHdoZW4gYGNvbnNvbGUubG9nYCBpcyBub3QgYSBcImZ1bmN0aW9uXCIuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gbG9nKCkge1xyXG4gIC8vIFRoaXMgaGFja2VyeSBpcyByZXF1aXJlZCBmb3IgSUU4LFxyXG4gIC8vIHdoZXJlIHRoZSBgY29uc29sZS5sb2dgIGZ1bmN0aW9uIGRvZXNuJ3QgaGF2ZSAnYXBwbHknXHJcbiAgcmV0dXJuICdvYmplY3QnID09IHR5cGVvZiBjb25zb2xlXHJcbiAgICAmJiAnZnVuY3Rpb24nID09IHR5cGVvZiBjb25zb2xlLmxvZ1xyXG4gICAgJiYgRnVuY3Rpb24ucHJvdG90eXBlLmFwcGx5LmNhbGwoY29uc29sZS5sb2csIGNvbnNvbGUsIGFyZ3VtZW50cyk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTYXZlIGBuYW1lc3BhY2VzYC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZXNcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gc2F2ZShuYW1lc3BhY2VzKSB7XHJcbiAgdHJ5IHtcclxuICAgIGlmIChudWxsID09IG5hbWVzcGFjZXMpIHtcclxuICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ2RlYnVnJyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBsb2NhbFN0b3JhZ2UuZGVidWcgPSBuYW1lc3BhY2VzO1xyXG4gICAgfVxyXG4gIH0gY2F0Y2goZSkge31cclxufVxyXG5cclxuLyoqXHJcbiAqIExvYWQgYG5hbWVzcGFjZXNgLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IHJldHVybnMgdGhlIHByZXZpb3VzbHkgcGVyc2lzdGVkIGRlYnVnIG1vZGVzXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIGxvYWQoKSB7XHJcbiAgdmFyIHI7XHJcbiAgdHJ5IHtcclxuICAgIHIgPSBsb2NhbFN0b3JhZ2UuZGVidWc7XHJcbiAgfSBjYXRjaChlKSB7fVxyXG4gIHJldHVybiByO1xyXG59XHJcblxyXG4vKipcclxuICogRW5hYmxlIG5hbWVzcGFjZXMgbGlzdGVkIGluIGBsb2NhbFN0b3JhZ2UuZGVidWdgIGluaXRpYWxseS5cclxuICovXHJcblxyXG5leHBvcnRzLmVuYWJsZShsb2FkKCkpO1xyXG5cclxufSx7XCIuL2RlYnVnXCI6MjN9XSwyMzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG4vKipcclxuICogVGhpcyBpcyB0aGUgY29tbW9uIGxvZ2ljIGZvciBib3RoIHRoZSBOb2RlLmpzIGFuZCB3ZWIgYnJvd3NlclxyXG4gKiBpbXBsZW1lbnRhdGlvbnMgb2YgYGRlYnVnKClgLlxyXG4gKlxyXG4gKiBFeHBvc2UgYGRlYnVnKClgIGFzIHRoZSBtb2R1bGUuXHJcbiAqL1xyXG5cclxuZXhwb3J0cyA9IG1vZHVsZS5leHBvcnRzID0gZGVidWc7XHJcbmV4cG9ydHMuY29lcmNlID0gY29lcmNlO1xyXG5leHBvcnRzLmRpc2FibGUgPSBkaXNhYmxlO1xyXG5leHBvcnRzLmVuYWJsZSA9IGVuYWJsZTtcclxuZXhwb3J0cy5lbmFibGVkID0gZW5hYmxlZDtcclxuZXhwb3J0cy5odW1hbml6ZSA9IF9kZXJlcV8oJ21zJyk7XHJcblxyXG4vKipcclxuICogVGhlIGN1cnJlbnRseSBhY3RpdmUgZGVidWcgbW9kZSBuYW1lcywgYW5kIG5hbWVzIHRvIHNraXAuXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5uYW1lcyA9IFtdO1xyXG5leHBvcnRzLnNraXBzID0gW107XHJcblxyXG4vKipcclxuICogTWFwIG9mIHNwZWNpYWwgXCIlblwiIGhhbmRsaW5nIGZ1bmN0aW9ucywgZm9yIHRoZSBkZWJ1ZyBcImZvcm1hdFwiIGFyZ3VtZW50LlxyXG4gKlxyXG4gKiBWYWxpZCBrZXkgbmFtZXMgYXJlIGEgc2luZ2xlLCBsb3dlcmNhc2VkIGxldHRlciwgaS5lLiBcIm5cIi5cclxuICovXHJcblxyXG5leHBvcnRzLmZvcm1hdHRlcnMgPSB7fTtcclxuXHJcbi8qKlxyXG4gKiBQcmV2aW91c2x5IGFzc2lnbmVkIGNvbG9yLlxyXG4gKi9cclxuXHJcbnZhciBwcmV2Q29sb3IgPSAwO1xyXG5cclxuLyoqXHJcbiAqIFByZXZpb3VzIGxvZyB0aW1lc3RhbXAuXHJcbiAqL1xyXG5cclxudmFyIHByZXZUaW1lO1xyXG5cclxuLyoqXHJcbiAqIFNlbGVjdCBhIGNvbG9yLlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIHNlbGVjdENvbG9yKCkge1xyXG4gIHJldHVybiBleHBvcnRzLmNvbG9yc1twcmV2Q29sb3IrKyAlIGV4cG9ydHMuY29sb3JzLmxlbmd0aF07XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDcmVhdGUgYSBkZWJ1Z2dlciB3aXRoIHRoZSBnaXZlbiBgbmFtZXNwYWNlYC5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG5hbWVzcGFjZVxyXG4gKiBAcmV0dXJuIHtGdW5jdGlvbn1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBkZWJ1ZyhuYW1lc3BhY2UpIHtcclxuXHJcbiAgLy8gZGVmaW5lIHRoZSBgZGlzYWJsZWRgIHZlcnNpb25cclxuICBmdW5jdGlvbiBkaXNhYmxlZCgpIHtcclxuICB9XHJcbiAgZGlzYWJsZWQuZW5hYmxlZCA9IGZhbHNlO1xyXG5cclxuICAvLyBkZWZpbmUgdGhlIGBlbmFibGVkYCB2ZXJzaW9uXHJcbiAgZnVuY3Rpb24gZW5hYmxlZCgpIHtcclxuXHJcbiAgICB2YXIgc2VsZiA9IGVuYWJsZWQ7XHJcblxyXG4gICAgLy8gc2V0IGBkaWZmYCB0aW1lc3RhbXBcclxuICAgIHZhciBjdXJyID0gK25ldyBEYXRlKCk7XHJcbiAgICB2YXIgbXMgPSBjdXJyIC0gKHByZXZUaW1lIHx8IGN1cnIpO1xyXG4gICAgc2VsZi5kaWZmID0gbXM7XHJcbiAgICBzZWxmLnByZXYgPSBwcmV2VGltZTtcclxuICAgIHNlbGYuY3VyciA9IGN1cnI7XHJcbiAgICBwcmV2VGltZSA9IGN1cnI7XHJcblxyXG4gICAgLy8gYWRkIHRoZSBgY29sb3JgIGlmIG5vdCBzZXRcclxuICAgIGlmIChudWxsID09IHNlbGYudXNlQ29sb3JzKSBzZWxmLnVzZUNvbG9ycyA9IGV4cG9ydHMudXNlQ29sb3JzKCk7XHJcbiAgICBpZiAobnVsbCA9PSBzZWxmLmNvbG9yICYmIHNlbGYudXNlQ29sb3JzKSBzZWxmLmNvbG9yID0gc2VsZWN0Q29sb3IoKTtcclxuXHJcbiAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XHJcblxyXG4gICAgYXJnc1swXSA9IGV4cG9ydHMuY29lcmNlKGFyZ3NbMF0pO1xyXG5cclxuICAgIGlmICgnc3RyaW5nJyAhPT0gdHlwZW9mIGFyZ3NbMF0pIHtcclxuICAgICAgLy8gYW55dGhpbmcgZWxzZSBsZXQncyBpbnNwZWN0IHdpdGggJW9cclxuICAgICAgYXJncyA9IFsnJW8nXS5jb25jYXQoYXJncyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gYXBwbHkgYW55IGBmb3JtYXR0ZXJzYCB0cmFuc2Zvcm1hdGlvbnNcclxuICAgIHZhciBpbmRleCA9IDA7XHJcbiAgICBhcmdzWzBdID0gYXJnc1swXS5yZXBsYWNlKC8lKFthLXolXSkvZywgZnVuY3Rpb24obWF0Y2gsIGZvcm1hdCkge1xyXG4gICAgICAvLyBpZiB3ZSBlbmNvdW50ZXIgYW4gZXNjYXBlZCAlIHRoZW4gZG9uJ3QgaW5jcmVhc2UgdGhlIGFycmF5IGluZGV4XHJcbiAgICAgIGlmIChtYXRjaCA9PT0gJyUnKSByZXR1cm4gbWF0Y2g7XHJcbiAgICAgIGluZGV4Kys7XHJcbiAgICAgIHZhciBmb3JtYXR0ZXIgPSBleHBvcnRzLmZvcm1hdHRlcnNbZm9ybWF0XTtcclxuICAgICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBmb3JtYXR0ZXIpIHtcclxuICAgICAgICB2YXIgdmFsID0gYXJnc1tpbmRleF07XHJcbiAgICAgICAgbWF0Y2ggPSBmb3JtYXR0ZXIuY2FsbChzZWxmLCB2YWwpO1xyXG5cclxuICAgICAgICAvLyBub3cgd2UgbmVlZCB0byByZW1vdmUgYGFyZ3NbaW5kZXhdYCBzaW5jZSBpdCdzIGlubGluZWQgaW4gdGhlIGBmb3JtYXRgXHJcbiAgICAgICAgYXJncy5zcGxpY2UoaW5kZXgsIDEpO1xyXG4gICAgICAgIGluZGV4LS07XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIG1hdGNoO1xyXG4gICAgfSk7XHJcblxyXG4gICAgaWYgKCdmdW5jdGlvbicgPT09IHR5cGVvZiBleHBvcnRzLmZvcm1hdEFyZ3MpIHtcclxuICAgICAgYXJncyA9IGV4cG9ydHMuZm9ybWF0QXJncy5hcHBseShzZWxmLCBhcmdzKTtcclxuICAgIH1cclxuICAgIHZhciBsb2dGbiA9IGVuYWJsZWQubG9nIHx8IGV4cG9ydHMubG9nIHx8IGNvbnNvbGUubG9nLmJpbmQoY29uc29sZSk7XHJcbiAgICBsb2dGbi5hcHBseShzZWxmLCBhcmdzKTtcclxuICB9XHJcbiAgZW5hYmxlZC5lbmFibGVkID0gdHJ1ZTtcclxuXHJcbiAgdmFyIGZuID0gZXhwb3J0cy5lbmFibGVkKG5hbWVzcGFjZSkgPyBlbmFibGVkIDogZGlzYWJsZWQ7XHJcblxyXG4gIGZuLm5hbWVzcGFjZSA9IG5hbWVzcGFjZTtcclxuXHJcbiAgcmV0dXJuIGZuO1xyXG59XHJcblxyXG4vKipcclxuICogRW5hYmxlcyBhIGRlYnVnIG1vZGUgYnkgbmFtZXNwYWNlcy4gVGhpcyBjYW4gaW5jbHVkZSBtb2Rlc1xyXG4gKiBzZXBhcmF0ZWQgYnkgYSBjb2xvbiBhbmQgd2lsZGNhcmRzLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZXNwYWNlc1xyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIGVuYWJsZShuYW1lc3BhY2VzKSB7XHJcbiAgZXhwb3J0cy5zYXZlKG5hbWVzcGFjZXMpO1xyXG5cclxuICB2YXIgc3BsaXQgPSAobmFtZXNwYWNlcyB8fCAnJykuc3BsaXQoL1tcXHMsXSsvKTtcclxuICB2YXIgbGVuID0gc3BsaXQubGVuZ3RoO1xyXG5cclxuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgaSsrKSB7XHJcbiAgICBpZiAoIXNwbGl0W2ldKSBjb250aW51ZTsgLy8gaWdub3JlIGVtcHR5IHN0cmluZ3NcclxuICAgIG5hbWVzcGFjZXMgPSBzcGxpdFtpXS5yZXBsYWNlKC9cXCovZywgJy4qPycpO1xyXG4gICAgaWYgKG5hbWVzcGFjZXNbMF0gPT09ICctJykge1xyXG4gICAgICBleHBvcnRzLnNraXBzLnB1c2gobmV3IFJlZ0V4cCgnXicgKyBuYW1lc3BhY2VzLnN1YnN0cigxKSArICckJykpO1xyXG4gICAgfSBlbHNlIHtcclxuICAgICAgZXhwb3J0cy5uYW1lcy5wdXNoKG5ldyBSZWdFeHAoJ14nICsgbmFtZXNwYWNlcyArICckJykpO1xyXG4gICAgfVxyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIERpc2FibGUgZGVidWcgb3V0cHV0LlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIGRpc2FibGUoKSB7XHJcbiAgZXhwb3J0cy5lbmFibGUoJycpO1xyXG59XHJcblxyXG4vKipcclxuICogUmV0dXJucyB0cnVlIGlmIHRoZSBnaXZlbiBtb2RlIG5hbWUgaXMgZW5hYmxlZCwgZmFsc2Ugb3RoZXJ3aXNlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gbmFtZVxyXG4gKiBAcmV0dXJuIHtCb29sZWFufVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIGVuYWJsZWQobmFtZSkge1xyXG4gIHZhciBpLCBsZW47XHJcbiAgZm9yIChpID0gMCwgbGVuID0gZXhwb3J0cy5za2lwcy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG4gICAgaWYgKGV4cG9ydHMuc2tpcHNbaV0udGVzdChuYW1lKSkge1xyXG4gICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGZvciAoaSA9IDAsIGxlbiA9IGV4cG9ydHMubmFtZXMubGVuZ3RoOyBpIDwgbGVuOyBpKyspIHtcclxuICAgIGlmIChleHBvcnRzLm5hbWVzW2ldLnRlc3QobmFtZSkpIHtcclxuICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBmYWxzZTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENvZXJjZSBgdmFsYC5cclxuICpcclxuICogQHBhcmFtIHtNaXhlZH0gdmFsXHJcbiAqIEByZXR1cm4ge01peGVkfVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5mdW5jdGlvbiBjb2VyY2UodmFsKSB7XHJcbiAgaWYgKHZhbCBpbnN0YW5jZW9mIEVycm9yKSByZXR1cm4gdmFsLnN0YWNrIHx8IHZhbC5tZXNzYWdlO1xyXG4gIHJldHVybiB2YWw7XHJcbn1cclxuXHJcbn0se1wibXNcIjoyNH1dLDI0OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuLyoqXHJcbiAqIEhlbHBlcnMuXHJcbiAqL1xyXG5cclxudmFyIHMgPSAxMDAwO1xyXG52YXIgbSA9IHMgKiA2MDtcclxudmFyIGggPSBtICogNjA7XHJcbnZhciBkID0gaCAqIDI0O1xyXG52YXIgeSA9IGQgKiAzNjUuMjU7XHJcblxyXG4vKipcclxuICogUGFyc2Ugb3IgZm9ybWF0IHRoZSBnaXZlbiBgdmFsYC5cclxuICpcclxuICogT3B0aW9uczpcclxuICpcclxuICogIC0gYGxvbmdgIHZlcmJvc2UgZm9ybWF0dGluZyBbZmFsc2VdXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfE51bWJlcn0gdmFsXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXHJcbiAqIEByZXR1cm4ge1N0cmluZ3xOdW1iZXJ9XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih2YWwsIG9wdGlvbnMpe1xyXG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xyXG4gIGlmICgnc3RyaW5nJyA9PSB0eXBlb2YgdmFsKSByZXR1cm4gcGFyc2UodmFsKTtcclxuICByZXR1cm4gb3B0aW9ucy5sb25nXHJcbiAgICA/IGxvbmcodmFsKVxyXG4gICAgOiBzaG9ydCh2YWwpO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFBhcnNlIHRoZSBnaXZlbiBgc3RyYCBhbmQgcmV0dXJuIG1pbGxpc2Vjb25kcy5cclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxyXG4gKiBAcmV0dXJuIHtOdW1iZXJ9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIHBhcnNlKHN0cikge1xyXG4gIHZhciBtYXRjaCA9IC9eKCg/OlxcZCspP1xcLj9cXGQrKSAqKG1zfHNlY29uZHM/fHN8bWludXRlcz98bXxob3Vycz98aHxkYXlzP3xkfHllYXJzP3x5KT8kL2kuZXhlYyhzdHIpO1xyXG4gIGlmICghbWF0Y2gpIHJldHVybjtcclxuICB2YXIgbiA9IHBhcnNlRmxvYXQobWF0Y2hbMV0pO1xyXG4gIHZhciB0eXBlID0gKG1hdGNoWzJdIHx8ICdtcycpLnRvTG93ZXJDYXNlKCk7XHJcbiAgc3dpdGNoICh0eXBlKSB7XHJcbiAgICBjYXNlICd5ZWFycyc6XHJcbiAgICBjYXNlICd5ZWFyJzpcclxuICAgIGNhc2UgJ3knOlxyXG4gICAgICByZXR1cm4gbiAqIHk7XHJcbiAgICBjYXNlICdkYXlzJzpcclxuICAgIGNhc2UgJ2RheSc6XHJcbiAgICBjYXNlICdkJzpcclxuICAgICAgcmV0dXJuIG4gKiBkO1xyXG4gICAgY2FzZSAnaG91cnMnOlxyXG4gICAgY2FzZSAnaG91cic6XHJcbiAgICBjYXNlICdoJzpcclxuICAgICAgcmV0dXJuIG4gKiBoO1xyXG4gICAgY2FzZSAnbWludXRlcyc6XHJcbiAgICBjYXNlICdtaW51dGUnOlxyXG4gICAgY2FzZSAnbSc6XHJcbiAgICAgIHJldHVybiBuICogbTtcclxuICAgIGNhc2UgJ3NlY29uZHMnOlxyXG4gICAgY2FzZSAnc2Vjb25kJzpcclxuICAgIGNhc2UgJ3MnOlxyXG4gICAgICByZXR1cm4gbiAqIHM7XHJcbiAgICBjYXNlICdtcyc6XHJcbiAgICAgIHJldHVybiBuO1xyXG4gIH1cclxufVxyXG5cclxuLyoqXHJcbiAqIFNob3J0IGZvcm1hdCBmb3IgYG1zYC5cclxuICpcclxuICogQHBhcmFtIHtOdW1iZXJ9IG1zXHJcbiAqIEByZXR1cm4ge1N0cmluZ31cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gc2hvcnQobXMpIHtcclxuICBpZiAobXMgPj0gZCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBkKSArICdkJztcclxuICBpZiAobXMgPj0gaCkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBoKSArICdoJztcclxuICBpZiAobXMgPj0gbSkgcmV0dXJuIE1hdGgucm91bmQobXMgLyBtKSArICdtJztcclxuICBpZiAobXMgPj0gcykgcmV0dXJuIE1hdGgucm91bmQobXMgLyBzKSArICdzJztcclxuICByZXR1cm4gbXMgKyAnbXMnO1xyXG59XHJcblxyXG4vKipcclxuICogTG9uZyBmb3JtYXQgZm9yIGBtc2AuXHJcbiAqXHJcbiAqIEBwYXJhbSB7TnVtYmVyfSBtc1xyXG4gKiBAcmV0dXJuIHtTdHJpbmd9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIGxvbmcobXMpIHtcclxuICByZXR1cm4gcGx1cmFsKG1zLCBkLCAnZGF5JylcclxuICAgIHx8IHBsdXJhbChtcywgaCwgJ2hvdXInKVxyXG4gICAgfHwgcGx1cmFsKG1zLCBtLCAnbWludXRlJylcclxuICAgIHx8IHBsdXJhbChtcywgcywgJ3NlY29uZCcpXHJcbiAgICB8fCBtcyArICcgbXMnO1xyXG59XHJcblxyXG4vKipcclxuICogUGx1cmFsaXphdGlvbiBoZWxwZXIuXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gcGx1cmFsKG1zLCBuLCBuYW1lKSB7XHJcbiAgaWYgKG1zIDwgbikgcmV0dXJuO1xyXG4gIGlmIChtcyA8IG4gKiAxLjUpIHJldHVybiBNYXRoLmZsb29yKG1zIC8gbikgKyAnICcgKyBuYW1lO1xyXG4gIHJldHVybiBNYXRoLmNlaWwobXMgLyBuKSArICcgJyArIG5hbWUgKyAncyc7XHJcbn1cclxuXHJcbn0se31dLDI1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuKGZ1bmN0aW9uIChnbG9iYWwpe1xyXG4vKipcclxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cclxuICovXHJcblxyXG52YXIga2V5cyA9IF9kZXJlcV8oJy4va2V5cycpO1xyXG52YXIgaGFzQmluYXJ5ID0gX2RlcmVxXygnaGFzLWJpbmFyeScpO1xyXG52YXIgc2xpY2VCdWZmZXIgPSBfZGVyZXFfKCdhcnJheWJ1ZmZlci5zbGljZScpO1xyXG52YXIgYmFzZTY0ZW5jb2RlciA9IF9kZXJlcV8oJ2Jhc2U2NC1hcnJheWJ1ZmZlcicpO1xyXG52YXIgYWZ0ZXIgPSBfZGVyZXFfKCdhZnRlcicpO1xyXG52YXIgdXRmOCA9IF9kZXJlcV8oJ3V0ZjgnKTtcclxuXHJcbi8qKlxyXG4gKiBDaGVjayBpZiB3ZSBhcmUgcnVubmluZyBhbiBhbmRyb2lkIGJyb3dzZXIuIFRoYXQgcmVxdWlyZXMgdXMgdG8gdXNlXHJcbiAqIEFycmF5QnVmZmVyIHdpdGggcG9sbGluZyB0cmFuc3BvcnRzLi4uXHJcbiAqXHJcbiAqIGh0dHA6Ly9naGluZGEubmV0L2pwZWctYmxvYi1hamF4LWFuZHJvaWQvXHJcbiAqL1xyXG5cclxudmFyIGlzQW5kcm9pZCA9IG5hdmlnYXRvci51c2VyQWdlbnQubWF0Y2goL0FuZHJvaWQvaSk7XHJcblxyXG4vKipcclxuICogQ2hlY2sgaWYgd2UgYXJlIHJ1bm5pbmcgaW4gUGhhbnRvbUpTLlxyXG4gKiBVcGxvYWRpbmcgYSBCbG9iIHdpdGggUGhhbnRvbUpTIGRvZXMgbm90IHdvcmsgY29ycmVjdGx5LCBhcyByZXBvcnRlZCBoZXJlOlxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vYXJpeWEvcGhhbnRvbWpzL2lzc3Vlcy8xMTM5NVxyXG4gKiBAdHlwZSBib29sZWFuXHJcbiAqL1xyXG52YXIgaXNQaGFudG9tSlMgPSAvUGhhbnRvbUpTL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KTtcclxuXHJcbi8qKlxyXG4gKiBXaGVuIHRydWUsIGF2b2lkcyB1c2luZyBCbG9icyB0byBlbmNvZGUgcGF5bG9hZHMuXHJcbiAqIEB0eXBlIGJvb2xlYW5cclxuICovXHJcbnZhciBkb250U2VuZEJsb2JzID0gaXNBbmRyb2lkIHx8IGlzUGhhbnRvbUpTO1xyXG5cclxuLyoqXHJcbiAqIEN1cnJlbnQgcHJvdG9jb2wgdmVyc2lvbi5cclxuICovXHJcblxyXG5leHBvcnRzLnByb3RvY29sID0gMztcclxuXHJcbi8qKlxyXG4gKiBQYWNrZXQgdHlwZXMuXHJcbiAqL1xyXG5cclxudmFyIHBhY2tldHMgPSBleHBvcnRzLnBhY2tldHMgPSB7XHJcbiAgICBvcGVuOiAgICAgMCAgICAvLyBub24td3NcclxuICAsIGNsb3NlOiAgICAxICAgIC8vIG5vbi13c1xyXG4gICwgcGluZzogICAgIDJcclxuICAsIHBvbmc6ICAgICAzXHJcbiAgLCBtZXNzYWdlOiAgNFxyXG4gICwgdXBncmFkZTogIDVcclxuICAsIG5vb3A6ICAgICA2XHJcbn07XHJcblxyXG52YXIgcGFja2V0c2xpc3QgPSBrZXlzKHBhY2tldHMpO1xyXG5cclxuLyoqXHJcbiAqIFByZW1hZGUgZXJyb3IgcGFja2V0LlxyXG4gKi9cclxuXHJcbnZhciBlcnIgPSB7IHR5cGU6ICdlcnJvcicsIGRhdGE6ICdwYXJzZXIgZXJyb3InIH07XHJcblxyXG4vKipcclxuICogQ3JlYXRlIGEgYmxvYiBhcGkgZXZlbiBmb3IgYmxvYiBidWlsZGVyIHdoZW4gdmVuZG9yIHByZWZpeGVzIGV4aXN0XHJcbiAqL1xyXG5cclxudmFyIEJsb2IgPSBfZGVyZXFfKCdibG9iJyk7XHJcblxyXG4vKipcclxuICogRW5jb2RlcyBhIHBhY2tldC5cclxuICpcclxuICogICAgIDxwYWNrZXQgdHlwZSBpZD4gWyA8ZGF0YT4gXVxyXG4gKlxyXG4gKiBFeGFtcGxlOlxyXG4gKlxyXG4gKiAgICAgNWhlbGxvIHdvcmxkXHJcbiAqICAgICAzXHJcbiAqICAgICA0XHJcbiAqXHJcbiAqIEJpbmFyeSBpcyBlbmNvZGVkIGluIGFuIGlkZW50aWNhbCBwcmluY2lwbGVcclxuICpcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5lbmNvZGVQYWNrZXQgPSBmdW5jdGlvbiAocGFja2V0LCBzdXBwb3J0c0JpbmFyeSwgdXRmOGVuY29kZSwgY2FsbGJhY2spIHtcclxuICBpZiAoJ2Z1bmN0aW9uJyA9PSB0eXBlb2Ygc3VwcG9ydHNCaW5hcnkpIHtcclxuICAgIGNhbGxiYWNrID0gc3VwcG9ydHNCaW5hcnk7XHJcbiAgICBzdXBwb3J0c0JpbmFyeSA9IGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgaWYgKCdmdW5jdGlvbicgPT0gdHlwZW9mIHV0ZjhlbmNvZGUpIHtcclxuICAgIGNhbGxiYWNrID0gdXRmOGVuY29kZTtcclxuICAgIHV0ZjhlbmNvZGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIGRhdGEgPSAocGFja2V0LmRhdGEgPT09IHVuZGVmaW5lZClcclxuICAgID8gdW5kZWZpbmVkXHJcbiAgICA6IHBhY2tldC5kYXRhLmJ1ZmZlciB8fCBwYWNrZXQuZGF0YTtcclxuXHJcbiAgaWYgKGdsb2JhbC5BcnJheUJ1ZmZlciAmJiBkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIpIHtcclxuICAgIHJldHVybiBlbmNvZGVBcnJheUJ1ZmZlcihwYWNrZXQsIHN1cHBvcnRzQmluYXJ5LCBjYWxsYmFjayk7XHJcbiAgfSBlbHNlIGlmIChCbG9iICYmIGRhdGEgaW5zdGFuY2VvZiBnbG9iYWwuQmxvYikge1xyXG4gICAgcmV0dXJuIGVuY29kZUJsb2IocGFja2V0LCBzdXBwb3J0c0JpbmFyeSwgY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgLy8gbWlnaHQgYmUgYW4gb2JqZWN0IHdpdGggeyBiYXNlNjQ6IHRydWUsIGRhdGE6IGRhdGFBc0Jhc2U2NFN0cmluZyB9XHJcbiAgaWYgKGRhdGEgJiYgZGF0YS5iYXNlNjQpIHtcclxuICAgIHJldHVybiBlbmNvZGVCYXNlNjRPYmplY3QocGFja2V0LCBjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICAvLyBTZW5kaW5nIGRhdGEgYXMgYSB1dGYtOCBzdHJpbmdcclxuICB2YXIgZW5jb2RlZCA9IHBhY2tldHNbcGFja2V0LnR5cGVdO1xyXG5cclxuICAvLyBkYXRhIGZyYWdtZW50IGlzIG9wdGlvbmFsXHJcbiAgaWYgKHVuZGVmaW5lZCAhPT0gcGFja2V0LmRhdGEpIHtcclxuICAgIGVuY29kZWQgKz0gdXRmOGVuY29kZSA/IHV0ZjguZW5jb2RlKFN0cmluZyhwYWNrZXQuZGF0YSkpIDogU3RyaW5nKHBhY2tldC5kYXRhKTtcclxuICB9XHJcblxyXG4gIHJldHVybiBjYWxsYmFjaygnJyArIGVuY29kZWQpO1xyXG5cclxufTtcclxuXHJcbmZ1bmN0aW9uIGVuY29kZUJhc2U2NE9iamVjdChwYWNrZXQsIGNhbGxiYWNrKSB7XHJcbiAgLy8gcGFja2V0IGRhdGEgaXMgYW4gb2JqZWN0IHsgYmFzZTY0OiB0cnVlLCBkYXRhOiBkYXRhQXNCYXNlNjRTdHJpbmcgfVxyXG4gIHZhciBtZXNzYWdlID0gJ2InICsgZXhwb3J0cy5wYWNrZXRzW3BhY2tldC50eXBlXSArIHBhY2tldC5kYXRhLmRhdGE7XHJcbiAgcmV0dXJuIGNhbGxiYWNrKG1lc3NhZ2UpO1xyXG59XHJcblxyXG4vKipcclxuICogRW5jb2RlIHBhY2tldCBoZWxwZXJzIGZvciBiaW5hcnkgdHlwZXNcclxuICovXHJcblxyXG5mdW5jdGlvbiBlbmNvZGVBcnJheUJ1ZmZlcihwYWNrZXQsIHN1cHBvcnRzQmluYXJ5LCBjYWxsYmFjaykge1xyXG4gIGlmICghc3VwcG9ydHNCaW5hcnkpIHtcclxuICAgIHJldHVybiBleHBvcnRzLmVuY29kZUJhc2U2NFBhY2tldChwYWNrZXQsIGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIHZhciBkYXRhID0gcGFja2V0LmRhdGE7XHJcbiAgdmFyIGNvbnRlbnRBcnJheSA9IG5ldyBVaW50OEFycmF5KGRhdGEpO1xyXG4gIHZhciByZXN1bHRCdWZmZXIgPSBuZXcgVWludDhBcnJheSgxICsgZGF0YS5ieXRlTGVuZ3RoKTtcclxuXHJcbiAgcmVzdWx0QnVmZmVyWzBdID0gcGFja2V0c1twYWNrZXQudHlwZV07XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250ZW50QXJyYXkubGVuZ3RoOyBpKyspIHtcclxuICAgIHJlc3VsdEJ1ZmZlcltpKzFdID0gY29udGVudEFycmF5W2ldO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIGNhbGxiYWNrKHJlc3VsdEJ1ZmZlci5idWZmZXIpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBlbmNvZGVCbG9iQXNBcnJheUJ1ZmZlcihwYWNrZXQsIHN1cHBvcnRzQmluYXJ5LCBjYWxsYmFjaykge1xyXG4gIGlmICghc3VwcG9ydHNCaW5hcnkpIHtcclxuICAgIHJldHVybiBleHBvcnRzLmVuY29kZUJhc2U2NFBhY2tldChwYWNrZXQsIGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIHZhciBmciA9IG5ldyBGaWxlUmVhZGVyKCk7XHJcbiAgZnIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICBwYWNrZXQuZGF0YSA9IGZyLnJlc3VsdDtcclxuICAgIGV4cG9ydHMuZW5jb2RlUGFja2V0KHBhY2tldCwgc3VwcG9ydHNCaW5hcnksIHRydWUsIGNhbGxiYWNrKTtcclxuICB9O1xyXG4gIHJldHVybiBmci5yZWFkQXNBcnJheUJ1ZmZlcihwYWNrZXQuZGF0YSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGVuY29kZUJsb2IocGFja2V0LCBzdXBwb3J0c0JpbmFyeSwgY2FsbGJhY2spIHtcclxuICBpZiAoIXN1cHBvcnRzQmluYXJ5KSB7XHJcbiAgICByZXR1cm4gZXhwb3J0cy5lbmNvZGVCYXNlNjRQYWNrZXQocGFja2V0LCBjYWxsYmFjayk7XHJcbiAgfVxyXG5cclxuICBpZiAoZG9udFNlbmRCbG9icykge1xyXG4gICAgcmV0dXJuIGVuY29kZUJsb2JBc0FycmF5QnVmZmVyKHBhY2tldCwgc3VwcG9ydHNCaW5hcnksIGNhbGxiYWNrKTtcclxuICB9XHJcblxyXG4gIHZhciBsZW5ndGggPSBuZXcgVWludDhBcnJheSgxKTtcclxuICBsZW5ndGhbMF0gPSBwYWNrZXRzW3BhY2tldC50eXBlXTtcclxuICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtsZW5ndGguYnVmZmVyLCBwYWNrZXQuZGF0YV0pO1xyXG5cclxuICByZXR1cm4gY2FsbGJhY2soYmxvYik7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBFbmNvZGVzIGEgcGFja2V0IHdpdGggYmluYXJ5IGRhdGEgaW4gYSBiYXNlNjQgc3RyaW5nXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXQsIGhhcyBgdHlwZWAgYW5kIGBkYXRhYFxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2VcclxuICovXHJcblxyXG5leHBvcnRzLmVuY29kZUJhc2U2NFBhY2tldCA9IGZ1bmN0aW9uKHBhY2tldCwgY2FsbGJhY2spIHtcclxuICB2YXIgbWVzc2FnZSA9ICdiJyArIGV4cG9ydHMucGFja2V0c1twYWNrZXQudHlwZV07XHJcbiAgaWYgKEJsb2IgJiYgcGFja2V0LmRhdGEgaW5zdGFuY2VvZiBCbG9iKSB7XHJcbiAgICB2YXIgZnIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgZnIub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgIHZhciBiNjQgPSBmci5yZXN1bHQuc3BsaXQoJywnKVsxXTtcclxuICAgICAgY2FsbGJhY2sobWVzc2FnZSArIGI2NCk7XHJcbiAgICB9O1xyXG4gICAgcmV0dXJuIGZyLnJlYWRBc0RhdGFVUkwocGFja2V0LmRhdGEpO1xyXG4gIH1cclxuXHJcbiAgdmFyIGI2NGRhdGE7XHJcbiAgdHJ5IHtcclxuICAgIGI2NGRhdGEgPSBTdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsIG5ldyBVaW50OEFycmF5KHBhY2tldC5kYXRhKSk7XHJcbiAgfSBjYXRjaCAoZSkge1xyXG4gICAgLy8gaVBob25lIFNhZmFyaSBkb2Vzbid0IGxldCB5b3UgYXBwbHkgd2l0aCB0eXBlZCBhcnJheXNcclxuICAgIHZhciB0eXBlZCA9IG5ldyBVaW50OEFycmF5KHBhY2tldC5kYXRhKTtcclxuICAgIHZhciBiYXNpYyA9IG5ldyBBcnJheSh0eXBlZC5sZW5ndGgpO1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0eXBlZC5sZW5ndGg7IGkrKykge1xyXG4gICAgICBiYXNpY1tpXSA9IHR5cGVkW2ldO1xyXG4gICAgfVxyXG4gICAgYjY0ZGF0YSA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgYmFzaWMpO1xyXG4gIH1cclxuICBtZXNzYWdlICs9IGdsb2JhbC5idG9hKGI2NGRhdGEpO1xyXG4gIHJldHVybiBjYWxsYmFjayhtZXNzYWdlKTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIGEgcGFja2V0LiBDaGFuZ2VzIGZvcm1hdCB0byBCbG9iIGlmIHJlcXVlc3RlZC5cclxuICpcclxuICogQHJldHVybiB7T2JqZWN0fSB3aXRoIGB0eXBlYCBhbmQgYGRhdGFgIChpZiBhbnkpXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmV4cG9ydHMuZGVjb2RlUGFja2V0ID0gZnVuY3Rpb24gKGRhdGEsIGJpbmFyeVR5cGUsIHV0ZjhkZWNvZGUpIHtcclxuICAvLyBTdHJpbmcgZGF0YVxyXG4gIGlmICh0eXBlb2YgZGF0YSA9PSAnc3RyaW5nJyB8fCBkYXRhID09PSB1bmRlZmluZWQpIHtcclxuICAgIGlmIChkYXRhLmNoYXJBdCgwKSA9PSAnYicpIHtcclxuICAgICAgcmV0dXJuIGV4cG9ydHMuZGVjb2RlQmFzZTY0UGFja2V0KGRhdGEuc3Vic3RyKDEpLCBiaW5hcnlUeXBlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodXRmOGRlY29kZSkge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIGRhdGEgPSB1dGY4LmRlY29kZShkYXRhKTtcclxuICAgICAgfSBjYXRjaCAoZSkge1xyXG4gICAgICAgIHJldHVybiBlcnI7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICAgIHZhciB0eXBlID0gZGF0YS5jaGFyQXQoMCk7XHJcblxyXG4gICAgaWYgKE51bWJlcih0eXBlKSAhPSB0eXBlIHx8ICFwYWNrZXRzbGlzdFt0eXBlXSkge1xyXG4gICAgICByZXR1cm4gZXJyO1xyXG4gICAgfVxyXG5cclxuICAgIGlmIChkYXRhLmxlbmd0aCA+IDEpIHtcclxuICAgICAgcmV0dXJuIHsgdHlwZTogcGFja2V0c2xpc3RbdHlwZV0sIGRhdGE6IGRhdGEuc3Vic3RyaW5nKDEpIH07XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICByZXR1cm4geyB0eXBlOiBwYWNrZXRzbGlzdFt0eXBlXSB9O1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgdmFyIGFzQXJyYXkgPSBuZXcgVWludDhBcnJheShkYXRhKTtcclxuICB2YXIgdHlwZSA9IGFzQXJyYXlbMF07XHJcbiAgdmFyIHJlc3QgPSBzbGljZUJ1ZmZlcihkYXRhLCAxKTtcclxuICBpZiAoQmxvYiAmJiBiaW5hcnlUeXBlID09PSAnYmxvYicpIHtcclxuICAgIHJlc3QgPSBuZXcgQmxvYihbcmVzdF0pO1xyXG4gIH1cclxuICByZXR1cm4geyB0eXBlOiBwYWNrZXRzbGlzdFt0eXBlXSwgZGF0YTogcmVzdCB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlY29kZXMgYSBwYWNrZXQgZW5jb2RlZCBpbiBhIGJhc2U2NCBzdHJpbmdcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IGJhc2U2NCBlbmNvZGVkIG1lc3NhZ2VcclxuICogQHJldHVybiB7T2JqZWN0fSB3aXRoIGB0eXBlYCBhbmQgYGRhdGFgIChpZiBhbnkpXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5kZWNvZGVCYXNlNjRQYWNrZXQgPSBmdW5jdGlvbihtc2csIGJpbmFyeVR5cGUpIHtcclxuICB2YXIgdHlwZSA9IHBhY2tldHNsaXN0W21zZy5jaGFyQXQoMCldO1xyXG4gIGlmICghZ2xvYmFsLkFycmF5QnVmZmVyKSB7XHJcbiAgICByZXR1cm4geyB0eXBlOiB0eXBlLCBkYXRhOiB7IGJhc2U2NDogdHJ1ZSwgZGF0YTogbXNnLnN1YnN0cigxKSB9IH07XHJcbiAgfVxyXG5cclxuICB2YXIgZGF0YSA9IGJhc2U2NGVuY29kZXIuZGVjb2RlKG1zZy5zdWJzdHIoMSkpO1xyXG5cclxuICBpZiAoYmluYXJ5VHlwZSA9PT0gJ2Jsb2InICYmIEJsb2IpIHtcclxuICAgIGRhdGEgPSBuZXcgQmxvYihbZGF0YV0pO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHsgdHlwZTogdHlwZSwgZGF0YTogZGF0YSB9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVuY29kZXMgbXVsdGlwbGUgbWVzc2FnZXMgKHBheWxvYWQpLlxyXG4gKlxyXG4gKiAgICAgPGxlbmd0aD46ZGF0YVxyXG4gKlxyXG4gKiBFeGFtcGxlOlxyXG4gKlxyXG4gKiAgICAgMTE6aGVsbG8gd29ybGQyOmhpXHJcbiAqXHJcbiAqIElmIGFueSBjb250ZW50cyBhcmUgYmluYXJ5LCB0aGV5IHdpbGwgYmUgZW5jb2RlZCBhcyBiYXNlNjQgc3RyaW5ncy4gQmFzZTY0XHJcbiAqIGVuY29kZWQgc3RyaW5ncyBhcmUgbWFya2VkIHdpdGggYSBiIGJlZm9yZSB0aGUgbGVuZ3RoIHNwZWNpZmllclxyXG4gKlxyXG4gKiBAcGFyYW0ge0FycmF5fSBwYWNrZXRzXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmV4cG9ydHMuZW5jb2RlUGF5bG9hZCA9IGZ1bmN0aW9uIChwYWNrZXRzLCBzdXBwb3J0c0JpbmFyeSwgY2FsbGJhY2spIHtcclxuICBpZiAodHlwZW9mIHN1cHBvcnRzQmluYXJ5ID09ICdmdW5jdGlvbicpIHtcclxuICAgIGNhbGxiYWNrID0gc3VwcG9ydHNCaW5hcnk7XHJcbiAgICBzdXBwb3J0c0JpbmFyeSA9IG51bGw7XHJcbiAgfVxyXG5cclxuICB2YXIgaXNCaW5hcnkgPSBoYXNCaW5hcnkocGFja2V0cyk7XHJcblxyXG4gIGlmIChzdXBwb3J0c0JpbmFyeSAmJiBpc0JpbmFyeSkge1xyXG4gICAgaWYgKEJsb2IgJiYgIWRvbnRTZW5kQmxvYnMpIHtcclxuICAgICAgcmV0dXJuIGV4cG9ydHMuZW5jb2RlUGF5bG9hZEFzQmxvYihwYWNrZXRzLCBjYWxsYmFjayk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGV4cG9ydHMuZW5jb2RlUGF5bG9hZEFzQXJyYXlCdWZmZXIocGFja2V0cywgY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgaWYgKCFwYWNrZXRzLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuIGNhbGxiYWNrKCcwOicpO1xyXG4gIH1cclxuXHJcbiAgZnVuY3Rpb24gc2V0TGVuZ3RoSGVhZGVyKG1lc3NhZ2UpIHtcclxuICAgIHJldHVybiBtZXNzYWdlLmxlbmd0aCArICc6JyArIG1lc3NhZ2U7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBlbmNvZGVPbmUocGFja2V0LCBkb25lQ2FsbGJhY2spIHtcclxuICAgIGV4cG9ydHMuZW5jb2RlUGFja2V0KHBhY2tldCwgIWlzQmluYXJ5ID8gZmFsc2UgOiBzdXBwb3J0c0JpbmFyeSwgdHJ1ZSwgZnVuY3Rpb24obWVzc2FnZSkge1xyXG4gICAgICBkb25lQ2FsbGJhY2sobnVsbCwgc2V0TGVuZ3RoSGVhZGVyKG1lc3NhZ2UpKTtcclxuICAgIH0pO1xyXG4gIH1cclxuXHJcbiAgbWFwKHBhY2tldHMsIGVuY29kZU9uZSwgZnVuY3Rpb24oZXJyLCByZXN1bHRzKSB7XHJcbiAgICByZXR1cm4gY2FsbGJhY2socmVzdWx0cy5qb2luKCcnKSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKipcclxuICogQXN5bmMgYXJyYXkgbWFwIHVzaW5nIGFmdGVyXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gbWFwKGFyeSwgZWFjaCwgZG9uZSkge1xyXG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkoYXJ5Lmxlbmd0aCk7XHJcbiAgdmFyIG5leHQgPSBhZnRlcihhcnkubGVuZ3RoLCBkb25lKTtcclxuXHJcbiAgdmFyIGVhY2hXaXRoSW5kZXggPSBmdW5jdGlvbihpLCBlbCwgY2IpIHtcclxuICAgIGVhY2goZWwsIGZ1bmN0aW9uKGVycm9yLCBtc2cpIHtcclxuICAgICAgcmVzdWx0W2ldID0gbXNnO1xyXG4gICAgICBjYihlcnJvciwgcmVzdWx0KTtcclxuICAgIH0pO1xyXG4gIH07XHJcblxyXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgYXJ5Lmxlbmd0aDsgaSsrKSB7XHJcbiAgICBlYWNoV2l0aEluZGV4KGksIGFyeVtpXSwgbmV4dCk7XHJcbiAgfVxyXG59XHJcblxyXG4vKlxyXG4gKiBEZWNvZGVzIGRhdGEgd2hlbiBhIHBheWxvYWQgaXMgbWF5YmUgZXhwZWN0ZWQuIFBvc3NpYmxlIGJpbmFyeSBjb250ZW50cyBhcmVcclxuICogZGVjb2RlZCBmcm9tIHRoZWlyIGJhc2U2NCByZXByZXNlbnRhdGlvblxyXG4gKlxyXG4gKiBAcGFyYW0ge1N0cmluZ30gZGF0YSwgY2FsbGJhY2sgbWV0aG9kXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5kZWNvZGVQYXlsb2FkID0gZnVuY3Rpb24gKGRhdGEsIGJpbmFyeVR5cGUsIGNhbGxiYWNrKSB7XHJcbiAgaWYgKHR5cGVvZiBkYXRhICE9ICdzdHJpbmcnKSB7XHJcbiAgICByZXR1cm4gZXhwb3J0cy5kZWNvZGVQYXlsb2FkQXNCaW5hcnkoZGF0YSwgYmluYXJ5VHlwZSwgY2FsbGJhY2spO1xyXG4gIH1cclxuXHJcbiAgaWYgKHR5cGVvZiBiaW5hcnlUeXBlID09PSAnZnVuY3Rpb24nKSB7XHJcbiAgICBjYWxsYmFjayA9IGJpbmFyeVR5cGU7XHJcbiAgICBiaW5hcnlUeXBlID0gbnVsbDtcclxuICB9XHJcblxyXG4gIHZhciBwYWNrZXQ7XHJcbiAgaWYgKGRhdGEgPT0gJycpIHtcclxuICAgIC8vIHBhcnNlciBlcnJvciAtIGlnbm9yaW5nIHBheWxvYWRcclxuICAgIHJldHVybiBjYWxsYmFjayhlcnIsIDAsIDEpO1xyXG4gIH1cclxuXHJcbiAgdmFyIGxlbmd0aCA9ICcnXHJcbiAgICAsIG4sIG1zZztcclxuXHJcbiAgZm9yICh2YXIgaSA9IDAsIGwgPSBkYXRhLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG4gICAgdmFyIGNociA9IGRhdGEuY2hhckF0KGkpO1xyXG5cclxuICAgIGlmICgnOicgIT0gY2hyKSB7XHJcbiAgICAgIGxlbmd0aCArPSBjaHI7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBpZiAoJycgPT0gbGVuZ3RoIHx8IChsZW5ndGggIT0gKG4gPSBOdW1iZXIobGVuZ3RoKSkpKSB7XHJcbiAgICAgICAgLy8gcGFyc2VyIGVycm9yIC0gaWdub3JpbmcgcGF5bG9hZFxyXG4gICAgICAgIHJldHVybiBjYWxsYmFjayhlcnIsIDAsIDEpO1xyXG4gICAgICB9XHJcblxyXG4gICAgICBtc2cgPSBkYXRhLnN1YnN0cihpICsgMSwgbik7XHJcblxyXG4gICAgICBpZiAobGVuZ3RoICE9IG1zZy5sZW5ndGgpIHtcclxuICAgICAgICAvLyBwYXJzZXIgZXJyb3IgLSBpZ25vcmluZyBwYXlsb2FkXHJcbiAgICAgICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgMCwgMSk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChtc2cubGVuZ3RoKSB7XHJcbiAgICAgICAgcGFja2V0ID0gZXhwb3J0cy5kZWNvZGVQYWNrZXQobXNnLCBiaW5hcnlUeXBlLCB0cnVlKTtcclxuXHJcbiAgICAgICAgaWYgKGVyci50eXBlID09IHBhY2tldC50eXBlICYmIGVyci5kYXRhID09IHBhY2tldC5kYXRhKSB7XHJcbiAgICAgICAgICAvLyBwYXJzZXIgZXJyb3IgaW4gaW5kaXZpZHVhbCBwYWNrZXQgLSBpZ25vcmluZyBwYXlsb2FkXHJcbiAgICAgICAgICByZXR1cm4gY2FsbGJhY2soZXJyLCAwLCAxKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHZhciByZXQgPSBjYWxsYmFjayhwYWNrZXQsIGkgKyBuLCBsKTtcclxuICAgICAgICBpZiAoZmFsc2UgPT09IHJldCkgcmV0dXJuO1xyXG4gICAgICB9XHJcblxyXG4gICAgICAvLyBhZHZhbmNlIGN1cnNvclxyXG4gICAgICBpICs9IG47XHJcbiAgICAgIGxlbmd0aCA9ICcnO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgaWYgKGxlbmd0aCAhPSAnJykge1xyXG4gICAgLy8gcGFyc2VyIGVycm9yIC0gaWdub3JpbmcgcGF5bG9hZFxyXG4gICAgcmV0dXJuIGNhbGxiYWNrKGVyciwgMCwgMSk7XHJcbiAgfVxyXG5cclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbmNvZGVzIG11bHRpcGxlIG1lc3NhZ2VzIChwYXlsb2FkKSBhcyBiaW5hcnkuXHJcbiAqXHJcbiAqIDwxID0gYmluYXJ5LCAwID0gc3RyaW5nPjxudW1iZXIgZnJvbSAwLTk+PG51bWJlciBmcm9tIDAtOT5bLi4uXTxudW1iZXJcclxuICogMjU1PjxkYXRhPlxyXG4gKlxyXG4gKiBFeGFtcGxlOlxyXG4gKiAxIDMgMjU1IDEgMiAzLCBpZiB0aGUgYmluYXJ5IGNvbnRlbnRzIGFyZSBpbnRlcnByZXRlZCBhcyA4IGJpdCBpbnRlZ2Vyc1xyXG4gKlxyXG4gKiBAcGFyYW0ge0FycmF5fSBwYWNrZXRzXHJcbiAqIEByZXR1cm4ge0FycmF5QnVmZmVyfSBlbmNvZGVkIHBheWxvYWRcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5lbmNvZGVQYXlsb2FkQXNBcnJheUJ1ZmZlciA9IGZ1bmN0aW9uKHBhY2tldHMsIGNhbGxiYWNrKSB7XHJcbiAgaWYgKCFwYWNrZXRzLmxlbmd0aCkge1xyXG4gICAgcmV0dXJuIGNhbGxiYWNrKG5ldyBBcnJheUJ1ZmZlcigwKSk7XHJcbiAgfVxyXG5cclxuICBmdW5jdGlvbiBlbmNvZGVPbmUocGFja2V0LCBkb25lQ2FsbGJhY2spIHtcclxuICAgIGV4cG9ydHMuZW5jb2RlUGFja2V0KHBhY2tldCwgdHJ1ZSwgdHJ1ZSwgZnVuY3Rpb24oZGF0YSkge1xyXG4gICAgICByZXR1cm4gZG9uZUNhbGxiYWNrKG51bGwsIGRhdGEpO1xyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBtYXAocGFja2V0cywgZW5jb2RlT25lLCBmdW5jdGlvbihlcnIsIGVuY29kZWRQYWNrZXRzKSB7XHJcbiAgICB2YXIgdG90YWxMZW5ndGggPSBlbmNvZGVkUGFja2V0cy5yZWR1Y2UoZnVuY3Rpb24oYWNjLCBwKSB7XHJcbiAgICAgIHZhciBsZW47XHJcbiAgICAgIGlmICh0eXBlb2YgcCA9PT0gJ3N0cmluZycpe1xyXG4gICAgICAgIGxlbiA9IHAubGVuZ3RoO1xyXG4gICAgICB9IGVsc2Uge1xyXG4gICAgICAgIGxlbiA9IHAuYnl0ZUxlbmd0aDtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gYWNjICsgbGVuLnRvU3RyaW5nKCkubGVuZ3RoICsgbGVuICsgMjsgLy8gc3RyaW5nL2JpbmFyeSBpZGVudGlmaWVyICsgc2VwYXJhdG9yID0gMlxyXG4gICAgfSwgMCk7XHJcblxyXG4gICAgdmFyIHJlc3VsdEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkodG90YWxMZW5ndGgpO1xyXG5cclxuICAgIHZhciBidWZmZXJJbmRleCA9IDA7XHJcbiAgICBlbmNvZGVkUGFja2V0cy5mb3JFYWNoKGZ1bmN0aW9uKHApIHtcclxuICAgICAgdmFyIGlzU3RyaW5nID0gdHlwZW9mIHAgPT09ICdzdHJpbmcnO1xyXG4gICAgICB2YXIgYWIgPSBwO1xyXG4gICAgICBpZiAoaXNTdHJpbmcpIHtcclxuICAgICAgICB2YXIgdmlldyA9IG5ldyBVaW50OEFycmF5KHAubGVuZ3RoKTtcclxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHAubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIHZpZXdbaV0gPSBwLmNoYXJDb2RlQXQoaSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGFiID0gdmlldy5idWZmZXI7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGlmIChpc1N0cmluZykgeyAvLyBub3QgdHJ1ZSBiaW5hcnlcclxuICAgICAgICByZXN1bHRBcnJheVtidWZmZXJJbmRleCsrXSA9IDA7XHJcbiAgICAgIH0gZWxzZSB7IC8vIHRydWUgYmluYXJ5XHJcbiAgICAgICAgcmVzdWx0QXJyYXlbYnVmZmVySW5kZXgrK10gPSAxO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgbGVuU3RyID0gYWIuYnl0ZUxlbmd0aC50b1N0cmluZygpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlblN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIHJlc3VsdEFycmF5W2J1ZmZlckluZGV4KytdID0gcGFyc2VJbnQobGVuU3RyW2ldKTtcclxuICAgICAgfVxyXG4gICAgICByZXN1bHRBcnJheVtidWZmZXJJbmRleCsrXSA9IDI1NTtcclxuXHJcbiAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoYWIpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHZpZXcubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICByZXN1bHRBcnJheVtidWZmZXJJbmRleCsrXSA9IHZpZXdbaV07XHJcbiAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHJldHVybiBjYWxsYmFjayhyZXN1bHRBcnJheS5idWZmZXIpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEVuY29kZSBhcyBCbG9iXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5lbmNvZGVQYXlsb2FkQXNCbG9iID0gZnVuY3Rpb24ocGFja2V0cywgY2FsbGJhY2spIHtcclxuICBmdW5jdGlvbiBlbmNvZGVPbmUocGFja2V0LCBkb25lQ2FsbGJhY2spIHtcclxuICAgIGV4cG9ydHMuZW5jb2RlUGFja2V0KHBhY2tldCwgdHJ1ZSwgdHJ1ZSwgZnVuY3Rpb24oZW5jb2RlZCkge1xyXG4gICAgICB2YXIgYmluYXJ5SWRlbnRpZmllciA9IG5ldyBVaW50OEFycmF5KDEpO1xyXG4gICAgICBiaW5hcnlJZGVudGlmaWVyWzBdID0gMTtcclxuICAgICAgaWYgKHR5cGVvZiBlbmNvZGVkID09PSAnc3RyaW5nJykge1xyXG4gICAgICAgIHZhciB2aWV3ID0gbmV3IFVpbnQ4QXJyYXkoZW5jb2RlZC5sZW5ndGgpO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZW5jb2RlZC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgICAgdmlld1tpXSA9IGVuY29kZWQuY2hhckNvZGVBdChpKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZW5jb2RlZCA9IHZpZXcuYnVmZmVyO1xyXG4gICAgICAgIGJpbmFyeUlkZW50aWZpZXJbMF0gPSAwO1xyXG4gICAgICB9XHJcblxyXG4gICAgICB2YXIgbGVuID0gKGVuY29kZWQgaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcilcclxuICAgICAgICA/IGVuY29kZWQuYnl0ZUxlbmd0aFxyXG4gICAgICAgIDogZW5jb2RlZC5zaXplO1xyXG5cclxuICAgICAgdmFyIGxlblN0ciA9IGxlbi50b1N0cmluZygpO1xyXG4gICAgICB2YXIgbGVuZ3RoQXJ5ID0gbmV3IFVpbnQ4QXJyYXkobGVuU3RyLmxlbmd0aCArIDEpO1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlblN0ci5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGxlbmd0aEFyeVtpXSA9IHBhcnNlSW50KGxlblN0cltpXSk7XHJcbiAgICAgIH1cclxuICAgICAgbGVuZ3RoQXJ5W2xlblN0ci5sZW5ndGhdID0gMjU1O1xyXG5cclxuICAgICAgaWYgKEJsb2IpIHtcclxuICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtiaW5hcnlJZGVudGlmaWVyLmJ1ZmZlciwgbGVuZ3RoQXJ5LmJ1ZmZlciwgZW5jb2RlZF0pO1xyXG4gICAgICAgIGRvbmVDYWxsYmFjayhudWxsLCBibG9iKTtcclxuICAgICAgfVxyXG4gICAgfSk7XHJcbiAgfVxyXG5cclxuICBtYXAocGFja2V0cywgZW5jb2RlT25lLCBmdW5jdGlvbihlcnIsIHJlc3VsdHMpIHtcclxuICAgIHJldHVybiBjYWxsYmFjayhuZXcgQmxvYihyZXN1bHRzKSk7XHJcbiAgfSk7XHJcbn07XHJcblxyXG4vKlxyXG4gKiBEZWNvZGVzIGRhdGEgd2hlbiBhIHBheWxvYWQgaXMgbWF5YmUgZXhwZWN0ZWQuIFN0cmluZ3MgYXJlIGRlY29kZWQgYnlcclxuICogaW50ZXJwcmV0aW5nIGVhY2ggYnl0ZSBhcyBhIGtleSBjb2RlIGZvciBlbnRyaWVzIG1hcmtlZCB0byBzdGFydCB3aXRoIDAuIFNlZVxyXG4gKiBkZXNjcmlwdGlvbiBvZiBlbmNvZGVQYXlsb2FkQXNCaW5hcnlcclxuICpcclxuICogQHBhcmFtIHtBcnJheUJ1ZmZlcn0gZGF0YSwgY2FsbGJhY2sgbWV0aG9kXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5kZWNvZGVQYXlsb2FkQXNCaW5hcnkgPSBmdW5jdGlvbiAoZGF0YSwgYmluYXJ5VHlwZSwgY2FsbGJhY2spIHtcclxuICBpZiAodHlwZW9mIGJpbmFyeVR5cGUgPT09ICdmdW5jdGlvbicpIHtcclxuICAgIGNhbGxiYWNrID0gYmluYXJ5VHlwZTtcclxuICAgIGJpbmFyeVR5cGUgPSBudWxsO1xyXG4gIH1cclxuXHJcbiAgdmFyIGJ1ZmZlclRhaWwgPSBkYXRhO1xyXG4gIHZhciBidWZmZXJzID0gW107XHJcblxyXG4gIHZhciBudW1iZXJUb29Mb25nID0gZmFsc2U7XHJcbiAgd2hpbGUgKGJ1ZmZlclRhaWwuYnl0ZUxlbmd0aCA+IDApIHtcclxuICAgIHZhciB0YWlsQXJyYXkgPSBuZXcgVWludDhBcnJheShidWZmZXJUYWlsKTtcclxuICAgIHZhciBpc1N0cmluZyA9IHRhaWxBcnJheVswXSA9PT0gMDtcclxuICAgIHZhciBtc2dMZW5ndGggPSAnJztcclxuXHJcbiAgICBmb3IgKHZhciBpID0gMTsgOyBpKyspIHtcclxuICAgICAgaWYgKHRhaWxBcnJheVtpXSA9PSAyNTUpIGJyZWFrO1xyXG5cclxuICAgICAgaWYgKG1zZ0xlbmd0aC5sZW5ndGggPiAzMTApIHtcclxuICAgICAgICBudW1iZXJUb29Mb25nID0gdHJ1ZTtcclxuICAgICAgICBicmVhaztcclxuICAgICAgfVxyXG5cclxuICAgICAgbXNnTGVuZ3RoICs9IHRhaWxBcnJheVtpXTtcclxuICAgIH1cclxuXHJcbiAgICBpZihudW1iZXJUb29Mb25nKSByZXR1cm4gY2FsbGJhY2soZXJyLCAwLCAxKTtcclxuXHJcbiAgICBidWZmZXJUYWlsID0gc2xpY2VCdWZmZXIoYnVmZmVyVGFpbCwgMiArIG1zZ0xlbmd0aC5sZW5ndGgpO1xyXG4gICAgbXNnTGVuZ3RoID0gcGFyc2VJbnQobXNnTGVuZ3RoKTtcclxuXHJcbiAgICB2YXIgbXNnID0gc2xpY2VCdWZmZXIoYnVmZmVyVGFpbCwgMCwgbXNnTGVuZ3RoKTtcclxuICAgIGlmIChpc1N0cmluZykge1xyXG4gICAgICB0cnkge1xyXG4gICAgICAgIG1zZyA9IFN0cmluZy5mcm9tQ2hhckNvZGUuYXBwbHkobnVsbCwgbmV3IFVpbnQ4QXJyYXkobXNnKSk7XHJcbiAgICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICAvLyBpUGhvbmUgU2FmYXJpIGRvZXNuJ3QgbGV0IHlvdSBhcHBseSB0byB0eXBlZCBhcnJheXNcclxuICAgICAgICB2YXIgdHlwZWQgPSBuZXcgVWludDhBcnJheShtc2cpO1xyXG4gICAgICAgIG1zZyA9ICcnO1xyXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdHlwZWQubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICAgIG1zZyArPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHR5cGVkW2ldKTtcclxuICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBidWZmZXJzLnB1c2gobXNnKTtcclxuICAgIGJ1ZmZlclRhaWwgPSBzbGljZUJ1ZmZlcihidWZmZXJUYWlsLCBtc2dMZW5ndGgpO1xyXG4gIH1cclxuXHJcbiAgdmFyIHRvdGFsID0gYnVmZmVycy5sZW5ndGg7XHJcbiAgYnVmZmVycy5mb3JFYWNoKGZ1bmN0aW9uKGJ1ZmZlciwgaSkge1xyXG4gICAgY2FsbGJhY2soZXhwb3J0cy5kZWNvZGVQYWNrZXQoYnVmZmVyLCBiaW5hcnlUeXBlLCB0cnVlKSwgaSwgdG90YWwpO1xyXG4gIH0pO1xyXG59O1xyXG5cclxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcclxufSx7XCIuL2tleXNcIjoyNixcImFmdGVyXCI6MjcsXCJhcnJheWJ1ZmZlci5zbGljZVwiOjI4LFwiYmFzZTY0LWFycmF5YnVmZmVyXCI6MjksXCJibG9iXCI6MzAsXCJoYXMtYmluYXJ5XCI6MzEsXCJ1dGY4XCI6MzN9XSwyNjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG4vKipcclxuICogR2V0cyB0aGUga2V5cyBmb3IgYW4gb2JqZWN0LlxyXG4gKlxyXG4gKiBAcmV0dXJuIHtBcnJheX0ga2V5c1xyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uIGtleXMgKG9iail7XHJcbiAgdmFyIGFyciA9IFtdO1xyXG4gIHZhciBoYXMgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xyXG5cclxuICBmb3IgKHZhciBpIGluIG9iaikge1xyXG4gICAgaWYgKGhhcy5jYWxsKG9iaiwgaSkpIHtcclxuICAgICAgYXJyLnB1c2goaSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBhcnI7XHJcbn07XHJcblxyXG59LHt9XSwyNzpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbm1vZHVsZS5leHBvcnRzID0gYWZ0ZXJcclxuXHJcbmZ1bmN0aW9uIGFmdGVyKGNvdW50LCBjYWxsYmFjaywgZXJyX2NiKSB7XHJcbiAgICB2YXIgYmFpbCA9IGZhbHNlXHJcbiAgICBlcnJfY2IgPSBlcnJfY2IgfHwgbm9vcFxyXG4gICAgcHJveHkuY291bnQgPSBjb3VudFxyXG5cclxuICAgIHJldHVybiAoY291bnQgPT09IDApID8gY2FsbGJhY2soKSA6IHByb3h5XHJcblxyXG4gICAgZnVuY3Rpb24gcHJveHkoZXJyLCByZXN1bHQpIHtcclxuICAgICAgICBpZiAocHJveHkuY291bnQgPD0gMCkge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ2FmdGVyIGNhbGxlZCB0b28gbWFueSB0aW1lcycpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIC0tcHJveHkuY291bnRcclxuXHJcbiAgICAgICAgLy8gYWZ0ZXIgZmlyc3QgZXJyb3IsIHJlc3QgYXJlIHBhc3NlZCB0byBlcnJfY2JcclxuICAgICAgICBpZiAoZXJyKSB7XHJcbiAgICAgICAgICAgIGJhaWwgPSB0cnVlXHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGVycilcclxuICAgICAgICAgICAgLy8gZnV0dXJlIGVycm9yIGNhbGxiYWNrcyB3aWxsIGdvIHRvIGVycm9yIGhhbmRsZXJcclxuICAgICAgICAgICAgY2FsbGJhY2sgPSBlcnJfY2JcclxuICAgICAgICB9IGVsc2UgaWYgKHByb3h5LmNvdW50ID09PSAwICYmICFiYWlsKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHJlc3VsdClcclxuICAgICAgICB9XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG5vb3AoKSB7fVxyXG5cclxufSx7fV0sMjg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG4vKipcclxuICogQW4gYWJzdHJhY3Rpb24gZm9yIHNsaWNpbmcgYW4gYXJyYXlidWZmZXIgZXZlbiB3aGVuXHJcbiAqIEFycmF5QnVmZmVyLnByb3RvdHlwZS5zbGljZSBpcyBub3Qgc3VwcG9ydGVkXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihhcnJheWJ1ZmZlciwgc3RhcnQsIGVuZCkge1xyXG4gIHZhciBieXRlcyA9IGFycmF5YnVmZmVyLmJ5dGVMZW5ndGg7XHJcbiAgc3RhcnQgPSBzdGFydCB8fCAwO1xyXG4gIGVuZCA9IGVuZCB8fCBieXRlcztcclxuXHJcbiAgaWYgKGFycmF5YnVmZmVyLnNsaWNlKSB7IHJldHVybiBhcnJheWJ1ZmZlci5zbGljZShzdGFydCwgZW5kKTsgfVxyXG5cclxuICBpZiAoc3RhcnQgPCAwKSB7IHN0YXJ0ICs9IGJ5dGVzOyB9XHJcbiAgaWYgKGVuZCA8IDApIHsgZW5kICs9IGJ5dGVzOyB9XHJcbiAgaWYgKGVuZCA+IGJ5dGVzKSB7IGVuZCA9IGJ5dGVzOyB9XHJcblxyXG4gIGlmIChzdGFydCA+PSBieXRlcyB8fCBzdGFydCA+PSBlbmQgfHwgYnl0ZXMgPT09IDApIHtcclxuICAgIHJldHVybiBuZXcgQXJyYXlCdWZmZXIoMCk7XHJcbiAgfVxyXG5cclxuICB2YXIgYWJ2ID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpO1xyXG4gIHZhciByZXN1bHQgPSBuZXcgVWludDhBcnJheShlbmQgLSBzdGFydCk7XHJcbiAgZm9yICh2YXIgaSA9IHN0YXJ0LCBpaSA9IDA7IGkgPCBlbmQ7IGkrKywgaWkrKykge1xyXG4gICAgcmVzdWx0W2lpXSA9IGFidltpXTtcclxuICB9XHJcbiAgcmV0dXJuIHJlc3VsdC5idWZmZXI7XHJcbn07XHJcblxyXG59LHt9XSwyOTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbi8qXHJcbiAqIGJhc2U2NC1hcnJheWJ1ZmZlclxyXG4gKiBodHRwczovL2dpdGh1Yi5jb20vbmlrbGFzdmgvYmFzZTY0LWFycmF5YnVmZmVyXHJcbiAqXHJcbiAqIENvcHlyaWdodCAoYykgMjAxMiBOaWtsYXMgdm9uIEhlcnR6ZW5cclxuICogTGljZW5zZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlLlxyXG4gKi9cclxuKGZ1bmN0aW9uKGNoYXJzKXtcclxuICBcInVzZSBzdHJpY3RcIjtcclxuXHJcbiAgZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbihhcnJheWJ1ZmZlcikge1xyXG4gICAgdmFyIGJ5dGVzID0gbmV3IFVpbnQ4QXJyYXkoYXJyYXlidWZmZXIpLFxyXG4gICAgaSwgbGVuID0gYnl0ZXMubGVuZ3RoLCBiYXNlNjQgPSBcIlwiO1xyXG5cclxuICAgIGZvciAoaSA9IDA7IGkgPCBsZW47IGkrPTMpIHtcclxuICAgICAgYmFzZTY0ICs9IGNoYXJzW2J5dGVzW2ldID4+IDJdO1xyXG4gICAgICBiYXNlNjQgKz0gY2hhcnNbKChieXRlc1tpXSAmIDMpIDw8IDQpIHwgKGJ5dGVzW2kgKyAxXSA+PiA0KV07XHJcbiAgICAgIGJhc2U2NCArPSBjaGFyc1soKGJ5dGVzW2kgKyAxXSAmIDE1KSA8PCAyKSB8IChieXRlc1tpICsgMl0gPj4gNildO1xyXG4gICAgICBiYXNlNjQgKz0gY2hhcnNbYnl0ZXNbaSArIDJdICYgNjNdO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICgobGVuICUgMykgPT09IDIpIHtcclxuICAgICAgYmFzZTY0ID0gYmFzZTY0LnN1YnN0cmluZygwLCBiYXNlNjQubGVuZ3RoIC0gMSkgKyBcIj1cIjtcclxuICAgIH0gZWxzZSBpZiAobGVuICUgMyA9PT0gMSkge1xyXG4gICAgICBiYXNlNjQgPSBiYXNlNjQuc3Vic3RyaW5nKDAsIGJhc2U2NC5sZW5ndGggLSAyKSArIFwiPT1cIjtcclxuICAgIH1cclxuXHJcbiAgICByZXR1cm4gYmFzZTY0O1xyXG4gIH07XHJcblxyXG4gIGV4cG9ydHMuZGVjb2RlID0gIGZ1bmN0aW9uKGJhc2U2NCkge1xyXG4gICAgdmFyIGJ1ZmZlckxlbmd0aCA9IGJhc2U2NC5sZW5ndGggKiAwLjc1LFxyXG4gICAgbGVuID0gYmFzZTY0Lmxlbmd0aCwgaSwgcCA9IDAsXHJcbiAgICBlbmNvZGVkMSwgZW5jb2RlZDIsIGVuY29kZWQzLCBlbmNvZGVkNDtcclxuXHJcbiAgICBpZiAoYmFzZTY0W2Jhc2U2NC5sZW5ndGggLSAxXSA9PT0gXCI9XCIpIHtcclxuICAgICAgYnVmZmVyTGVuZ3RoLS07XHJcbiAgICAgIGlmIChiYXNlNjRbYmFzZTY0Lmxlbmd0aCAtIDJdID09PSBcIj1cIikge1xyXG4gICAgICAgIGJ1ZmZlckxlbmd0aC0tO1xyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIGFycmF5YnVmZmVyID0gbmV3IEFycmF5QnVmZmVyKGJ1ZmZlckxlbmd0aCksXHJcbiAgICBieXRlcyA9IG5ldyBVaW50OEFycmF5KGFycmF5YnVmZmVyKTtcclxuXHJcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKz00KSB7XHJcbiAgICAgIGVuY29kZWQxID0gY2hhcnMuaW5kZXhPZihiYXNlNjRbaV0pO1xyXG4gICAgICBlbmNvZGVkMiA9IGNoYXJzLmluZGV4T2YoYmFzZTY0W2krMV0pO1xyXG4gICAgICBlbmNvZGVkMyA9IGNoYXJzLmluZGV4T2YoYmFzZTY0W2krMl0pO1xyXG4gICAgICBlbmNvZGVkNCA9IGNoYXJzLmluZGV4T2YoYmFzZTY0W2krM10pO1xyXG5cclxuICAgICAgYnl0ZXNbcCsrXSA9IChlbmNvZGVkMSA8PCAyKSB8IChlbmNvZGVkMiA+PiA0KTtcclxuICAgICAgYnl0ZXNbcCsrXSA9ICgoZW5jb2RlZDIgJiAxNSkgPDwgNCkgfCAoZW5jb2RlZDMgPj4gMik7XHJcbiAgICAgIGJ5dGVzW3ArK10gPSAoKGVuY29kZWQzICYgMykgPDwgNikgfCAoZW5jb2RlZDQgJiA2Myk7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFycmF5YnVmZmVyO1xyXG4gIH07XHJcbn0pKFwiQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODkrL1wiKTtcclxuXHJcbn0se31dLDMwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuKGZ1bmN0aW9uIChnbG9iYWwpe1xyXG4vKipcclxuICogQ3JlYXRlIGEgYmxvYiBidWlsZGVyIGV2ZW4gd2hlbiB2ZW5kb3IgcHJlZml4ZXMgZXhpc3RcclxuICovXHJcblxyXG52YXIgQmxvYkJ1aWxkZXIgPSBnbG9iYWwuQmxvYkJ1aWxkZXJcclxuICB8fCBnbG9iYWwuV2ViS2l0QmxvYkJ1aWxkZXJcclxuICB8fCBnbG9iYWwuTVNCbG9iQnVpbGRlclxyXG4gIHx8IGdsb2JhbC5Nb3pCbG9iQnVpbGRlcjtcclxuXHJcbi8qKlxyXG4gKiBDaGVjayBpZiBCbG9iIGNvbnN0cnVjdG9yIGlzIHN1cHBvcnRlZFxyXG4gKi9cclxuXHJcbnZhciBibG9iU3VwcG9ydGVkID0gKGZ1bmN0aW9uKCkge1xyXG4gIHRyeSB7XHJcbiAgICB2YXIgYiA9IG5ldyBCbG9iKFsnaGknXSk7XHJcbiAgICByZXR1cm4gYi5zaXplID09IDI7XHJcbiAgfSBjYXRjaChlKSB7XHJcbiAgICByZXR1cm4gZmFsc2U7XHJcbiAgfVxyXG59KSgpO1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIEJsb2JCdWlsZGVyIGlzIHN1cHBvcnRlZFxyXG4gKi9cclxuXHJcbnZhciBibG9iQnVpbGRlclN1cHBvcnRlZCA9IEJsb2JCdWlsZGVyXHJcbiAgJiYgQmxvYkJ1aWxkZXIucHJvdG90eXBlLmFwcGVuZFxyXG4gICYmIEJsb2JCdWlsZGVyLnByb3RvdHlwZS5nZXRCbG9iO1xyXG5cclxuZnVuY3Rpb24gQmxvYkJ1aWxkZXJDb25zdHJ1Y3RvcihhcnksIG9wdGlvbnMpIHtcclxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcclxuXHJcbiAgdmFyIGJiID0gbmV3IEJsb2JCdWlsZGVyKCk7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnkubGVuZ3RoOyBpKyspIHtcclxuICAgIGJiLmFwcGVuZChhcnlbaV0pO1xyXG4gIH1cclxuICByZXR1cm4gKG9wdGlvbnMudHlwZSkgPyBiYi5nZXRCbG9iKG9wdGlvbnMudHlwZSkgOiBiYi5nZXRCbG9iKCk7XHJcbn07XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IChmdW5jdGlvbigpIHtcclxuICBpZiAoYmxvYlN1cHBvcnRlZCkge1xyXG4gICAgcmV0dXJuIGdsb2JhbC5CbG9iO1xyXG4gIH0gZWxzZSBpZiAoYmxvYkJ1aWxkZXJTdXBwb3J0ZWQpIHtcclxuICAgIHJldHVybiBCbG9iQnVpbGRlckNvbnN0cnVjdG9yO1xyXG4gIH0gZWxzZSB7XHJcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xyXG4gIH1cclxufSkoKTtcclxuXHJcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXHJcbn0se31dLDMxOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuKGZ1bmN0aW9uIChnbG9iYWwpe1xyXG5cclxuLypcclxuICogTW9kdWxlIHJlcXVpcmVtZW50cy5cclxuICovXHJcblxyXG52YXIgaXNBcnJheSA9IF9kZXJlcV8oJ2lzYXJyYXknKTtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGhhc0JpbmFyeTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgZm9yIGJpbmFyeSBkYXRhLlxyXG4gKlxyXG4gKiBSaWdodCBub3cgb25seSBCdWZmZXIgYW5kIEFycmF5QnVmZmVyIGFyZSBzdXBwb3J0ZWQuLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYW55dGhpbmdcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBoYXNCaW5hcnkoZGF0YSkge1xyXG5cclxuICBmdW5jdGlvbiBfaGFzQmluYXJ5KG9iaikge1xyXG4gICAgaWYgKCFvYmopIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICBpZiAoIChnbG9iYWwuQnVmZmVyICYmIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIob2JqKSkgfHxcclxuICAgICAgICAgKGdsb2JhbC5BcnJheUJ1ZmZlciAmJiBvYmogaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgfHxcclxuICAgICAgICAgKGdsb2JhbC5CbG9iICYmIG9iaiBpbnN0YW5jZW9mIEJsb2IpIHx8XHJcbiAgICAgICAgIChnbG9iYWwuRmlsZSAmJiBvYmogaW5zdGFuY2VvZiBGaWxlKVxyXG4gICAgICAgICkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNBcnJheShvYmopKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoX2hhc0JpbmFyeShvYmpbaV0pKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAob2JqICYmICdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcclxuICAgICAgaWYgKG9iai50b0pTT04pIHtcclxuICAgICAgICBvYmogPSBvYmoudG9KU09OKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICBpZiAob2JqLmhhc093blByb3BlcnR5KGtleSkgJiYgX2hhc0JpbmFyeShvYmpba2V5XSkpIHtcclxuICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJldHVybiBmYWxzZTtcclxuICB9XHJcblxyXG4gIHJldHVybiBfaGFzQmluYXJ5KGRhdGEpO1xyXG59XHJcblxyXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxyXG59LHtcImlzYXJyYXlcIjozMn1dLDMyOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxubW9kdWxlLmV4cG9ydHMgPSBBcnJheS5pc0FycmF5IHx8IGZ1bmN0aW9uIChhcnIpIHtcclxuICByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKGFycikgPT0gJ1tvYmplY3QgQXJyYXldJztcclxufTtcclxuXHJcbn0se31dLDMzOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuKGZ1bmN0aW9uIChnbG9iYWwpe1xyXG4vKiEgaHR0cDovL210aHMuYmUvdXRmOGpzIHYyLjAuMCBieSBAbWF0aGlhcyAqL1xyXG47KGZ1bmN0aW9uKHJvb3QpIHtcclxuXHJcblx0Ly8gRGV0ZWN0IGZyZWUgdmFyaWFibGVzIGBleHBvcnRzYFxyXG5cdHZhciBmcmVlRXhwb3J0cyA9IHR5cGVvZiBleHBvcnRzID09ICdvYmplY3QnICYmIGV4cG9ydHM7XHJcblxyXG5cdC8vIERldGVjdCBmcmVlIHZhcmlhYmxlIGBtb2R1bGVgXHJcblx0dmFyIGZyZWVNb2R1bGUgPSB0eXBlb2YgbW9kdWxlID09ICdvYmplY3QnICYmIG1vZHVsZSAmJlxyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPT0gZnJlZUV4cG9ydHMgJiYgbW9kdWxlO1xyXG5cclxuXHQvLyBEZXRlY3QgZnJlZSB2YXJpYWJsZSBgZ2xvYmFsYCwgZnJvbSBOb2RlLmpzIG9yIEJyb3dzZXJpZmllZCBjb2RlLFxyXG5cdC8vIGFuZCB1c2UgaXQgYXMgYHJvb3RgXHJcblx0dmFyIGZyZWVHbG9iYWwgPSB0eXBlb2YgZ2xvYmFsID09ICdvYmplY3QnICYmIGdsb2JhbDtcclxuXHRpZiAoZnJlZUdsb2JhbC5nbG9iYWwgPT09IGZyZWVHbG9iYWwgfHwgZnJlZUdsb2JhbC53aW5kb3cgPT09IGZyZWVHbG9iYWwpIHtcclxuXHRcdHJvb3QgPSBmcmVlR2xvYmFsO1xyXG5cdH1cclxuXHJcblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5cdHZhciBzdHJpbmdGcm9tQ2hhckNvZGUgPSBTdHJpbmcuZnJvbUNoYXJDb2RlO1xyXG5cclxuXHQvLyBUYWtlbiBmcm9tIGh0dHA6Ly9tdGhzLmJlL3B1bnljb2RlXHJcblx0ZnVuY3Rpb24gdWNzMmRlY29kZShzdHJpbmcpIHtcclxuXHRcdHZhciBvdXRwdXQgPSBbXTtcclxuXHRcdHZhciBjb3VudGVyID0gMDtcclxuXHRcdHZhciBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xyXG5cdFx0dmFyIHZhbHVlO1xyXG5cdFx0dmFyIGV4dHJhO1xyXG5cdFx0d2hpbGUgKGNvdW50ZXIgPCBsZW5ndGgpIHtcclxuXHRcdFx0dmFsdWUgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xyXG5cdFx0XHRpZiAodmFsdWUgPj0gMHhEODAwICYmIHZhbHVlIDw9IDB4REJGRiAmJiBjb3VudGVyIDwgbGVuZ3RoKSB7XHJcblx0XHRcdFx0Ly8gaGlnaCBzdXJyb2dhdGUsIGFuZCB0aGVyZSBpcyBhIG5leHQgY2hhcmFjdGVyXHJcblx0XHRcdFx0ZXh0cmEgPSBzdHJpbmcuY2hhckNvZGVBdChjb3VudGVyKyspO1xyXG5cdFx0XHRcdGlmICgoZXh0cmEgJiAweEZDMDApID09IDB4REMwMCkgeyAvLyBsb3cgc3Vycm9nYXRlXHJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCgoKHZhbHVlICYgMHgzRkYpIDw8IDEwKSArIChleHRyYSAmIDB4M0ZGKSArIDB4MTAwMDApO1xyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHQvLyB1bm1hdGNoZWQgc3Vycm9nYXRlOyBvbmx5IGFwcGVuZCB0aGlzIGNvZGUgdW5pdCwgaW4gY2FzZSB0aGUgbmV4dFxyXG5cdFx0XHRcdFx0Ly8gY29kZSB1bml0IGlzIHRoZSBoaWdoIHN1cnJvZ2F0ZSBvZiBhIHN1cnJvZ2F0ZSBwYWlyXHJcblx0XHRcdFx0XHRvdXRwdXQucHVzaCh2YWx1ZSk7XHJcblx0XHRcdFx0XHRjb3VudGVyLS07XHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG91dHB1dC5wdXNoKHZhbHVlKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIG91dHB1dDtcclxuXHR9XHJcblxyXG5cdC8vIFRha2VuIGZyb20gaHR0cDovL210aHMuYmUvcHVueWNvZGVcclxuXHRmdW5jdGlvbiB1Y3MyZW5jb2RlKGFycmF5KSB7XHJcblx0XHR2YXIgbGVuZ3RoID0gYXJyYXkubGVuZ3RoO1xyXG5cdFx0dmFyIGluZGV4ID0gLTE7XHJcblx0XHR2YXIgdmFsdWU7XHJcblx0XHR2YXIgb3V0cHV0ID0gJyc7XHJcblx0XHR3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xyXG5cdFx0XHR2YWx1ZSA9IGFycmF5W2luZGV4XTtcclxuXHRcdFx0aWYgKHZhbHVlID4gMHhGRkZGKSB7XHJcblx0XHRcdFx0dmFsdWUgLT0gMHgxMDAwMDtcclxuXHRcdFx0XHRvdXRwdXQgKz0gc3RyaW5nRnJvbUNoYXJDb2RlKHZhbHVlID4+PiAxMCAmIDB4M0ZGIHwgMHhEODAwKTtcclxuXHRcdFx0XHR2YWx1ZSA9IDB4REMwMCB8IHZhbHVlICYgMHgzRkY7XHJcblx0XHRcdH1cclxuXHRcdFx0b3V0cHV0ICs9IHN0cmluZ0Zyb21DaGFyQ29kZSh2YWx1ZSk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gb3V0cHV0O1xyXG5cdH1cclxuXHJcblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5cdGZ1bmN0aW9uIGNyZWF0ZUJ5dGUoY29kZVBvaW50LCBzaGlmdCkge1xyXG5cdFx0cmV0dXJuIHN0cmluZ0Zyb21DaGFyQ29kZSgoKGNvZGVQb2ludCA+PiBzaGlmdCkgJiAweDNGKSB8IDB4ODApO1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZW5jb2RlQ29kZVBvaW50KGNvZGVQb2ludCkge1xyXG5cdFx0aWYgKChjb2RlUG9pbnQgJiAweEZGRkZGRjgwKSA9PSAwKSB7IC8vIDEtYnl0ZSBzZXF1ZW5jZVxyXG5cdFx0XHRyZXR1cm4gc3RyaW5nRnJvbUNoYXJDb2RlKGNvZGVQb2ludCk7XHJcblx0XHR9XHJcblx0XHR2YXIgc3ltYm9sID0gJyc7XHJcblx0XHRpZiAoKGNvZGVQb2ludCAmIDB4RkZGRkY4MDApID09IDApIHsgLy8gMi1ieXRlIHNlcXVlbmNlXHJcblx0XHRcdHN5bWJvbCA9IHN0cmluZ0Zyb21DaGFyQ29kZSgoKGNvZGVQb2ludCA+PiA2KSAmIDB4MUYpIHwgMHhDMCk7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICgoY29kZVBvaW50ICYgMHhGRkZGMDAwMCkgPT0gMCkgeyAvLyAzLWJ5dGUgc2VxdWVuY2VcclxuXHRcdFx0c3ltYm9sID0gc3RyaW5nRnJvbUNoYXJDb2RlKCgoY29kZVBvaW50ID4+IDEyKSAmIDB4MEYpIHwgMHhFMCk7XHJcblx0XHRcdHN5bWJvbCArPSBjcmVhdGVCeXRlKGNvZGVQb2ludCwgNik7XHJcblx0XHR9XHJcblx0XHRlbHNlIGlmICgoY29kZVBvaW50ICYgMHhGRkUwMDAwMCkgPT0gMCkgeyAvLyA0LWJ5dGUgc2VxdWVuY2VcclxuXHRcdFx0c3ltYm9sID0gc3RyaW5nRnJvbUNoYXJDb2RlKCgoY29kZVBvaW50ID4+IDE4KSAmIDB4MDcpIHwgMHhGMCk7XHJcblx0XHRcdHN5bWJvbCArPSBjcmVhdGVCeXRlKGNvZGVQb2ludCwgMTIpO1xyXG5cdFx0XHRzeW1ib2wgKz0gY3JlYXRlQnl0ZShjb2RlUG9pbnQsIDYpO1xyXG5cdFx0fVxyXG5cdFx0c3ltYm9sICs9IHN0cmluZ0Zyb21DaGFyQ29kZSgoY29kZVBvaW50ICYgMHgzRikgfCAweDgwKTtcclxuXHRcdHJldHVybiBzeW1ib2w7XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiB1dGY4ZW5jb2RlKHN0cmluZykge1xyXG5cdFx0dmFyIGNvZGVQb2ludHMgPSB1Y3MyZGVjb2RlKHN0cmluZyk7XHJcblxyXG5cdFx0Ly8gY29uc29sZS5sb2coSlNPTi5zdHJpbmdpZnkoY29kZVBvaW50cy5tYXAoZnVuY3Rpb24oeCkge1xyXG5cdFx0Ly8gXHRyZXR1cm4gJ1UrJyArIHgudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XHJcblx0XHQvLyB9KSkpO1xyXG5cclxuXHRcdHZhciBsZW5ndGggPSBjb2RlUG9pbnRzLmxlbmd0aDtcclxuXHRcdHZhciBpbmRleCA9IC0xO1xyXG5cdFx0dmFyIGNvZGVQb2ludDtcclxuXHRcdHZhciBieXRlU3RyaW5nID0gJyc7XHJcblx0XHR3aGlsZSAoKytpbmRleCA8IGxlbmd0aCkge1xyXG5cdFx0XHRjb2RlUG9pbnQgPSBjb2RlUG9pbnRzW2luZGV4XTtcclxuXHRcdFx0Ynl0ZVN0cmluZyArPSBlbmNvZGVDb2RlUG9pbnQoY29kZVBvaW50KTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBieXRlU3RyaW5nO1xyXG5cdH1cclxuXHJcblx0LyotLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLSovXHJcblxyXG5cdGZ1bmN0aW9uIHJlYWRDb250aW51YXRpb25CeXRlKCkge1xyXG5cdFx0aWYgKGJ5dGVJbmRleCA+PSBieXRlQ291bnQpIHtcclxuXHRcdFx0dGhyb3cgRXJyb3IoJ0ludmFsaWQgYnl0ZSBpbmRleCcpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjb250aW51YXRpb25CeXRlID0gYnl0ZUFycmF5W2J5dGVJbmRleF0gJiAweEZGO1xyXG5cdFx0Ynl0ZUluZGV4Kys7XHJcblxyXG5cdFx0aWYgKChjb250aW51YXRpb25CeXRlICYgMHhDMCkgPT0gMHg4MCkge1xyXG5cdFx0XHRyZXR1cm4gY29udGludWF0aW9uQnl0ZSAmIDB4M0Y7XHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gSWYgd2UgZW5kIHVwIGhlcmUsIGl04oCZcyBub3QgYSBjb250aW51YXRpb24gYnl0ZVxyXG5cdFx0dGhyb3cgRXJyb3IoJ0ludmFsaWQgY29udGludWF0aW9uIGJ5dGUnKTtcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRlY29kZVN5bWJvbCgpIHtcclxuXHRcdHZhciBieXRlMTtcclxuXHRcdHZhciBieXRlMjtcclxuXHRcdHZhciBieXRlMztcclxuXHRcdHZhciBieXRlNDtcclxuXHRcdHZhciBjb2RlUG9pbnQ7XHJcblxyXG5cdFx0aWYgKGJ5dGVJbmRleCA+IGJ5dGVDb3VudCkge1xyXG5cdFx0XHR0aHJvdyBFcnJvcignSW52YWxpZCBieXRlIGluZGV4Jyk7XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGJ5dGVJbmRleCA9PSBieXRlQ291bnQpIHtcclxuXHRcdFx0cmV0dXJuIGZhbHNlO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vIFJlYWQgZmlyc3QgYnl0ZVxyXG5cdFx0Ynl0ZTEgPSBieXRlQXJyYXlbYnl0ZUluZGV4XSAmIDB4RkY7XHJcblx0XHRieXRlSW5kZXgrKztcclxuXHJcblx0XHQvLyAxLWJ5dGUgc2VxdWVuY2UgKG5vIGNvbnRpbnVhdGlvbiBieXRlcylcclxuXHRcdGlmICgoYnl0ZTEgJiAweDgwKSA9PSAwKSB7XHJcblx0XHRcdHJldHVybiBieXRlMTtcclxuXHRcdH1cclxuXHJcblx0XHQvLyAyLWJ5dGUgc2VxdWVuY2VcclxuXHRcdGlmICgoYnl0ZTEgJiAweEUwKSA9PSAweEMwKSB7XHJcblx0XHRcdHZhciBieXRlMiA9IHJlYWRDb250aW51YXRpb25CeXRlKCk7XHJcblx0XHRcdGNvZGVQb2ludCA9ICgoYnl0ZTEgJiAweDFGKSA8PCA2KSB8IGJ5dGUyO1xyXG5cdFx0XHRpZiAoY29kZVBvaW50ID49IDB4ODApIHtcclxuXHRcdFx0XHRyZXR1cm4gY29kZVBvaW50O1xyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHRocm93IEVycm9yKCdJbnZhbGlkIGNvbnRpbnVhdGlvbiBieXRlJyk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHQvLyAzLWJ5dGUgc2VxdWVuY2UgKG1heSBpbmNsdWRlIHVucGFpcmVkIHN1cnJvZ2F0ZXMpXHJcblx0XHRpZiAoKGJ5dGUxICYgMHhGMCkgPT0gMHhFMCkge1xyXG5cdFx0XHRieXRlMiA9IHJlYWRDb250aW51YXRpb25CeXRlKCk7XHJcblx0XHRcdGJ5dGUzID0gcmVhZENvbnRpbnVhdGlvbkJ5dGUoKTtcclxuXHRcdFx0Y29kZVBvaW50ID0gKChieXRlMSAmIDB4MEYpIDw8IDEyKSB8IChieXRlMiA8PCA2KSB8IGJ5dGUzO1xyXG5cdFx0XHRpZiAoY29kZVBvaW50ID49IDB4MDgwMCkge1xyXG5cdFx0XHRcdHJldHVybiBjb2RlUG9pbnQ7XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0dGhyb3cgRXJyb3IoJ0ludmFsaWQgY29udGludWF0aW9uIGJ5dGUnKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIDQtYnl0ZSBzZXF1ZW5jZVxyXG5cdFx0aWYgKChieXRlMSAmIDB4RjgpID09IDB4RjApIHtcclxuXHRcdFx0Ynl0ZTIgPSByZWFkQ29udGludWF0aW9uQnl0ZSgpO1xyXG5cdFx0XHRieXRlMyA9IHJlYWRDb250aW51YXRpb25CeXRlKCk7XHJcblx0XHRcdGJ5dGU0ID0gcmVhZENvbnRpbnVhdGlvbkJ5dGUoKTtcclxuXHRcdFx0Y29kZVBvaW50ID0gKChieXRlMSAmIDB4MEYpIDw8IDB4MTIpIHwgKGJ5dGUyIDw8IDB4MEMpIHxcclxuXHRcdFx0XHQoYnl0ZTMgPDwgMHgwNikgfCBieXRlNDtcclxuXHRcdFx0aWYgKGNvZGVQb2ludCA+PSAweDAxMDAwMCAmJiBjb2RlUG9pbnQgPD0gMHgxMEZGRkYpIHtcclxuXHRcdFx0XHRyZXR1cm4gY29kZVBvaW50O1xyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0dGhyb3cgRXJyb3IoJ0ludmFsaWQgVVRGLTggZGV0ZWN0ZWQnKTtcclxuXHR9XHJcblxyXG5cdHZhciBieXRlQXJyYXk7XHJcblx0dmFyIGJ5dGVDb3VudDtcclxuXHR2YXIgYnl0ZUluZGV4O1xyXG5cdGZ1bmN0aW9uIHV0ZjhkZWNvZGUoYnl0ZVN0cmluZykge1xyXG5cdFx0Ynl0ZUFycmF5ID0gdWNzMmRlY29kZShieXRlU3RyaW5nKTtcclxuXHRcdGJ5dGVDb3VudCA9IGJ5dGVBcnJheS5sZW5ndGg7XHJcblx0XHRieXRlSW5kZXggPSAwO1xyXG5cdFx0dmFyIGNvZGVQb2ludHMgPSBbXTtcclxuXHRcdHZhciB0bXA7XHJcblx0XHR3aGlsZSAoKHRtcCA9IGRlY29kZVN5bWJvbCgpKSAhPT0gZmFsc2UpIHtcclxuXHRcdFx0Y29kZVBvaW50cy5wdXNoKHRtcCk7XHJcblx0XHR9XHJcblx0XHRyZXR1cm4gdWNzMmVuY29kZShjb2RlUG9pbnRzKTtcclxuXHR9XHJcblxyXG5cdC8qLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0qL1xyXG5cclxuXHR2YXIgdXRmOCA9IHtcclxuXHRcdCd2ZXJzaW9uJzogJzIuMC4wJyxcclxuXHRcdCdlbmNvZGUnOiB1dGY4ZW5jb2RlLFxyXG5cdFx0J2RlY29kZSc6IHV0ZjhkZWNvZGVcclxuXHR9O1xyXG5cclxuXHQvLyBTb21lIEFNRCBidWlsZCBvcHRpbWl6ZXJzLCBsaWtlIHIuanMsIGNoZWNrIGZvciBzcGVjaWZpYyBjb25kaXRpb24gcGF0dGVybnNcclxuXHQvLyBsaWtlIHRoZSBmb2xsb3dpbmc6XHJcblx0aWYgKFxyXG5cdFx0dHlwZW9mIGRlZmluZSA9PSAnZnVuY3Rpb24nICYmXHJcblx0XHR0eXBlb2YgZGVmaW5lLmFtZCA9PSAnb2JqZWN0JyAmJlxyXG5cdFx0ZGVmaW5lLmFtZFxyXG5cdCkge1xyXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uKCkge1xyXG5cdFx0XHRyZXR1cm4gdXRmODtcclxuXHRcdH0pO1xyXG5cdH1cdGVsc2UgaWYgKGZyZWVFeHBvcnRzICYmICFmcmVlRXhwb3J0cy5ub2RlVHlwZSkge1xyXG5cdFx0aWYgKGZyZWVNb2R1bGUpIHsgLy8gaW4gTm9kZS5qcyBvciBSaW5nb0pTIHYwLjguMCtcclxuXHRcdFx0ZnJlZU1vZHVsZS5leHBvcnRzID0gdXRmODtcclxuXHRcdH0gZWxzZSB7IC8vIGluIE5hcndoYWwgb3IgUmluZ29KUyB2MC43LjAtXHJcblx0XHRcdHZhciBvYmplY3QgPSB7fTtcclxuXHRcdFx0dmFyIGhhc093blByb3BlcnR5ID0gb2JqZWN0Lmhhc093blByb3BlcnR5O1xyXG5cdFx0XHRmb3IgKHZhciBrZXkgaW4gdXRmOCkge1xyXG5cdFx0XHRcdGhhc093blByb3BlcnR5LmNhbGwodXRmOCwga2V5KSAmJiAoZnJlZUV4cG9ydHNba2V5XSA9IHV0Zjhba2V5XSk7XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9IGVsc2UgeyAvLyBpbiBSaGlubyBvciBhIHdlYiBicm93c2VyXHJcblx0XHRyb290LnV0ZjggPSB1dGY4O1xyXG5cdH1cclxuXHJcbn0odGhpcykpO1xyXG5cclxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcclxufSx7fV0sMzQ6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG4oZnVuY3Rpb24gKGdsb2JhbCl7XHJcbi8qKlxyXG4gKiBKU09OIHBhcnNlLlxyXG4gKlxyXG4gKiBAc2VlIEJhc2VkIG9uIGpRdWVyeSNwYXJzZUpTT04gKE1JVCkgYW5kIEpTT04yXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbnZhciBydmFsaWRjaGFycyA9IC9eW1xcXSw6e31cXHNdKiQvO1xyXG52YXIgcnZhbGlkZXNjYXBlID0gL1xcXFwoPzpbXCJcXFxcXFwvYmZucnRdfHVbMC05YS1mQS1GXXs0fSkvZztcclxudmFyIHJ2YWxpZHRva2VucyA9IC9cIlteXCJcXFxcXFxuXFxyXSpcInx0cnVlfGZhbHNlfG51bGx8LT9cXGQrKD86XFwuXFxkKik/KD86W2VFXVsrXFwtXT9cXGQrKT8vZztcclxudmFyIHJ2YWxpZGJyYWNlcyA9IC8oPzpefDp8LCkoPzpcXHMqXFxbKSsvZztcclxudmFyIHJ0cmltTGVmdCA9IC9eXFxzKy87XHJcbnZhciBydHJpbVJpZ2h0ID0gL1xccyskLztcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2Vqc29uKGRhdGEpIHtcclxuICBpZiAoJ3N0cmluZycgIT0gdHlwZW9mIGRhdGEgfHwgIWRhdGEpIHtcclxuICAgIHJldHVybiBudWxsO1xyXG4gIH1cclxuXHJcbiAgZGF0YSA9IGRhdGEucmVwbGFjZShydHJpbUxlZnQsICcnKS5yZXBsYWNlKHJ0cmltUmlnaHQsICcnKTtcclxuXHJcbiAgLy8gQXR0ZW1wdCB0byBwYXJzZSB1c2luZyB0aGUgbmF0aXZlIEpTT04gcGFyc2VyIGZpcnN0XHJcbiAgaWYgKGdsb2JhbC5KU09OICYmIEpTT04ucGFyc2UpIHtcclxuICAgIHJldHVybiBKU09OLnBhcnNlKGRhdGEpO1xyXG4gIH1cclxuXHJcbiAgaWYgKHJ2YWxpZGNoYXJzLnRlc3QoZGF0YS5yZXBsYWNlKHJ2YWxpZGVzY2FwZSwgJ0AnKVxyXG4gICAgICAucmVwbGFjZShydmFsaWR0b2tlbnMsICddJylcclxuICAgICAgLnJlcGxhY2UocnZhbGlkYnJhY2VzLCAnJykpKSB7XHJcbiAgICByZXR1cm4gKG5ldyBGdW5jdGlvbigncmV0dXJuICcgKyBkYXRhKSkoKTtcclxuICB9XHJcbn07XHJcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXHJcbn0se31dLDM1OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuLyoqXHJcbiAqIENvbXBpbGVzIGEgcXVlcnlzdHJpbmdcclxuICogUmV0dXJucyBzdHJpbmcgcmVwcmVzZW50YXRpb24gb2YgdGhlIG9iamVjdFxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH1cclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5lbmNvZGUgPSBmdW5jdGlvbiAob2JqKSB7XHJcbiAgdmFyIHN0ciA9ICcnO1xyXG5cclxuICBmb3IgKHZhciBpIGluIG9iaikge1xyXG4gICAgaWYgKG9iai5oYXNPd25Qcm9wZXJ0eShpKSkge1xyXG4gICAgICBpZiAoc3RyLmxlbmd0aCkgc3RyICs9ICcmJztcclxuICAgICAgc3RyICs9IGVuY29kZVVSSUNvbXBvbmVudChpKSArICc9JyArIGVuY29kZVVSSUNvbXBvbmVudChvYmpbaV0pO1xyXG4gICAgfVxyXG4gIH1cclxuXHJcbiAgcmV0dXJuIHN0cjtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBQYXJzZXMgYSBzaW1wbGUgcXVlcnlzdHJpbmcgaW50byBhbiBvYmplY3RcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHFzXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmV4cG9ydHMuZGVjb2RlID0gZnVuY3Rpb24ocXMpe1xyXG4gIHZhciBxcnkgPSB7fTtcclxuICB2YXIgcGFpcnMgPSBxcy5zcGxpdCgnJicpO1xyXG4gIGZvciAodmFyIGkgPSAwLCBsID0gcGFpcnMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcbiAgICB2YXIgcGFpciA9IHBhaXJzW2ldLnNwbGl0KCc9Jyk7XHJcbiAgICBxcnlbZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXSA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyWzFdKTtcclxuICB9XHJcbiAgcmV0dXJuIHFyeTtcclxufTtcclxuXHJcbn0se31dLDM2OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuLyoqXHJcbiAqIFBhcnNlcyBhbiBVUklcclxuICpcclxuICogQGF1dGhvciBTdGV2ZW4gTGV2aXRoYW4gPHN0ZXZlbmxldml0aGFuLmNvbT4gKE1JVCBsaWNlbnNlKVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG52YXIgcmUgPSAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShodHRwfGh0dHBzfHdzfHdzcyk6XFwvXFwvKT8oKD86KChbXjpAXSopKD86OihbXjpAXSopKT8pP0ApPygoPzpbYS1mMC05XXswLDR9Oil7Miw3fVthLWYwLTldezAsNH18W146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLztcclxuXHJcbnZhciBwYXJ0cyA9IFtcclxuICAgICdzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnYW5jaG9yJ1xyXG5dO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBwYXJzZXVyaShzdHIpIHtcclxuICAgIHZhciBzcmMgPSBzdHIsXHJcbiAgICAgICAgYiA9IHN0ci5pbmRleE9mKCdbJyksXHJcbiAgICAgICAgZSA9IHN0ci5pbmRleE9mKCddJyk7XHJcblxyXG4gICAgaWYgKGIgIT0gLTEgJiYgZSAhPSAtMSkge1xyXG4gICAgICAgIHN0ciA9IHN0ci5zdWJzdHJpbmcoMCwgYikgKyBzdHIuc3Vic3RyaW5nKGIsIGUpLnJlcGxhY2UoLzovZywgJzsnKSArIHN0ci5zdWJzdHJpbmcoZSwgc3RyLmxlbmd0aCk7XHJcbiAgICB9XHJcblxyXG4gICAgdmFyIG0gPSByZS5leGVjKHN0ciB8fCAnJyksXHJcbiAgICAgICAgdXJpID0ge30sXHJcbiAgICAgICAgaSA9IDE0O1xyXG5cclxuICAgIHdoaWxlIChpLS0pIHtcclxuICAgICAgICB1cmlbcGFydHNbaV1dID0gbVtpXSB8fCAnJztcclxuICAgIH1cclxuXHJcbiAgICBpZiAoYiAhPSAtMSAmJiBlICE9IC0xKSB7XHJcbiAgICAgICAgdXJpLnNvdXJjZSA9IHNyYztcclxuICAgICAgICB1cmkuaG9zdCA9IHVyaS5ob3N0LnN1YnN0cmluZygxLCB1cmkuaG9zdC5sZW5ndGggLSAxKS5yZXBsYWNlKC87L2csICc6Jyk7XHJcbiAgICAgICAgdXJpLmF1dGhvcml0eSA9IHVyaS5hdXRob3JpdHkucmVwbGFjZSgnWycsICcnKS5yZXBsYWNlKCddJywgJycpLnJlcGxhY2UoLzsvZywgJzonKTtcclxuICAgICAgICB1cmkuaXB2NnVyaSA9IHRydWU7XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIHVyaTtcclxufTtcclxuXHJcbn0se31dLDM3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZGVwZW5kZW5jaWVzLlxyXG4gKi9cclxuXHJcbnZhciBnbG9iYWwgPSAoZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzOyB9KSgpO1xyXG5cclxuLyoqXHJcbiAqIFdlYlNvY2tldCBjb25zdHJ1Y3Rvci5cclxuICovXHJcblxyXG52YXIgV2ViU29ja2V0ID0gZ2xvYmFsLldlYlNvY2tldCB8fCBnbG9iYWwuTW96V2ViU29ja2V0O1xyXG5cclxuLyoqXHJcbiAqIE1vZHVsZSBleHBvcnRzLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gV2ViU29ja2V0ID8gd3MgOiBudWxsO1xyXG5cclxuLyoqXHJcbiAqIFdlYlNvY2tldCBjb25zdHJ1Y3Rvci5cclxuICpcclxuICogVGhlIHRoaXJkIGBvcHRzYCBvcHRpb25zIG9iamVjdCBnZXRzIGlnbm9yZWQgaW4gd2ViIGJyb3dzZXJzLCBzaW5jZSBpdCdzXHJcbiAqIG5vbi1zdGFuZGFyZCwgYW5kIHRocm93cyBhIFR5cGVFcnJvciBpZiBwYXNzZWQgdG8gdGhlIGNvbnN0cnVjdG9yLlxyXG4gKiBTZWU6IGh0dHBzOi8vZ2l0aHViLmNvbS9laW5hcm9zL3dzL2lzc3Vlcy8yMjdcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHVyaVxyXG4gKiBAcGFyYW0ge0FycmF5fSBwcm90b2NvbHMgKG9wdGlvbmFsKVxyXG4gKiBAcGFyYW0ge09iamVjdCkgb3B0cyAob3B0aW9uYWwpXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gd3ModXJpLCBwcm90b2NvbHMsIG9wdHMpIHtcclxuICB2YXIgaW5zdGFuY2U7XHJcbiAgaWYgKHByb3RvY29scykge1xyXG4gICAgaW5zdGFuY2UgPSBuZXcgV2ViU29ja2V0KHVyaSwgcHJvdG9jb2xzKTtcclxuICB9IGVsc2Uge1xyXG4gICAgaW5zdGFuY2UgPSBuZXcgV2ViU29ja2V0KHVyaSk7XHJcbiAgfVxyXG4gIHJldHVybiBpbnN0YW5jZTtcclxufVxyXG5cclxuaWYgKFdlYlNvY2tldCkgd3MucHJvdG90eXBlID0gV2ViU29ja2V0LnByb3RvdHlwZTtcclxuXHJcbn0se31dLDM4OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuKGZ1bmN0aW9uIChnbG9iYWwpe1xyXG5cclxuLypcclxuICogTW9kdWxlIHJlcXVpcmVtZW50cy5cclxuICovXHJcblxyXG52YXIgaXNBcnJheSA9IF9kZXJlcV8oJ2lzYXJyYXknKTtcclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgZXhwb3J0cy5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGhhc0JpbmFyeTtcclxuXHJcbi8qKlxyXG4gKiBDaGVja3MgZm9yIGJpbmFyeSBkYXRhLlxyXG4gKlxyXG4gKiBSaWdodCBub3cgb25seSBCdWZmZXIgYW5kIEFycmF5QnVmZmVyIGFyZSBzdXBwb3J0ZWQuLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gYW55dGhpbmdcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBoYXNCaW5hcnkoZGF0YSkge1xyXG5cclxuICBmdW5jdGlvbiBfaGFzQmluYXJ5KG9iaikge1xyXG4gICAgaWYgKCFvYmopIHJldHVybiBmYWxzZTtcclxuXHJcbiAgICBpZiAoIChnbG9iYWwuQnVmZmVyICYmIGdsb2JhbC5CdWZmZXIuaXNCdWZmZXIob2JqKSkgfHxcclxuICAgICAgICAgKGdsb2JhbC5BcnJheUJ1ZmZlciAmJiBvYmogaW5zdGFuY2VvZiBBcnJheUJ1ZmZlcikgfHxcclxuICAgICAgICAgKGdsb2JhbC5CbG9iICYmIG9iaiBpbnN0YW5jZW9mIEJsb2IpIHx8XHJcbiAgICAgICAgIChnbG9iYWwuRmlsZSAmJiBvYmogaW5zdGFuY2VvZiBGaWxlKVxyXG4gICAgICAgICkge1xyXG4gICAgICByZXR1cm4gdHJ1ZTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAoaXNBcnJheShvYmopKSB7XHJcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgb2JqLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgICBpZiAoX2hhc0JpbmFyeShvYmpbaV0pKSB7XHJcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgICB9XHJcbiAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAob2JqICYmICdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcclxuICAgICAgaWYgKG9iai50b0pTT04pIHtcclxuICAgICAgICBvYmogPSBvYmoudG9KU09OKCk7XHJcbiAgICAgIH1cclxuXHJcbiAgICAgIGZvciAodmFyIGtleSBpbiBvYmopIHtcclxuICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSAmJiBfaGFzQmluYXJ5KG9ialtrZXldKSkge1xyXG4gICAgICAgICAgcmV0dXJuIHRydWU7XHJcbiAgICAgICAgfVxyXG4gICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGZhbHNlO1xyXG4gIH1cclxuXHJcbiAgcmV0dXJuIF9oYXNCaW5hcnkoZGF0YSk7XHJcbn1cclxuXHJcbn0pLmNhbGwodGhpcyx0eXBlb2Ygc2VsZiAhPT0gXCJ1bmRlZmluZWRcIiA/IHNlbGYgOiB0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiID8gd2luZG93IDoge30pXHJcbn0se1wiaXNhcnJheVwiOjM5fV0sMzk6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG5tb2R1bGUuZXhwb3J0cz1fZGVyZXFfKDMyKVxyXG59LHt9XSw0MDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG4vKipcclxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cclxuICovXHJcblxyXG52YXIgZ2xvYmFsID0gX2RlcmVxXygnZ2xvYmFsJyk7XHJcblxyXG4vKipcclxuICogTW9kdWxlIGV4cG9ydHMuXHJcbiAqXHJcbiAqIExvZ2ljIGJvcnJvd2VkIGZyb20gTW9kZXJuaXpyOlxyXG4gKlxyXG4gKiAgIC0gaHR0cHM6Ly9naXRodWIuY29tL01vZGVybml6ci9Nb2Rlcm5penIvYmxvYi9tYXN0ZXIvZmVhdHVyZS1kZXRlY3RzL2NvcnMuanNcclxuICovXHJcblxyXG50cnkge1xyXG4gIG1vZHVsZS5leHBvcnRzID0gJ1hNTEh0dHBSZXF1ZXN0JyBpbiBnbG9iYWwgJiZcclxuICAgICd3aXRoQ3JlZGVudGlhbHMnIGluIG5ldyBnbG9iYWwuWE1MSHR0cFJlcXVlc3QoKTtcclxufSBjYXRjaCAoZXJyKSB7XHJcbiAgLy8gaWYgWE1MSHR0cCBzdXBwb3J0IGlzIGRpc2FibGVkIGluIElFIHRoZW4gaXQgd2lsbCB0aHJvd1xyXG4gIC8vIHdoZW4gdHJ5aW5nIHRvIGNyZWF0ZVxyXG4gIG1vZHVsZS5leHBvcnRzID0gZmFsc2U7XHJcbn1cclxuXHJcbn0se1wiZ2xvYmFsXCI6NDF9XSw0MTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG4vKipcclxuICogUmV0dXJucyBgdGhpc2AuIEV4ZWN1dGUgdGhpcyB3aXRob3V0IGEgXCJjb250ZXh0XCIgKGkuZS4gd2l0aG91dCBpdCBiZWluZ1xyXG4gKiBhdHRhY2hlZCB0byBhbiBvYmplY3Qgb2YgdGhlIGxlZnQtaGFuZCBzaWRlKSwgYW5kIGB0aGlzYCBwb2ludHMgdG8gdGhlXHJcbiAqIFwiZ2xvYmFsXCIgc2NvcGUgb2YgdGhlIGN1cnJlbnQgSlMgZXhlY3V0aW9uLlxyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gKGZ1bmN0aW9uICgpIHsgcmV0dXJuIHRoaXM7IH0pKCk7XHJcblxyXG59LHt9XSw0MjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG52YXIgaW5kZXhPZiA9IFtdLmluZGV4T2Y7XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGFyciwgb2JqKXtcclxuICBpZiAoaW5kZXhPZikgcmV0dXJuIGFyci5pbmRleE9mKG9iaik7XHJcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnIubGVuZ3RoOyArK2kpIHtcclxuICAgIGlmIChhcnJbaV0gPT09IG9iaikgcmV0dXJuIGk7XHJcbiAgfVxyXG4gIHJldHVybiAtMTtcclxufTtcclxufSx7fV0sNDM6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG5cclxuLyoqXHJcbiAqIEhPUCByZWYuXHJcbiAqL1xyXG5cclxudmFyIGhhcyA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XHJcblxyXG4vKipcclxuICogUmV0dXJuIG93biBrZXlzIGluIGBvYmpgLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXHJcbiAqIEByZXR1cm4ge0FycmF5fVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMua2V5cyA9IE9iamVjdC5rZXlzIHx8IGZ1bmN0aW9uKG9iail7XHJcbiAgdmFyIGtleXMgPSBbXTtcclxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICBpZiAoaGFzLmNhbGwob2JqLCBrZXkpKSB7XHJcbiAgICAgIGtleXMucHVzaChrZXkpO1xyXG4gICAgfVxyXG4gIH1cclxuICByZXR1cm4ga2V5cztcclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gb3duIHZhbHVlcyBpbiBgb2JqYC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IG9ialxyXG4gKiBAcmV0dXJuIHtBcnJheX1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5leHBvcnRzLnZhbHVlcyA9IGZ1bmN0aW9uKG9iail7XHJcbiAgdmFyIHZhbHMgPSBbXTtcclxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XHJcbiAgICBpZiAoaGFzLmNhbGwob2JqLCBrZXkpKSB7XHJcbiAgICAgIHZhbHMucHVzaChvYmpba2V5XSk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiB2YWxzO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIE1lcmdlIGBiYCBpbnRvIGBhYC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IGFcclxuICogQHBhcmFtIHtPYmplY3R9IGJcclxuICogQHJldHVybiB7T2JqZWN0fSBhXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5tZXJnZSA9IGZ1bmN0aW9uKGEsIGIpe1xyXG4gIGZvciAodmFyIGtleSBpbiBiKSB7XHJcbiAgICBpZiAoaGFzLmNhbGwoYiwga2V5KSkge1xyXG4gICAgICBhW2tleV0gPSBiW2tleV07XHJcbiAgICB9XHJcbiAgfVxyXG4gIHJldHVybiBhO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJldHVybiBsZW5ndGggb2YgYG9iamAuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcclxuICogQHJldHVybiB7TnVtYmVyfVxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMubGVuZ3RoID0gZnVuY3Rpb24ob2JqKXtcclxuICByZXR1cm4gZXhwb3J0cy5rZXlzKG9iaikubGVuZ3RoO1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIGlmIGBvYmpgIGlzIGVtcHR5LlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59XHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5pc0VtcHR5ID0gZnVuY3Rpb24ob2JqKXtcclxuICByZXR1cm4gMCA9PSBleHBvcnRzLmxlbmd0aChvYmopO1xyXG59O1xyXG59LHt9XSw0NDpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbi8qKlxyXG4gKiBQYXJzZXMgYW4gVVJJXHJcbiAqXHJcbiAqIEBhdXRob3IgU3RldmVuIExldml0aGFuIDxzdGV2ZW5sZXZpdGhhbi5jb20+IChNSVQgbGljZW5zZSlcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxudmFyIHJlID0gL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoaHR0cHxodHRwc3x3c3x3c3MpOlxcL1xcLyk/KCg/OigoW146QF0qKSg/OjooW146QF0qKSk/KT9AKT8oKD86W2EtZjAtOV17MCw0fTopezIsN31bYS1mMC05XXswLDR9fFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS87XHJcblxyXG52YXIgcGFydHMgPSBbXHJcbiAgICAnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnXHJcbiAgLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2FuY2hvcidcclxuXTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gcGFyc2V1cmkoc3RyKSB7XHJcbiAgdmFyIG0gPSByZS5leGVjKHN0ciB8fCAnJylcclxuICAgICwgdXJpID0ge31cclxuICAgICwgaSA9IDE0O1xyXG5cclxuICB3aGlsZSAoaS0tKSB7XHJcbiAgICB1cmlbcGFydHNbaV1dID0gbVtpXSB8fCAnJztcclxuICB9XHJcblxyXG4gIHJldHVybiB1cmk7XHJcbn07XHJcblxyXG59LHt9XSw0NTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbihmdW5jdGlvbiAoZ2xvYmFsKXtcclxuLypnbG9iYWwgQmxvYixGaWxlKi9cclxuXHJcbi8qKlxyXG4gKiBNb2R1bGUgcmVxdWlyZW1lbnRzXHJcbiAqL1xyXG5cclxudmFyIGlzQXJyYXkgPSBfZGVyZXFfKCdpc2FycmF5Jyk7XHJcbnZhciBpc0J1ZiA9IF9kZXJlcV8oJy4vaXMtYnVmZmVyJyk7XHJcblxyXG4vKipcclxuICogUmVwbGFjZXMgZXZlcnkgQnVmZmVyIHwgQXJyYXlCdWZmZXIgaW4gcGFja2V0IHdpdGggYSBudW1iZXJlZCBwbGFjZWhvbGRlci5cclxuICogQW55dGhpbmcgd2l0aCBibG9icyBvciBmaWxlcyBzaG91bGQgYmUgZmVkIHRocm91Z2ggcmVtb3ZlQmxvYnMgYmVmb3JlIGNvbWluZ1xyXG4gKiBoZXJlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gcGFja2V0IC0gc29ja2V0LmlvIGV2ZW50IHBhY2tldFxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IHdpdGggZGVjb25zdHJ1Y3RlZCBwYWNrZXQgYW5kIGxpc3Qgb2YgYnVmZmVyc1xyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMuZGVjb25zdHJ1Y3RQYWNrZXQgPSBmdW5jdGlvbihwYWNrZXQpe1xyXG4gIHZhciBidWZmZXJzID0gW107XHJcbiAgdmFyIHBhY2tldERhdGEgPSBwYWNrZXQuZGF0YTtcclxuXHJcbiAgZnVuY3Rpb24gX2RlY29uc3RydWN0UGFja2V0KGRhdGEpIHtcclxuICAgIGlmICghZGF0YSkgcmV0dXJuIGRhdGE7XHJcblxyXG4gICAgaWYgKGlzQnVmKGRhdGEpKSB7XHJcbiAgICAgIHZhciBwbGFjZWhvbGRlciA9IHsgX3BsYWNlaG9sZGVyOiB0cnVlLCBudW06IGJ1ZmZlcnMubGVuZ3RoIH07XHJcbiAgICAgIGJ1ZmZlcnMucHVzaChkYXRhKTtcclxuICAgICAgcmV0dXJuIHBsYWNlaG9sZGVyO1xyXG4gICAgfSBlbHNlIGlmIChpc0FycmF5KGRhdGEpKSB7XHJcbiAgICAgIHZhciBuZXdEYXRhID0gbmV3IEFycmF5KGRhdGEubGVuZ3RoKTtcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XHJcbiAgICAgICAgbmV3RGF0YVtpXSA9IF9kZWNvbnN0cnVjdFBhY2tldChkYXRhW2ldKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbmV3RGF0YTtcclxuICAgIH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIGRhdGEgJiYgIShkYXRhIGluc3RhbmNlb2YgRGF0ZSkpIHtcclxuICAgICAgdmFyIG5ld0RhdGEgPSB7fTtcclxuICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcclxuICAgICAgICBuZXdEYXRhW2tleV0gPSBfZGVjb25zdHJ1Y3RQYWNrZXQoZGF0YVtrZXldKTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gbmV3RGF0YTtcclxuICAgIH1cclxuICAgIHJldHVybiBkYXRhO1xyXG4gIH1cclxuXHJcbiAgdmFyIHBhY2sgPSBwYWNrZXQ7XHJcbiAgcGFjay5kYXRhID0gX2RlY29uc3RydWN0UGFja2V0KHBhY2tldERhdGEpO1xyXG4gIHBhY2suYXR0YWNobWVudHMgPSBidWZmZXJzLmxlbmd0aDsgLy8gbnVtYmVyIG9mIGJpbmFyeSAnYXR0YWNobWVudHMnXHJcbiAgcmV0dXJuIHtwYWNrZXQ6IHBhY2ssIGJ1ZmZlcnM6IGJ1ZmZlcnN9O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIFJlY29uc3RydWN0cyBhIGJpbmFyeSBwYWNrZXQgZnJvbSBpdHMgcGxhY2Vob2xkZXIgcGFja2V0IGFuZCBidWZmZXJzXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXQgLSBldmVudCBwYWNrZXQgd2l0aCBwbGFjZWhvbGRlcnNcclxuICogQHBhcmFtIHtBcnJheX0gYnVmZmVycyAtIGJpbmFyeSBidWZmZXJzIHRvIHB1dCBpbiBwbGFjZWhvbGRlciBwb3NpdGlvbnNcclxuICogQHJldHVybiB7T2JqZWN0fSByZWNvbnN0cnVjdGVkIHBhY2tldFxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMucmVjb25zdHJ1Y3RQYWNrZXQgPSBmdW5jdGlvbihwYWNrZXQsIGJ1ZmZlcnMpIHtcclxuICB2YXIgY3VyUGxhY2VIb2xkZXIgPSAwO1xyXG5cclxuICBmdW5jdGlvbiBfcmVjb25zdHJ1Y3RQYWNrZXQoZGF0YSkge1xyXG4gICAgaWYgKGRhdGEgJiYgZGF0YS5fcGxhY2Vob2xkZXIpIHtcclxuICAgICAgdmFyIGJ1ZiA9IGJ1ZmZlcnNbZGF0YS5udW1dOyAvLyBhcHByb3ByaWF0ZSBidWZmZXIgKHNob3VsZCBiZSBuYXR1cmFsIG9yZGVyIGFueXdheSlcclxuICAgICAgcmV0dXJuIGJ1ZjtcclxuICAgIH0gZWxzZSBpZiAoaXNBcnJheShkYXRhKSkge1xyXG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRhdGEubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBkYXRhW2ldID0gX3JlY29uc3RydWN0UGFja2V0KGRhdGFbaV0pO1xyXG4gICAgICB9XHJcbiAgICAgIHJldHVybiBkYXRhO1xyXG4gICAgfSBlbHNlIGlmIChkYXRhICYmICdvYmplY3QnID09IHR5cGVvZiBkYXRhKSB7XHJcbiAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XHJcbiAgICAgICAgZGF0YVtrZXldID0gX3JlY29uc3RydWN0UGFja2V0KGRhdGFba2V5XSk7XHJcbiAgICAgIH1cclxuICAgICAgcmV0dXJuIGRhdGE7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZGF0YTtcclxuICB9XHJcblxyXG4gIHBhY2tldC5kYXRhID0gX3JlY29uc3RydWN0UGFja2V0KHBhY2tldC5kYXRhKTtcclxuICBwYWNrZXQuYXR0YWNobWVudHMgPSB1bmRlZmluZWQ7IC8vIG5vIGxvbmdlciB1c2VmdWxcclxuICByZXR1cm4gcGFja2V0O1xyXG59O1xyXG5cclxuLyoqXHJcbiAqIEFzeW5jaHJvbm91c2x5IHJlbW92ZXMgQmxvYnMgb3IgRmlsZXMgZnJvbSBkYXRhIHZpYVxyXG4gKiBGaWxlUmVhZGVyJ3MgcmVhZEFzQXJyYXlCdWZmZXIgbWV0aG9kLiBVc2VkIGJlZm9yZSBlbmNvZGluZ1xyXG4gKiBkYXRhIGFzIG1zZ3BhY2suIENhbGxzIGNhbGxiYWNrIHdpdGggdGhlIGJsb2JsZXNzIGRhdGEuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBkYXRhXHJcbiAqIEBwYXJhbSB7RnVuY3Rpb259IGNhbGxiYWNrXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmV4cG9ydHMucmVtb3ZlQmxvYnMgPSBmdW5jdGlvbihkYXRhLCBjYWxsYmFjaykge1xyXG4gIGZ1bmN0aW9uIF9yZW1vdmVCbG9icyhvYmosIGN1cktleSwgY29udGFpbmluZ09iamVjdCkge1xyXG4gICAgaWYgKCFvYmopIHJldHVybiBvYmo7XHJcblxyXG4gICAgLy8gY29udmVydCBhbnkgYmxvYlxyXG4gICAgaWYgKChnbG9iYWwuQmxvYiAmJiBvYmogaW5zdGFuY2VvZiBCbG9iKSB8fFxyXG4gICAgICAgIChnbG9iYWwuRmlsZSAmJiBvYmogaW5zdGFuY2VvZiBGaWxlKSkge1xyXG4gICAgICBwZW5kaW5nQmxvYnMrKztcclxuXHJcbiAgICAgIC8vIGFzeW5jIGZpbGVyZWFkZXJcclxuICAgICAgdmFyIGZpbGVSZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xyXG4gICAgICBmaWxlUmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkgeyAvLyB0aGlzLnJlc3VsdCA9PSBhcnJheWJ1ZmZlclxyXG4gICAgICAgIGlmIChjb250YWluaW5nT2JqZWN0KSB7XHJcbiAgICAgICAgICBjb250YWluaW5nT2JqZWN0W2N1cktleV0gPSB0aGlzLnJlc3VsdDtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICBibG9ibGVzc0RhdGEgPSB0aGlzLnJlc3VsdDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vIGlmIG5vdGhpbmcgcGVuZGluZyBpdHMgY2FsbGJhY2sgdGltZVxyXG4gICAgICAgIGlmKCEgLS1wZW5kaW5nQmxvYnMpIHtcclxuICAgICAgICAgIGNhbGxiYWNrKGJsb2JsZXNzRGF0YSk7XHJcbiAgICAgICAgfVxyXG4gICAgICB9O1xyXG5cclxuICAgICAgZmlsZVJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihvYmopOyAvLyBibG9iIC0+IGFycmF5YnVmZmVyXHJcbiAgICB9IGVsc2UgaWYgKGlzQXJyYXkob2JqKSkgeyAvLyBoYW5kbGUgYXJyYXlcclxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBvYmoubGVuZ3RoOyBpKyspIHtcclxuICAgICAgICBfcmVtb3ZlQmxvYnMob2JqW2ldLCBpLCBvYmopO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgaWYgKG9iaiAmJiAnb2JqZWN0JyA9PSB0eXBlb2Ygb2JqICYmICFpc0J1ZihvYmopKSB7IC8vIGFuZCBvYmplY3RcclxuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikge1xyXG4gICAgICAgIF9yZW1vdmVCbG9icyhvYmpba2V5XSwga2V5LCBvYmopO1xyXG4gICAgICB9XHJcbiAgICB9XHJcbiAgfVxyXG5cclxuICB2YXIgcGVuZGluZ0Jsb2JzID0gMDtcclxuICB2YXIgYmxvYmxlc3NEYXRhID0gZGF0YTtcclxuICBfcmVtb3ZlQmxvYnMoYmxvYmxlc3NEYXRhKTtcclxuICBpZiAoIXBlbmRpbmdCbG9icykge1xyXG4gICAgY2FsbGJhY2soYmxvYmxlc3NEYXRhKTtcclxuICB9XHJcbn07XHJcblxyXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KVxyXG59LHtcIi4vaXMtYnVmZmVyXCI6NDcsXCJpc2FycmF5XCI6NDh9XSw0NjpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcblxyXG4vKipcclxuICogTW9kdWxlIGRlcGVuZGVuY2llcy5cclxuICovXHJcblxyXG52YXIgZGVidWcgPSBfZGVyZXFfKCdkZWJ1ZycpKCdzb2NrZXQuaW8tcGFyc2VyJyk7XHJcbnZhciBqc29uID0gX2RlcmVxXygnanNvbjMnKTtcclxudmFyIGlzQXJyYXkgPSBfZGVyZXFfKCdpc2FycmF5Jyk7XHJcbnZhciBFbWl0dGVyID0gX2RlcmVxXygnY29tcG9uZW50LWVtaXR0ZXInKTtcclxudmFyIGJpbmFyeSA9IF9kZXJlcV8oJy4vYmluYXJ5Jyk7XHJcbnZhciBpc0J1ZiA9IF9kZXJlcV8oJy4vaXMtYnVmZmVyJyk7XHJcblxyXG4vKipcclxuICogUHJvdG9jb2wgdmVyc2lvbi5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5leHBvcnRzLnByb3RvY29sID0gNDtcclxuXHJcbi8qKlxyXG4gKiBQYWNrZXQgdHlwZXMuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy50eXBlcyA9IFtcclxuICAnQ09OTkVDVCcsXHJcbiAgJ0RJU0NPTk5FQ1QnLFxyXG4gICdFVkVOVCcsXHJcbiAgJ0JJTkFSWV9FVkVOVCcsXHJcbiAgJ0FDSycsXHJcbiAgJ0JJTkFSWV9BQ0snLFxyXG4gICdFUlJPUidcclxuXTtcclxuXHJcbi8qKlxyXG4gKiBQYWNrZXQgdHlwZSBgY29ubmVjdGAuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5DT05ORUNUID0gMDtcclxuXHJcbi8qKlxyXG4gKiBQYWNrZXQgdHlwZSBgZGlzY29ubmVjdGAuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5ESVNDT05ORUNUID0gMTtcclxuXHJcbi8qKlxyXG4gKiBQYWNrZXQgdHlwZSBgZXZlbnRgLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMuRVZFTlQgPSAyO1xyXG5cclxuLyoqXHJcbiAqIFBhY2tldCB0eXBlIGBhY2tgLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMuQUNLID0gMztcclxuXHJcbi8qKlxyXG4gKiBQYWNrZXQgdHlwZSBgZXJyb3JgLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMuRVJST1IgPSA0O1xyXG5cclxuLyoqXHJcbiAqIFBhY2tldCB0eXBlICdiaW5hcnkgZXZlbnQnXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5CSU5BUllfRVZFTlQgPSA1O1xyXG5cclxuLyoqXHJcbiAqIFBhY2tldCB0eXBlIGBiaW5hcnkgYWNrYC4gRm9yIGFja3Mgd2l0aCBiaW5hcnkgYXJndW1lbnRzLlxyXG4gKlxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbmV4cG9ydHMuQklOQVJZX0FDSyA9IDY7XHJcblxyXG4vKipcclxuICogRW5jb2RlciBjb25zdHJ1Y3Rvci5cclxuICpcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5leHBvcnRzLkVuY29kZXIgPSBFbmNvZGVyO1xyXG5cclxuLyoqXHJcbiAqIERlY29kZXIgY29uc3RydWN0b3IuXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZXhwb3J0cy5EZWNvZGVyID0gRGVjb2RlcjtcclxuXHJcbi8qKlxyXG4gKiBBIHNvY2tldC5pbyBFbmNvZGVyIGluc3RhbmNlXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gRW5jb2RlcigpIHt9XHJcblxyXG4vKipcclxuICogRW5jb2RlIGEgcGFja2V0IGFzIGEgc2luZ2xlIHN0cmluZyBpZiBub24tYmluYXJ5LCBvciBhcyBhXHJcbiAqIGJ1ZmZlciBzZXF1ZW5jZSwgZGVwZW5kaW5nIG9uIHBhY2tldCB0eXBlLlxyXG4gKlxyXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqIC0gcGFja2V0IG9iamVjdFxyXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBjYWxsYmFjayAtIGZ1bmN0aW9uIHRvIGhhbmRsZSBlbmNvZGluZ3MgKGxpa2VseSBlbmdpbmUud3JpdGUpXHJcbiAqIEByZXR1cm4gQ2FsbHMgY2FsbGJhY2sgd2l0aCBBcnJheSBvZiBlbmNvZGluZ3NcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5FbmNvZGVyLnByb3RvdHlwZS5lbmNvZGUgPSBmdW5jdGlvbihvYmosIGNhbGxiYWNrKXtcclxuICBkZWJ1ZygnZW5jb2RpbmcgcGFja2V0ICVqJywgb2JqKTtcclxuXHJcbiAgaWYgKGV4cG9ydHMuQklOQVJZX0VWRU5UID09IG9iai50eXBlIHx8IGV4cG9ydHMuQklOQVJZX0FDSyA9PSBvYmoudHlwZSkge1xyXG4gICAgZW5jb2RlQXNCaW5hcnkob2JqLCBjYWxsYmFjayk7XHJcbiAgfVxyXG4gIGVsc2Uge1xyXG4gICAgdmFyIGVuY29kaW5nID0gZW5jb2RlQXNTdHJpbmcob2JqKTtcclxuICAgIGNhbGxiYWNrKFtlbmNvZGluZ10pO1xyXG4gIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBFbmNvZGUgcGFja2V0IGFzIHN0cmluZy5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldFxyXG4gKiBAcmV0dXJuIHtTdHJpbmd9IGVuY29kZWRcclxuICogQGFwaSBwcml2YXRlXHJcbiAqL1xyXG5cclxuZnVuY3Rpb24gZW5jb2RlQXNTdHJpbmcob2JqKSB7XHJcbiAgdmFyIHN0ciA9ICcnO1xyXG4gIHZhciBuc3AgPSBmYWxzZTtcclxuXHJcbiAgLy8gZmlyc3QgaXMgdHlwZVxyXG4gIHN0ciArPSBvYmoudHlwZTtcclxuXHJcbiAgLy8gYXR0YWNobWVudHMgaWYgd2UgaGF2ZSB0aGVtXHJcbiAgaWYgKGV4cG9ydHMuQklOQVJZX0VWRU5UID09IG9iai50eXBlIHx8IGV4cG9ydHMuQklOQVJZX0FDSyA9PSBvYmoudHlwZSkge1xyXG4gICAgc3RyICs9IG9iai5hdHRhY2htZW50cztcclxuICAgIHN0ciArPSAnLSc7XHJcbiAgfVxyXG5cclxuICAvLyBpZiB3ZSBoYXZlIGEgbmFtZXNwYWNlIG90aGVyIHRoYW4gYC9gXHJcbiAgLy8gd2UgYXBwZW5kIGl0IGZvbGxvd2VkIGJ5IGEgY29tbWEgYCxgXHJcbiAgaWYgKG9iai5uc3AgJiYgJy8nICE9IG9iai5uc3ApIHtcclxuICAgIG5zcCA9IHRydWU7XHJcbiAgICBzdHIgKz0gb2JqLm5zcDtcclxuICB9XHJcblxyXG4gIC8vIGltbWVkaWF0ZWx5IGZvbGxvd2VkIGJ5IHRoZSBpZFxyXG4gIGlmIChudWxsICE9IG9iai5pZCkge1xyXG4gICAgaWYgKG5zcCkge1xyXG4gICAgICBzdHIgKz0gJywnO1xyXG4gICAgICBuc3AgPSBmYWxzZTtcclxuICAgIH1cclxuICAgIHN0ciArPSBvYmouaWQ7XHJcbiAgfVxyXG5cclxuICAvLyBqc29uIGRhdGFcclxuICBpZiAobnVsbCAhPSBvYmouZGF0YSkge1xyXG4gICAgaWYgKG5zcCkgc3RyICs9ICcsJztcclxuICAgIHN0ciArPSBqc29uLnN0cmluZ2lmeShvYmouZGF0YSk7XHJcbiAgfVxyXG5cclxuICBkZWJ1ZygnZW5jb2RlZCAlaiBhcyAlcycsIG9iaiwgc3RyKTtcclxuICByZXR1cm4gc3RyO1xyXG59XHJcblxyXG4vKipcclxuICogRW5jb2RlIHBhY2tldCBhcyAnYnVmZmVyIHNlcXVlbmNlJyBieSByZW1vdmluZyBibG9icywgYW5kXHJcbiAqIGRlY29uc3RydWN0aW5nIHBhY2tldCBpbnRvIG9iamVjdCB3aXRoIHBsYWNlaG9sZGVycyBhbmRcclxuICogYSBsaXN0IG9mIGJ1ZmZlcnMuXHJcbiAqXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBwYWNrZXRcclxuICogQHJldHVybiB7QnVmZmVyfSBlbmNvZGVkXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIGVuY29kZUFzQmluYXJ5KG9iaiwgY2FsbGJhY2spIHtcclxuXHJcbiAgZnVuY3Rpb24gd3JpdGVFbmNvZGluZyhibG9ibGVzc0RhdGEpIHtcclxuICAgIHZhciBkZWNvbnN0cnVjdGlvbiA9IGJpbmFyeS5kZWNvbnN0cnVjdFBhY2tldChibG9ibGVzc0RhdGEpO1xyXG4gICAgdmFyIHBhY2sgPSBlbmNvZGVBc1N0cmluZyhkZWNvbnN0cnVjdGlvbi5wYWNrZXQpO1xyXG4gICAgdmFyIGJ1ZmZlcnMgPSBkZWNvbnN0cnVjdGlvbi5idWZmZXJzO1xyXG5cclxuICAgIGJ1ZmZlcnMudW5zaGlmdChwYWNrKTsgLy8gYWRkIHBhY2tldCBpbmZvIHRvIGJlZ2lubmluZyBvZiBkYXRhIGxpc3RcclxuICAgIGNhbGxiYWNrKGJ1ZmZlcnMpOyAvLyB3cml0ZSBhbGwgdGhlIGJ1ZmZlcnNcclxuICB9XHJcblxyXG4gIGJpbmFyeS5yZW1vdmVCbG9icyhvYmosIHdyaXRlRW5jb2RpbmcpO1xyXG59XHJcblxyXG4vKipcclxuICogQSBzb2NrZXQuaW8gRGVjb2RlciBpbnN0YW5jZVxyXG4gKlxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IGRlY29kZXJcclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcblxyXG5mdW5jdGlvbiBEZWNvZGVyKCkge1xyXG4gIHRoaXMucmVjb25zdHJ1Y3RvciA9IG51bGw7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNaXggaW4gYEVtaXR0ZXJgIHdpdGggRGVjb2Rlci5cclxuICovXHJcblxyXG5FbWl0dGVyKERlY29kZXIucHJvdG90eXBlKTtcclxuXHJcbi8qKlxyXG4gKiBEZWNvZGVzIGFuIGVjb2RlZCBwYWNrZXQgc3RyaW5nIGludG8gcGFja2V0IEpTT04uXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBvYmogLSBlbmNvZGVkIHBhY2tldFxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IHBhY2tldFxyXG4gKiBAYXBpIHB1YmxpY1xyXG4gKi9cclxuXHJcbkRlY29kZXIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKG9iaikge1xyXG4gIHZhciBwYWNrZXQ7XHJcbiAgaWYgKCdzdHJpbmcnID09IHR5cGVvZiBvYmopIHtcclxuICAgIHBhY2tldCA9IGRlY29kZVN0cmluZyhvYmopO1xyXG4gICAgaWYgKGV4cG9ydHMuQklOQVJZX0VWRU5UID09IHBhY2tldC50eXBlIHx8IGV4cG9ydHMuQklOQVJZX0FDSyA9PSBwYWNrZXQudHlwZSkgeyAvLyBiaW5hcnkgcGFja2V0J3MganNvblxyXG4gICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBuZXcgQmluYXJ5UmVjb25zdHJ1Y3RvcihwYWNrZXQpO1xyXG5cclxuICAgICAgLy8gbm8gYXR0YWNobWVudHMsIGxhYmVsZWQgYmluYXJ5IGJ1dCBubyBiaW5hcnkgZGF0YSB0byBmb2xsb3dcclxuICAgICAgaWYgKHRoaXMucmVjb25zdHJ1Y3Rvci5yZWNvblBhY2suYXR0YWNobWVudHMgPT09IDApIHtcclxuICAgICAgICB0aGlzLmVtaXQoJ2RlY29kZWQnLCBwYWNrZXQpO1xyXG4gICAgICB9XHJcbiAgICB9IGVsc2UgeyAvLyBub24tYmluYXJ5IGZ1bGwgcGFja2V0XHJcbiAgICAgIHRoaXMuZW1pdCgnZGVjb2RlZCcsIHBhY2tldCk7XHJcbiAgICB9XHJcbiAgfVxyXG4gIGVsc2UgaWYgKGlzQnVmKG9iaikgfHwgb2JqLmJhc2U2NCkgeyAvLyByYXcgYmluYXJ5IGRhdGFcclxuICAgIGlmICghdGhpcy5yZWNvbnN0cnVjdG9yKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignZ290IGJpbmFyeSBkYXRhIHdoZW4gbm90IHJlY29uc3RydWN0aW5nIGEgcGFja2V0Jyk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICBwYWNrZXQgPSB0aGlzLnJlY29uc3RydWN0b3IudGFrZUJpbmFyeURhdGEob2JqKTtcclxuICAgICAgaWYgKHBhY2tldCkgeyAvLyByZWNlaXZlZCBmaW5hbCBidWZmZXJcclxuICAgICAgICB0aGlzLnJlY29uc3RydWN0b3IgPSBudWxsO1xyXG4gICAgICAgIHRoaXMuZW1pdCgnZGVjb2RlZCcsIHBhY2tldCk7XHJcbiAgICAgIH1cclxuICAgIH1cclxuICB9XHJcbiAgZWxzZSB7XHJcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gdHlwZTogJyArIG9iaik7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIERlY29kZSBhIHBhY2tldCBTdHJpbmcgKEpTT04gZGF0YSlcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IHN0clxyXG4gKiBAcmV0dXJuIHtPYmplY3R9IHBhY2tldFxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5mdW5jdGlvbiBkZWNvZGVTdHJpbmcoc3RyKSB7XHJcbiAgdmFyIHAgPSB7fTtcclxuICB2YXIgaSA9IDA7XHJcblxyXG4gIC8vIGxvb2sgdXAgdHlwZVxyXG4gIHAudHlwZSA9IE51bWJlcihzdHIuY2hhckF0KDApKTtcclxuICBpZiAobnVsbCA9PSBleHBvcnRzLnR5cGVzW3AudHlwZV0pIHJldHVybiBlcnJvcigpO1xyXG5cclxuICAvLyBsb29rIHVwIGF0dGFjaG1lbnRzIGlmIHR5cGUgYmluYXJ5XHJcbiAgaWYgKGV4cG9ydHMuQklOQVJZX0VWRU5UID09IHAudHlwZSB8fCBleHBvcnRzLkJJTkFSWV9BQ0sgPT0gcC50eXBlKSB7XHJcbiAgICB2YXIgYnVmID0gJyc7XHJcbiAgICB3aGlsZSAoc3RyLmNoYXJBdCgrK2kpICE9ICctJykge1xyXG4gICAgICBidWYgKz0gc3RyLmNoYXJBdChpKTtcclxuICAgICAgaWYgKGkgPT0gc3RyLmxlbmd0aCkgYnJlYWs7XHJcbiAgICB9XHJcbiAgICBpZiAoYnVmICE9IE51bWJlcihidWYpIHx8IHN0ci5jaGFyQXQoaSkgIT0gJy0nKSB7XHJcbiAgICAgIHRocm93IG5ldyBFcnJvcignSWxsZWdhbCBhdHRhY2htZW50cycpO1xyXG4gICAgfVxyXG4gICAgcC5hdHRhY2htZW50cyA9IE51bWJlcihidWYpO1xyXG4gIH1cclxuXHJcbiAgLy8gbG9vayB1cCBuYW1lc3BhY2UgKGlmIGFueSlcclxuICBpZiAoJy8nID09IHN0ci5jaGFyQXQoaSArIDEpKSB7XHJcbiAgICBwLm5zcCA9ICcnO1xyXG4gICAgd2hpbGUgKCsraSkge1xyXG4gICAgICB2YXIgYyA9IHN0ci5jaGFyQXQoaSk7XHJcbiAgICAgIGlmICgnLCcgPT0gYykgYnJlYWs7XHJcbiAgICAgIHAubnNwICs9IGM7XHJcbiAgICAgIGlmIChpID09IHN0ci5sZW5ndGgpIGJyZWFrO1xyXG4gICAgfVxyXG4gIH0gZWxzZSB7XHJcbiAgICBwLm5zcCA9ICcvJztcclxuICB9XHJcblxyXG4gIC8vIGxvb2sgdXAgaWRcclxuICB2YXIgbmV4dCA9IHN0ci5jaGFyQXQoaSArIDEpO1xyXG4gIGlmICgnJyAhPT0gbmV4dCAmJiBOdW1iZXIobmV4dCkgPT0gbmV4dCkge1xyXG4gICAgcC5pZCA9ICcnO1xyXG4gICAgd2hpbGUgKCsraSkge1xyXG4gICAgICB2YXIgYyA9IHN0ci5jaGFyQXQoaSk7XHJcbiAgICAgIGlmIChudWxsID09IGMgfHwgTnVtYmVyKGMpICE9IGMpIHtcclxuICAgICAgICAtLWk7XHJcbiAgICAgICAgYnJlYWs7XHJcbiAgICAgIH1cclxuICAgICAgcC5pZCArPSBzdHIuY2hhckF0KGkpO1xyXG4gICAgICBpZiAoaSA9PSBzdHIubGVuZ3RoKSBicmVhaztcclxuICAgIH1cclxuICAgIHAuaWQgPSBOdW1iZXIocC5pZCk7XHJcbiAgfVxyXG5cclxuICAvLyBsb29rIHVwIGpzb24gZGF0YVxyXG4gIGlmIChzdHIuY2hhckF0KCsraSkpIHtcclxuICAgIHRyeSB7XHJcbiAgICAgIHAuZGF0YSA9IGpzb24ucGFyc2Uoc3RyLnN1YnN0cihpKSk7XHJcbiAgICB9IGNhdGNoKGUpe1xyXG4gICAgICByZXR1cm4gZXJyb3IoKTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIGRlYnVnKCdkZWNvZGVkICVzIGFzICVqJywgc3RyLCBwKTtcclxuICByZXR1cm4gcDtcclxufVxyXG5cclxuLyoqXHJcbiAqIERlYWxsb2NhdGVzIGEgcGFyc2VyJ3MgcmVzb3VyY2VzXHJcbiAqXHJcbiAqIEBhcGkgcHVibGljXHJcbiAqL1xyXG5cclxuRGVjb2Rlci5wcm90b3R5cGUuZGVzdHJveSA9IGZ1bmN0aW9uKCkge1xyXG4gIGlmICh0aGlzLnJlY29uc3RydWN0b3IpIHtcclxuICAgIHRoaXMucmVjb25zdHJ1Y3Rvci5maW5pc2hlZFJlY29uc3RydWN0aW9uKCk7XHJcbiAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEEgbWFuYWdlciBvZiBhIGJpbmFyeSBldmVudCdzICdidWZmZXIgc2VxdWVuY2UnLiBTaG91bGRcclxuICogYmUgY29uc3RydWN0ZWQgd2hlbmV2ZXIgYSBwYWNrZXQgb2YgdHlwZSBCSU5BUllfRVZFTlQgaXNcclxuICogZGVjb2RlZC5cclxuICpcclxuICogQHBhcmFtIHtPYmplY3R9IHBhY2tldFxyXG4gKiBAcmV0dXJuIHtCaW5hcnlSZWNvbnN0cnVjdG9yfSBpbml0aWFsaXplZCByZWNvbnN0cnVjdG9yXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbmZ1bmN0aW9uIEJpbmFyeVJlY29uc3RydWN0b3IocGFja2V0KSB7XHJcbiAgdGhpcy5yZWNvblBhY2sgPSBwYWNrZXQ7XHJcbiAgdGhpcy5idWZmZXJzID0gW107XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBNZXRob2QgdG8gYmUgY2FsbGVkIHdoZW4gYmluYXJ5IGRhdGEgcmVjZWl2ZWQgZnJvbSBjb25uZWN0aW9uXHJcbiAqIGFmdGVyIGEgQklOQVJZX0VWRU5UIHBhY2tldC5cclxuICpcclxuICogQHBhcmFtIHtCdWZmZXIgfCBBcnJheUJ1ZmZlcn0gYmluRGF0YSAtIHRoZSByYXcgYmluYXJ5IGRhdGEgcmVjZWl2ZWRcclxuICogQHJldHVybiB7bnVsbCB8IE9iamVjdH0gcmV0dXJucyBudWxsIGlmIG1vcmUgYmluYXJ5IGRhdGEgaXMgZXhwZWN0ZWQgb3JcclxuICogICBhIHJlY29uc3RydWN0ZWQgcGFja2V0IG9iamVjdCBpZiBhbGwgYnVmZmVycyBoYXZlIGJlZW4gcmVjZWl2ZWQuXHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuXHJcbkJpbmFyeVJlY29uc3RydWN0b3IucHJvdG90eXBlLnRha2VCaW5hcnlEYXRhID0gZnVuY3Rpb24oYmluRGF0YSkge1xyXG4gIHRoaXMuYnVmZmVycy5wdXNoKGJpbkRhdGEpO1xyXG4gIGlmICh0aGlzLmJ1ZmZlcnMubGVuZ3RoID09IHRoaXMucmVjb25QYWNrLmF0dGFjaG1lbnRzKSB7IC8vIGRvbmUgd2l0aCBidWZmZXIgbGlzdFxyXG4gICAgdmFyIHBhY2tldCA9IGJpbmFyeS5yZWNvbnN0cnVjdFBhY2tldCh0aGlzLnJlY29uUGFjaywgdGhpcy5idWZmZXJzKTtcclxuICAgIHRoaXMuZmluaXNoZWRSZWNvbnN0cnVjdGlvbigpO1xyXG4gICAgcmV0dXJuIHBhY2tldDtcclxuICB9XHJcbiAgcmV0dXJuIG51bGw7XHJcbn07XHJcblxyXG4vKipcclxuICogQ2xlYW5zIHVwIGJpbmFyeSBwYWNrZXQgcmVjb25zdHJ1Y3Rpb24gdmFyaWFibGVzLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5CaW5hcnlSZWNvbnN0cnVjdG9yLnByb3RvdHlwZS5maW5pc2hlZFJlY29uc3RydWN0aW9uID0gZnVuY3Rpb24oKSB7XHJcbiAgdGhpcy5yZWNvblBhY2sgPSBudWxsO1xyXG4gIHRoaXMuYnVmZmVycyA9IFtdO1xyXG59O1xyXG5cclxuZnVuY3Rpb24gZXJyb3IoZGF0YSl7XHJcbiAgcmV0dXJuIHtcclxuICAgIHR5cGU6IGV4cG9ydHMuRVJST1IsXHJcbiAgICBkYXRhOiAncGFyc2VyIGVycm9yJ1xyXG4gIH07XHJcbn1cclxuXHJcbn0se1wiLi9iaW5hcnlcIjo0NSxcIi4vaXMtYnVmZmVyXCI6NDcsXCJjb21wb25lbnQtZW1pdHRlclwiOjksXCJkZWJ1Z1wiOjEwLFwiaXNhcnJheVwiOjQ4LFwianNvbjNcIjo0OX1dLDQ3OltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxuKGZ1bmN0aW9uIChnbG9iYWwpe1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBpc0J1ZjtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm5zIHRydWUgaWYgb2JqIGlzIGEgYnVmZmVyIG9yIGFuIGFycmF5YnVmZmVyLlxyXG4gKlxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcblxyXG5mdW5jdGlvbiBpc0J1ZihvYmopIHtcclxuICByZXR1cm4gKGdsb2JhbC5CdWZmZXIgJiYgZ2xvYmFsLkJ1ZmZlci5pc0J1ZmZlcihvYmopKSB8fFxyXG4gICAgICAgICAoZ2xvYmFsLkFycmF5QnVmZmVyICYmIG9iaiBpbnN0YW5jZW9mIEFycmF5QnVmZmVyKTtcclxufVxyXG5cclxufSkuY2FsbCh0aGlzLHR5cGVvZiBzZWxmICE9PSBcInVuZGVmaW5lZFwiID8gc2VsZiA6IHR5cGVvZiB3aW5kb3cgIT09IFwidW5kZWZpbmVkXCIgPyB3aW5kb3cgOiB7fSlcclxufSx7fV0sNDg6W2Z1bmN0aW9uKF9kZXJlcV8sbW9kdWxlLGV4cG9ydHMpe1xyXG5tb2R1bGUuZXhwb3J0cz1fZGVyZXFfKDMyKVxyXG59LHt9XSw0OTpbZnVuY3Rpb24oX2RlcmVxXyxtb2R1bGUsZXhwb3J0cyl7XHJcbi8qISBKU09OIHYzLjIuNiB8IGh0dHA6Ly9iZXN0aWVqcy5naXRodWIuaW8vanNvbjMgfCBDb3B5cmlnaHQgMjAxMi0yMDEzLCBLaXQgQ2FtYnJpZGdlIHwgaHR0cDovL2tpdC5taXQtbGljZW5zZS5vcmcgKi9cclxuOyhmdW5jdGlvbiAod2luZG93KSB7XHJcbiAgLy8gQ29udmVuaWVuY2UgYWxpYXNlcy5cclxuICB2YXIgZ2V0Q2xhc3MgPSB7fS50b1N0cmluZywgaXNQcm9wZXJ0eSwgZm9yRWFjaCwgdW5kZWY7XHJcblxyXG4gIC8vIERldGVjdCB0aGUgYGRlZmluZWAgZnVuY3Rpb24gZXhwb3NlZCBieSBhc3luY2hyb25vdXMgbW9kdWxlIGxvYWRlcnMuIFRoZVxyXG4gIC8vIHN0cmljdCBgZGVmaW5lYCBjaGVjayBpcyBuZWNlc3NhcnkgZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBgci5qc2AuXHJcbiAgdmFyIGlzTG9hZGVyID0gdHlwZW9mIGRlZmluZSA9PT0gXCJmdW5jdGlvblwiICYmIGRlZmluZS5hbWQ7XHJcblxyXG4gIC8vIERldGVjdCBuYXRpdmUgaW1wbGVtZW50YXRpb25zLlxyXG4gIHZhciBuYXRpdmVKU09OID0gdHlwZW9mIEpTT04gPT0gXCJvYmplY3RcIiAmJiBKU09OO1xyXG5cclxuICAvLyBTZXQgdXAgdGhlIEpTT04gMyBuYW1lc3BhY2UsIHByZWZlcnJpbmcgdGhlIENvbW1vbkpTIGBleHBvcnRzYCBvYmplY3QgaWZcclxuICAvLyBhdmFpbGFibGUuXHJcbiAgdmFyIEpTT04zID0gdHlwZW9mIGV4cG9ydHMgPT0gXCJvYmplY3RcIiAmJiBleHBvcnRzICYmICFleHBvcnRzLm5vZGVUeXBlICYmIGV4cG9ydHM7XHJcblxyXG4gIGlmIChKU09OMyAmJiBuYXRpdmVKU09OKSB7XHJcbiAgICAvLyBFeHBsaWNpdGx5IGRlbGVnYXRlIHRvIHRoZSBuYXRpdmUgYHN0cmluZ2lmeWAgYW5kIGBwYXJzZWBcclxuICAgIC8vIGltcGxlbWVudGF0aW9ucyBpbiBDb21tb25KUyBlbnZpcm9ubWVudHMuXHJcbiAgICBKU09OMy5zdHJpbmdpZnkgPSBuYXRpdmVKU09OLnN0cmluZ2lmeTtcclxuICAgIEpTT04zLnBhcnNlID0gbmF0aXZlSlNPTi5wYXJzZTtcclxuICB9IGVsc2Uge1xyXG4gICAgLy8gRXhwb3J0IGZvciB3ZWIgYnJvd3NlcnMsIEphdmFTY3JpcHQgZW5naW5lcywgYW5kIGFzeW5jaHJvbm91cyBtb2R1bGVcclxuICAgIC8vIGxvYWRlcnMsIHVzaW5nIHRoZSBnbG9iYWwgYEpTT05gIG9iamVjdCBpZiBhdmFpbGFibGUuXHJcbiAgICBKU09OMyA9IHdpbmRvdy5KU09OID0gbmF0aXZlSlNPTiB8fCB7fTtcclxuICB9XHJcblxyXG4gIC8vIFRlc3QgdGhlIGBEYXRlI2dldFVUQypgIG1ldGhvZHMuIEJhc2VkIG9uIHdvcmsgYnkgQFlhZmZsZS5cclxuICB2YXIgaXNFeHRlbmRlZCA9IG5ldyBEYXRlKC0zNTA5ODI3MzM0NTczMjkyKTtcclxuICB0cnkge1xyXG4gICAgLy8gVGhlIGBnZXRVVENGdWxsWWVhcmAsIGBNb250aGAsIGFuZCBgRGF0ZWAgbWV0aG9kcyByZXR1cm4gbm9uc2Vuc2ljYWxcclxuICAgIC8vIHJlc3VsdHMgZm9yIGNlcnRhaW4gZGF0ZXMgaW4gT3BlcmEgPj0gMTAuNTMuXHJcbiAgICBpc0V4dGVuZGVkID0gaXNFeHRlbmRlZC5nZXRVVENGdWxsWWVhcigpID09IC0xMDkyNTIgJiYgaXNFeHRlbmRlZC5nZXRVVENNb250aCgpID09PSAwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDRGF0ZSgpID09PSAxICYmXHJcbiAgICAgIC8vIFNhZmFyaSA8IDIuMC4yIHN0b3JlcyB0aGUgaW50ZXJuYWwgbWlsbGlzZWNvbmQgdGltZSB2YWx1ZSBjb3JyZWN0bHksXHJcbiAgICAgIC8vIGJ1dCBjbGlwcyB0aGUgdmFsdWVzIHJldHVybmVkIGJ5IHRoZSBkYXRlIG1ldGhvZHMgdG8gdGhlIHJhbmdlIG9mXHJcbiAgICAgIC8vIHNpZ25lZCAzMi1iaXQgaW50ZWdlcnMgKFstMiAqKiAzMSwgMiAqKiAzMSAtIDFdKS5cclxuICAgICAgaXNFeHRlbmRlZC5nZXRVVENIb3VycygpID09IDEwICYmIGlzRXh0ZW5kZWQuZ2V0VVRDTWludXRlcygpID09IDM3ICYmIGlzRXh0ZW5kZWQuZ2V0VVRDU2Vjb25kcygpID09IDYgJiYgaXNFeHRlbmRlZC5nZXRVVENNaWxsaXNlY29uZHMoKSA9PSA3MDg7XHJcbiAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG5cclxuICAvLyBJbnRlcm5hbDogRGV0ZXJtaW5lcyB3aGV0aGVyIHRoZSBuYXRpdmUgYEpTT04uc3RyaW5naWZ5YCBhbmQgYHBhcnNlYFxyXG4gIC8vIGltcGxlbWVudGF0aW9ucyBhcmUgc3BlYy1jb21wbGlhbnQuIEJhc2VkIG9uIHdvcmsgYnkgS2VuIFNueWRlci5cclxuICBmdW5jdGlvbiBoYXMobmFtZSkge1xyXG4gICAgaWYgKGhhc1tuYW1lXSAhPT0gdW5kZWYpIHtcclxuICAgICAgLy8gUmV0dXJuIGNhY2hlZCBmZWF0dXJlIHRlc3QgcmVzdWx0LlxyXG4gICAgICByZXR1cm4gaGFzW25hbWVdO1xyXG4gICAgfVxyXG5cclxuICAgIHZhciBpc1N1cHBvcnRlZDtcclxuICAgIGlmIChuYW1lID09IFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpIHtcclxuICAgICAgLy8gSUUgPD0gNyBkb2Vzbid0IHN1cHBvcnQgYWNjZXNzaW5nIHN0cmluZyBjaGFyYWN0ZXJzIHVzaW5nIHNxdWFyZVxyXG4gICAgICAvLyBicmFja2V0IG5vdGF0aW9uLiBJRSA4IG9ubHkgc3VwcG9ydHMgdGhpcyBmb3IgcHJpbWl0aXZlcy5cclxuICAgICAgaXNTdXBwb3J0ZWQgPSBcImFcIlswXSAhPSBcImFcIjtcclxuICAgIH0gZWxzZSBpZiAobmFtZSA9PSBcImpzb25cIikge1xyXG4gICAgICAvLyBJbmRpY2F0ZXMgd2hldGhlciBib3RoIGBKU09OLnN0cmluZ2lmeWAgYW5kIGBKU09OLnBhcnNlYCBhcmVcclxuICAgICAgLy8gc3VwcG9ydGVkLlxyXG4gICAgICBpc1N1cHBvcnRlZCA9IGhhcyhcImpzb24tc3RyaW5naWZ5XCIpICYmIGhhcyhcImpzb24tcGFyc2VcIik7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICB2YXIgdmFsdWUsIHNlcmlhbGl6ZWQgPSAne1wiYVwiOlsxLHRydWUsZmFsc2UsbnVsbCxcIlxcXFx1MDAwMFxcXFxiXFxcXG5cXFxcZlxcXFxyXFxcXHRcIl19JztcclxuICAgICAgLy8gVGVzdCBgSlNPTi5zdHJpbmdpZnlgLlxyXG4gICAgICBpZiAobmFtZSA9PSBcImpzb24tc3RyaW5naWZ5XCIpIHtcclxuICAgICAgICB2YXIgc3RyaW5naWZ5ID0gSlNPTjMuc3RyaW5naWZ5LCBzdHJpbmdpZnlTdXBwb3J0ZWQgPSB0eXBlb2Ygc3RyaW5naWZ5ID09IFwiZnVuY3Rpb25cIiAmJiBpc0V4dGVuZGVkO1xyXG4gICAgICAgIGlmIChzdHJpbmdpZnlTdXBwb3J0ZWQpIHtcclxuICAgICAgICAgIC8vIEEgdGVzdCBmdW5jdGlvbiBvYmplY3Qgd2l0aCBhIGN1c3RvbSBgdG9KU09OYCBtZXRob2QuXHJcbiAgICAgICAgICAodmFsdWUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIHJldHVybiAxO1xyXG4gICAgICAgICAgfSkudG9KU09OID0gdmFsdWU7XHJcbiAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPVxyXG4gICAgICAgICAgICAgIC8vIEZpcmVmb3ggMy4xYjEgYW5kIGIyIHNlcmlhbGl6ZSBzdHJpbmcsIG51bWJlciwgYW5kIGJvb2xlYW5cclxuICAgICAgICAgICAgICAvLyBwcmltaXRpdmVzIGFzIG9iamVjdCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICBzdHJpbmdpZnkoMCkgPT09IFwiMFwiICYmXHJcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIGIyLCBhbmQgSlNPTiAyIHNlcmlhbGl6ZSB3cmFwcGVkIHByaW1pdGl2ZXMgYXMgb2JqZWN0XHJcbiAgICAgICAgICAgICAgLy8gbGl0ZXJhbHMuXHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBOdW1iZXIoKSkgPT09IFwiMFwiICYmXHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBTdHJpbmcoKSkgPT0gJ1wiXCInICYmXHJcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIHZhbHVlIGlzIGBudWxsYCwgYHVuZGVmaW5lZGAsIG9yXHJcbiAgICAgICAgICAgICAgLy8gZG9lcyBub3QgZGVmaW5lIGEgY2Fub25pY2FsIEpTT04gcmVwcmVzZW50YXRpb24gKHRoaXMgYXBwbGllcyB0b1xyXG4gICAgICAgICAgICAgIC8vIG9iamVjdHMgd2l0aCBgdG9KU09OYCBwcm9wZXJ0aWVzIGFzIHdlbGwsICp1bmxlc3MqIHRoZXkgYXJlIG5lc3RlZFxyXG4gICAgICAgICAgICAgIC8vIHdpdGhpbiBhbiBvYmplY3Qgb3IgYXJyYXkpLlxyXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShnZXRDbGFzcykgPT09IHVuZGVmICYmXHJcbiAgICAgICAgICAgICAgLy8gSUUgOCBzZXJpYWxpemVzIGB1bmRlZmluZWRgIGFzIGBcInVuZGVmaW5lZFwiYC4gU2FmYXJpIDw9IDUuMS43IGFuZFxyXG4gICAgICAgICAgICAgIC8vIEZGIDMuMWIzIHBhc3MgdGhpcyB0ZXN0LlxyXG4gICAgICAgICAgICAgIHN0cmluZ2lmeSh1bmRlZikgPT09IHVuZGVmICYmXHJcbiAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS43IGFuZCBGRiAzLjFiMyB0aHJvdyBgRXJyb3JgcyBhbmQgYFR5cGVFcnJvcmBzLFxyXG4gICAgICAgICAgICAgIC8vIHJlc3BlY3RpdmVseSwgaWYgdGhlIHZhbHVlIGlzIG9taXR0ZWQgZW50aXJlbHkuXHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5KCkgPT09IHVuZGVmICYmXHJcbiAgICAgICAgICAgICAgLy8gRkYgMy4xYjEsIDIgdGhyb3cgYW4gZXJyb3IgaWYgdGhlIGdpdmVuIHZhbHVlIGlzIG5vdCBhIG51bWJlcixcclxuICAgICAgICAgICAgICAvLyBzdHJpbmcsIGFycmF5LCBvYmplY3QsIEJvb2xlYW4sIG9yIGBudWxsYCBsaXRlcmFsLiBUaGlzIGFwcGxpZXMgdG9cclxuICAgICAgICAgICAgICAvLyBvYmplY3RzIHdpdGggY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMgYXMgd2VsbCwgdW5sZXNzIHRoZXkgYXJlIG5lc3RlZFxyXG4gICAgICAgICAgICAgIC8vIGluc2lkZSBvYmplY3Qgb3IgYXJyYXkgbGl0ZXJhbHMuIFlVSSAzLjAuMGIxIGlnbm9yZXMgY3VzdG9tIGB0b0pTT05gXHJcbiAgICAgICAgICAgICAgLy8gbWV0aG9kcyBlbnRpcmVseS5cclxuICAgICAgICAgICAgICBzdHJpbmdpZnkodmFsdWUpID09PSBcIjFcIiAmJlxyXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShbdmFsdWVdKSA9PSBcIlsxXVwiICYmXHJcbiAgICAgICAgICAgICAgLy8gUHJvdG90eXBlIDw9IDEuNi4xIHNlcmlhbGl6ZXMgYFt1bmRlZmluZWRdYCBhcyBgXCJbXVwiYCBpbnN0ZWFkIG9mXHJcbiAgICAgICAgICAgICAgLy8gYFwiW251bGxdXCJgLlxyXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShbdW5kZWZdKSA9PSBcIltudWxsXVwiICYmXHJcbiAgICAgICAgICAgICAgLy8gWVVJIDMuMC4wYjEgZmFpbHMgdG8gc2VyaWFsaXplIGBudWxsYCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCkgPT0gXCJudWxsXCIgJiZcclxuICAgICAgICAgICAgICAvLyBGRiAzLjFiMSwgMiBoYWx0cyBzZXJpYWxpemF0aW9uIGlmIGFuIGFycmF5IGNvbnRhaW5zIGEgZnVuY3Rpb246XHJcbiAgICAgICAgICAgICAgLy8gYFsxLCB0cnVlLCBnZXRDbGFzcywgMV1gIHNlcmlhbGl6ZXMgYXMgXCJbMSx0cnVlLF0sXCIuIEZGIDMuMWIzXHJcbiAgICAgICAgICAgICAgLy8gZWxpZGVzIG5vbi1KU09OIHZhbHVlcyBmcm9tIG9iamVjdHMgYW5kIGFycmF5cywgdW5sZXNzIHRoZXlcclxuICAgICAgICAgICAgICAvLyBkZWZpbmUgY3VzdG9tIGB0b0pTT05gIG1ldGhvZHMuXHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5KFt1bmRlZiwgZ2V0Q2xhc3MsIG51bGxdKSA9PSBcIltudWxsLG51bGwsbnVsbF1cIiAmJlxyXG4gICAgICAgICAgICAgIC8vIFNpbXBsZSBzZXJpYWxpemF0aW9uIHRlc3QuIEZGIDMuMWIxIHVzZXMgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2VzXHJcbiAgICAgICAgICAgICAgLy8gd2hlcmUgY2hhcmFjdGVyIGVzY2FwZSBjb2RlcyBhcmUgZXhwZWN0ZWQgKGUuZy4sIGBcXGJgID0+IGBcXHUwMDA4YCkuXHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5KHsgXCJhXCI6IFt2YWx1ZSwgdHJ1ZSwgZmFsc2UsIG51bGwsIFwiXFx4MDBcXGJcXG5cXGZcXHJcXHRcIl0gfSkgPT0gc2VyaWFsaXplZCAmJlxyXG4gICAgICAgICAgICAgIC8vIEZGIDMuMWIxIGFuZCBiMiBpZ25vcmUgdGhlIGBmaWx0ZXJgIGFuZCBgd2lkdGhgIGFyZ3VtZW50cy5cclxuICAgICAgICAgICAgICBzdHJpbmdpZnkobnVsbCwgdmFsdWUpID09PSBcIjFcIiAmJlxyXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShbMSwgMl0sIG51bGwsIDEpID09IFwiW1xcbiAxLFxcbiAyXFxuXVwiICYmXHJcbiAgICAgICAgICAgICAgLy8gSlNPTiAyLCBQcm90b3R5cGUgPD0gMS43LCBhbmQgb2xkZXIgV2ViS2l0IGJ1aWxkcyBpbmNvcnJlY3RseVxyXG4gICAgICAgICAgICAgIC8vIHNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycy5cclxuICAgICAgICAgICAgICBzdHJpbmdpZnkobmV3IERhdGUoLTguNjRlMTUpKSA9PSAnXCItMjcxODIxLTA0LTIwVDAwOjAwOjAwLjAwMFpcIicgJiZcclxuICAgICAgICAgICAgICAvLyBUaGUgbWlsbGlzZWNvbmRzIGFyZSBvcHRpb25hbCBpbiBFUyA1LCBidXQgcmVxdWlyZWQgaW4gNS4xLlxyXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSg4LjY0ZTE1KSkgPT0gJ1wiKzI3NTc2MC0wOS0xM1QwMDowMDowMC4wMDBaXCInICYmXHJcbiAgICAgICAgICAgICAgLy8gRmlyZWZveCA8PSAxMS4wIGluY29ycmVjdGx5IHNlcmlhbGl6ZXMgeWVhcnMgcHJpb3IgdG8gMCBhcyBuZWdhdGl2ZVxyXG4gICAgICAgICAgICAgIC8vIGZvdXItZGlnaXQgeWVhcnMgaW5zdGVhZCBvZiBzaXgtZGlnaXQgeWVhcnMuIENyZWRpdHM6IEBZYWZmbGUuXHJcbiAgICAgICAgICAgICAgc3RyaW5naWZ5KG5ldyBEYXRlKC02MjE5ODc1NTJlNSkpID09ICdcIi0wMDAwMDEtMDEtMDFUMDA6MDA6MDAuMDAwWlwiJyAmJlxyXG4gICAgICAgICAgICAgIC8vIFNhZmFyaSA8PSA1LjEuNSBhbmQgT3BlcmEgPj0gMTAuNTMgaW5jb3JyZWN0bHkgc2VyaWFsaXplIG1pbGxpc2Vjb25kXHJcbiAgICAgICAgICAgICAgLy8gdmFsdWVzIGxlc3MgdGhhbiAxMDAwLiBDcmVkaXRzOiBAWWFmZmxlLlxyXG4gICAgICAgICAgICAgIHN0cmluZ2lmeShuZXcgRGF0ZSgtMSkpID09ICdcIjE5NjktMTItMzFUMjM6NTk6NTkuOTk5WlwiJztcclxuICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge1xyXG4gICAgICAgICAgICBzdHJpbmdpZnlTdXBwb3J0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBzdHJpbmdpZnlTdXBwb3J0ZWQ7XHJcbiAgICAgIH1cclxuICAgICAgLy8gVGVzdCBgSlNPTi5wYXJzZWAuXHJcbiAgICAgIGlmIChuYW1lID09IFwianNvbi1wYXJzZVwiKSB7XHJcbiAgICAgICAgdmFyIHBhcnNlID0gSlNPTjMucGFyc2U7XHJcbiAgICAgICAgaWYgKHR5cGVvZiBwYXJzZSA9PSBcImZ1bmN0aW9uXCIpIHtcclxuICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIC8vIEZGIDMuMWIxLCBiMiB3aWxsIHRocm93IGFuIGV4Y2VwdGlvbiBpZiBhIGJhcmUgbGl0ZXJhbCBpcyBwcm92aWRlZC5cclxuICAgICAgICAgICAgLy8gQ29uZm9ybWluZyBpbXBsZW1lbnRhdGlvbnMgc2hvdWxkIGFsc28gY29lcmNlIHRoZSBpbml0aWFsIGFyZ3VtZW50IHRvXHJcbiAgICAgICAgICAgIC8vIGEgc3RyaW5nIHByaW9yIHRvIHBhcnNpbmcuXHJcbiAgICAgICAgICAgIGlmIChwYXJzZShcIjBcIikgPT09IDAgJiYgIXBhcnNlKGZhbHNlKSkge1xyXG4gICAgICAgICAgICAgIC8vIFNpbXBsZSBwYXJzaW5nIHRlc3QuXHJcbiAgICAgICAgICAgICAgdmFsdWUgPSBwYXJzZShzZXJpYWxpemVkKTtcclxuICAgICAgICAgICAgICB2YXIgcGFyc2VTdXBwb3J0ZWQgPSB2YWx1ZVtcImFcIl0ubGVuZ3RoID09IDUgJiYgdmFsdWVbXCJhXCJdWzBdID09PSAxO1xyXG4gICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgLy8gU2FmYXJpIDw9IDUuMS4yIGFuZCBGRiAzLjFiMSBhbGxvdyB1bmVzY2FwZWQgdGFicyBpbiBzdHJpbmdzLlxyXG4gICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9ICFwYXJzZSgnXCJcXHRcIicpO1xyXG4gICAgICAgICAgICAgICAgfSBjYXRjaCAoZXhjZXB0aW9uKSB7fVxyXG4gICAgICAgICAgICAgICAgaWYgKHBhcnNlU3VwcG9ydGVkKSB7XHJcbiAgICAgICAgICAgICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gRkYgNC4wIGFuZCA0LjAuMSBhbGxvdyBsZWFkaW5nIGArYCBzaWducyBhbmQgbGVhZGluZ1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIGRlY2ltYWwgcG9pbnRzLiBGRiA0LjAsIDQuMC4xLCBhbmQgSUUgOS0xMCBhbHNvIGFsbG93XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gY2VydGFpbiBvY3RhbCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgICAgICBwYXJzZVN1cHBvcnRlZCA9IHBhcnNlKFwiMDFcIikgIT09IDE7XHJcbiAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGV4Y2VwdGlvbikge31cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIGlmIChwYXJzZVN1cHBvcnRlZCkge1xyXG4gICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgIC8vIEZGIDQuMCwgNC4wLjEsIGFuZCBSaGlubyAxLjdSMy1SNCBhbGxvdyB0cmFpbGluZyBkZWNpbWFsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gcG9pbnRzLiBUaGVzZSBlbnZpcm9ubWVudHMsIGFsb25nIHdpdGggRkYgMy4xYjEgYW5kIDIsXHJcbiAgICAgICAgICAgICAgICAgICAgLy8gYWxzbyBhbGxvdyB0cmFpbGluZyBjb21tYXMgaW4gSlNPTiBvYmplY3RzIGFuZCBhcnJheXMuXHJcbiAgICAgICAgICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBwYXJzZShcIjEuXCIpICE9PSAxO1xyXG4gICAgICAgICAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHtcclxuICAgICAgICAgICAgcGFyc2VTdXBwb3J0ZWQgPSBmYWxzZTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaXNTdXBwb3J0ZWQgPSBwYXJzZVN1cHBvcnRlZDtcclxuICAgICAgfVxyXG4gICAgfVxyXG4gICAgcmV0dXJuIGhhc1tuYW1lXSA9ICEhaXNTdXBwb3J0ZWQ7XHJcbiAgfVxyXG5cclxuICBpZiAoIWhhcyhcImpzb25cIikpIHtcclxuICAgIC8vIENvbW1vbiBgW1tDbGFzc11dYCBuYW1lIGFsaWFzZXMuXHJcbiAgICB2YXIgZnVuY3Rpb25DbGFzcyA9IFwiW29iamVjdCBGdW5jdGlvbl1cIjtcclxuICAgIHZhciBkYXRlQ2xhc3MgPSBcIltvYmplY3QgRGF0ZV1cIjtcclxuICAgIHZhciBudW1iZXJDbGFzcyA9IFwiW29iamVjdCBOdW1iZXJdXCI7XHJcbiAgICB2YXIgc3RyaW5nQ2xhc3MgPSBcIltvYmplY3QgU3RyaW5nXVwiO1xyXG4gICAgdmFyIGFycmF5Q2xhc3MgPSBcIltvYmplY3QgQXJyYXldXCI7XHJcbiAgICB2YXIgYm9vbGVhbkNsYXNzID0gXCJbb2JqZWN0IEJvb2xlYW5dXCI7XHJcblxyXG4gICAgLy8gRGV0ZWN0IGluY29tcGxldGUgc3VwcG9ydCBmb3IgYWNjZXNzaW5nIHN0cmluZyBjaGFyYWN0ZXJzIGJ5IGluZGV4LlxyXG4gICAgdmFyIGNoYXJJbmRleEJ1Z2d5ID0gaGFzKFwiYnVnLXN0cmluZy1jaGFyLWluZGV4XCIpO1xyXG5cclxuICAgIC8vIERlZmluZSBhZGRpdGlvbmFsIHV0aWxpdHkgbWV0aG9kcyBpZiB0aGUgYERhdGVgIG1ldGhvZHMgYXJlIGJ1Z2d5LlxyXG4gICAgaWYgKCFpc0V4dGVuZGVkKSB7XHJcbiAgICAgIHZhciBmbG9vciA9IE1hdGguZmxvb3I7XHJcbiAgICAgIC8vIEEgbWFwcGluZyBiZXR3ZWVuIHRoZSBtb250aHMgb2YgdGhlIHllYXIgYW5kIHRoZSBudW1iZXIgb2YgZGF5cyBiZXR3ZWVuXHJcbiAgICAgIC8vIEphbnVhcnkgMXN0IGFuZCB0aGUgZmlyc3Qgb2YgdGhlIHJlc3BlY3RpdmUgbW9udGguXHJcbiAgICAgIHZhciBNb250aHMgPSBbMCwgMzEsIDU5LCA5MCwgMTIwLCAxNTEsIDE4MSwgMjEyLCAyNDMsIDI3MywgMzA0LCAzMzRdO1xyXG4gICAgICAvLyBJbnRlcm5hbDogQ2FsY3VsYXRlcyB0aGUgbnVtYmVyIG9mIGRheXMgYmV0d2VlbiB0aGUgVW5peCBlcG9jaCBhbmQgdGhlXHJcbiAgICAgIC8vIGZpcnN0IGRheSBvZiB0aGUgZ2l2ZW4gbW9udGguXHJcbiAgICAgIHZhciBnZXREYXkgPSBmdW5jdGlvbiAoeWVhciwgbW9udGgpIHtcclxuICAgICAgICByZXR1cm4gTW9udGhzW21vbnRoXSArIDM2NSAqICh5ZWFyIC0gMTk3MCkgKyBmbG9vcigoeWVhciAtIDE5NjkgKyAobW9udGggPSArKG1vbnRoID4gMSkpKSAvIDQpIC0gZmxvb3IoKHllYXIgLSAxOTAxICsgbW9udGgpIC8gMTAwKSArIGZsb29yKCh5ZWFyIC0gMTYwMSArIG1vbnRoKSAvIDQwMCk7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgaWYgYSBwcm9wZXJ0eSBpcyBhIGRpcmVjdCBwcm9wZXJ0eSBvZiB0aGUgZ2l2ZW5cclxuICAgIC8vIG9iamVjdC4gRGVsZWdhdGVzIHRvIHRoZSBuYXRpdmUgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAgbWV0aG9kLlxyXG4gICAgaWYgKCEoaXNQcm9wZXJ0eSA9IHt9Lmhhc093blByb3BlcnR5KSkge1xyXG4gICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XHJcbiAgICAgICAgdmFyIG1lbWJlcnMgPSB7fSwgY29uc3RydWN0b3I7XHJcbiAgICAgICAgaWYgKChtZW1iZXJzLl9fcHJvdG9fXyA9IG51bGwsIG1lbWJlcnMuX19wcm90b19fID0ge1xyXG4gICAgICAgICAgLy8gVGhlICpwcm90byogcHJvcGVydHkgY2Fubm90IGJlIHNldCBtdWx0aXBsZSB0aW1lcyBpbiByZWNlbnRcclxuICAgICAgICAgIC8vIHZlcnNpb25zIG9mIEZpcmVmb3ggYW5kIFNlYU1vbmtleS5cclxuICAgICAgICAgIFwidG9TdHJpbmdcIjogMVxyXG4gICAgICAgIH0sIG1lbWJlcnMpLnRvU3RyaW5nICE9IGdldENsYXNzKSB7XHJcbiAgICAgICAgICAvLyBTYWZhcmkgPD0gMi4wLjMgZG9lc24ndCBpbXBsZW1lbnQgYE9iamVjdCNoYXNPd25Qcm9wZXJ0eWAsIGJ1dFxyXG4gICAgICAgICAgLy8gc3VwcG9ydHMgdGhlIG11dGFibGUgKnByb3RvKiBwcm9wZXJ0eS5cclxuICAgICAgICAgIGlzUHJvcGVydHkgPSBmdW5jdGlvbiAocHJvcGVydHkpIHtcclxuICAgICAgICAgICAgLy8gQ2FwdHVyZSBhbmQgYnJlYWsgdGhlIG9iamVjdCdzIHByb3RvdHlwZSBjaGFpbiAoc2VlIHNlY3Rpb24gOC42LjJcclxuICAgICAgICAgICAgLy8gb2YgdGhlIEVTIDUuMSBzcGVjKS4gVGhlIHBhcmVudGhlc2l6ZWQgZXhwcmVzc2lvbiBwcmV2ZW50cyBhblxyXG4gICAgICAgICAgICAvLyB1bnNhZmUgdHJhbnNmb3JtYXRpb24gYnkgdGhlIENsb3N1cmUgQ29tcGlsZXIuXHJcbiAgICAgICAgICAgIHZhciBvcmlnaW5hbCA9IHRoaXMuX19wcm90b19fLCByZXN1bHQgPSBwcm9wZXJ0eSBpbiAodGhpcy5fX3Byb3RvX18gPSBudWxsLCB0aGlzKTtcclxuICAgICAgICAgICAgLy8gUmVzdG9yZSB0aGUgb3JpZ2luYWwgcHJvdG90eXBlIGNoYWluLlxyXG4gICAgICAgICAgICB0aGlzLl9fcHJvdG9fXyA9IG9yaWdpbmFsO1xyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgICAgfTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgLy8gQ2FwdHVyZSBhIHJlZmVyZW5jZSB0byB0aGUgdG9wLWxldmVsIGBPYmplY3RgIGNvbnN0cnVjdG9yLlxyXG4gICAgICAgICAgY29uc3RydWN0b3IgPSBtZW1iZXJzLmNvbnN0cnVjdG9yO1xyXG4gICAgICAgICAgLy8gVXNlIHRoZSBgY29uc3RydWN0b3JgIHByb3BlcnR5IHRvIHNpbXVsYXRlIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIGluXHJcbiAgICAgICAgICAvLyBvdGhlciBlbnZpcm9ubWVudHMuXHJcbiAgICAgICAgICBpc1Byb3BlcnR5ID0gZnVuY3Rpb24gKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgIHZhciBwYXJlbnQgPSAodGhpcy5jb25zdHJ1Y3RvciB8fCBjb25zdHJ1Y3RvcikucHJvdG90eXBlO1xyXG4gICAgICAgICAgICByZXR1cm4gcHJvcGVydHkgaW4gdGhpcyAmJiAhKHByb3BlcnR5IGluIHBhcmVudCAmJiB0aGlzW3Byb3BlcnR5XSA9PT0gcGFyZW50W3Byb3BlcnR5XSk7XHJcbiAgICAgICAgICB9O1xyXG4gICAgICAgIH1cclxuICAgICAgICBtZW1iZXJzID0gbnVsbDtcclxuICAgICAgICByZXR1cm4gaXNQcm9wZXJ0eS5jYWxsKHRoaXMsIHByb3BlcnR5KTtcclxuICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBJbnRlcm5hbDogQSBzZXQgb2YgcHJpbWl0aXZlIHR5cGVzIHVzZWQgYnkgYGlzSG9zdFR5cGVgLlxyXG4gICAgdmFyIFByaW1pdGl2ZVR5cGVzID0ge1xyXG4gICAgICAnYm9vbGVhbic6IDEsXHJcbiAgICAgICdudW1iZXInOiAxLFxyXG4gICAgICAnc3RyaW5nJzogMSxcclxuICAgICAgJ3VuZGVmaW5lZCc6IDFcclxuICAgIH07XHJcblxyXG4gICAgLy8gSW50ZXJuYWw6IERldGVybWluZXMgaWYgdGhlIGdpdmVuIG9iamVjdCBgcHJvcGVydHlgIHZhbHVlIGlzIGFcclxuICAgIC8vIG5vbi1wcmltaXRpdmUuXHJcbiAgICB2YXIgaXNIb3N0VHlwZSA9IGZ1bmN0aW9uIChvYmplY3QsIHByb3BlcnR5KSB7XHJcbiAgICAgIHZhciB0eXBlID0gdHlwZW9mIG9iamVjdFtwcm9wZXJ0eV07XHJcbiAgICAgIHJldHVybiB0eXBlID09ICdvYmplY3QnID8gISFvYmplY3RbcHJvcGVydHldIDogIVByaW1pdGl2ZVR5cGVzW3R5cGVdO1xyXG4gICAgfTtcclxuXHJcbiAgICAvLyBJbnRlcm5hbDogTm9ybWFsaXplcyB0aGUgYGZvci4uLmluYCBpdGVyYXRpb24gYWxnb3JpdGhtIGFjcm9zc1xyXG4gICAgLy8gZW52aXJvbm1lbnRzLiBFYWNoIGVudW1lcmF0ZWQga2V5IGlzIHlpZWxkZWQgdG8gYSBgY2FsbGJhY2tgIGZ1bmN0aW9uLlxyXG4gICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XHJcbiAgICAgIHZhciBzaXplID0gMCwgUHJvcGVydGllcywgbWVtYmVycywgcHJvcGVydHk7XHJcblxyXG4gICAgICAvLyBUZXN0cyBmb3IgYnVncyBpbiB0aGUgY3VycmVudCBlbnZpcm9ubWVudCdzIGBmb3IuLi5pbmAgYWxnb3JpdGhtLiBUaGVcclxuICAgICAgLy8gYHZhbHVlT2ZgIHByb3BlcnR5IGluaGVyaXRzIHRoZSBub24tZW51bWVyYWJsZSBmbGFnIGZyb21cclxuICAgICAgLy8gYE9iamVjdC5wcm90b3R5cGVgIGluIG9sZGVyIHZlcnNpb25zIG9mIElFLCBOZXRzY2FwZSwgYW5kIE1vemlsbGEuXHJcbiAgICAgIChQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHRoaXMudmFsdWVPZiA9IDA7XHJcbiAgICAgIH0pLnByb3RvdHlwZS52YWx1ZU9mID0gMDtcclxuXHJcbiAgICAgIC8vIEl0ZXJhdGUgb3ZlciBhIG5ldyBpbnN0YW5jZSBvZiB0aGUgYFByb3BlcnRpZXNgIGNsYXNzLlxyXG4gICAgICBtZW1iZXJzID0gbmV3IFByb3BlcnRpZXMoKTtcclxuICAgICAgZm9yIChwcm9wZXJ0eSBpbiBtZW1iZXJzKSB7XHJcbiAgICAgICAgLy8gSWdub3JlIGFsbCBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cclxuICAgICAgICBpZiAoaXNQcm9wZXJ0eS5jYWxsKG1lbWJlcnMsIHByb3BlcnR5KSkge1xyXG4gICAgICAgICAgc2l6ZSsrO1xyXG4gICAgICAgIH1cclxuICAgICAgfVxyXG4gICAgICBQcm9wZXJ0aWVzID0gbWVtYmVycyA9IG51bGw7XHJcblxyXG4gICAgICAvLyBOb3JtYWxpemUgdGhlIGl0ZXJhdGlvbiBhbGdvcml0aG0uXHJcbiAgICAgIGlmICghc2l6ZSkge1xyXG4gICAgICAgIC8vIEEgbGlzdCBvZiBub24tZW51bWVyYWJsZSBwcm9wZXJ0aWVzIGluaGVyaXRlZCBmcm9tIGBPYmplY3QucHJvdG90eXBlYC5cclxuICAgICAgICBtZW1iZXJzID0gW1widmFsdWVPZlwiLCBcInRvU3RyaW5nXCIsIFwidG9Mb2NhbGVTdHJpbmdcIiwgXCJwcm9wZXJ0eUlzRW51bWVyYWJsZVwiLCBcImlzUHJvdG90eXBlT2ZcIiwgXCJoYXNPd25Qcm9wZXJ0eVwiLCBcImNvbnN0cnVjdG9yXCJdO1xyXG4gICAgICAgIC8vIElFIDw9IDgsIE1vemlsbGEgMS4wLCBhbmQgTmV0c2NhcGUgNi4yIGlnbm9yZSBzaGFkb3dlZCBub24tZW51bWVyYWJsZVxyXG4gICAgICAgIC8vIHByb3BlcnRpZXMuXHJcbiAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICB2YXIgaXNGdW5jdGlvbiA9IGdldENsYXNzLmNhbGwob2JqZWN0KSA9PSBmdW5jdGlvbkNsYXNzLCBwcm9wZXJ0eSwgbGVuZ3RoO1xyXG4gICAgICAgICAgdmFyIGhhc1Byb3BlcnR5ID0gIWlzRnVuY3Rpb24gJiYgdHlwZW9mIG9iamVjdC5jb25zdHJ1Y3RvciAhPSAnZnVuY3Rpb24nICYmIGlzSG9zdFR5cGUob2JqZWN0LCAnaGFzT3duUHJvcGVydHknKSA/IG9iamVjdC5oYXNPd25Qcm9wZXJ0eSA6IGlzUHJvcGVydHk7XHJcbiAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xyXG4gICAgICAgICAgICAvLyBHZWNrbyA8PSAxLjAgZW51bWVyYXRlcyB0aGUgYHByb3RvdHlwZWAgcHJvcGVydHkgb2YgZnVuY3Rpb25zIHVuZGVyXHJcbiAgICAgICAgICAgIC8vIGNlcnRhaW4gY29uZGl0aW9uczsgSUUgZG9lcyBub3QuXHJcbiAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgaGFzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSkge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgZWFjaCBub24tZW51bWVyYWJsZSBwcm9wZXJ0eS5cclxuICAgICAgICAgIGZvciAobGVuZ3RoID0gbWVtYmVycy5sZW5ndGg7IHByb3BlcnR5ID0gbWVtYmVyc1stLWxlbmd0aF07IGhhc1Byb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSkgJiYgY2FsbGJhY2socHJvcGVydHkpKTtcclxuICAgICAgICB9O1xyXG4gICAgICB9IGVsc2UgaWYgKHNpemUgPT0gMikge1xyXG4gICAgICAgIC8vIFNhZmFyaSA8PSAyLjAuNCBlbnVtZXJhdGVzIHNoYWRvd2VkIHByb3BlcnRpZXMgdHdpY2UuXHJcbiAgICAgICAgZm9yRWFjaCA9IGZ1bmN0aW9uIChvYmplY3QsIGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAvLyBDcmVhdGUgYSBzZXQgb2YgaXRlcmF0ZWQgcHJvcGVydGllcy5cclxuICAgICAgICAgIHZhciBtZW1iZXJzID0ge30sIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHk7XHJcbiAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xyXG4gICAgICAgICAgICAvLyBTdG9yZSBlYWNoIHByb3BlcnR5IG5hbWUgdG8gcHJldmVudCBkb3VibGUgZW51bWVyYXRpb24uIFRoZVxyXG4gICAgICAgICAgICAvLyBgcHJvdG90eXBlYCBwcm9wZXJ0eSBvZiBmdW5jdGlvbnMgaXMgbm90IGVudW1lcmF0ZWQgZHVlIHRvIGNyb3NzLVxyXG4gICAgICAgICAgICAvLyBlbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXHJcbiAgICAgICAgICAgIGlmICghKGlzRnVuY3Rpb24gJiYgcHJvcGVydHkgPT0gXCJwcm90b3R5cGVcIikgJiYgIWlzUHJvcGVydHkuY2FsbChtZW1iZXJzLCBwcm9wZXJ0eSkgJiYgKG1lbWJlcnNbcHJvcGVydHldID0gMSkgJiYgaXNQcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpKSB7XHJcbiAgICAgICAgICAgICAgY2FsbGJhY2socHJvcGVydHkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgfSBlbHNlIHtcclxuICAgICAgICAvLyBObyBidWdzIGRldGVjdGVkOyB1c2UgdGhlIHN0YW5kYXJkIGBmb3IuLi5pbmAgYWxnb3JpdGhtLlxyXG4gICAgICAgIGZvckVhY2ggPSBmdW5jdGlvbiAob2JqZWN0LCBjYWxsYmFjaykge1xyXG4gICAgICAgICAgdmFyIGlzRnVuY3Rpb24gPSBnZXRDbGFzcy5jYWxsKG9iamVjdCkgPT0gZnVuY3Rpb25DbGFzcywgcHJvcGVydHksIGlzQ29uc3RydWN0b3I7XHJcbiAgICAgICAgICBmb3IgKHByb3BlcnR5IGluIG9iamVjdCkge1xyXG4gICAgICAgICAgICBpZiAoIShpc0Z1bmN0aW9uICYmIHByb3BlcnR5ID09IFwicHJvdG90eXBlXCIpICYmIGlzUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KSAmJiAhKGlzQ29uc3RydWN0b3IgPSBwcm9wZXJ0eSA9PT0gXCJjb25zdHJ1Y3RvclwiKSkge1xyXG4gICAgICAgICAgICAgIGNhbGxiYWNrKHByb3BlcnR5KTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gTWFudWFsbHkgaW52b2tlIHRoZSBjYWxsYmFjayBmb3IgdGhlIGBjb25zdHJ1Y3RvcmAgcHJvcGVydHkgZHVlIHRvXHJcbiAgICAgICAgICAvLyBjcm9zcy1lbnZpcm9ubWVudCBpbmNvbnNpc3RlbmNpZXMuXHJcbiAgICAgICAgICBpZiAoaXNDb25zdHJ1Y3RvciB8fCBpc1Byb3BlcnR5LmNhbGwob2JqZWN0LCAocHJvcGVydHkgPSBcImNvbnN0cnVjdG9yXCIpKSkge1xyXG4gICAgICAgICAgICBjYWxsYmFjayhwcm9wZXJ0eSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfTtcclxuICAgICAgfVxyXG4gICAgICByZXR1cm4gZm9yRWFjaChvYmplY3QsIGNhbGxiYWNrKTtcclxuICAgIH07XHJcblxyXG4gICAgLy8gUHVibGljOiBTZXJpYWxpemVzIGEgSmF2YVNjcmlwdCBgdmFsdWVgIGFzIGEgSlNPTiBzdHJpbmcuIFRoZSBvcHRpb25hbFxyXG4gICAgLy8gYGZpbHRlcmAgYXJndW1lbnQgbWF5IHNwZWNpZnkgZWl0aGVyIGEgZnVuY3Rpb24gdGhhdCBhbHRlcnMgaG93IG9iamVjdCBhbmRcclxuICAgIC8vIGFycmF5IG1lbWJlcnMgYXJlIHNlcmlhbGl6ZWQsIG9yIGFuIGFycmF5IG9mIHN0cmluZ3MgYW5kIG51bWJlcnMgdGhhdFxyXG4gICAgLy8gaW5kaWNhdGVzIHdoaWNoIHByb3BlcnRpZXMgc2hvdWxkIGJlIHNlcmlhbGl6ZWQuIFRoZSBvcHRpb25hbCBgd2lkdGhgXHJcbiAgICAvLyBhcmd1bWVudCBtYXkgYmUgZWl0aGVyIGEgc3RyaW5nIG9yIG51bWJlciB0aGF0IHNwZWNpZmllcyB0aGUgaW5kZW50YXRpb25cclxuICAgIC8vIGxldmVsIG9mIHRoZSBvdXRwdXQuXHJcbiAgICBpZiAoIWhhcyhcImpzb24tc3RyaW5naWZ5XCIpKSB7XHJcbiAgICAgIC8vIEludGVybmFsOiBBIG1hcCBvZiBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIGVzY2FwZWQgZXF1aXZhbGVudHMuXHJcbiAgICAgIHZhciBFc2NhcGVzID0ge1xyXG4gICAgICAgIDkyOiBcIlxcXFxcXFxcXCIsXHJcbiAgICAgICAgMzQ6ICdcXFxcXCInLFxyXG4gICAgICAgIDg6IFwiXFxcXGJcIixcclxuICAgICAgICAxMjogXCJcXFxcZlwiLFxyXG4gICAgICAgIDEwOiBcIlxcXFxuXCIsXHJcbiAgICAgICAgMTM6IFwiXFxcXHJcIixcclxuICAgICAgICA5OiBcIlxcXFx0XCJcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIEludGVybmFsOiBDb252ZXJ0cyBgdmFsdWVgIGludG8gYSB6ZXJvLXBhZGRlZCBzdHJpbmcgc3VjaCB0aGF0IGl0c1xyXG4gICAgICAvLyBsZW5ndGggaXMgYXQgbGVhc3QgZXF1YWwgdG8gYHdpZHRoYC4gVGhlIGB3aWR0aGAgbXVzdCBiZSA8PSA2LlxyXG4gICAgICB2YXIgbGVhZGluZ1plcm9lcyA9IFwiMDAwMDAwXCI7XHJcbiAgICAgIHZhciB0b1BhZGRlZFN0cmluZyA9IGZ1bmN0aW9uICh3aWR0aCwgdmFsdWUpIHtcclxuICAgICAgICAvLyBUaGUgYHx8IDBgIGV4cHJlc3Npb24gaXMgbmVjZXNzYXJ5IHRvIHdvcmsgYXJvdW5kIGEgYnVnIGluXHJcbiAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIHdoZXJlIGAwID09IC0wYCwgYnV0IGBTdHJpbmcoLTApICE9PSBcIjBcImAuXHJcbiAgICAgICAgcmV0dXJuIChsZWFkaW5nWmVyb2VzICsgKHZhbHVlIHx8IDApKS5zbGljZSgtd2lkdGgpO1xyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gSW50ZXJuYWw6IERvdWJsZS1xdW90ZXMgYSBzdHJpbmcgYHZhbHVlYCwgcmVwbGFjaW5nIGFsbCBBU0NJSSBjb250cm9sXHJcbiAgICAgIC8vIGNoYXJhY3RlcnMgKGNoYXJhY3RlcnMgd2l0aCBjb2RlIHVuaXQgdmFsdWVzIGJldHdlZW4gMCBhbmQgMzEpIHdpdGhcclxuICAgICAgLy8gdGhlaXIgZXNjYXBlZCBlcXVpdmFsZW50cy4gVGhpcyBpcyBhbiBpbXBsZW1lbnRhdGlvbiBvZiB0aGVcclxuICAgICAgLy8gYFF1b3RlKHZhbHVlKWAgb3BlcmF0aW9uIGRlZmluZWQgaW4gRVMgNS4xIHNlY3Rpb24gMTUuMTIuMy5cclxuICAgICAgdmFyIHVuaWNvZGVQcmVmaXggPSBcIlxcXFx1MDBcIjtcclxuICAgICAgdmFyIHF1b3RlID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdCA9ICdcIicsIGluZGV4ID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoLCBpc0xhcmdlID0gbGVuZ3RoID4gMTAgJiYgY2hhckluZGV4QnVnZ3ksIHN5bWJvbHM7XHJcbiAgICAgICAgaWYgKGlzTGFyZ2UpIHtcclxuICAgICAgICAgIHN5bWJvbHMgPSB2YWx1ZS5zcGxpdChcIlwiKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZm9yICg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCsrKSB7XHJcbiAgICAgICAgICB2YXIgY2hhckNvZGUgPSB2YWx1ZS5jaGFyQ29kZUF0KGluZGV4KTtcclxuICAgICAgICAgIC8vIElmIHRoZSBjaGFyYWN0ZXIgaXMgYSBjb250cm9sIGNoYXJhY3RlciwgYXBwZW5kIGl0cyBVbmljb2RlIG9yXHJcbiAgICAgICAgICAvLyBzaG9ydGhhbmQgZXNjYXBlIHNlcXVlbmNlOyBvdGhlcndpc2UsIGFwcGVuZCB0aGUgY2hhcmFjdGVyIGFzLWlzLlxyXG4gICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xyXG4gICAgICAgICAgICBjYXNlIDg6IGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMjogY2FzZSAxMzogY2FzZSAzNDogY2FzZSA5MjpcclxuICAgICAgICAgICAgICByZXN1bHQgKz0gRXNjYXBlc1tjaGFyQ29kZV07XHJcbiAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIGRlZmF1bHQ6XHJcbiAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcclxuICAgICAgICAgICAgICAgIHJlc3VsdCArPSB1bmljb2RlUHJlZml4ICsgdG9QYWRkZWRTdHJpbmcoMiwgY2hhckNvZGUudG9TdHJpbmcoMTYpKTtcclxuICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICByZXN1bHQgKz0gaXNMYXJnZSA/IHN5bWJvbHNbaW5kZXhdIDogY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoaW5kZXgpIDogdmFsdWVbaW5kZXhdO1xyXG4gICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gcmVzdWx0ICsgJ1wiJztcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSBzZXJpYWxpemVzIGFuIG9iamVjdC4gSW1wbGVtZW50cyB0aGVcclxuICAgICAgLy8gYFN0cihrZXksIGhvbGRlcilgLCBgSk8odmFsdWUpYCwgYW5kIGBKQSh2YWx1ZSlgIG9wZXJhdGlvbnMuXHJcbiAgICAgIHZhciBzZXJpYWxpemUgPSBmdW5jdGlvbiAocHJvcGVydHksIG9iamVjdCwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIHdoaXRlc3BhY2UsIGluZGVudGF0aW9uLCBzdGFjaykge1xyXG4gICAgICAgIHZhciB2YWx1ZSwgY2xhc3NOYW1lLCB5ZWFyLCBtb250aCwgZGF0ZSwgdGltZSwgaG91cnMsIG1pbnV0ZXMsIHNlY29uZHMsIG1pbGxpc2Vjb25kcywgcmVzdWx0cywgZWxlbWVudCwgaW5kZXgsIGxlbmd0aCwgcHJlZml4LCByZXN1bHQ7XHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgIC8vIE5lY2Vzc2FyeSBmb3IgaG9zdCBvYmplY3Qgc3VwcG9ydC5cclxuICAgICAgICAgIHZhbHVlID0gb2JqZWN0W3Byb3BlcnR5XTtcclxuICAgICAgICB9IGNhdGNoIChleGNlcHRpb24pIHt9XHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiICYmIHZhbHVlKSB7XHJcbiAgICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcclxuICAgICAgICAgIGlmIChjbGFzc05hbWUgPT0gZGF0ZUNsYXNzICYmICFpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSB7XHJcbiAgICAgICAgICAgIGlmICh2YWx1ZSA+IC0xIC8gMCAmJiB2YWx1ZSA8IDEgLyAwKSB7XHJcbiAgICAgICAgICAgICAgLy8gRGF0ZXMgYXJlIHNlcmlhbGl6ZWQgYWNjb3JkaW5nIHRvIHRoZSBgRGF0ZSN0b0pTT05gIG1ldGhvZFxyXG4gICAgICAgICAgICAgIC8vIHNwZWNpZmllZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS45LjUuNDQuIFNlZSBzZWN0aW9uIDE1LjkuMS4xNVxyXG4gICAgICAgICAgICAgIC8vIGZvciB0aGUgSVNPIDg2MDEgZGF0ZSB0aW1lIHN0cmluZyBmb3JtYXQuXHJcbiAgICAgICAgICAgICAgaWYgKGdldERheSkge1xyXG4gICAgICAgICAgICAgICAgLy8gTWFudWFsbHkgY29tcHV0ZSB0aGUgeWVhciwgbW9udGgsIGRhdGUsIGhvdXJzLCBtaW51dGVzLFxyXG4gICAgICAgICAgICAgICAgLy8gc2Vjb25kcywgYW5kIG1pbGxpc2Vjb25kcyBpZiB0aGUgYGdldFVUQypgIG1ldGhvZHMgYXJlXHJcbiAgICAgICAgICAgICAgICAvLyBidWdneS4gQWRhcHRlZCBmcm9tIEBZYWZmbGUncyBgZGF0ZS1zaGltYCBwcm9qZWN0LlxyXG4gICAgICAgICAgICAgICAgZGF0ZSA9IGZsb29yKHZhbHVlIC8gODY0ZTUpO1xyXG4gICAgICAgICAgICAgICAgZm9yICh5ZWFyID0gZmxvb3IoZGF0ZSAvIDM2NS4yNDI1KSArIDE5NzAgLSAxOyBnZXREYXkoeWVhciArIDEsIDApIDw9IGRhdGU7IHllYXIrKyk7XHJcbiAgICAgICAgICAgICAgICBmb3IgKG1vbnRoID0gZmxvb3IoKGRhdGUgLSBnZXREYXkoeWVhciwgMCkpIC8gMzAuNDIpOyBnZXREYXkoeWVhciwgbW9udGggKyAxKSA8PSBkYXRlOyBtb250aCsrKTtcclxuICAgICAgICAgICAgICAgIGRhdGUgPSAxICsgZGF0ZSAtIGdldERheSh5ZWFyLCBtb250aCk7XHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgYHRpbWVgIHZhbHVlIHNwZWNpZmllcyB0aGUgdGltZSB3aXRoaW4gdGhlIGRheSAoc2VlIEVTXHJcbiAgICAgICAgICAgICAgICAvLyA1LjEgc2VjdGlvbiAxNS45LjEuMikuIFRoZSBmb3JtdWxhIGAoQSAlIEIgKyBCKSAlIEJgIGlzIHVzZWRcclxuICAgICAgICAgICAgICAgIC8vIHRvIGNvbXB1dGUgYEEgbW9kdWxvIEJgLCBhcyB0aGUgYCVgIG9wZXJhdG9yIGRvZXMgbm90XHJcbiAgICAgICAgICAgICAgICAvLyBjb3JyZXNwb25kIHRvIHRoZSBgbW9kdWxvYCBvcGVyYXRpb24gZm9yIG5lZ2F0aXZlIG51bWJlcnMuXHJcbiAgICAgICAgICAgICAgICB0aW1lID0gKHZhbHVlICUgODY0ZTUgKyA4NjRlNSkgJSA4NjRlNTtcclxuICAgICAgICAgICAgICAgIC8vIFRoZSBob3VycywgbWludXRlcywgc2Vjb25kcywgYW5kIG1pbGxpc2Vjb25kcyBhcmUgb2J0YWluZWQgYnlcclxuICAgICAgICAgICAgICAgIC8vIGRlY29tcG9zaW5nIHRoZSB0aW1lIHdpdGhpbiB0aGUgZGF5LiBTZWUgc2VjdGlvbiAxNS45LjEuMTAuXHJcbiAgICAgICAgICAgICAgICBob3VycyA9IGZsb29yKHRpbWUgLyAzNmU1KSAlIDI0O1xyXG4gICAgICAgICAgICAgICAgbWludXRlcyA9IGZsb29yKHRpbWUgLyA2ZTQpICUgNjA7XHJcbiAgICAgICAgICAgICAgICBzZWNvbmRzID0gZmxvb3IodGltZSAvIDFlMykgJSA2MDtcclxuICAgICAgICAgICAgICAgIG1pbGxpc2Vjb25kcyA9IHRpbWUgJSAxZTM7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHllYXIgPSB2YWx1ZS5nZXRVVENGdWxsWWVhcigpO1xyXG4gICAgICAgICAgICAgICAgbW9udGggPSB2YWx1ZS5nZXRVVENNb250aCgpO1xyXG4gICAgICAgICAgICAgICAgZGF0ZSA9IHZhbHVlLmdldFVUQ0RhdGUoKTtcclxuICAgICAgICAgICAgICAgIGhvdXJzID0gdmFsdWUuZ2V0VVRDSG91cnMoKTtcclxuICAgICAgICAgICAgICAgIG1pbnV0ZXMgPSB2YWx1ZS5nZXRVVENNaW51dGVzKCk7XHJcbiAgICAgICAgICAgICAgICBzZWNvbmRzID0gdmFsdWUuZ2V0VVRDU2Vjb25kcygpO1xyXG4gICAgICAgICAgICAgICAgbWlsbGlzZWNvbmRzID0gdmFsdWUuZ2V0VVRDTWlsbGlzZWNvbmRzKCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIFNlcmlhbGl6ZSBleHRlbmRlZCB5ZWFycyBjb3JyZWN0bHkuXHJcbiAgICAgICAgICAgICAgdmFsdWUgPSAoeWVhciA8PSAwIHx8IHllYXIgPj0gMWU0ID8gKHllYXIgPCAwID8gXCItXCIgOiBcIitcIikgKyB0b1BhZGRlZFN0cmluZyg2LCB5ZWFyIDwgMCA/IC15ZWFyIDogeWVhcikgOiB0b1BhZGRlZFN0cmluZyg0LCB5ZWFyKSkgK1xyXG4gICAgICAgICAgICAgICAgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBtb250aCArIDEpICsgXCItXCIgKyB0b1BhZGRlZFN0cmluZygyLCBkYXRlKSArXHJcbiAgICAgICAgICAgICAgICAvLyBNb250aHMsIGRhdGVzLCBob3VycywgbWludXRlcywgYW5kIHNlY29uZHMgc2hvdWxkIGhhdmUgdHdvXHJcbiAgICAgICAgICAgICAgICAvLyBkaWdpdHM7IG1pbGxpc2Vjb25kcyBzaG91bGQgaGF2ZSB0aHJlZS5cclxuICAgICAgICAgICAgICAgIFwiVFwiICsgdG9QYWRkZWRTdHJpbmcoMiwgaG91cnMpICsgXCI6XCIgKyB0b1BhZGRlZFN0cmluZygyLCBtaW51dGVzKSArIFwiOlwiICsgdG9QYWRkZWRTdHJpbmcoMiwgc2Vjb25kcykgK1xyXG4gICAgICAgICAgICAgICAgLy8gTWlsbGlzZWNvbmRzIGFyZSBvcHRpb25hbCBpbiBFUyA1LjAsIGJ1dCByZXF1aXJlZCBpbiA1LjEuXHJcbiAgICAgICAgICAgICAgICBcIi5cIiArIHRvUGFkZGVkU3RyaW5nKDMsIG1pbGxpc2Vjb25kcykgKyBcIlpcIjtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICB2YWx1ZSA9IG51bGw7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHZhbHVlLnRvSlNPTiA9PSBcImZ1bmN0aW9uXCIgJiYgKChjbGFzc05hbWUgIT0gbnVtYmVyQ2xhc3MgJiYgY2xhc3NOYW1lICE9IHN0cmluZ0NsYXNzICYmIGNsYXNzTmFtZSAhPSBhcnJheUNsYXNzKSB8fCBpc1Byb3BlcnR5LmNhbGwodmFsdWUsIFwidG9KU09OXCIpKSkge1xyXG4gICAgICAgICAgICAvLyBQcm90b3R5cGUgPD0gMS42LjEgYWRkcyBub24tc3RhbmRhcmQgYHRvSlNPTmAgbWV0aG9kcyB0byB0aGVcclxuICAgICAgICAgICAgLy8gYE51bWJlcmAsIGBTdHJpbmdgLCBgRGF0ZWAsIGFuZCBgQXJyYXlgIHByb3RvdHlwZXMuIEpTT04gM1xyXG4gICAgICAgICAgICAvLyBpZ25vcmVzIGFsbCBgdG9KU09OYCBtZXRob2RzIG9uIHRoZXNlIG9iamVjdHMgdW5sZXNzIHRoZXkgYXJlXHJcbiAgICAgICAgICAgIC8vIGRlZmluZWQgZGlyZWN0bHkgb24gYW4gaW5zdGFuY2UuXHJcbiAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudG9KU09OKHByb3BlcnR5KTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKGNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAvLyBJZiBhIHJlcGxhY2VtZW50IGZ1bmN0aW9uIHdhcyBwcm92aWRlZCwgY2FsbCBpdCB0byBvYnRhaW4gdGhlIHZhbHVlXHJcbiAgICAgICAgICAvLyBmb3Igc2VyaWFsaXphdGlvbi5cclxuICAgICAgICAgIHZhbHVlID0gY2FsbGJhY2suY2FsbChvYmplY3QsIHByb3BlcnR5LCB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh2YWx1ZSA9PT0gbnVsbCkge1xyXG4gICAgICAgICAgcmV0dXJuIFwibnVsbFwiO1xyXG4gICAgICAgIH1cclxuICAgICAgICBjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKTtcclxuICAgICAgICBpZiAoY2xhc3NOYW1lID09IGJvb2xlYW5DbGFzcykge1xyXG4gICAgICAgICAgLy8gQm9vbGVhbnMgYXJlIHJlcHJlc2VudGVkIGxpdGVyYWxseS5cclxuICAgICAgICAgIHJldHVybiBcIlwiICsgdmFsdWU7XHJcbiAgICAgICAgfSBlbHNlIGlmIChjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpIHtcclxuICAgICAgICAgIC8vIEpTT04gbnVtYmVycyBtdXN0IGJlIGZpbml0ZS4gYEluZmluaXR5YCBhbmQgYE5hTmAgYXJlIHNlcmlhbGl6ZWQgYXNcclxuICAgICAgICAgIC8vIGBcIm51bGxcImAuXHJcbiAgICAgICAgICByZXR1cm4gdmFsdWUgPiAtMSAvIDAgJiYgdmFsdWUgPCAxIC8gMCA/IFwiXCIgKyB2YWx1ZSA6IFwibnVsbFwiO1xyXG4gICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XHJcbiAgICAgICAgICAvLyBTdHJpbmdzIGFyZSBkb3VibGUtcXVvdGVkIGFuZCBlc2NhcGVkLlxyXG4gICAgICAgICAgcmV0dXJuIHF1b3RlKFwiXCIgKyB2YWx1ZSk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFJlY3Vyc2l2ZWx5IHNlcmlhbGl6ZSBvYmplY3RzIGFuZCBhcnJheXMuXHJcbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PSBcIm9iamVjdFwiKSB7XHJcbiAgICAgICAgICAvLyBDaGVjayBmb3IgY3ljbGljIHN0cnVjdHVyZXMuIFRoaXMgaXMgYSBsaW5lYXIgc2VhcmNoOyBwZXJmb3JtYW5jZVxyXG4gICAgICAgICAgLy8gaXMgaW52ZXJzZWx5IHByb3BvcnRpb25hbCB0byB0aGUgbnVtYmVyIG9mIHVuaXF1ZSBuZXN0ZWQgb2JqZWN0cy5cclxuICAgICAgICAgIGZvciAobGVuZ3RoID0gc3RhY2subGVuZ3RoOyBsZW5ndGgtLTspIHtcclxuICAgICAgICAgICAgaWYgKHN0YWNrW2xlbmd0aF0gPT09IHZhbHVlKSB7XHJcbiAgICAgICAgICAgICAgLy8gQ3ljbGljIHN0cnVjdHVyZXMgY2Fubm90IGJlIHNlcmlhbGl6ZWQgYnkgYEpTT04uc3RyaW5naWZ5YC5cclxuICAgICAgICAgICAgICB0aHJvdyBUeXBlRXJyb3IoKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgfVxyXG4gICAgICAgICAgLy8gQWRkIHRoZSBvYmplY3QgdG8gdGhlIHN0YWNrIG9mIHRyYXZlcnNlZCBvYmplY3RzLlxyXG4gICAgICAgICAgc3RhY2sucHVzaCh2YWx1ZSk7XHJcbiAgICAgICAgICByZXN1bHRzID0gW107XHJcbiAgICAgICAgICAvLyBTYXZlIHRoZSBjdXJyZW50IGluZGVudGF0aW9uIGxldmVsIGFuZCBpbmRlbnQgb25lIGFkZGl0aW9uYWwgbGV2ZWwuXHJcbiAgICAgICAgICBwcmVmaXggPSBpbmRlbnRhdGlvbjtcclxuICAgICAgICAgIGluZGVudGF0aW9uICs9IHdoaXRlc3BhY2U7XHJcbiAgICAgICAgICBpZiAoY2xhc3NOYW1lID09IGFycmF5Q2xhc3MpIHtcclxuICAgICAgICAgICAgLy8gUmVjdXJzaXZlbHkgc2VyaWFsaXplIGFycmF5IGVsZW1lbnRzLlxyXG4gICAgICAgICAgICBmb3IgKGluZGV4ID0gMCwgbGVuZ3RoID0gdmFsdWUubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXgrKykge1xyXG4gICAgICAgICAgICAgIGVsZW1lbnQgPSBzZXJpYWxpemUoaW5kZXgsIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKTtcclxuICAgICAgICAgICAgICByZXN1bHRzLnB1c2goZWxlbWVudCA9PT0gdW5kZWYgPyBcIm51bGxcIiA6IGVsZW1lbnQpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID8gKHdoaXRlc3BhY2UgPyBcIltcXG5cIiArIGluZGVudGF0aW9uICsgcmVzdWx0cy5qb2luKFwiLFxcblwiICsgaW5kZW50YXRpb24pICsgXCJcXG5cIiArIHByZWZpeCArIFwiXVwiIDogKFwiW1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwiXVwiKSkgOiBcIltdXCI7XHJcbiAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLyBSZWN1cnNpdmVseSBzZXJpYWxpemUgb2JqZWN0IG1lbWJlcnMuIE1lbWJlcnMgYXJlIHNlbGVjdGVkIGZyb21cclxuICAgICAgICAgICAgLy8gZWl0aGVyIGEgdXNlci1zcGVjaWZpZWQgbGlzdCBvZiBwcm9wZXJ0eSBuYW1lcywgb3IgdGhlIG9iamVjdFxyXG4gICAgICAgICAgICAvLyBpdHNlbGYuXHJcbiAgICAgICAgICAgIGZvckVhY2gocHJvcGVydGllcyB8fCB2YWx1ZSwgZnVuY3Rpb24gKHByb3BlcnR5KSB7XHJcbiAgICAgICAgICAgICAgdmFyIGVsZW1lbnQgPSBzZXJpYWxpemUocHJvcGVydHksIHZhbHVlLCBjYWxsYmFjaywgcHJvcGVydGllcywgd2hpdGVzcGFjZSwgaW5kZW50YXRpb24sIHN0YWNrKTtcclxuICAgICAgICAgICAgICBpZiAoZWxlbWVudCAhPT0gdW5kZWYpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFjY29yZGluZyB0byBFUyA1LjEgc2VjdGlvbiAxNS4xMi4zOiBcIklmIGBnYXBgIHt3aGl0ZXNwYWNlfVxyXG4gICAgICAgICAgICAgICAgLy8gaXMgbm90IHRoZSBlbXB0eSBzdHJpbmcsIGxldCBgbWVtYmVyYCB7cXVvdGUocHJvcGVydHkpICsgXCI6XCJ9XHJcbiAgICAgICAgICAgICAgICAvLyBiZSB0aGUgY29uY2F0ZW5hdGlvbiBvZiBgbWVtYmVyYCBhbmQgdGhlIGBzcGFjZWAgY2hhcmFjdGVyLlwiXHJcbiAgICAgICAgICAgICAgICAvLyBUaGUgXCJgc3BhY2VgIGNoYXJhY3RlclwiIHJlZmVycyB0byB0aGUgbGl0ZXJhbCBzcGFjZVxyXG4gICAgICAgICAgICAgICAgLy8gY2hhcmFjdGVyLCBub3QgdGhlIGBzcGFjZWAge3dpZHRofSBhcmd1bWVudCBwcm92aWRlZCB0b1xyXG4gICAgICAgICAgICAgICAgLy8gYEpTT04uc3RyaW5naWZ5YC5cclxuICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChxdW90ZShwcm9wZXJ0eSkgKyBcIjpcIiArICh3aGl0ZXNwYWNlID8gXCIgXCIgOiBcIlwiKSArIGVsZW1lbnQpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgIHJlc3VsdCA9IHJlc3VsdHMubGVuZ3RoID8gKHdoaXRlc3BhY2UgPyBcIntcXG5cIiArIGluZGVudGF0aW9uICsgcmVzdWx0cy5qb2luKFwiLFxcblwiICsgaW5kZW50YXRpb24pICsgXCJcXG5cIiArIHByZWZpeCArIFwifVwiIDogKFwie1wiICsgcmVzdWx0cy5qb2luKFwiLFwiKSArIFwifVwiKSkgOiBcInt9XCI7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgICAvLyBSZW1vdmUgdGhlIG9iamVjdCBmcm9tIHRoZSB0cmF2ZXJzZWQgb2JqZWN0IHN0YWNrLlxyXG4gICAgICAgICAgc3RhY2sucG9wKCk7XHJcbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIFB1YmxpYzogYEpTT04uc3RyaW5naWZ5YC4gU2VlIEVTIDUuMSBzZWN0aW9uIDE1LjEyLjMuXHJcbiAgICAgIEpTT04zLnN0cmluZ2lmeSA9IGZ1bmN0aW9uIChzb3VyY2UsIGZpbHRlciwgd2lkdGgpIHtcclxuICAgICAgICB2YXIgd2hpdGVzcGFjZSwgY2FsbGJhY2ssIHByb3BlcnRpZXMsIGNsYXNzTmFtZTtcclxuICAgICAgICBpZiAodHlwZW9mIGZpbHRlciA9PSBcImZ1bmN0aW9uXCIgfHwgdHlwZW9mIGZpbHRlciA9PSBcIm9iamVjdFwiICYmIGZpbHRlcikge1xyXG4gICAgICAgICAgaWYgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKGZpbHRlcikpID09IGZ1bmN0aW9uQ2xhc3MpIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sgPSBmaWx0ZXI7XHJcbiAgICAgICAgICB9IGVsc2UgaWYgKGNsYXNzTmFtZSA9PSBhcnJheUNsYXNzKSB7XHJcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIHByb3BlcnR5IG5hbWVzIGFycmF5IGludG8gYSBtYWtlc2hpZnQgc2V0LlxyXG4gICAgICAgICAgICBwcm9wZXJ0aWVzID0ge307XHJcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMCwgbGVuZ3RoID0gZmlsdGVyLmxlbmd0aCwgdmFsdWU7IGluZGV4IDwgbGVuZ3RoOyB2YWx1ZSA9IGZpbHRlcltpbmRleCsrXSwgKChjbGFzc05hbWUgPSBnZXRDbGFzcy5jYWxsKHZhbHVlKSksIGNsYXNzTmFtZSA9PSBzdHJpbmdDbGFzcyB8fCBjbGFzc05hbWUgPT0gbnVtYmVyQ2xhc3MpICYmIChwcm9wZXJ0aWVzW3ZhbHVlXSA9IDEpKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKHdpZHRoKSB7XHJcbiAgICAgICAgICBpZiAoKGNsYXNzTmFtZSA9IGdldENsYXNzLmNhbGwod2lkdGgpKSA9PSBudW1iZXJDbGFzcykge1xyXG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBgd2lkdGhgIHRvIGFuIGludGVnZXIgYW5kIGNyZWF0ZSBhIHN0cmluZyBjb250YWluaW5nXHJcbiAgICAgICAgICAgIC8vIGB3aWR0aGAgbnVtYmVyIG9mIHNwYWNlIGNoYXJhY3RlcnMuXHJcbiAgICAgICAgICAgIGlmICgod2lkdGggLT0gd2lkdGggJSAxKSA+IDApIHtcclxuICAgICAgICAgICAgICBmb3IgKHdoaXRlc3BhY2UgPSBcIlwiLCB3aWR0aCA+IDEwICYmICh3aWR0aCA9IDEwKTsgd2hpdGVzcGFjZS5sZW5ndGggPCB3aWR0aDsgd2hpdGVzcGFjZSArPSBcIiBcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSBpZiAoY2xhc3NOYW1lID09IHN0cmluZ0NsYXNzKSB7XHJcbiAgICAgICAgICAgIHdoaXRlc3BhY2UgPSB3aWR0aC5sZW5ndGggPD0gMTAgPyB3aWR0aCA6IHdpZHRoLnNsaWNlKDAsIDEwKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gT3BlcmEgPD0gNy41NHUyIGRpc2NhcmRzIHRoZSB2YWx1ZXMgYXNzb2NpYXRlZCB3aXRoIGVtcHR5IHN0cmluZyBrZXlzXHJcbiAgICAgICAgLy8gKGBcIlwiYCkgb25seSBpZiB0aGV5IGFyZSB1c2VkIGRpcmVjdGx5IHdpdGhpbiBhbiBvYmplY3QgbWVtYmVyIGxpc3RcclxuICAgICAgICAvLyAoZS5nLiwgYCEoXCJcIiBpbiB7IFwiXCI6IDF9KWApLlxyXG4gICAgICAgIHJldHVybiBzZXJpYWxpemUoXCJcIiwgKHZhbHVlID0ge30sIHZhbHVlW1wiXCJdID0gc291cmNlLCB2YWx1ZSksIGNhbGxiYWNrLCBwcm9wZXJ0aWVzLCB3aGl0ZXNwYWNlLCBcIlwiLCBbXSk7XHJcbiAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgLy8gUHVibGljOiBQYXJzZXMgYSBKU09OIHNvdXJjZSBzdHJpbmcuXHJcbiAgICBpZiAoIWhhcyhcImpzb24tcGFyc2VcIikpIHtcclxuICAgICAgdmFyIGZyb21DaGFyQ29kZSA9IFN0cmluZy5mcm9tQ2hhckNvZGU7XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogQSBtYXAgb2YgZXNjYXBlZCBjb250cm9sIGNoYXJhY3RlcnMgYW5kIHRoZWlyIHVuZXNjYXBlZFxyXG4gICAgICAvLyBlcXVpdmFsZW50cy5cclxuICAgICAgdmFyIFVuZXNjYXBlcyA9IHtcclxuICAgICAgICA5MjogXCJcXFxcXCIsXHJcbiAgICAgICAgMzQ6ICdcIicsXHJcbiAgICAgICAgNDc6IFwiL1wiLFxyXG4gICAgICAgIDk4OiBcIlxcYlwiLFxyXG4gICAgICAgIDExNjogXCJcXHRcIixcclxuICAgICAgICAxMTA6IFwiXFxuXCIsXHJcbiAgICAgICAgMTAyOiBcIlxcZlwiLFxyXG4gICAgICAgIDExNDogXCJcXHJcIlxyXG4gICAgICB9O1xyXG5cclxuICAgICAgLy8gSW50ZXJuYWw6IFN0b3JlcyB0aGUgcGFyc2VyIHN0YXRlLlxyXG4gICAgICB2YXIgSW5kZXgsIFNvdXJjZTtcclxuXHJcbiAgICAgIC8vIEludGVybmFsOiBSZXNldHMgdGhlIHBhcnNlciBzdGF0ZSBhbmQgdGhyb3dzIGEgYFN5bnRheEVycm9yYC5cclxuICAgICAgdmFyIGFib3J0ID0gZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgSW5kZXggPSBTb3VyY2UgPSBudWxsO1xyXG4gICAgICAgIHRocm93IFN5bnRheEVycm9yKCk7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogUmV0dXJucyB0aGUgbmV4dCB0b2tlbiwgb3IgYFwiJFwiYCBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkXHJcbiAgICAgIC8vIHRoZSBlbmQgb2YgdGhlIHNvdXJjZSBzdHJpbmcuIEEgdG9rZW4gbWF5IGJlIGEgc3RyaW5nLCBudW1iZXIsIGBudWxsYFxyXG4gICAgICAvLyBsaXRlcmFsLCBvciBCb29sZWFuIGxpdGVyYWwuXHJcbiAgICAgIHZhciBsZXggPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdmFyIHNvdXJjZSA9IFNvdXJjZSwgbGVuZ3RoID0gc291cmNlLmxlbmd0aCwgdmFsdWUsIGJlZ2luLCBwb3NpdGlvbiwgaXNTaWduZWQsIGNoYXJDb2RlO1xyXG4gICAgICAgIHdoaWxlIChJbmRleCA8IGxlbmd0aCkge1xyXG4gICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCk7XHJcbiAgICAgICAgICBzd2l0Y2ggKGNoYXJDb2RlKSB7XHJcbiAgICAgICAgICAgIGNhc2UgOTogY2FzZSAxMDogY2FzZSAxMzogY2FzZSAzMjpcclxuICAgICAgICAgICAgICAvLyBTa2lwIHdoaXRlc3BhY2UgdG9rZW5zLCBpbmNsdWRpbmcgdGFicywgY2FycmlhZ2UgcmV0dXJucywgbGluZVxyXG4gICAgICAgICAgICAgIC8vIGZlZWRzLCBhbmQgc3BhY2UgY2hhcmFjdGVycy5cclxuICAgICAgICAgICAgICBJbmRleCsrO1xyXG4gICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICBjYXNlIDEyMzogY2FzZSAxMjU6IGNhc2UgOTE6IGNhc2UgOTM6IGNhc2UgNTg6IGNhc2UgNDQ6XHJcbiAgICAgICAgICAgICAgLy8gUGFyc2UgYSBwdW5jdHVhdG9yIHRva2VuIChge2AsIGB9YCwgYFtgLCBgXWAsIGA6YCwgb3IgYCxgKSBhdFxyXG4gICAgICAgICAgICAgIC8vIHRoZSBjdXJyZW50IHBvc2l0aW9uLlxyXG4gICAgICAgICAgICAgIHZhbHVlID0gY2hhckluZGV4QnVnZ3kgPyBzb3VyY2UuY2hhckF0KEluZGV4KSA6IHNvdXJjZVtJbmRleF07XHJcbiAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgICAgICAgIGNhc2UgMzQ6XHJcbiAgICAgICAgICAgICAgLy8gYFwiYCBkZWxpbWl0cyBhIEpTT04gc3RyaW5nOyBhZHZhbmNlIHRvIHRoZSBuZXh0IGNoYXJhY3RlciBhbmRcclxuICAgICAgICAgICAgICAvLyBiZWdpbiBwYXJzaW5nIHRoZSBzdHJpbmcuIFN0cmluZyB0b2tlbnMgYXJlIHByZWZpeGVkIHdpdGggdGhlXHJcbiAgICAgICAgICAgICAgLy8gc2VudGluZWwgYEBgIGNoYXJhY3RlciB0byBkaXN0aW5ndWlzaCB0aGVtIGZyb20gcHVuY3R1YXRvcnMgYW5kXHJcbiAgICAgICAgICAgICAgLy8gZW5kLW9mLXN0cmluZyB0b2tlbnMuXHJcbiAgICAgICAgICAgICAgZm9yICh2YWx1ZSA9IFwiQFwiLCBJbmRleCsrOyBJbmRleCA8IGxlbmd0aDspIHtcclxuICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlIDwgMzIpIHtcclxuICAgICAgICAgICAgICAgICAgLy8gVW5lc2NhcGVkIEFTQ0lJIGNvbnRyb2wgY2hhcmFjdGVycyAodGhvc2Ugd2l0aCBhIGNvZGUgdW5pdFxyXG4gICAgICAgICAgICAgICAgICAvLyBsZXNzIHRoYW4gdGhlIHNwYWNlIGNoYXJhY3RlcikgYXJlIG5vdCBwZXJtaXR0ZWQuXHJcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKGNoYXJDb2RlID09IDkyKSB7XHJcbiAgICAgICAgICAgICAgICAgIC8vIEEgcmV2ZXJzZSBzb2xpZHVzIChgXFxgKSBtYXJrcyB0aGUgYmVnaW5uaW5nIG9mIGFuIGVzY2FwZWRcclxuICAgICAgICAgICAgICAgICAgLy8gY29udHJvbCBjaGFyYWN0ZXIgKGluY2x1ZGluZyBgXCJgLCBgXFxgLCBhbmQgYC9gKSBvciBVbmljb2RlXHJcbiAgICAgICAgICAgICAgICAgIC8vIGVzY2FwZSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcclxuICAgICAgICAgICAgICAgICAgc3dpdGNoIChjaGFyQ29kZSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNhc2UgOTI6IGNhc2UgMzQ6IGNhc2UgNDc6IGNhc2UgOTg6IGNhc2UgMTE2OiBjYXNlIDExMDogY2FzZSAxMDI6IGNhc2UgMTE0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIGVzY2FwZWQgY29udHJvbCBjaGFyYWN0ZXJzLlxyXG4gICAgICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gVW5lc2NhcGVzW2NoYXJDb2RlXTtcclxuICAgICAgICAgICAgICAgICAgICAgIEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBjYXNlIDExNzpcclxuICAgICAgICAgICAgICAgICAgICAgIC8vIGBcXHVgIG1hcmtzIHRoZSBiZWdpbm5pbmcgb2YgYSBVbmljb2RlIGVzY2FwZSBzZXF1ZW5jZS5cclxuICAgICAgICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIGZpcnN0IGNoYXJhY3RlciBhbmQgdmFsaWRhdGUgdGhlXHJcbiAgICAgICAgICAgICAgICAgICAgICAvLyBmb3VyLWRpZ2l0IGNvZGUgcG9pbnQuXHJcbiAgICAgICAgICAgICAgICAgICAgICBiZWdpbiA9ICsrSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXggKyA0OyBJbmRleCA8IHBvc2l0aW9uOyBJbmRleCsrKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBBIHZhbGlkIHNlcXVlbmNlIGNvbXByaXNlcyBmb3VyIGhleGRpZ2l0cyAoY2FzZS1cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaW5zZW5zaXRpdmUpIHRoYXQgZm9ybSBhIHNpbmdsZSBoZXhhZGVjaW1hbCB2YWx1ZS5cclxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCEoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcgfHwgY2hhckNvZGUgPj0gOTcgJiYgY2hhckNvZGUgPD0gMTAyIHx8IGNoYXJDb2RlID49IDY1ICYmIGNoYXJDb2RlIDw9IDcwKSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEludmFsaWQgVW5pY29kZSBlc2NhcGUgc2VxdWVuY2UuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gUmV2aXZlIHRoZSBlc2NhcGVkIGNoYXJhY3Rlci5cclxuICAgICAgICAgICAgICAgICAgICAgIHZhbHVlICs9IGZyb21DaGFyQ29kZShcIjB4XCIgKyBzb3VyY2Uuc2xpY2UoYmVnaW4sIEluZGV4KSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSW52YWxpZCBlc2NhcGUgc2VxdWVuY2UuXHJcbiAgICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPT0gMzQpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBBbiB1bmVzY2FwZWQgZG91YmxlLXF1b3RlIGNoYXJhY3RlciBtYXJrcyB0aGUgZW5kIG9mIHRoZVxyXG4gICAgICAgICAgICAgICAgICAgIC8vIHN0cmluZy5cclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KTtcclxuICAgICAgICAgICAgICAgICAgYmVnaW4gPSBJbmRleDtcclxuICAgICAgICAgICAgICAgICAgLy8gT3B0aW1pemUgZm9yIHRoZSBjb21tb24gY2FzZSB3aGVyZSBhIHN0cmluZyBpcyB2YWxpZC5cclxuICAgICAgICAgICAgICAgICAgd2hpbGUgKGNoYXJDb2RlID49IDMyICYmIGNoYXJDb2RlICE9IDkyICYmIGNoYXJDb2RlICE9IDM0KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAvLyBBcHBlbmQgdGhlIHN0cmluZyBhcy1pcy5cclxuICAgICAgICAgICAgICAgICAgdmFsdWUgKz0gc291cmNlLnNsaWNlKGJlZ2luLCBJbmRleCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIGlmIChzb3VyY2UuY2hhckNvZGVBdChJbmRleCkgPT0gMzQpIHtcclxuICAgICAgICAgICAgICAgIC8vIEFkdmFuY2UgdG8gdGhlIG5leHQgY2hhcmFjdGVyIGFuZCByZXR1cm4gdGhlIHJldml2ZWQgc3RyaW5nLlxyXG4gICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gVW50ZXJtaW5hdGVkIHN0cmluZy5cclxuICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgIC8vIFBhcnNlIG51bWJlcnMgYW5kIGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgIGJlZ2luID0gSW5kZXg7XHJcbiAgICAgICAgICAgICAgLy8gQWR2YW5jZSBwYXN0IHRoZSBuZWdhdGl2ZSBzaWduLCBpZiBvbmUgaXMgc3BlY2lmaWVkLlxyXG4gICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0NSkge1xyXG4gICAgICAgICAgICAgICAgaXNTaWduZWQgPSB0cnVlO1xyXG4gICAgICAgICAgICAgICAgY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdCgrK0luZGV4KTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gUGFyc2UgYW4gaW50ZWdlciBvciBmbG9hdGluZy1wb2ludCB2YWx1ZS5cclxuICAgICAgICAgICAgICBpZiAoY2hhckNvZGUgPj0gNDggJiYgY2hhckNvZGUgPD0gNTcpIHtcclxuICAgICAgICAgICAgICAgIC8vIExlYWRpbmcgemVyb2VzIGFyZSBpbnRlcnByZXRlZCBhcyBvY3RhbCBsaXRlcmFscy5cclxuICAgICAgICAgICAgICAgIGlmIChjaGFyQ29kZSA9PSA0OCAmJiAoKGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXggKyAxKSksIGNoYXJDb2RlID49IDQ4ICYmIGNoYXJDb2RlIDw9IDU3KSkge1xyXG4gICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIG9jdGFsIGxpdGVyYWwuXHJcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBpc1NpZ25lZCA9IGZhbHNlO1xyXG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgdGhlIGludGVnZXIgY29tcG9uZW50LlxyXG4gICAgICAgICAgICAgICAgZm9yICg7IEluZGV4IDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChJbmRleCkpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IEluZGV4KyspO1xyXG4gICAgICAgICAgICAgICAgLy8gRmxvYXRzIGNhbm5vdCBjb250YWluIGEgbGVhZGluZyBkZWNpbWFsIHBvaW50OyBob3dldmVyLCB0aGlzXHJcbiAgICAgICAgICAgICAgICAvLyBjYXNlIGlzIGFscmVhZHkgYWNjb3VudGVkIGZvciBieSB0aGUgcGFyc2VyLlxyXG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZS5jaGFyQ29kZUF0KEluZGV4KSA9PSA0Nikge1xyXG4gICAgICAgICAgICAgICAgICBwb3NpdGlvbiA9ICsrSW5kZXg7XHJcbiAgICAgICAgICAgICAgICAgIC8vIFBhcnNlIHRoZSBkZWNpbWFsIGNvbXBvbmVudC5cclxuICAgICAgICAgICAgICAgICAgZm9yICg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xyXG4gICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIHRyYWlsaW5nIGRlY2ltYWwuXHJcbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICBJbmRleCA9IHBvc2l0aW9uO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgLy8gUGFyc2UgZXhwb25lbnRzLiBUaGUgYGVgIGRlbm90aW5nIHRoZSBleHBvbmVudCBpc1xyXG4gICAgICAgICAgICAgICAgLy8gY2FzZS1pbnNlbnNpdGl2ZS5cclxuICAgICAgICAgICAgICAgIGNoYXJDb2RlID0gc291cmNlLmNoYXJDb2RlQXQoSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDEwMSB8fCBjaGFyQ29kZSA9PSA2OSkge1xyXG4gICAgICAgICAgICAgICAgICBjaGFyQ29kZSA9IHNvdXJjZS5jaGFyQ29kZUF0KCsrSW5kZXgpO1xyXG4gICAgICAgICAgICAgICAgICAvLyBTa2lwIHBhc3QgdGhlIHNpZ24gZm9sbG93aW5nIHRoZSBleHBvbmVudCwgaWYgb25lIGlzXHJcbiAgICAgICAgICAgICAgICAgIC8vIHNwZWNpZmllZC5cclxuICAgICAgICAgICAgICAgICAgaWYgKGNoYXJDb2RlID09IDQzIHx8IGNoYXJDb2RlID09IDQ1KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgSW5kZXgrKztcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAvLyBQYXJzZSB0aGUgZXhwb25lbnRpYWwgY29tcG9uZW50LlxyXG4gICAgICAgICAgICAgICAgICBmb3IgKHBvc2l0aW9uID0gSW5kZXg7IHBvc2l0aW9uIDwgbGVuZ3RoICYmICgoY2hhckNvZGUgPSBzb3VyY2UuY2hhckNvZGVBdChwb3NpdGlvbikpLCBjaGFyQ29kZSA+PSA0OCAmJiBjaGFyQ29kZSA8PSA1Nyk7IHBvc2l0aW9uKyspO1xyXG4gICAgICAgICAgICAgICAgICBpZiAocG9zaXRpb24gPT0gSW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICAvLyBJbGxlZ2FsIGVtcHR5IGV4cG9uZW50LlxyXG4gICAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgSW5kZXggPSBwb3NpdGlvbjtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIC8vIENvZXJjZSB0aGUgcGFyc2VkIHZhbHVlIHRvIGEgSmF2YVNjcmlwdCBudW1iZXIuXHJcbiAgICAgICAgICAgICAgICByZXR1cm4gK3NvdXJjZS5zbGljZShiZWdpbiwgSW5kZXgpO1xyXG4gICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAvLyBBIG5lZ2F0aXZlIHNpZ24gbWF5IG9ubHkgcHJlY2VkZSBudW1iZXJzLlxyXG4gICAgICAgICAgICAgIGlmIChpc1NpZ25lZCkge1xyXG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gYHRydWVgLCBgZmFsc2VgLCBhbmQgYG51bGxgIGxpdGVyYWxzLlxyXG4gICAgICAgICAgICAgIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJ0cnVlXCIpIHtcclxuICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcclxuICAgICAgICAgICAgICB9IGVsc2UgaWYgKHNvdXJjZS5zbGljZShJbmRleCwgSW5kZXggKyA1KSA9PSBcImZhbHNlXCIpIHtcclxuICAgICAgICAgICAgICAgIEluZGV4ICs9IDU7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICAgICAgICAgICAgfSBlbHNlIGlmIChzb3VyY2Uuc2xpY2UoSW5kZXgsIEluZGV4ICsgNCkgPT0gXCJudWxsXCIpIHtcclxuICAgICAgICAgICAgICAgIEluZGV4ICs9IDQ7XHJcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gVW5yZWNvZ25pemVkIHRva2VuLlxyXG4gICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIC8vIFJldHVybiB0aGUgc2VudGluZWwgYCRgIGNoYXJhY3RlciBpZiB0aGUgcGFyc2VyIGhhcyByZWFjaGVkIHRoZSBlbmRcclxuICAgICAgICAvLyBvZiB0aGUgc291cmNlIHN0cmluZy5cclxuICAgICAgICByZXR1cm4gXCIkXCI7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogUGFyc2VzIGEgSlNPTiBgdmFsdWVgIHRva2VuLlxyXG4gICAgICB2YXIgZ2V0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcbiAgICAgICAgdmFyIHJlc3VsdHMsIGhhc01lbWJlcnM7XHJcbiAgICAgICAgaWYgKHZhbHVlID09IFwiJFwiKSB7XHJcbiAgICAgICAgICAvLyBVbmV4cGVjdGVkIGVuZCBvZiBpbnB1dC5cclxuICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT0gXCJzdHJpbmdcIikge1xyXG4gICAgICAgICAgaWYgKChjaGFySW5kZXhCdWdneSA/IHZhbHVlLmNoYXJBdCgwKSA6IHZhbHVlWzBdKSA9PSBcIkBcIikge1xyXG4gICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNlbnRpbmVsIGBAYCBjaGFyYWN0ZXIuXHJcbiAgICAgICAgICAgIHJldHVybiB2YWx1ZS5zbGljZSgxKTtcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIFBhcnNlIG9iamVjdCBhbmQgYXJyYXkgbGl0ZXJhbHMuXHJcbiAgICAgICAgICBpZiAodmFsdWUgPT0gXCJbXCIpIHtcclxuICAgICAgICAgICAgLy8gUGFyc2VzIGEgSlNPTiBhcnJheSwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgYXJyYXkuXHJcbiAgICAgICAgICAgIHJlc3VsdHMgPSBbXTtcclxuICAgICAgICAgICAgZm9yICg7OyBoYXNNZW1iZXJzIHx8IChoYXNNZW1iZXJzID0gdHJ1ZSkpIHtcclxuICAgICAgICAgICAgICB2YWx1ZSA9IGxleCgpO1xyXG4gICAgICAgICAgICAgIC8vIEEgY2xvc2luZyBzcXVhcmUgYnJhY2tldCBtYXJrcyB0aGUgZW5kIG9mIHRoZSBhcnJheSBsaXRlcmFsLlxyXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIl1cIikge1xyXG4gICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIElmIHRoZSBhcnJheSBsaXRlcmFsIGNvbnRhaW5zIGVsZW1lbnRzLCB0aGUgY3VycmVudCB0b2tlblxyXG4gICAgICAgICAgICAgIC8vIHNob3VsZCBiZSBhIGNvbW1hIHNlcGFyYXRpbmcgdGhlIHByZXZpb3VzIGVsZW1lbnQgZnJvbSB0aGVcclxuICAgICAgICAgICAgICAvLyBuZXh0LlxyXG4gICAgICAgICAgICAgIGlmIChoYXNNZW1iZXJzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiXVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gYXJyYXkgbGl0ZXJhbC5cclxuICAgICAgICAgICAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAvLyBBIGAsYCBtdXN0IHNlcGFyYXRlIGVhY2ggYXJyYXkgZWxlbWVudC5cclxuICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gRWxpc2lvbnMgYW5kIGxlYWRpbmcgY29tbWFzIGFyZSBub3QgcGVybWl0dGVkLlxyXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIikge1xyXG4gICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgcmVzdWx0cy5wdXNoKGdldCh2YWx1ZSkpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIHJldHVybiByZXN1bHRzO1xyXG4gICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcIntcIikge1xyXG4gICAgICAgICAgICAvLyBQYXJzZXMgYSBKU09OIG9iamVjdCwgcmV0dXJuaW5nIGEgbmV3IEphdmFTY3JpcHQgb2JqZWN0LlxyXG4gICAgICAgICAgICByZXN1bHRzID0ge307XHJcbiAgICAgICAgICAgIGZvciAoOzsgaGFzTWVtYmVycyB8fCAoaGFzTWVtYmVycyA9IHRydWUpKSB7XHJcbiAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAvLyBBIGNsb3NpbmcgY3VybHkgYnJhY2UgbWFya3MgdGhlIGVuZCBvZiB0aGUgb2JqZWN0IGxpdGVyYWwuXHJcbiAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifVwiKSB7XHJcbiAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgLy8gSWYgdGhlIG9iamVjdCBsaXRlcmFsIGNvbnRhaW5zIG1lbWJlcnMsIHRoZSBjdXJyZW50IHRva2VuXHJcbiAgICAgICAgICAgICAgLy8gc2hvdWxkIGJlIGEgY29tbWEgc2VwYXJhdG9yLlxyXG4gICAgICAgICAgICAgIGlmIChoYXNNZW1iZXJzKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAodmFsdWUgPT0gXCIsXCIpIHtcclxuICAgICAgICAgICAgICAgICAgdmFsdWUgPSBsZXgoKTtcclxuICAgICAgICAgICAgICAgICAgaWYgKHZhbHVlID09IFwifVwiKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8gVW5leHBlY3RlZCB0cmFpbGluZyBgLGAgaW4gb2JqZWN0IGxpdGVyYWwuXHJcbiAgICAgICAgICAgICAgICAgICAgYWJvcnQoKTtcclxuICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgLy8gQSBgLGAgbXVzdCBzZXBhcmF0ZSBlYWNoIG9iamVjdCBtZW1iZXIuXHJcbiAgICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIC8vIExlYWRpbmcgY29tbWFzIGFyZSBub3QgcGVybWl0dGVkLCBvYmplY3QgcHJvcGVydHkgbmFtZXMgbXVzdCBiZVxyXG4gICAgICAgICAgICAgIC8vIGRvdWJsZS1xdW90ZWQgc3RyaW5ncywgYW5kIGEgYDpgIG11c3Qgc2VwYXJhdGUgZWFjaCBwcm9wZXJ0eVxyXG4gICAgICAgICAgICAgIC8vIG5hbWUgYW5kIHZhbHVlLlxyXG4gICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBcIixcIiB8fCB0eXBlb2YgdmFsdWUgIT0gXCJzdHJpbmdcIiB8fCAoY2hhckluZGV4QnVnZ3kgPyB2YWx1ZS5jaGFyQXQoMCkgOiB2YWx1ZVswXSkgIT0gXCJAXCIgfHwgbGV4KCkgIT0gXCI6XCIpIHtcclxuICAgICAgICAgICAgICAgIGFib3J0KCk7XHJcbiAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgIHJlc3VsdHNbdmFsdWUuc2xpY2UoMSldID0gZ2V0KGxleCgpKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0cztcclxuICAgICAgICAgIH1cclxuICAgICAgICAgIC8vIFVuZXhwZWN0ZWQgdG9rZW4gZW5jb3VudGVyZWQuXHJcbiAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICByZXR1cm4gdmFsdWU7XHJcbiAgICAgIH07XHJcblxyXG4gICAgICAvLyBJbnRlcm5hbDogVXBkYXRlcyBhIHRyYXZlcnNlZCBvYmplY3QgbWVtYmVyLlxyXG4gICAgICB2YXIgdXBkYXRlID0gZnVuY3Rpb24oc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spIHtcclxuICAgICAgICB2YXIgZWxlbWVudCA9IHdhbGsoc291cmNlLCBwcm9wZXJ0eSwgY2FsbGJhY2spO1xyXG4gICAgICAgIGlmIChlbGVtZW50ID09PSB1bmRlZikge1xyXG4gICAgICAgICAgZGVsZXRlIHNvdXJjZVtwcm9wZXJ0eV07XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgIHNvdXJjZVtwcm9wZXJ0eV0gPSBlbGVtZW50O1xyXG4gICAgICAgIH1cclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIEludGVybmFsOiBSZWN1cnNpdmVseSB0cmF2ZXJzZXMgYSBwYXJzZWQgSlNPTiBvYmplY3QsIGludm9raW5nIHRoZVxyXG4gICAgICAvLyBgY2FsbGJhY2tgIGZ1bmN0aW9uIGZvciBlYWNoIHZhbHVlLiBUaGlzIGlzIGFuIGltcGxlbWVudGF0aW9uIG9mIHRoZVxyXG4gICAgICAvLyBgV2Fsayhob2xkZXIsIG5hbWUpYCBvcGVyYXRpb24gZGVmaW5lZCBpbiBFUyA1LjEgc2VjdGlvbiAxNS4xMi4yLlxyXG4gICAgICB2YXIgd2FsayA9IGZ1bmN0aW9uIChzb3VyY2UsIHByb3BlcnR5LCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciB2YWx1ZSA9IHNvdXJjZVtwcm9wZXJ0eV0sIGxlbmd0aDtcclxuICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09IFwib2JqZWN0XCIgJiYgdmFsdWUpIHtcclxuICAgICAgICAgIC8vIGBmb3JFYWNoYCBjYW4ndCBiZSB1c2VkIHRvIHRyYXZlcnNlIGFuIGFycmF5IGluIE9wZXJhIDw9IDguNTRcclxuICAgICAgICAgIC8vIGJlY2F1c2UgaXRzIGBPYmplY3QjaGFzT3duUHJvcGVydHlgIGltcGxlbWVudGF0aW9uIHJldHVybnMgYGZhbHNlYFxyXG4gICAgICAgICAgLy8gZm9yIGFycmF5IGluZGljZXMgKGUuZy4sIGAhWzEsIDIsIDNdLmhhc093blByb3BlcnR5KFwiMFwiKWApLlxyXG4gICAgICAgICAgaWYgKGdldENsYXNzLmNhbGwodmFsdWUpID09IGFycmF5Q2xhc3MpIHtcclxuICAgICAgICAgICAgZm9yIChsZW5ndGggPSB2YWx1ZS5sZW5ndGg7IGxlbmd0aC0tOykge1xyXG4gICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgbGVuZ3RoLCBjYWxsYmFjayk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGZvckVhY2godmFsdWUsIGZ1bmN0aW9uIChwcm9wZXJ0eSkge1xyXG4gICAgICAgICAgICAgIHVwZGF0ZSh2YWx1ZSwgcHJvcGVydHksIGNhbGxiYWNrKTtcclxuICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHJldHVybiBjYWxsYmFjay5jYWxsKHNvdXJjZSwgcHJvcGVydHksIHZhbHVlKTtcclxuICAgICAgfTtcclxuXHJcbiAgICAgIC8vIFB1YmxpYzogYEpTT04ucGFyc2VgLiBTZWUgRVMgNS4xIHNlY3Rpb24gMTUuMTIuMi5cclxuICAgICAgSlNPTjMucGFyc2UgPSBmdW5jdGlvbiAoc291cmNlLCBjYWxsYmFjaykge1xyXG4gICAgICAgIHZhciByZXN1bHQsIHZhbHVlO1xyXG4gICAgICAgIEluZGV4ID0gMDtcclxuICAgICAgICBTb3VyY2UgPSBcIlwiICsgc291cmNlO1xyXG4gICAgICAgIHJlc3VsdCA9IGdldChsZXgoKSk7XHJcbiAgICAgICAgLy8gSWYgYSBKU09OIHN0cmluZyBjb250YWlucyBtdWx0aXBsZSB0b2tlbnMsIGl0IGlzIGludmFsaWQuXHJcbiAgICAgICAgaWYgKGxleCgpICE9IFwiJFwiKSB7XHJcbiAgICAgICAgICBhYm9ydCgpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBSZXNldCB0aGUgcGFyc2VyIHN0YXRlLlxyXG4gICAgICAgIEluZGV4ID0gU291cmNlID0gbnVsbDtcclxuICAgICAgICByZXR1cm4gY2FsbGJhY2sgJiYgZ2V0Q2xhc3MuY2FsbChjYWxsYmFjaykgPT0gZnVuY3Rpb25DbGFzcyA/IHdhbGsoKHZhbHVlID0ge30sIHZhbHVlW1wiXCJdID0gcmVzdWx0LCB2YWx1ZSksIFwiXCIsIGNhbGxiYWNrKSA6IHJlc3VsdDtcclxuICAgICAgfTtcclxuICAgIH1cclxuICB9XHJcblxyXG4gIC8vIEV4cG9ydCBmb3IgYXN5bmNocm9ub3VzIG1vZHVsZSBsb2FkZXJzLlxyXG4gIGlmIChpc0xvYWRlcikge1xyXG4gICAgZGVmaW5lKGZ1bmN0aW9uICgpIHtcclxuICAgICAgcmV0dXJuIEpTT04zO1xyXG4gICAgfSk7XHJcbiAgfVxyXG59KHRoaXMpKTtcclxuXHJcbn0se31dLDUwOltmdW5jdGlvbihfZGVyZXFfLG1vZHVsZSxleHBvcnRzKXtcclxubW9kdWxlLmV4cG9ydHMgPSB0b0FycmF5XHJcblxyXG5mdW5jdGlvbiB0b0FycmF5KGxpc3QsIGluZGV4KSB7XHJcbiAgICB2YXIgYXJyYXkgPSBbXVxyXG5cclxuICAgIGluZGV4ID0gaW5kZXggfHwgMFxyXG5cclxuICAgIGZvciAodmFyIGkgPSBpbmRleCB8fCAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG4gICAgICAgIGFycmF5W2kgLSBpbmRleF0gPSBsaXN0W2ldXHJcbiAgICB9XHJcblxyXG4gICAgcmV0dXJuIGFycmF5XHJcbn1cclxuXHJcbn0se31dfSx7fSxbMV0pXHJcbigxKVxyXG59KTtcclxuXG59KS5jYWxsKHRoaXMsdHlwZW9mIHNlbGYgIT09IFwidW5kZWZpbmVkXCIgPyBzZWxmIDogdHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHt9KSJdfQ==
