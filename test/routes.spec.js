const hh = require('../lib/routes'),
    A = require('joi'),
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
        code: A.string().min(2).max(10),
        description: A.string()
    }
}

lab.experiment('hh.get is called', ()=> {

    const route = hh.get(schema)

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

    lab.experiment('result can be registered with a hapi server', ()=> {

        route.handler = function (req, reply) {
            reply()
        }

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

lab.experiment('hh.post is called,', ()=> {

    const route = hh.post(schema)

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

    lab.experiment('result can be registered with a hapi server', ()=> {

        route.handler = function (req, reply) {
            reply('').code(201)
        }

        var server = new Hapi.Server()
        server.connection()
        server.route(route)

        const validBrand = {
            data: {
                type: 'brands',
                attributes: {
                    code: 'MF',
                    description: 'Massey Ferguson'
                }
            }
        }

        lab.test('post with a valid payload returns success', (done)=> {
            server.inject({url:'/brands', method:'POST', payload:validBrand}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with a valid payload and a client generated id returns success', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.id', uuid.v4())
            server.inject({url:'/brands', method:'POST', payload:invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(201)
                done()
            })
        })

        lab.test('post with non declared attribute fails with a 400', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.bogus', 'foobar')
            server.inject({url:'/brands', method:'POST', payload:invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

        lab.test('post with an invalid attribute value fails with a 400', (done)=> {
            const invalidBrand = _.chain(validBrand).cloneDeep().set('data.attributes.code', 'M')
            server.inject({url:'/brands', method:'POST', payload:invalidBrand}, function (res) {
                expect(res.statusCode).to.equal(400)
                done()
            })
        })

    })

})