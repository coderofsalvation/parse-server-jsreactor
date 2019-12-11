var pMemoize = require('p-memoize')
var User     = require('./../../User')

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
    this.getSchema = pMemoize(this.getSchema,{maxAge:opts.MEMOIZE_AGE})

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
            console.log("registering "+c+".afterSave etc hooks")
            var cb = async (type,className,request) => {
                var input = {className,request}
                input[type] = true
                if( request.user ) await User.extend(request.user,input) // convenient flat userobject useable by triggers
                await bre.run(input)
                if( type.match(/^after/) ) return request.objects
                if( className == "User" ) return request.object
            }
            var createCallback = (type) => cb.bind(this,type,c)
            var className = c
            if( c == "User" ) className = Parse.User // odd exception case see: http://parseplatform.org/Parse-SDK-JS/api/2.10.0/Parse.Cloud.html#.beforeSave
            Parse.Cloud.afterFind(className,    createCallback('afterFind'))
            Parse.Cloud.beforeSave(className,   createCallback('beforeSave'))
            Parse.Cloud.afterSave(className,    createCallback('afterSave'))
            Parse.Cloud.afterDelete(className,  createCallback('afterDelete')) 
            Parse.Cloud.beforeDelete(className,  createCallback('beforeDelete'))
            listeners[c] = true                   
        })
    
    }

    opts.bre.addChannel(this)

    return this
}
