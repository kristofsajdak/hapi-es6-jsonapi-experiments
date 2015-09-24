const hh = require('../lib/routes'),
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

lab.experiment('hh.get is invoked with a schema and handler,', ()=> {

    function handler(req, reply) {
        reply()
    }

    const route = hh.get(schema, handler)

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

        var server = new Hapi.Server()
        server.connection()
        server.route(route)

        lab.test('query with a valid id works', (done)=> {
            server.inject(`/brands?id=${uuid.v4()}`, function (res) {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })

        lab.test('query with an invalid id returns a 400', (done)=> {
            server.inject('/brands?id=foobar', function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('query with a valid code returns a 200', (done)=> {
            server.inject('/brands?code=1234', function (res) {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })

        lab.test('query with unknowns are allowed', (done)=> {
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

lab.experiment('hh.post is invoked with a schema and handler,', ()=> {

    function handler(req, reply) {
        reply('').code(201)
    }

    const route = hh.post(schema, handler)

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

        lab.test('post with a valid payload returns success', (done)=> {
            const server = buildServer(route);
            server.inject({url: '/brands', method: 'POST', payload: validBrand}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with a valid payload and a client generated id returns success', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.id', uuid.v4())
            const server = buildServer(route);
            server.inject({url: '/brands', method: 'POST', payload: invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with non declared attribute fails with a 400', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.bogus', 'foobar')
            const server = buildServer(route);
            server.inject({url: '/brands', method: 'POST', payload: invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an invalid attribute value fails with a 400', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.code', 'M')
            const server = buildServer(route);
            server.inject({url: '/brands', method: 'POST', payload: invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

    })

})

lab.experiment('hh.post is invoked with a schema, handler and routeConfig overrides.', ()=> {

        lab.test('a config/bind override is respected', (done) => {

            function handler(req, reply) {
                reply(this.message).code(201)
            }

            var route = hh.post(schema, {
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