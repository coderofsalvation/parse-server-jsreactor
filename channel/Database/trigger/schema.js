let _ = require('@coderofsalvation/jsreactor/_')

module.exports = function(opts){
    var bre = opts.bre
    
    var docs = `click for <a href="${process.env.JSREACTOR_DATABASE_DOC ? process.env.JSREACTOR_DATABASE_DOC : "https://github.com/coderofsalvation/parse-server-jsreactor/blob/master/doc/database.md"}" target="_blank">documentation here</a>`

    // channel specific operators
    var conditions = (slug) => ([
        {
            type:"object",
            title:slug+"is requested",
            properties:{
                type: bre.addType('onDatabaseRequest', async (input,cfg) => {
                    return input.beforeFind && input.className == cfg.item
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' ',
                    description:docs
                }
            }
        },
        {
            type:"object",
            title:slug+"is being returned",
            properties:{
                type: bre.addType('onDatabaseReturn', async (input,cfg) => {
                    return input.afterFind && input.className == cfg.item
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' ',
                    description:docs
                }
            }
        },
        {
            type:"object",
            title:slug+"is being created",
            properties:{
                type: bre.addType('onDatabaseCreate', async (input,cfg) => {
                    return input.beforeSave && input.className == cfg.item && input.request.object.isNew()
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' ',
                    description:docs
                }
            }
        },
        {
            type:"object",
            title:slug+"is created",
            properties:{
                type: bre.addType('onDatabaseCreated', async (input,cfg) => {
                    return input.afterSave && input.className == cfg.item && input.request.object.existed() === false
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' ',
                    description:docs
                }
            }
        },
        {
            type:"object",
            title:slug+"was updated",
            properties:{
                type: bre.addType('onDatabaseUpdate', async (input,cfg) => {
                    return input.afterSave && input.className == cfg.item
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' ',
                    description:docs
                }
            }
        },
        {
            type:"object",
            title:slug+"is being deleted",
            properties:{
                type: bre.addType('onDatabaseBeforeDelete', async (input,cfg) => {
                    return input.beforeDelete && input.className == cfg.item
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' ',
                    description:docs
                }
            }
        },
        {
            type:"object",
            title:slug+"was deleted",
            properties:{
                type: bre.addType('onDatabaseDelete', async (input,cfg) => {
                    return input.afterDelete && input.className == cfg.item
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' ',
                    description:docs
                }
            }
        },
        {
            type:"object",
            title:"user logs in",
            properties:{
                type: bre.addType('Parse.beforeLogin', async (input,cfg) => {
                    return input.beforeLogin
                })
            }
        }         
    ])
    
    // default conditional operators from json-logic-schema
    var operators = require('@coderofsalvation/jsreactor/schema.operators')
    
    return conditions('object ')
                .concat(operators('value ',{ type:"string","$ref":"#/definitions/dbpath" }))

}
