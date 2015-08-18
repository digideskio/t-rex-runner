var path = require('path');
var generator = require('./server/generator');

var express = require('express');
var app = express();

var server = require('http').createServer();
var io = require('socket.io')(server);

var HTTP_PORT = 8080;
var SOCKET_PORT = 3030;

var players = {};
var timer;

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, './index.html'));
});

app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/build', express.static(path.join(__dirname, 'build')));

app.listen(HTTP_PORT, function () {
  console.log('HTTP server is listening on port ' + HTTP_PORT);
});

io.on('connection', function(socket){
    console.log('Client ' + socket.id + ' connected.');

    if(!players[socket.id]) {
        players[socket.id] = {};
    }

    socket.broadcast.emit('player.new', { id: socket.id });

    // Resend data every 8s
    if(!timer) {
        socket.emit('game.data', generator.gen());
        timer = setInterval(function () {
            io.emit('game.data', generator.gen());
        }, 8000);
    }

    io.emit('player.list', players);

    socket.on('game.start', function() {
        socket.broadcast.emit('game.start');
    });
    socket.on('player.over', function(meters) {
        socket.broadcast.emit('player.over', {
            playerId: this.id,
            meters: meters
        });
    });
    socket.on('player.jump.start', function() {
        socket.broadcast.emit('player.jump.start', this.id);
    });
    socket.on('player.jump.end', function() {
        socket.broadcast.emit('player.jump.end', this.id);
    });

    socket.on('disconnect', function(){
        try {
            delete players[this.id];
            io.emit('player.list', players);
        } catch (e) {}
    });

});

server.listen(SOCKET_PORT, function () {
    console.log('Socket server is listening on port ' + SOCKET_PORT);
});
