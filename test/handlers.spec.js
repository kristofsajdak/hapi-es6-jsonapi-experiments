const hh = require('../'),
    Joi = require('joi'),
    Code = require('code'),
    Lab = require('lab'),
    Hapi = require('hapi'),
    _ = require('lodash'),
    expect = Code.expect,
    uuid = require('node-uuid'),
    mongoose = require('mongoose'),
    converters = hh.converters


var lab = exports.lab = Lab.script()

const schema = {
    type: 'brands',
    attributes: {
        code: Joi.string().min(2).max(10),
        description: Joi.string()
    }
}


lab.experiment('convert an hh schema to mongoose model', ()=> {

    lab.test.skip('attributes are transferred as is', (done)=> {
        var model = converters.toMongooseModel(schema);
        expect(model).to.not.be.undefined()
        expect(model.schema.paths['attributes.code']).to.not.be.undefined()
        expect(model.schema.paths['attributes.description']).to.not.be.undefined()
        done()

    })

})

lab.experiment('register an hh get route', ()=> {

    const route = hh.routes.get(schema)

    var id = uuid.v4();

    var mf = {
        _id: id,
        attributes: {
            code: 'MF',
            description: 'Massey Furgeson'
        }
    };

    var Brands = hh.models['brands'];

    lab.before((done)=> {
        mongoose.connect('mongodb://localhost/test', function (err) {
            Brands.create(mf, function (err, result) {
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

    lab.test('query with an existing id returns result', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.id=${id}`}, function (res) {
            expect(res.result).to.deep.equal({data: converters.toJsonApi([mf])})
            expect(res.statusCode).to.equal(200)
            done()
        })

    })

    // todo add tests for array id value

    lab.test('query with an attribute works', (done)=> {
        var server = buildServer(route);

        server.inject({url: `/brands?filter.code=MF`}, function (res) {
            expect(res.result).to.deep.equal({data: converters.toJsonApi([mf])})
            expect(res.statusCode).to.equal(200)
            done()
        })

    })

    // todo add tests for array attribute value

})

function buildServer(route) {
    const server = new Hapi.Server()
    server.connection()
    server.route(route)
    return server;
}
