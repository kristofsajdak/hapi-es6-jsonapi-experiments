const hh = require('../'),
    Joi = require('joi'),
    Lab = require('lab'),
    Hapi = require('hapi'),
    _ = require('lodash'),
    chai = require('chai'),
    expect = chai.expect,
    uuid = require('node-uuid'),
    mongoose = require('mongoose'),
    converters = hh.converters

chai.use(require('chai-things'))

var lab = exports.lab = Lab.script()

const schema = {
    type: 'brands',
    attributes: {
        code: Joi.string().min(2).max(10),
        description: Joi.string()
    }
}


lab.experiment('convert an hh schema to mongoose model', ()=> {

    lab.test('attributes are transferred as is', (done)=> {

        // clean up existing models and schemas as they might have already been registered through hh
        delete mongoose.models['brands'];
        delete mongoose.modelSchemas['brands'];

        var model = converters.toMongooseModel(schema);
        expect(model).to.not.be.undefined
        expect(model.schema.paths['attributes.code']).to.not.be.undefined
        expect(model.schema.paths['attributes.description']).to.not.be.undefined
        done()

    })

})

lab.experiment('register an hh get route,', ()=> {

    const route = hh.routes.get(schema)

    const mfId = uuid.v4();
    const mf = {
        _id: mfId,
        attributes: {
            code: 'MF',
            description: 'Massey Furgeson'
        }
    };

    const valtraId = uuid.v4();
    const valtra = {
        _id: valtraId,
        attributes: {
            code: 'VT',
            description: 'Valtra'
        }
    };

    const Brands = hh.models['brands'];

    lab.before((done)=> {
        mongoose.connect('mongodb://localhost/test', function (err) {
            Brands.create(mf, valtra, function (err, result) {
                if (err)done(err)
                else done()
            })
        })
    })

    lab.after((done)=> {
        Brands.remove(function () {
            mongoose.disconnect(done);
        });
    })

    lab.test('query with an existing mf id returns 1 result', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.id=${mfId}`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result.data).to.deep.equal(converters.toJsonApi([mf]))
            done()
        })

    })

    lab.test('query with an array of 2 existing mf and valtra ids returns 2 results', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.id=${mfId},${valtraId}`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result.data).to.include.something.that.deep.equals(converters.toJsonApi(mf))
            expect(res.result.data).to.include.something.that.deep.equals(converters.toJsonApi(valtra))
            done()
        })
    })

    lab.test('query with an attribute works', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.code=MF`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result.data).to.deep.equal(converters.toJsonApi([mf]))
            done()
        })

    })

    lab.test('query with an array of 2 existing mf and valtra codes returns 2 results', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.code=MF,VT`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result.data).to.include.something.that.deep.equals(converters.toJsonApi(mf))
            expect(res.result.data).to.include.something.that.deep.equals(converters.toJsonApi(valtra))
            done()
        })
    })

    lab.test('query with a combination of 2 predicates, an existing mf code and id, returns 1 result', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.id=${mfId}&filter.code=MF`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result.data).to.deep.equal(converters.toJsonApi([mf]))
            done()
        })
    })

    lab.test('query with a combination of 2 predicates, an existing mf code and a non existing id, returns an empty result set', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.id=12345678&filter.code=MF`}, function (res) {
            expect(res.statusCode).to.equal(200)
            expect(res.result.data).to.be.empty
            done()
        })
    })

})

lab.experiment('register an hh post route,', ()=> {

    const route = hh.routes.post(schema)

    const Brands = hh.models['brands'];

    lab.before((done)=> {
        mongoose.connect('mongodb://localhost/test', function (err) {
            if (err)done(err)
            else done()
        })
    })

    lab.after((done)=> {
        Brands.remove(function () {
            mongoose.disconnect(done);
        });
    })

    lab.test('create a brand', (done)=> {
        var server = buildServer(route);

        const mf = {
            attributes: {
                code: 'MF',
                description: 'Massey Furgeson'
            }
        };

        server.inject({url: `/brands`, method:'POST', payload: {data: mf}}, function (res) {
            expect(res.statusCode).to.equal(201)
            expect(res.result.data.id).to.not.be.undefined
            expect(res.result.data.attributes).to.deep.equal(mf.attributes)
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
