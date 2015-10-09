const Joi = require('joi')

module.exports = function (server, hh)
{
    var brands = {
        type: 'brands',
        attributes: {
            code: Joi.string(),
            description: Joi.string()
        }
    }

    server.route(hh.routes.get(brands))
    server.route(hh.routes.getById(brands))
    server.route(hh.routes.post(brands))


}

