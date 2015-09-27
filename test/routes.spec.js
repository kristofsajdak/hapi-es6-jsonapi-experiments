const hhroutes = require('../lib/routes'),
    Joi = require('joi'),
    Code = require('code'),
    Lab = require('lab'),
    Hapi = require('hapi'),
    _ = require('lodash'),
    expect = Code.expect,
    uuid = require('node-uuid')

var lab = exports.lab = Lab.script()

const schema = {
    type: 'brands',
    attributes: {
        code: Joi.string().min(2).max(10),
        description: Joi.string()
    }
}

var routes = hhroutes({});

lab.experiment('routes.get is invoked with an hh schema and noop handler,', ()=> {

    function handler(req, reply) {
        reply()
    }

    const route = routes.get(schema, {handler})

    lab.experiment('the route config/validate section', ()=> {

        const query = route.config.validate.query

        lab.test('has a query block defined', (done)=> {
            expect(query).to.not.be.undefined()
            done()
        })

        lab.test('is defined with an id', (done)=> {
            expect(query.id).to.not.be.undefined()
            done()
        })

        lab.test('is defined with all schema attributes', (done)=> {
            expect(query.code).to.not.be.undefined()
            expect(query.description).to.not.be.undefined()
            done()
        })

    })

    lab.experiment('result can be registered with a hapi buildServer', ()=> {

        const server = buildServer(route)

        lab.test('query with a valid id passes validation', (done)=> {
            server.inject(`/brands?id=${uuid.v4()}`, function (res) {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })

        lab.test('query with an invalid id fails validation', (done)=> {
            server.inject('/brands?id=foobar', function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('query with a valid code passes validation', (done)=> {
            server.inject('/brands?code=1234', function (res) {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })

        lab.test('query with unknowns parameters passes validation', (done)=> {
            server.inject('/brands?foo=bar', function (res) {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })

    })


})

const validBrand = {
    data: {
        type: 'brands',
        attributes: {
            code: 'MF',
            description: 'Massey Ferguson'
        }
    }
}

lab.experiment('post is invoked with an hh schema and noop handler,', ()=> {

    function handler(req, reply) {
        reply('').code(201)
    }

    const route = routes.post(schema, {handler})

    lab.experiment('the route config/validate section', ()=> {

        const payload = route.config.validate.payload

        lab.test('has a payload object defined', (done)=> {
            expect(payload).to.not.be.undefined()
            done()
        })

        lab.test('is defined with an id', (done)=> {
            expect(payload.data.attributes.id).to.not.be.undefined()
            done()
        })

        lab.test('is defined with all schema attributes', (done)=> {
            expect(payload.data.attributes.code).to.not.be.undefined()
            expect(payload.data.attributes.description).to.not.be.undefined()
            done()
        })
    })

    lab.experiment('result can be registered with a hapi buildServer', ()=> {

        const server = buildServer(route);

        lab.test('post with a valid payload passes validation', (done)=> {
            server.inject({url: '/brands', method: 'POST', payload: validBrand}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with a valid payload and a client generated id passes validation', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.id', uuid.v4())
            server.inject({url: '/brands', method: 'POST', payload: invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with non declared attribute fails validation', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.bogus', 'foobar')
            server.inject({url: '/brands', method: 'POST', payload: invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an invalid attribute value fails validation', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.code', 'M')
            server.inject({url: '/brands', method: 'POST', payload: invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

    })

})

lab.experiment('routes.post is invoked with a schema, handler and routeConfig overrides.', ()=> {

        lab.test('a config/bind override is respected', (done) => {

            function handler(req, reply) {
                reply(this.message).code(201)
            }

            var route = routes.post(schema, {
                handler,
                config: {
                    bind: {
                        message: 'foobar'
                    }
                }
            })

            const server = buildServer(route);

            server.inject({url: '/brands', method: 'POST', payload: validBrand}, function (res) {
                expect(res.result).to.equal('foobar')
                done()
            })
        })
})

function buildServer(route) {
    const server = new Hapi.Server()
    server.connection()
    server.route(route)
    return server;
}