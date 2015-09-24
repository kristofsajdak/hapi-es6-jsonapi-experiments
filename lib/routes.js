var Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash')

module.exports.get = function (schema, routeConfig) {
    return _.merge({
        method: 'GET',
        path: `/${schema.type}`,
        config: {
            tags: ['api'],
            validate: {
                query: cloneAttrAndMergeWithId(schema),
                options: {allowUnknown: true}
            }
        }
    }, normalise(routeConfig));
}

function cloneAttrAndMergeWithId(schema) {
    const attrClone = _.clone(schema.attributes)
    return _.merge(attrClone, makeIdDescriptor())
}

module.exports.getById = function (schema, routeConfig) {
    return _.merge({
        method: 'GET',
        path: `/${schema.type}/{id}`,
        config: {
            tags: ['api'],
            validate: {
                query: false
            }
        }
    }, normalise(routeConfig));
}

module.exports.post = function (schema, routeConfig) {
    return _.merge({
        method: 'POST',
        path: `/${schema.type}`,
        config: {
            tags: ['api'],
            validate: {
                payload: makePostBodyDescriptor(schema)
            }
        }
    }, normalise(routeConfig));
}

function normalise(routeConfig) {
    return (routeConfig && !_.isFunction(routeConfig)) ? routeConfig : {handler: routeConfig};
}

function makePostBodyDescriptor(schema) {

    var optionalId = {id: makeIdDescriptor().id.optional()}
    const schemaWithId = _.merge(_.clone(schema), {attributes: optionalId})
    return {data: schemaWithId}

}

function makeIdDescriptor() {
    return {id: Joi.string().guid().description('id')}
}

