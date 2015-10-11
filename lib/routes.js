var Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash'),
    Hoek = require('hoek')

module.exports = function () {

    const get = function (schema) {
        return {
            method: 'GET',
            path: `/${schema.type}`,
            config: {
                validate: {
                    query: makeJoiValidateQuery(schema),
                    options: {allowUnknown: true}
                }
            }
        }
    }

    const getById = function (schema) {
        return {
            method: 'GET',
            path: `/${schema.type}/{id}`,
            config: {
                validate: {
                    query: false
                }
            }
        }
    }

    const post = function (schema) {
        return {
            method: 'POST',
            path: `/${schema.type}`,
            config: {
                validate: {
                    payload: makeJoiValidatePayload(schema)
                }
            }
        }
    }

    function makeJoiValidateQuery(schema) {
        const filterWithAttrs = {filter: _.clone(schema.attributes)}
        return _.merge(filterWithAttrs, {filter: {id: Joi.string().guid().description('id')}})
    }


    function makeJoiValidatePayload(schema) {

        var optionalId = {id: Joi.string().guid().description('id').optional()}
        var clone = _.clone(schema)
        const schemaWithId = _.merge(clone, optionalId)
        if (schema.relationships) {
            var relationshipsDef = _.map(schema.relationships, (relTarget, relKey)=> {
                const dataDescriptor = {
                    type: Joi.string().valid(_.isArray(relTarget) ? relTarget[0] : relTarget),
                    id: Joi.string().guid()
                }
                return {
                    [relKey]: {
                        data: _.isArray(relTarget) ? Joi.array().items(Joi.object().keys(dataDescriptor)) : dataDescriptor
                    }
                }
            })

            var merged = _.merge({}, schemaWithId, {
                relationships: _.reduce(relationshipsDef, function (acc, relationshipDef) {
                    _.merge(acc, relationshipDef)
                    return acc
                }, {})
            })

            return {
                data: merged
            }
        } else {
            return {data: schemaWithId}
        }
    }


    return {
        get: get,
        getById: getById,
        post: post
    }

}


