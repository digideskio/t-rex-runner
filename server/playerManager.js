var Player = require('./player');

var manager = {};
var players = {};
var playerIds = [];

var addPlayer = function (socket) {
    var player = new Player(socket);
    playerIds.push(player.id);
    players[player.id] = player;
};

var removePlayer = function (playerId) {
    if(players[playerId.id]) {
        var position = playerIds.indexOf(playerId);
        playerIds.splice(position, 1);
        delete players[playerId.id];
    }
};

manager.playerConnected = function () {
    addPlayer(this);
    this.emit('player.list', playerIds);
    this.broadcast.emit('player.new', this.id);
    console.log('Player ' + this.id + ' is connected.');
};

manager.playerDisconnected = function () {
    var player = players[this.id];
    if(player) {
        removePlayer(this.id);
        this.broadcast.emit('player.disconnected', this.id);
        console.log('Player ' + this.id + ' is disconnected.');
    }
};

module.exports = manager;