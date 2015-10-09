const hhroutes = require('../lib/routes'),
    Joi = require('joi'),
    Lab = require('lab'),
    Hapi = require('hapi'),
    _ = require('lodash'),
    chai = require('chai'),
    expect = chai.expect,
    uuid = require('node-uuid')

var lab = exports.lab = Lab.script()

const brandsSchema = {
    type: 'brands',
    attributes: {
        code: Joi.string().min(2).max(10),
        description: Joi.string()
    }
}

const seriesSchema = {
    type: 'series',
    attributes: {
        code: Joi.string().min(2).max(10),
        description: Joi.string()
    },
    relationships: {
        brand: 'brands'
    }
}

var routes = hhroutes({});

lab.experiment('routes.get is invoked with an hh schema and noop handler,', ()=> {

    function handler(req, reply) {
        reply()
    }

    const route = routes.get(brandsSchema, {handler})

    lab.experiment('the route config/validate section', ()=> {

        const query = route.config.validate.query

        lab.test('has a query block defined', (done)=> {
            expect(query).to.not.be.undefined
            done()
        })

        lab.test('is defined with an id', (done)=> {
            expect(query.filter.id).to.not.be.undefined
            done()
        })

        lab.test('is defined with all schema attributes', (done)=> {
            expect(query.filter.code).to.not.be.undefined
            expect(query.filter.description).to.not.be.undefined
            done()
        })

    })

    lab.experiment('result can be registered with a hapi buildServer', ()=> {

        const server = buildServer(route)

        lab.test('query with a valid id passes validation', (done)=> {
            server.inject(`/brands?filter.id=${uuid.v4()}`, function (res) {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })

        lab.test('query with an invalid id fails validation', (done)=> {
            server.inject('/brands?filter.id=foobar', function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('query with a valid code passes validation', (done)=> {
            server.inject('/brands?filter.code=1234', function (res) {
                expect(res.statusCode).to.equal(200)
                done()
            })
        })

        lab.test('query with unknowns parameters passes validation', (done)=> {
            server.inject('/brands?filter.foo=bar', function (res) {
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

const validSeries = {
    data: {
        type: 'series',
        attributes: {
            code: 'M1'
        },
        relationships: {
            brand: {
                data: {type: 'brands', id: uuid.v4()}
            }
        }
    }
}

lab.experiment('routes.post is invoked with an hh schema and noop handler,', ()=> {

    function handler(req, reply) {
        reply('').code(201)
    }

    const route = routes.post(seriesSchema, {handler})

    lab.experiment('the route config/validate section', ()=> {

        const payload = route.config.validate.payload

        lab.test('has a payload object defined', (done)=> {
            expect(payload).to.not.be.undefined
            done()
        })

        lab.test('is defined with an id', (done)=> {
            expect(payload.data.id).to.not.be.undefined
            done()
        })

        lab.test('is defined with all schema attributes', (done)=> {
            expect(payload.data.attributes.code).to.not.be.undefined
            expect(payload.data.attributes.description).to.not.be.undefined
            done()
        })

        lab.test('is defined with relationships', (done)=> {
            expect(payload.data.relationships).to.not.be.undefined
            expect(payload.data.relationships.brand).to.not.be.undefined
            expect(payload.data.relationships.brand.data).to.not.be.undefined
            done()
        })
    })

    lab.experiment('result can be registered with a hapi buildServer', ()=> {

        const server = buildServer(route);

        lab.test('post with a valid payload passes validation', (done)=> {
            server.inject({url: '/series', method: 'POST', payload: validSeries}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with a valid payload and a client generated id passes validation', (done)=> {
            const seriesWithClientGenId = _.chain(validSeries).cloneDeep().set('data.id', uuid.v4())
            server.inject({url: '/series', method: 'POST', payload: seriesWithClientGenId}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with non declared attribute fails validation', (done)=> {
            const invalidSeries = _.chain(validBrand).cloneDeep().set('data.attributes.bogus', 'foobar')
            server.inject({url: '/series', method: 'POST', payload: invalidSeries}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an invalid attribute value fails validation', (done)=> {
            const invalidSeries = _.chain(validSeries).cloneDeep().set('data.attributes.code', 'M')
            server.inject({url: '/series', method: 'POST', payload: invalidSeries}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an invalid relationship key fails validation', (done)=> {
            const invalidSeries = _.chain(validSeries).cloneDeep().set('data.relationships.bogus', {})
            server.inject({url: '/series', method: 'POST', payload: invalidSeries}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an incorrect relationship data/type value fails validation', (done)=> {
            const invalidSeries = _.chain(validSeries).cloneDeep().set('data.relationships.brand.data', {type: 'bogus'})
            server.inject({url: '/series', method: 'POST', payload: invalidSeries}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an non uuid relationship data/id value fails validation', (done)=> {
            const invalidSeries = _.chain(validSeries).cloneDeep().set('data.relationships.brand.data', {id: 'bogus'})
            server.inject({url: '/series', method: 'POST', payload: invalidSeries}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an uuid relationship data/id array value where a single value is expected fails validation', (done)=> {
            const invalidSeries = _.chain(validSeries).cloneDeep().set('data.relationships.brand.data', [{type: 'brands', id: uuid.v4()}])
            server.inject({url: '/series', method: 'POST', payload: invalidSeries}, function (res) {
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

        var route = routes.post(brandsSchema, {
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