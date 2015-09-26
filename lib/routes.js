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
            handler: handlers.get ? handlers.get(schema) : null,
            config: {
                tags: ['api'],
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
            handler: handlers.getById ? handlers.getById(schema) : null,
            config: {
                tags: ['api'],
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
            handler: handlers.post ? handlers.post(schema) : null,
            config: {
                tags: ['api'],
                validate: {
                    payload: makePostJoiSchema(schema)
                }
            }
        }, normalise(routeConfig));
    }

    function normalise(routeConfig) {
        return (routeConfig && !_.isFunction(routeConfig)) ? routeConfig : {handler: routeConfig};
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


