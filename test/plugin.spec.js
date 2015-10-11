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
    converters = hh.converters,
    Boom = require('boom')

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

        const brandsGet = server.plugins.hh.routes.get(schema)

        server.route(_.merge(brandsGet, {
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
        }))

        server.inject({url: `/brands`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result).to.equal('MF')
            done()
        })

    })

    lab.experiment('register an hh get route,', ()=> {

        var createdBrand;

        lab.beforeEach((done)=> {
            var hh = server.plugins.hh;

            server.route(hh.routes.get(schema))
            server.route(hh.routes.getById(schema))

            const mf = {
                attributes: {
                    code: 'MF',
                    description: 'Massey Furgeson'
                }
            };

            const Brands = hh.adapter.models.brands
            return Brands.remove()
                .then(()=> {
                    return Brands.create(mf)
                })
                .then((created) => {
                    createdBrand = created
                    done()
                })
        })


        lab.test('query a brand with a code', (done)=> {

            server.inject({url: `/brands?filter.code=MF`}, function (res) {

                expect(res.statusCode).to.equal(200)
                var data = res.result.data[0];
                expect(data.id).to.equal(createdBrand._id)
                expect(data.attributes.code).to.equal(createdBrand.attributes.code)
                expect(data.attributes.description).to.equal(createdBrand.attributes.description)

                done()
            })
        })

        lab.test('query a brand by id', (done)=> {

            server.inject({url: `/brands/${createdBrand._id}`}, function (res) {

                expect(res.statusCode).to.equal(200)
                var data = res.result.data[0];
                expect(data.id).to.equal(createdBrand._id)
                expect(data.attributes.code).to.equal(createdBrand.attributes.code)
                expect(data.attributes.description).to.equal(createdBrand.attributes.description)

                done()
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

            server
                .inject({url: `/brands`, method: 'POST', payload: {data: mf}}, function (res) {
                    console.log(res.result)
                expect(res.statusCode).to.equal(201)
                expect(res.result.data.id).to.not.be.undefined
                expect(res.result.data.attributes).to.deep.equal(mf.attributes)

                done()
            })
        })

        lab.test('fail in before with Boom outputs a jsonapi error', (done)=> {

            var hh = server.plugins.hh;

            const route = hh.routes.post(schema)
            server.route(_.merge(route, {
                config: {
                    plugins: {
                        hh: {
                            before: (req, reply) => {
                                reply(Boom.badRequest('Fail'))
                            }
                        }
                    }
                }
            }))

            server.inject({url: `/brands`, method: 'POST', payload: {data: {}}}, function (res) {
                expect(res.statusCode).to.equal(400)
                expect(res.result.errors).to.not.be.undefined
                expect(res.result.errors[0]).to.deep.equal({
                    title: 'Bad Request',
                    status: 400,
                    detail: 'Fail'
                })

                done()
            })
        })

        lab.test('fail unexpected error in before outputs a jsonapi error', (done)=> {

            var hh = server.plugins.hh;

            const route = hh.routes.post(schema)
            server.route(_.merge(route, {
                config: {
                    plugins: {
                        hh: {
                            before: (req, reply) => {
                                throw new Error()
                            }
                        }
                    }
                }
            }))

            server.inject({url: `/brands`, method: 'POST', payload: {data: {}}}, function (res) {
                expect(res.statusCode).to.equal(500)
                expect(res.result.errors).to.not.be.undefined
                expect(res.result.errors[0]).to.deep.equal({
                    title: 'Internal Server Error',
                    status: 500,
                    detail: 'An internal server error occurred'
                })

                done()
            })
        })


    })


})

function loadPlugin(server, callback) {
    var adapter = require('../lib/mongodb-adapter')({mongodbUrl: 'mongodb://localhost/test'})
    server.register({register: require('../lib/plugin'), options: {adapter: adapter}}, callback)
}

function buildServer() {
    const server = new Hapi.Server()
    server.connection()
    return server
}


