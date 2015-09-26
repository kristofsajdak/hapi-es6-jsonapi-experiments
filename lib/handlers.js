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
            console.log(predicate)
            model.find(predicate).skip(skip).sort(sort).limit(limit).lean()
                .exec(function (error, resources) {
                    reply({data: converters.toJsonApi(resources)})
                })

        }

        function isFilter(key) {
            return _.startsWith(key, 'filter.')
        }

        function stripFilterPrefix(key) {
            return key.slice(6)
        }

        function toMongoosePredicate(query) {

            _.each(query, (val, key) => {
                if (isFilter(key) && _.includes(['limit', 'offset', 'sort'], stripFilterPrefix(key)))
                    throw new Error('filter. query parameters must not overlap with reserved keywords : limit, offset, sort')
            })

            const mappedToModel = _.mapKeys(query.filter, function (val, key) {
                if (_.includes(['limit', 'offset', 'sort'], key))
                    throw new Error('filter. query parameters must not overlap with reserved keywords : limit, offset, sort')

                if (key == 'id') return '_id'
                else return `attributes.${key}`
            })

            var temp = _.mapValues(mappedToModel, function (val, key) {
                if (_.isArray(val))return {$in: val}
                else return val
            });

            console.log(temp)

            return temp

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
        const model = converters.toMongooseModel(hhSchema)
        models[hhSchema.type] || (models[hhSchema.type] = model)
        return model
    }

    return {
        get: get,
        post: post
    }

}


