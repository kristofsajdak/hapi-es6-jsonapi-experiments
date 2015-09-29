const mongoose = require('mongoose'),
    _ = require('lodash'),
    routes = require('./routes')(),
    models = {}
    handlers = require('./handlers')(models)

mongoose.Promise = require('bluebird');

exports.register = function (server, options, next) {

    mongoose.connect(options.mongodbUrl, function (err) {
        next()
    })

    server.on('stop', function() {
        mongoose.disconnect()
    })

    server.expose('models', models)

    server.ext('onPreHandler', function (request, reply) {
        var hh = request.route.settings.plugins.hh;
        if (hh) {
            const before = hh.before
            if (before) before(request, reply)
        }
        else reply.continue()
    })

    const get = function (schema, routeConfig) {
        return routes.get(schema, _.merge({handler: handlers.get(schema)}, routeConfig))
    }

    const getById = function (schema, routeConfig) {
        return routes.getById(schema, _.merge({handler: handlers.getById(schema)}, routeConfig))
    }

    const post = function (schema, routeConfig) {
        return routes.post(schema, _.merge({handler: handlers.post(schema)}, routeConfig))
    }

    server.expose('routes', {
        get: get,
        getById: getById,
        post: post
    })


}

exports.register.attributes = {
    name: 'hh'
};
