const Joi = require('joi')

module.exports = function (server, hh) {

    const trackingData = {
        type: 'trackingData',
        attributes: {
            value: Joi.string(),
            externalId: Joi.string()
        },
        relationships: {
            trackingPoint: 'trackingPoints',
            canVariable: 'canVariables'
        }
    }

    server.route(hh.routes.get(trackingData))

    const trackingDataPost = hh.routes.post(trackingData)

    server.route(_.merge(trackingDataPost, {
        auth: false,
        config: {
            plugins: {
                hh: {
                    before(req, reply) {
                        var data = req.payload.data
                        return hh.adapter.models['canVariables'].find({'relationships.canVariable': data.relationships.canVariable.data.id})
                            .lean().exec()
                            .then(function (canVariable) {
                                data.attributes.value = canVariable.scale * canVariable.resolution *
                                    (data.attributes.raw + canVariable.computeOffset)
                                reply.continue()
                            })
                    }
                }
            }
        }
    })


}


