var Constants = require('./Constants');
var IO = require('../lib/socket.io.js');

var socket = new IO();
var Server = {};

Server.connected = function (callback) {
    socket.emit('client.connect');
    callback(socket);
}

module.exports = Server;