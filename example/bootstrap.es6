var hh = require('hapi-harvester');

var A = require('joi');
var server = require('hapi');

const adapter = require('../lib/mongodb-adapter')({mongodbUrl: 'mongodb://localhost/test'})

// without an adapter : error formatting, inclusions, sparse fields
// adapter persists and retrieves
server.register({
    register: hh, // the hapi-harvester plugin in turn will load the hapi-mongoose-db-connector, hapi-swagger
    options: {
        adapter: adapter
        // ...
    }
}, function (err) {
    require('routes')(server)
})







