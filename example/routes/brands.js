const Joi = require('joi'),
    _ = require('lodash')

module.exports = function (server, hh) {
    var brands = {
        type: 'brands',
        attributes: {
            code: Joi.string(),
            description: Joi.string()
        }
    }

    server.route(_.merge(hh.routes.get(brands), {
        config: {
            auth: false,
            description: 'Get brands',
            notes: 'Returns all the brands we are looking for',
            tags: ['api']
        }
    }))

    server.route(hh.routes.getById(brands))
    server.route(hh.routes.post(brands))


}

