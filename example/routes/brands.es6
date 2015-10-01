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

    hh.routes.register(brands)

}

