const
    adapter = require('../lib/mongodb-adapter')({mongodbUrl: 'mongodb://localhost/test'}),
    Joi = require('joi'),
    Lab = require('lab'),
    _ = require('lodash'),
    chai = require('chai'),
    expect = chai.expect,
    mongoose = require('mongoose')

const lab = exports.lab = Lab.script()


lab.experiment('convert an hh schema to mongoose model', ()=> {

    var model;

    lab.beforeEach((done) => {
        // clean up existing models and schemas as they might have already been registered through hh
        delete mongoose.models['brands'];
        delete mongoose.modelSchemas['brands'];
        const schema = {
            type: 'brands',
            attributes: {
                code: Joi.string().min(2).max(10),
                description: Joi.string()
            }
        }
        model = adapter.processSchema(schema);
        adapter.connect(done)
    })

    lab.afterEach((done)=> {
        adapter.disconnect(done)
    })

    lab.test('attributes are transferred as is', (done)=> {

        expect(model).to.not.be.undefined
        expect(model.schema.paths['attributes.code']).to.not.be.undefined
        expect(model.schema.paths['attributes.description']).to.not.be.undefined
        done()

    })

    lab.test('model instances dont have a __v', (done)=> {

        adapter.create('brands', {data: {attributes: {code: 'MF', description: 'Massey Furgeson'}}}).then((created)=> {
            expect(created.data.__v).to.be.undefined
            expect(created.data.id).to.not.be.undefined
            done()
        })

    })


})
