const mongoose = require('mongoose'),
    _ = require('lodash'),
    routes = require('./routes')()

mongoose.Promise = require('bluebird');

exports.register = function (server, options, next) {

    var adapter = options.adapter;

    adapter.connect((err) => {
        next(err)
    })

    server.on('stop', () => {
        adapter.disconnect()
    })

    server.expose('adapter', adapter)

    server.ext('onPreHandler', function (request, reply) {
        var hh = request.route.settings.plugins.hh;
        if (hh) {
            const before = hh.before
            if (before) before(request, reply)
        }
        else reply.continue()
    })

    const get = function (schema, routeConfig) {
        return routes.get(schema, _.merge({handler: adapter.get(schema)}, routeConfig))
    }

    const getById = function (schema, routeConfig) {
        return routes.getById(schema, _.merge({handler: adapter.getById(schema)}, routeConfig))
    }

    const post = function (schema, routeConfig) {
        return routes.post(schema, _.merge({handler: adapter.post(schema)}, routeConfig))
    }

    server.ext('onPreResponse', (req, reply) => {

        const response = req.response
        if (response.isBoom) {
            var error = {
                title: response.output.payload.error,
                status: response.output.statusCode,
                detail: response.output.payload.message
            };
            response.output.payload = {
                errors: [error]
            }
            reply(response)
        } else {
            reply.continue()
        }
    })

    server.expose('routes', {
        get: get,
        getById: getById,
        post: post
    })


}

exports.register.attributes = {
    name: 'hh'
};
