var Obstacle = require('./obstacle');

var Generator = {};

// Data to be sent in every unit time
var OBSTACLE_COUNT = 7;

Generator.gen = function () {
    var obstacles = [];
    for(var i = 0; i < OBSTACLE_COUNT; i++) {
        var obstacle = new Obstacle();
        obstacles.push({
            type: obstacle.typeIndex,
            gap: obstacle.getGap(),
            size: obstacle.size
        });
    }
    return {
        obstacles: obstacles
    };
}

module.exports = Generator;