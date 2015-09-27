const Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash'),
    Hoek = require('hoek'),
    mongoose = require('mongoose'),
    uuid = require('node-uuid'),
    converters = require('./converters')

module.exports = function (models) {

    const get = function (hhSchema) {

        var model = toMongooseModelAndStore(hhSchema)

        return function (req, reply) {

            const query = req.query
            const limit = query.limit || 1000
            const skip = query.offset || 0
            const sort = query.sort || {'_id': -1}
            var predicate = toMongoosePredicate(query);
            model.find(predicate).skip(skip).sort(sort).limit(limit).lean()
                .exec(function (error, resources) {
                    reply({data: converters.toJsonApi(resources)})
                })

        }

        function toMongoosePredicate(query) {

            const mappedToModel = _.mapKeys(query.filter, function (val, key) {
                if (key == 'id') return '_id'
                else return `attributes.${key}`
            })

            return _.mapValues(mappedToModel, function (val, key) {
                if (val.indexOf(',')!=-1) return {$in: val.split(',')}
                else return val
            })
        }
    }

    const post = function (hhSchema) {

        var model = toMongooseModelAndStore(hhSchema)

        return function (req, reply) {
            return model.create(req.payload.data)
                .then((created)=> {
                    reply({data: converters.toJsonApi(created)[0]})
                })
        }
    }

    function toMongooseModelAndStore(hhSchema) {
        models[hhSchema.type] || (models[hhSchema.type] = converters.toMongooseModel(hhSchema))
        return models[hhSchema.type]
    }

    return {
        get: get,
        post: post
    }

}


