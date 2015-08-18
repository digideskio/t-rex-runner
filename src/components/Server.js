var Constants = require('./Constants');
var IO = require('../lib/socket.io.js');

var socket = new IO(Constants.SOCKET_URL);
var Server = {};

Server.connected = function (callback) {
    callback(socket);
}

module.exports = Server;