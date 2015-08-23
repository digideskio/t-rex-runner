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