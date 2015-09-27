exports.register = function (server, options, next) {

    server.ext('onPreHandler', function (request, reply) {
        var before = request.route.settings.plugins.hh.before
        if (before) before(request, reply)
        else reply.continue()
    })

    return next()
}

exports.register.attributes = {
    pkg: require('../package.json')
};
