var player = function (socket) {
    this.id = socket.id;
    this.socket = socket;
}

player.over = function (data) {
    this.broadcast.emit('player.over', data);
    console.log('Player ' + this.id + ' is game over.')
};

player.jumpStart = function () {
    this.broadcast.emit('player.jump.start', this.id);
};

player.jumpEnd = function () {
    this.broadcast.emit('player.jump.end', this.id);
};

module.exports = player;