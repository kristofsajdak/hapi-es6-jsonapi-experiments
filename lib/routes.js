var Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash'),
    Hoek = require('hoek')

module.exports = function (handlers) {

    Hoek.assert(handlers, 'missing handlers')

    const get = function (schema, routeConfig) {
        return _.merge({
            method: 'GET',
            path: `/${schema.type}`,
            config: {
                tags: ['api'],
                validate: {
                    query: makeQueryJoiSchema(schema),
                    options: {allowUnknown: true}
                }
            }
        }, normalise(routeConfig, ()=> {
            return handlers.get(schema)
        }));
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
                tags: ['api'],
                validate: {
                    query: false
                }
            }
        }, normalise(routeConfig, ()=> {
            return handlers.getById(schema)
        }));
    }

    const post = function (schema, routeConfig) {
        return _.merge({
            method: 'POST',
            path: `/${schema.type}`,
            config: {
                tags: ['api'],
                validate: {
                    payload: makePostJoiSchema(schema)
                }
            }
        }, normalise(routeConfig, ()=> {
            return handlers.post(schema)
        }));
    }

    function normalise(routeConfig, initHandler) {
        var normalised = (routeConfig && !_.isFunction(routeConfig)) ? routeConfig : {handler: routeConfig};
        if (!normalised.handler) {
            return _.merge({}, routeConfig, {handler: initHandler()})
        } else {
            return normalised
        }
    }

    function makePostJoiSchema(schema) {

        var optionalId = {id: makeIdDescriptor().id.optional()}
        const schemaWithId = _.merge(_.clone(schema), {attributes: optionalId})
        return {data: schemaWithId}

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


