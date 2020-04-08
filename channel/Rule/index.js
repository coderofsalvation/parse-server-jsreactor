// default conditional operators from json-logic-schema
var debug = require('@coderofsalvation/jsreactor/node_modules/debug')('parse-server-jsreactor/channel/rule')
var _         = require('@coderofsalvation/jsreactor/_')
var pMemoize  = require('p-memoize')
var peach     = require('promise-each')

module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Rule" // this is the channel name
    this.description = " "  

    
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

    this.runWave = (state,done) => {
        var waves     = state.config.waves
        var waverule  = waves[state.wave]
        var firsttime = state.wave == 0 && state.delay_execute == 0
        var trigger = false
        if( !waverule                     )    return done() // no more rules
        if( waverule.active === 0         )    return        // disabled
        if( state.delay_execute < 0          ) return done() // wave is done
        state.delay_execute-=1
        if( state.delay_execute === 0 ){
          waverule = waves[ state.wave + state.wave === 0 ? 0 : 1]
          if(waverule){
            state.wave += 1
            state.delay_execute = waverule.delay_execute 
            trigger = waverule
          }
        }
        if( firsttime ) trigger = waverule
        state.trigger = trigger
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
            .then( async (ruleWaves) => {
                for( var i in ruleWaves ){
                    var RuleWave = ruleWaves[i]
                    debug("rulewave")
                    // process wave 
                    var ruleWave = RuleWave.toJSON()
                    var done     = false
                    this.runWave(ruleWave, () => {
                        debug("ruleWave done")
                        this.waveDone(RuleWave)
                        done = true
                    })
                    if( done ) return // no more work needed
                    var trigger = ruleWave.trigger
                    delete ruleWave.trigger
                    await RuleWave.save( ruleWave )
                    debug("delay_execute: "+ruleWave.delay_execute)
                    // trigger subrule if needed
                    if( trigger !== false && trigger.rule ){
                        this.log("triggered rule ",ruleWave)
                        debug("getting Rule id"+trigger.rule)
                        var Rule = await new Parse.Query('Rule').get(trigger.rule)
                        var res = await bre.Channel.runActions(Rule.toJSON(),{output:{},...ruleWave.config.input,getWaveRule: () => ruleWave},{})
                        ruleWave.config.input = res.output
                        await RuleWave.save(ruleWave) // update
                    }
                }
                setTimeout(resolve, process.env.TEST ? 1 : 2000) // 2 sec of pause to offload server 
            })
        })
        Promise.resolve(reqs)
        .then( peach( processWave ) )
        .then(resolve)
        .catch(reject)
    })

    this.init = async () => {
        this.trigger = {
            schema:  [
                {
                    type:"object",
                    title:"other rule triggered this rule",
                    properties:{
                        type: bre.addType('onRuleWave', async (input,cfg) => {
                            return input.getRuleWave !== undefined
                        })
                    }
                },
            ]
        }

        this.getRules = () => {
            var rules = bre.rules
                        .sort( (a,b) => a.priority > b.priority ) 
            return {
                title: rules.map( (r) => r.name     ),
                value: rules.map( (r) => r.objectId )
            }
        }

        this.setupWave  = async (input,config,results) => {
            debug('setupWave()')
            if( !input.test ){
                var rule     = results.events[0].params
                var ruleWave = new Parse.Object("RuleWave")
                ruleWave.set('wave',       input.wave       || 0)
                ruleWave.set('delay_execute', input.delay_execute || config.waves[0].delay_execute )
                ruleWave.set('name',       (input.delay_execute||input.wave) && input.name ? input.name : rule.name )
                ruleWave.set('config', {RuleWave:{objectId:rule.objectId},...config,input})
                await ruleWave.save()
            }else{
                setTimeout( () => {
                    config.waves.map( async (wave) => {
                        bre.log(`TEST mode enabled: firing subrule ${wave.rule} immediately`)
                        var Rule = await new Parse.Query("Rule").get(wave.rule)
                        var res = await bre.Channel.runActions(Rule.toJSON(),{output:{},...input,getWaveRule: () => wave},{})
                        bre.log( JSON.stringify(res,null,2) )
                    })
                },500) // lets give the current action some headroom to finish (time) + get readable logs
            }
        }
 
        this.action = {
            schema: [
                {
                    type:"object",
                    title:"execute rule(s)",
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
