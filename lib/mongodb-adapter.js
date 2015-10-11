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

    const find = function (type, req) {

        const model = models[type]
        const query = req.query
        const limit = query.limit || 1000
        const skip = query.offset || 0
        const sort = query.sort || {'_id': -1}
        var predicate = toMongoosePredicate(query)
        return model.find(predicate).skip(skip).sort(sort).limit(limit).lean().exec()
            .then((resources)=> {
                return {data: converters.toJsonApi(resources)}
            })

    }

    const findById = function (type, req) {

        const model = models[type]
        var predicate = toMongoosePredicate({id: req.params.id})
        return model.find(predicate).lean().exec()
            .then((resources) => {
                return {data: converters.toJsonApi(resources)}
            })

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


    const create = function (type, req) {

        const model = models[type]
        var data = req.payload.data
        return model.create(data).then((created) => {
            return {data: converters.toJsonApi(created.toObject())}
        })

    }

    function processSchema(hhSchema) {

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
        find: find,
        findById: findById,
        create: create,
        models: models,
        processSchema: processSchema
    }

}


