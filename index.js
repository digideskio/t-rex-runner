var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var generator = require('./server/generator');
var player = require('./server/player');
var playerManager = require('./server/playerManager');

var HTTP_PORT = 80;

var timer;

app.use('/', express.static('public'));

io.on('connection', function(socket){


    // Resend data every 8s
    if(!timer) {
        socket.emit('game.data', generator.gen());
        timer = setInterval(function () {
            io.emit('game.data', generator.gen());
        }, 8000);
    }

    socket.on('client.connect',     playerManager.playerConnected);
    socket.on('disconnect',         playerManager.playerDisconnected);
    socket.on('player.jump.start',  player.jumpStart);
    socket.on('player.jump.end',    player.jumpStart);
    socket.on('player.over',        player.over);

});

http.listen(HTTP_PORT, function () {
  console.log('HTTP server is listening on port ' + HTTP_PORT);
});