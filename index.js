var BRE = require('@coderofsalvation/jsreactor')
var _   = require('@coderofsalvation/jsreactor/_')
var pMemoize = require('p-memoize')
var User = require('./User')

function bre(Parse, opts){
    opts = opts || {}
    opts.MEMOIZE_AGE = process.env.MEMOIZE_AGE || (process.env.NODE_ENV == 'production' ? 120000 : 5000)
    
    var parseAdapter = opts.adapter ? opts.adapter : async (bre) => {

        bre.createRuleSchema = async () => new Promise((resolve,reject) => {
            var schema = new Parse.Schema("Rule")
            var detectExtraColumns = (schema) => {
                opts.extraColumns = opts.extraColumns || {}
                var ignore = ['name','objectId','notes','createdAt','updatedAt','ACL','config']
                for( var i in schema.fields){
                    if( ~ignore.indexOf(i) ) continue                    
                    var col = schema.fields[i]
                    var c   = {type: col.type.toLowerCase()}    
                    if( col.defaultValue ) c.default = col.defaultValue
                    var globalSchema   = _.get(opts,`schema.${i}`)
                    if( globalSchema ) c = Object.assign(c,globalSchema)
                    opts.extraColumns[i] = c
                }
                resolve()
            }
            schema.get()
            .then( (s)  => detectExtraColumns(s) )
            .catch( (e) => {
                b.log("fallback: created Rule-Class schema in db")
                schema.addString('name');
                schema.addObject('config')
                schema.save()
                .then(resolve)
                .catch(reject)
            })
        })
   
        // lets specify the function to load rules from DB
        bre.loadRuleConfigs = () => {
            var q    = new Parse.Query("Rule")
            return new Promise( (resolve, reject) => {
                q.find()
                .then( (rules) => rules.map( (r) => r.toJSON() ) ) 
                .then( resolve )
                .catch( (e) => {
                    console.error(e)
                })
            })
        }
        // cache the output of this function for 2 mins e.g.
        //bre.loadRuleConfigs = pMemoize(bre.loadRuleConfigs,{maxAge:opts.MEMOIZE_AGE})


        /* *TODO* removeme...not used i think */
        bre.getInstalledTriggers = (channel) => {
            var q    = new Parse.Query("Rule")
            return new Promise( (resolve, reject) => {
                q.equalTo("triggerChannel",channel)
                q.find()
                .then( (rules) => rules.map( (r) => r.toJSON() ) ) 
                .then( resolve )
                .catch( (e) => {
                    console.error(e)
                })
            })    
        }

        bre.onDatabaseSave = (table,cb) => {
        }

        bre.Parse = Parse

        function enableParseLogging(req){
            var old = bre.log 
            var e   = console.error
            bre.log = function(str,prefix){
                str = (prefix ? prefix : "bre: ") + `${str}`
                old(str)
                req.log.info(str)
            }
            console.error = function(i){
                e(i)
                req.log.error(i)
            }
            bre.log.parse = true
        }

        // register endpoints
        for( var i in bre.endpoint ){
            console.log(`defining Parse.Cloud.${i}`)
            var endpoint = async (cb,req) => {
                if( req.user ) await User.extend(req.user,req.params) // convenient flat userobject useable by triggers
                req.params.request = () => req
                if( !bre.log.parse ) enableParseLogging(req)
                return cb(req.params)
            }
            Parse.Cloud.define(i, endpoint.bind(bre,bre.endpoint[i]))
        }
    
        bre.createRuleSchema()
        .then( () => b.log("checking Rule-class: exist") )
        .catch(console.error)
    }

    var b = BRE(parseAdapter,opts)
    b.log(`MEMOIZE_AGE set to ${opts.MEMOIZE_AGE/1000} seconds`)
    b.Parse = Parse

    return b
}

bre.Channel = {
    Input:      require('@coderofsalvation/jsreactor/channel/Input'),
    HelloWorld: require('@coderofsalvation/jsreactor/channel/HelloWorld'),
    Javascript: require('@coderofsalvation/jsreactor/channel/Javascript'),
    Server:     require('@coderofsalvation/jsreactor/channel/Server')
}

bre.emailAdapter = require('./emailAdapter')

module.exports = bre
