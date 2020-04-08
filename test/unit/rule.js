let RuleAction = require('./../../channel/Rule')
var HelloWorld = require('@coderofsalvation/jsreactor/channel/HelloWorld')
var Javascript = require('@coderofsalvation/jsreactor/channel/Javascript')
var Input      = require('@coderofsalvation/jsreactor/channel/Input')
const z         = require('zora')

var sleep      = (sec) => new Promise((r,j) => setTimeout(r,sec*1000) )
var ids        = {}
var testDummyRule = (id) => ({
    "name": id,
    "config": {
      "basic": {
        "name": id,
        "notes": "test",
        "disabled": false
      },
      "action": [
        {
            "config": {
                "type": "javascript",
                "config": {
                    "js": `console.log(JSON.stringify({id:'${id}',input},null,2)) ; input.bar = String(input.bar)+'${id}'; input.output.foo = input.foo+10`
                }
            },
            "channel": "Javascript"
        }
      ],
      "trigger": [
        { 
          "config": {
            "type": "helloEquals",
            "value": "123"
          },
          "channel": "HelloWorld"
        }
      ]
    },
    "triggerChannel": "HelloWorld"
})


const ParseMockDB = require('parse-mockdb');
const Parse = require('parse-shim');
ParseMockDB.mockDB();
// create database-classes
Parse.Object.extend('Rule') 
Parse.Object.extend('RuleWave')
require('./mock/Cloud')(Parse) 

var BRE = false
var channel

var setup = async (z) => {
    BRE = require('./../../.')(Parse) // index.js
    new HelloWorld({bre:BRE})
    new Input({bre:BRE})
    new Javascript({bre:BRE})
    channel = new RuleAction({bre:BRE})
    z.ok(true,"inited")

    var dbitem = () => ({
        "name": "test",
        "config": {
            "basic": {
                "name": "test rule wave",
                "notes": ""
            },
            "extra": {
                "disabled": false,
                "language": "ALL",
                "priority": 1000,
                "triggered": 0
            },
            "action": [
                {
                    "config": {
                        "type": "rule",
                        "waves": [
                            {
                            "rule": ids['AAA'],
                            "delay_execute": 3
                            },
                            {
                            "rule": ids['BBB'],
                            "delay_execute": 2
                            },
                            {
                            "rule": ids['CCC'],
                            "delay_execute": 2
                            }
                        ]
                    },
                    "channel": "Rule"
                }
            ],
            "trigger": [{ 
                "config": {
                    "type": "exist",
                    "value": "foo"
                },
                "channel": "Input"
            }]
        }
    })
    // setup rules in DB
    var rules = [
        testDummyRule('AAA'),
        testDummyRule('BBB'),
        testDummyRule('CCC'),
    ]
    for( var i in rules ){
        var r = new Parse.Object('Rule')
        await r.save(rules[i])
        console.dir(r)
        ids[ ''+r.get('name') ] = r.id
    }
    // now we have the Rule objectids stored in 'ids' so lets build the rule containing the Rule-action :)
    var r = new Parse.Object('Rule')
    await r.save( dbitem() )
    
    console.dir(ids)
    rules = await new Parse.Query("Rule").find() 
    z.equal(rules.length, 4,"4 rules should be saved to db")
    BRE.loadRuleConfigs = async () => {
        var rules = await new Parse.Query("Rule").find()
        return rules.map( (r) => r.toJSON() )
    }
}
    
z.test('run wave rule (installs RuleWave state)', async () => {
    await setup(z)
    var expected = {
        output:[{"foo":1,"output":{"foo":11},"success-events":{"id":"success-events","type":"DYNAMIC","priority":1,"options":{"cache":false}}},{"output":{"foo":11},"foo":1,"success-events":{"id":"success-events","type":"DYNAMIC","priority":1,"options":{"cache":false}}},{"output":{"foo":21},"foo":11},{"output":{"foo":31},"foo":21}],
        result:[{"wave":0,"delay_execute":2,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":false},{"wave":0,"delay_execute":1,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":false},{"wave":1,"delay_execute":3,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":{"rule":"AAA","delay_execute":3}},{"wave":1,"delay_execute":2,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":false},{"wave":1,"delay_execute":1,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":false},{"wave":2,"delay_execute":2,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":{"rule":"BBB","delay_execute":2}},{"wave":2,"delay_execute":1,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":false},{"wave":3,"delay_execute":2,"name":"test","config":{"RuleWave":{"objectId":"lk12lk3"},"type":"rule","waves":[{"rule":"AAA","delay_execute":3},{"rule":"BBB","delay_execute":2},{"rule":"CCC","delay_execute":2}],"input":{"foo":31}},"objectId":1,"trigger":{"rule":"BBB","delay_execute":2}}]
    }
    var result = []
    var output = []
    // spy runWave to capture function output
    var runWave = channel.runWave
    channel.runWave = async (state) => {
        var x = await runWave(state)
        result.push(x)
        return x
    }
    // spy on runActioins to capture actions
    BRE.Channel.runActions = function(old,a,b,c,d){
        return new Promise( (resolve,reject) => {
            old(a,b,c,d)
            .then( (a) => output.push(a) )
            .then( ( ) => resolve( output[output.length-1] ) )
            .catch( reject )
        })
    }.bind(BRE.Channel,BRE.Channel.runActions)

    await BRE.run({foo:1}) // this triggers the rule.js:setupWave()

    // we do timeouts because BRE rules run seperated by time
    await sleep(1)
    var waves = await new Parse.Query("RuleWave").find()
    z.equal(waves.length,1, "wave should be installed")
    // we do timeouts because Cloud jobs run seperated by time
    for( var i = 0; i < 8; i++ ){
        Parse.Cloud.startJob("Rule engine (waves)")
        await sleep(0.3)
    }
 
    // we do timeouts here to simulate waiting for completion of previous cloudjobs    
    await sleep(1)
    var error = false 
    for( var i in result ){
        var fields = ['delay_execute','wave']
        fields.map( (f) => {
            if( result[i][f] !== expected.result[i][f] ) error = [{i},result[i],expected.result[i]]
        })
    }
    if(error) console.dir(error)
    z.ok( !error, "match output runWave()"  )
    output = output.map( (o) => { delete o.runid; return o})
    z.ok( output.length == expected.output.length, "rules output ok")
        
})
      