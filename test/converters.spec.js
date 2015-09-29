const hh = require('../'),
    Joi = require('joi'),
    Lab = require('lab'),
    _ = require('lodash'),
    chai = require('chai'),
    expect = chai.expect,
    mongoose = require('mongoose'),
    converters = hh.converters

const lab = exports.lab = Lab.script()

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