var Runner = require('./components/Runner');
var server = require('./components/Server');

server.connected(function (socket) {
  var runner = new Runner('.interstitial-wrapper');
  runner.bind(socket);
});