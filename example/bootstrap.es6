var hh = require('hapi-harvester');

var A = require('joi');
var server = require('hapi');

server.register({
    register: hh, // the hapi-harvester plugin in turn will load the hapi-mongoose-db-connector, hapi-swagger
    options: {
        mongodbUrl: 'mongodb://localhost:27017/test'
        // ...
    }
}, function (err) {
    require('routes')(server)
});







