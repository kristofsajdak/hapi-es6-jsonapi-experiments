# hapi-es6-jsonapi-experiments

Prototype for [hapi-harvester](https://github.com/agco/hapi-harvester) 

## usage 

```js
const hhPlugin = require('hapi-harvester')

// initialise a hapi server... register the hapi-harvester plugin
server.register({
    register: hhPlugin, 
    options: {
       // bootstrap with a prebuilt adapter
        adapter: require('hapi-harvester/adapters/mongodb')({mongodbUrl: 'mongodb://localhost/test'})
        // ...
    }
}, function (err) {
    
    // define a jsonapi schema with Joi validation 
    var brands = {
        type: 'brands',
        attributes: {
            code: Joi.string(),
            description: Joi.string()
        }
    }
    
    // retrieve the plugin namespace from the server object
    const hh = server.plugins['hh']
    // call routes.get to generate a hapi route definition  
    const brandsGet = hh.routes.get(brands)
    // register the route
    server.route(brandsGet)
    
})
```



```js

// as simple can be, routes.get generates a hapi route definition
// ootb this comes with a validate block, and a handler which delegates work to the configured adapter
{ method: 'GET',
  path: '/series',
  config: { 
    validate: 
        { 
            query: {
                filter : {
                    id: Joi.string().guid().description('id'),
                    code: Joi.string(),
                    description: Joi.string()
                } 
            }, 
            options: {
                allowUnknown: true
            } 
        } 
    },
    handler: [Function] }
    
// add, remove, change your own properties before registering it as a route 
server.route(_.merge(brandsGet, {
        config: {
            auth: false, // skip authentication
            // properties below are used by hapi-swagger
            description: 'Get brands',
            notes: 'Returns all the brands we are looking for',
            tags: ['api']
        }
    }))

```

```js
    // generate additional routes using routes.getById .post .patch .delete
    server.route(hh.routes.getById(brands))
    server.route(hh.routes.post(brands))
    server.route(hh.routes.patch(brands))
    server.route(hh.routes.delete(brands))
    
```

