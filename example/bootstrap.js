var hh = require('../lib/plugin'),
    A = require('joi'),
    Hapi = require('hapi')

var server = new Hapi.Server()
server.connection({port: 3000})

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
    require('./routes')(server)
    server.start(function () {
        console.log('Server running at:', server.info.uri);
    })
})







