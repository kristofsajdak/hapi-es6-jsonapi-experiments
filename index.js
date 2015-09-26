


const models = {}
module.exports.models = models

const handlers = require('./lib/handlers')(models)
module.exports.handlers = handlers

module.exports.routes = require('./lib/routes')(handlers)
module.exports.converters = require('./lib/converters')
