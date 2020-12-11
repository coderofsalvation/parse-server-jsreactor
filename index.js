var BRE = require('@coderofsalvation/jsreactor')
var _   = require('@coderofsalvation/jsreactor/_')
var pMemoize = require('p-memoize')
var User = require('./User')

function bre(Parse, opts){
    opts = opts || {}
    opts.MEMOIZE_AGE = process.env.MEMOIZE_AGE || 2000
    
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
            }
            schema.get()
            .then( (s)  => detectExtraColumns(s) )
            .then( resolve )
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
            var q    = new Parse.Query("Rule").equalTo("disabled",false)
            return new Promise( (resolve, reject) => {
                bre
                .createRuleSchema()
                .then( () => q.find() )
                .then( (rules) => rules.map(    (r  ) => r.toJSON() ) ) 
                .then( (rules) => rules.filter( (r  ) => _.get(r,'config.extra.disabled') ? false : r) )
                .then( (rules) => rules.sort(   (a,b) => _.get(a,'config.extra.priority') > _.get(b,'config.extra.priority') ) )
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

		var appId = Parse.CoreManager.get('APPLICATION_ID')
		process[appId] = process[appId] || {
			bre, 
			serverURL: Parse.serverURL, 
			k:[ 
				Parse.CoreManager.get('APPLICATION_ID'), 
				Parse.CoreManager.get('JAVASCRIPT_KEY'), 
				Parse.CoreManager.get('MASTER_KEY')
			]
		}

        function enableParseLogging(req){
            if( bre.log.parse ) return
            var old = bre.log 
            var e   = console.error
            bre.log = function(str,prefix){
                if( typeof str != "string" ) str = JSON.stringify(str,null,2)
                str = (prefix ? prefix : "bre: ") + `${str}`
                if( typeof old == "function" ) old(str)
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
				var appId = Parse.CoreManager.get('APPLICATION_ID')
                if( req.user ) await User.extend(req.user,req.params) // convenient flat userobject useable by triggers
                req.params.request = () => req
                if( opts.logConsole && !bre.log.parse ) enableParseLogging(req)
				let breInstance = process[appId].bre
				// multi-app workaround: reinitilialize Parse client, since its a singleton :/
				breInstance.Parse.initialize.apply( breInstance.Parse, process[appId].k )
				breInstance.Parse.serverURL = Parse.serverURL
				return breInstance.endpoint[cb](req.params)
            }
            Parse.Cloud.define(i, endpoint.bind(null,i))
        }

    }

    var b = BRE(parseAdapter,opts)
    b.log(`MEMOIZE_AGE set to ${opts.MEMOIZE_AGE/1000} seconds`)

    return b
}

bre.Channel = {
    Input:      require('@coderofsalvation/jsreactor/channel/Input'),
    HelloWorld: require('@coderofsalvation/jsreactor/channel/HelloWorld'),
    Javascript: require('@coderofsalvation/jsreactor/channel/Javascript'),
    Server:     require('@coderofsalvation/jsreactor/channel/Server'),
    //Date:       require('@coderofsalvation/jsreactor/channel/Date')
}

bre.emailAdapter = require('./emailAdapter')

module.exports = bre
