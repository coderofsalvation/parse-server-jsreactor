module.exports = function(opts){
    var bre = opts.bre
    
    // channel specific operators
    var conditions = (slug) => [
        {
            type:"object",
            title:slug+"was created",
            properties:{
                type: bre.addType('DBcreated', async (input,cfg) => input.afterSave && input.className == cfg.item ),
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' '
                }
            }
        }
        /*
        {
            type:"object",
            title:slug+"was updated",
            properties:{
                type:{type:"string",default:"DBupdated",pattern:"^DBupdated$",options:{hidden:true}},
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
                type:{type:"string",default:"DBdeleted",pattern:"^DBdeleted$",options:{hidden:true}},
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' '
                }
            }
        },
        {
            type:"object",
            title:slug+"property equals",
            properties:{
                type:{type:"string",default:"DBequals",pattern:"^DBequals$",options:{hidden:true}},
                item:{
                    type:"string",
                    enum: opts.classes,
                    default: opts.classes.length ? opts.classes[0]: ' '
                }
            }
        }
        */
    ]
    
    // default conditional operators from json-logic-schema
    var operators = require('jsreactor/schema.operators')
    
    return conditions('object ')
                .concat(operators('value ',{ type:"string","$ref":"#/definitions/dbpath" }))

}
