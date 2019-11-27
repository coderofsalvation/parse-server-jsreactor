var pMemoize = require('p-memoize')

module.exports = function(opts){
    opts             = opts || {}
    var bre     = opts.bre
    var Parse   = bre.Parse
    var listeners = {}
    var schemas = []
    var dbpaths = []

    this.getSchema = (c) => new Promise( (resolve,reject) => {
        console.log("retrieving schema of class "+c)
        var schema = new Parse.Schema(c)
        schema.get()
        .then( (schema) => {
            for( var a in schema.fields ) dbpaths.push(`${c}.${a}`)
            return schema
        })
        .then(resolve)
        .catch(reject)
    })
    // cache the output of this function for 2 mins  1000*60*2
    this.getSchema = pMemoize(this.getSchema,{maxAge:5000})

    this.title       = "Database"
    this.description = "Detects database changes"
            
    this.init = async () => {

        // always first check if config changed
        var cfg = await Parse.Config.get()
        opts.classes = cfg.attributes.breClasses || []
        var promises = opts.classes.map( (c) => this.getSchema(c) )
        await Promise.all(promises)
        this.trigger = { schema:require('./trigger/schema')(opts) }
        this.action  = { schema:require('./action/schema')(opts)  }
        this.definitions = { 
            dbpath: { type:'string',enum:dbpaths, title:"attribute",options:{inputAttributes:{placeholder:".foo"}}}
        }
        opts.classes.map( (c) => {
            if( listeners[c] ) return // only once
            console.log("registering "+c+".afterSave")
            var cb = (type) => function(className,request){
                var input = {className,object:request.object}
                input[type] = true
                bre.run(input)
                .then( console.log )
                .catch( (e) => console.error(e.stack) )
            }.bind(this,c)  
            Parse.Cloud.afterSave(c,cb('beforeSave'))
            Parse.Cloud.afterSave(c,cb('afterSave'))
            Parse.Cloud.beforeDelete(c,cb('beforeDelete'))
            Parse.Cloud.afterDelete(c,cb('afterDelete')) 
            listeners[c] = true                   
        })
    
    }

    opts.bre.addChannel(this)

    return this
}
