const Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash'),
    Hoek = require('hoek'),
    mongoose = require('mongoose'),
    uuid = require('node-uuid'),
    converters = require('./converters')

module.exports = function (options) {

    const models = {}

    function disconnect(cb) {
        mongoose.disconnect(cb)
    }

    function connect(cb) {
        mongoose.connect(options.mongodbUrl, cb)
    }

    const get = function (hhSchema) {

        var model = toMongooseModelAndStore(hhSchema)
        return (req, reply) => {
            const query = req.query
            const limit = query.limit || 1000
            const skip = query.offset || 0
            const sort = query.sort || {'_id': -1}
            var predicate = toMongoosePredicate(query)
            model.find(predicate).skip(skip).sort(sort).limit(limit).lean()
                .exec(convertAndReply(reply))
        }
    }

    const getById = function (hhSchema) {

        var model = toMongooseModelAndStore(hhSchema)
        return (req, reply) => {
            var predicate = toMongoosePredicate({id: req.params.id})
            model.find(predicate).lean()
                .exec(convertAndReply(reply))
        }
    }

    function convertAndReply(reply) {
        return (error, resources) => {
            if (error) reply(error)
            else reply({data: converters.toJsonApi(resources)})
        }
    }

    function toMongoosePredicate(query) {
        const mappedToModel = _.mapKeys(query.filter, function (val, key) {
            if (key == 'id') return '_id'
            else return `attributes.${key}`
        })

        return _.mapValues(mappedToModel, function (val, key) {
            if (val.indexOf(',') != -1) return {$in: val.split(',')}
            else return val
        })
    }


    const post = function (hhSchema) {
        var model = toMongooseModelAndStore(hhSchema)

        return function (req, reply) {
            var data = req.payload.data
            return model.create(data).then((created) => {
                reply({data: converters.toJsonApi(created.toObject())}).code(201)
            })
        }
    }

    function toMongooseModelAndStore(hhSchema) {

        if (!models[hhSchema.type]) {

            // clean up existing models and schemas
            delete mongoose.models[hhSchema.type]
            delete mongoose.modelSchemas[hhSchema.type]

            models[hhSchema.type] = converters.toMongooseModel(hhSchema)
        }
        return models[hhSchema.type]
    }

    return {
        connect,
        disconnect,
        get: get,
        post: post,
        getById: getById,
        models: models
    }

}

