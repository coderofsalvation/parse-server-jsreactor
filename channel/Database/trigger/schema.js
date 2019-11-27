module.exports = function(opts){
    var bre = opts.bre
    
    // channel specific operators
    var conditions = (slug) => ([
        {
            type:"object",
            title:slug+"was created",
            properties:{
                type: bre.addType('DBcreated', async (input,cfg) => {
                    return input.beforeSave && input.className == cfg.item && !input.object.objectId
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' '
                }
            }
        },
        {
            type:"object",
            title:slug+" was updated",
            properties:{
                type: bre.addType('DBupdated', async (input,cfg) => {
                    return input.afterSave && input.className == cfg.item
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' '
                }
            }
        },
        {
            type:"object",
            title:slug+"was deleted",
            properties:{
                type: bre.addType('DBdeleted', async (input,cfg) => {
                    return input.afterDelete && input.className == cfg.item
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' '
                }
            }
        },
        {
            type:"object",
            title:"user views "+slug+"(s)",
            properties:{
                type: bre.addType('DBfind', async (input,cfg) => {
                    return input.beforeFind
                }),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' '
                }
            }
        },
        {
            type:"object",
            title:"user logs in",
            properties:{
                type: bre.addType('DBlogin', async (input,cfg) => {
                    return input.beforeLogin
                })
            }
        }         
    ])
    
    // default conditional operators from json-logic-schema
    var operators = require('jsreactor/schema.operators')
    
    return conditions('object ')
                .concat(operators('value ',{ type:"string","$ref":"#/definitions/dbpath" }))

}
