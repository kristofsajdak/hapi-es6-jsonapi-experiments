var Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash'),
    Hoek = require('hoek')

module.exports = function () {

    const get = function (schema, routeConfig) {
        return _.merge({
            method: 'GET',
            path: `/${schema.type}`,
            config: {
                validate: {
                    query: makeQueryJoiSchema(schema),
                    options: {allowUnknown: true}
                }
            }
        }, normalise(routeConfig));
    }

    function makeQueryJoiSchema(schema) {
        const attrClone = _.clone(schema.attributes)
        return _.merge(attrClone, makeIdDescriptor())
    }

    const getById = function (schema, routeConfig) {
        return _.merge({
            method: 'GET',
            path: `/${schema.type}/{id}`,
            config: {
                validate: {
                    query: false
                }
            }
        }, normalise(routeConfig));
    }

    const post = function (schema, routeConfig) {
        return _.merge({
            method: 'POST',
            path: `/${schema.type}`,
            config: {
                validate: {
                    payload: makePostJoiSchema(schema)
                }
            }
        }, normalise(routeConfig));
    }

    function normalise(routeConfig) {
        return (routeConfig && !_.isFunction(routeConfig)) ? routeConfig : {handler: routeConfig}
    }

    function makePostJoiSchema(schema) {

        var optionalId = {id: makeIdDescriptor().id.optional()}
        var clone = _.clone(schema);
        const schemaWithId = _.merge(clone, optionalId)
        if (schema.relationships) {
            var relationshipsDef = _.map(schema.relationships, (relTarget, relKey)=> {
                const dataDescriptor = {
                    type: Joi.string().valid(_.isArray(relTarget) ? relTarget[0] : relTarget),
                    id: Joi.string().guid()
                };
                return {
                    [relKey]: {
                        data: _.isArray(relTarget) ? Joi.array().items(Joi.object().keys(dataDescriptor)) : dataDescriptor
                    }
                }
            });

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

    function makeIdDescriptor() {
        return {id: Joi.string().guid().description('id')}
    }

    return {
        get: get,
        getById: getById,
        post: post
    }

}


