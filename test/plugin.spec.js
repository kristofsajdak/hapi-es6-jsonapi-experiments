const hh = require('../'),
    Joi = require('joi'),
    Lab = require('lab'),
    Hapi = require('hapi'),
    _ = require('lodash'),
    chai = require('chai'),
    expect = chai.expect,
    uuid = require('node-uuid'),
    mongoose = require('mongoose'),
    Hoek = require('hoek'),
    converters = hh.converters

chai.use(require('chai-things'))

var lab = exports.lab = Lab.script()

lab.experiment('plugin', ()=> {

    lab.test('loads successfully', (done)=> {
        const server = new Hapi.Server()
        server.connection()
        server.register(require('../lib/plugin'), (err) => {
            done(err)
        })
    })

    lab.test('registers onPreHandler which invokes plugins.hh.before', (done)=> {

        const server = new Hapi.Server()
        server.connection()
        server.register(require('../lib/plugin'), Hoek.ignore)

        function handler(req, reply) {
            reply(req.query.filter.code)
        }

        const schema = {
            type: 'brands',
            attributes: {
                code: Joi.string().min(2).max(10),
                description: Joi.string()
            }
        }

        const route = hh.routes.get(schema, {
            handler,
            config: {
                tags: ['api'],
                plugins: {
                    hh: {
                        before(req, reply) {
                            req.query = _.merge({}, req.query, {filter : {code: 'MF'}})
                            reply.continue()
                        }
                    }
                }
            }
        })

        server.route(route)
        server.inject({url: `/brands`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result).to.equal('MF')
            done()
        })
    })

})

function buildServer() {
    const server = new Hapi.Server()
    server.connection()
    return server
}

function loadPlugin(server, callback) {
    server.register(require('../lib/plugin'), callback);
}

