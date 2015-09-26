const _ = require('lodash')

module.exports = function (server) {

    const hh = server.plugins['hh']

    const routes = [
        'brands',
        'trackingData'
    ]

    _.each(routes, (route) => {
        require(route)(server, hh)
    })
}