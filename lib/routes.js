var Hapi = require('hapi'),
    Joi = require('joi'),
    _ = require('lodash')

module.exports.get = function (schema) {
    return {
        method: 'GET',
        path: `/${schema.type}`,
        config: {
            tags: ['api'],
            validate: {
                query: cloneAttrAndMergeWithId(schema),
                options: {allowUnknown: true}
            }
        }
    }
}

function cloneAttrAndMergeWithId (schema) {
    const attrClone = _.clone(schema.attributes)
    return _.merge(attrClone, makeIdDescriptor())
}

module.exports.getById = function (schema) {
    return {
        method: 'GET',
        path: `/${schema.type}/{id}`,
        config: {
            tags: ['api'],
            validate: {
                query: false
            }
        }
    }
}

module.exports.post = function (schema) {
    return {
        method: 'POST',
        path: `/${schema.type}`,
        config: {
            tags: ['api'],
            validate: {
                payload: makePostBodyDescriptor(schema)
            }
        }
    }
}

function makePostBodyDescriptor(schema) {

    var optionalId = {id: makeIdDescriptor().id.optional()}
    const schemaWithId = _.merge(_.clone(schema), {attributes: optionalId})
    return {data: schemaWithId}

}

function makeIdDescriptor() {
    return {id: Joi.string().guid().description('id')}
}

