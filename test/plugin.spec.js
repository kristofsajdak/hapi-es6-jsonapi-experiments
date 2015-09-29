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

var server;

lab.beforeEach((done)=> {
    server = buildServer();
    loadPlugin(server, done)
})

lab.afterEach((done)=> {
    server.stop(done)
})

lab.experiment('plugin', ()=> {

    const schema = {
        type: 'brands',
        attributes: {
            code: Joi.string().min(2).max(10),
            description: Joi.string()
        }
    }

    lab.test('registers onPreHandler which invokes plugins.hh.before', (done)=> {

        function handler(req, reply) {
            reply(req.query.filter.code)
        }

        var routeConfig = {
            handler,
            config: {
                plugins: {
                    hh: {
                        before(req, reply) {
                            req.query = _.merge({}, req.query, {filter: {code: 'MF'}})
                            reply.continue()
                        }
                    }
                }
            }
        };

        const route = server.plugins.hh.routes.get(schema, routeConfig)

        server.route(route)
        server.inject({url: `/brands`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result).to.equal('MF')
            done()
        })

    })

    lab.experiment('register an hh get route,', ()=> {

        lab.test('query a brand with a code', (done)=> {

            var hh = server.plugins.hh;

            const route = hh.routes.get(schema)
            server.route(route)

            const mf = {
                attributes: {
                    code: 'MF',
                    description: 'Massey Furgeson'
                }
            };

            const Brands = hh.models.brands
            Brands.remove()
                .then(()=> {
                    return Brands.create(mf)
                })
                .then((created)=> {
                    server.inject({url: `/brands?code=MF`}, function (res) {
                        expect(res.statusCode).to.equal(200)
                        console.log(res.result)
                        expect(res.result.data[0].attributes).to.deep.equal(mf.attributes)
                        done()
                    })
                })


        })
    })

    lab.experiment('register an hh post route,', ()=> {

        lab.test('create a brand', (done)=> {

            var hh = server.plugins.hh;

            const route = hh.routes.post(schema)
            server.route(route)

            const mf = {
                attributes: {
                    code: 'MF',
                    description: 'Massey Furgeson'
                }
            };

            server.inject({url: `/brands`, method: 'POST', payload: {data: mf}}, function (res) {
                expect(res.statusCode).to.equal(201)
                expect(res.result.data.id).to.not.be.undefined
                expect(res.result.data.attributes).to.deep.equal(mf.attributes)

                done()
            })
        })
    })
})

function loadPlugin(server, callback) {
    server.register({register: require('../lib/plugin'), options: {mongodbUrl: 'mongodb://localhost/test'}}, callback)
}

function buildServer() {
    const server = new Hapi.Server()
    server.connection()
    return server
}


