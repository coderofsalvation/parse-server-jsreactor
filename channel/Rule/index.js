// default conditional operators from json-logic-schema
var debug = require('@coderofsalvation/jsreactor/node_modules/debug')('parse-server-jsreactor/channel/rule')
var _         = require('@coderofsalvation/jsreactor/_')
var pMemoize  = require('p-memoize')
var peach     = require('promise-each')

module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Rule" // this is the channel name
    this.description = "execute other rule(s)"  

    
    this.createWaveSchema = () => {
        var schema = new Parse.Schema("RuleWave")
        schema.get()
        .then( () => false )
        .catch( (e) => {
            bre.log("fallback: created RuleWave-Class schema in db")
            schema.addString('name');
            schema.addNumber('wave');
            schema.addNumber('delay_execute');
            schema.addObject('config')
            schema.save()
        })
    }

    this.log = (msg,state) => {
        bre.log(`RuleWave '${state.name}' (${state.objectId||''}): ${msg}`)
    }

    this.waveDone = async (state) => {
        this.log("done",state)
        await state.destroy()
    }

    this.runWave = async (state) => {
        var waves     = state.config.waves
        var waverule  = waves[state.wave]
        var firsttime = state.wave == 0 && state.delay_execute == 0
        state.trigger = false
        if( !waverule                     ) return state // no more rules
        if( waverule.active === 0         ) return state // disabled
        if( state.delay_execute < 0          ) return this.waveDone(state) // wave is done
        state.delay_execute-=1
        if( state.delay_execute === 0 ){
          waverule = waves[ state.wave + state.wave === 0 ? 0 : 1]
          if(waverule){
            state.wave += 1
            state.delay_execute = waverule.delay_execute 
            state.trigger = waverule
          }
        }
        if( firsttime ) state.trigger = waverule
        await state.save()
        return state
    }

    this.runWaves = () => new Promise( async (resolve,reject) => {
        debug("runWaves()") 
        var q = new Parse.Query("RuleWave")
        var n = await q.count()    
        var l = 5 // process 5 a time
        var reqs = []
        for( i = 0; i < n; i+=l ) reqs.push({skip:i, limit:l})
        var processWave = (i) => new Promise( async (resolve,reject) => {
            new Parse.Query("RuleWave")
            .skip(i.skip)
            .limit(i.limit)
            .find()
            .then( (ruleWaves) => {
                ruleWaves.map( this.runWave )  
                // run triggered rules
                ruleWaves.map( async (ruleWave) => {
                    if( ruleWave.trigger ){
                        this.log("triggered rule ",ruleWave)
                        debug("getting Rule id"+ruleWave.trigger.rule)
                        var Rule = await new Parse.Query('Rule').get(ruleWave.trigger.rule)
                        var res = await bre.Channel.runActions(Rule,{output:{},...ruleWave.config.input,getWaveRule: () => ruleWave},{})
                        ruleWave.config.input = res.output 
                        await ruleWave.save() // update
                    }
                })
                setTimeout(resolve, process.env.TEST ? 1 : 2000) // 2 sec of pause 
            })
        })
        Promise.resolve(reqs)
        .then( peach( processWave ) )
        .then(resolve)
        .catch(reject)
    })

    this.init = async () => {
        this.trigger = {
            schema:  []
        }

        this.getRules = () => {
            var rules = bre.rules
                        .sort( (a,b) => a.priority > b.priority ) 
            return {
                title: rules.map( (r) => r.name     ),
                value: rules.map( (r) => r.objectId )
            }
        }

        this.setupWave  = async (input,config,results) => new Promise((resolve,reject) => {
            var rule     = results.events[0].params
            var ruleWave = Parse.Object.extend("RuleWave");
            ruleWave.set('wave',       input.wave       || 0)
            ruleWave.set('delay_execute', input.delay_execute || config.waves[0].delay_execute )
            ruleWave.set('name',       input.name       || rule.name )
            ruleWave.set('config', {RuleWave:{objectId:rule.objectId},...config,input})
            ruleWave.save()
            .then(resolve)
            .catch(reject)
        })
 
        this.action = {
            schema: [
                {
                    type:"object",
                    //description:"halt wave using javascript: delete input.user.waves[rule_id]",
                    properties:{
                        type: bre.addType('rule', this.setupWave ),
                        waves:{
                            "type": "array", 
                            "title": " ",
                            format:"table",
                            "items": {
                                "type": "object",
                                "title": " ",
                                "properties": {
                                    "rule": {
                                        "type": "string",
                                        "enum": this.getRules().value,
                                        "options":{enum_titles: this.getRules().title},
                                        "links": [
                                            {
                                              "rel": "» view",
                                              "href": "./#{{self}}",
                                              // Optional - set CSS classes for the link
                                            }
                                          ]
                                    },
                                    "delay_execute": {
                                        "type": "integer",
                                        "format":"number",
                                        "title":"wait hour(s)",
                                        "value":0,
                                        "min":0
                                    }
                                }
                            }                       
                        }
                    }
                } 
            ]           
        }

    
    }

    // monkeypatch run to pass RuleWave input as new input for Rule's
    // so they can re-use the output of previous rule's
    bre.run = function(old,input){
        if( input.getRuleWave ) input = {...input, ...input.getRuleWave() }
        return old(input)
    }.bind(bre,bre.run)

    this.createWaveSchema()
    opts.bre.addChannel(this)
    Parse.Cloud.job("Rule engine (waves)",  this.runWaves )

    return this
}
