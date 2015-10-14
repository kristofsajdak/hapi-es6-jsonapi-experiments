const Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash'),
    Hoek = require('hoek'),
    mongoose = require('mongoose'),
    uuid = require('node-uuid')

module.exports = function (options) {

    const models = {}

    function disconnect(cb) {
        mongoose.disconnect(cb)
    }

    function connect(cb) {
        mongoose.connect(options.mongodbUrl, cb)
    }

    const find = function (type, query) {

        const model = models[type]
        const limit = query.limit || 1000
        const skip = query.offset || 0
        const sort = query.sort || {'_id': -1}
        var predicate = toMongoosePredicate(query)
        return model.find(predicate).skip(skip).sort(sort).limit(limit).lean().exec()
            .then((resources) => {
                return {
                    data: dbToApi(resources)
                }
            })

    }

    const findById = function (type, id) {

        const model = models[type]
        var predicate = toMongoosePredicate({id: id})
        return model.find(predicate).lean().exec()
            .then((resources) => {
                return {
                    data: dbToApi(resources)
                }
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


    function create(type, payload) {

        const model = models[type]
        var data = payload.data
        return model.create(apiToDb(data)).then((created) => {
            return {data: dbToApi(created.toObject())}
        })
    }

    function dbToApi(resources) {

        return mapArrayOrSingle(resources, format)

        function format(resource) {
            return _.mapKeys(resource, function (val, key) {
                if (key === '_id') return 'id'
                else return key
            });
        }
    }

    function apiToDb(resources) {
        return mapArrayOrSingle(resources, format)

        function format(resource) {
            return _.mapKeys(resource, function (val, key) {
                if (key === 'id') return '_id'
                else return key
            })
        }
    }

    function mapArrayOrSingle(resources, mapFn) {
        if (_.isArray(resources)) {
            return _.map(resources, (resource) => {
                return mapFn(resource);
            })
        } else {
            return mapFn(resources);
        }
    }

    function processSchema(hhSchema) {

        if (!models[hhSchema.type]) {

            // clean up existing models and schemas
            delete mongoose.models[hhSchema.type]
            delete mongoose.modelSchemas[hhSchema.type]

            models[hhSchema.type] = toMongooseModel(hhSchema)
        }
        return models[hhSchema.type]
    }

    function toMongooseModel(hhSchema) {

        const mongooseSchema = {}
        mongooseSchema._id = {
            type: String,
            default: () => {
                return uuid.v4()
            }
        }

        var schemaMap = {
            'string': String,
            'number': Number,
            'date': Date,
            'buffer': Buffer,
            'boolean': Boolean,
            'array': Array,
            'any': Object
        }

        mongooseSchema.attributes =
            _.mapValues(hhSchema.attributes, function (val) {
                Hoek.assert(val.isJoi, 'attribute values in the hh schema should be defined with Joi')
                return schemaMap[val._type]
            })

        const schema = mongoose.Schema(mongooseSchema, {versionKey: false})

        return mongoose.model(hhSchema.type, schema)

    }


    return {
        connect,
        disconnect,
        find: find,
        findById: findById,
        create: create,
        models: models,
        processSchema: processSchema,
        toMongooseModel: toMongooseModel
    }

}


