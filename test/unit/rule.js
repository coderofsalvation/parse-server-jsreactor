let RuleAction = require('./../../../channel/Rule')
var HelloWorld = require('@coderofsalvation/jsreactor/channel/HelloWorld')
var Javascript = require('@coderofsalvation/jsreactor/channel/Javascript')
var Input      = require('@coderofsalvation/jsreactor/channel/Input')

var testDummyRule = (id) => ({
    "createdAt": "2019-11-10T13:47:45.696Z",
    "updatedAt": "2019-11-10T13:47:59.796Z",
    "name": "["+id+"]",
    "config": {
      "basic": {
        "name": "test",
        "notes": "test",
        "disabled": false
      },
      "action": [
        {
            "config": {
                "type": "javascript",
                "config": {
                    "js": "input.output.foo = input.foo+10"
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
    "triggerChannel": "HelloWorld",
    "objectId": id
})

module.exports = function(z,Parse){
    
    var BRE = false
    var channel

    z.test('init BRE',  async (t) => {
        BRE = require('./../../../.')(Parse) // index.js
        new HelloWorld({bre:BRE})
        new Input({bre:BRE})
        new Javascript({bre:BRE})
        channel = new RuleAction({bre:BRE})
        t.ok(true,"inited")
    })
      
    z.test('loadRuleConfigs', async (t) => {
        var dbitem = {
            "createdAt": "2019-11-10T13:47:45.696Z",
            "updatedAt": "2019-11-10T13:47:59.796Z",
            "objectId":"lk12lk3",
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
                                "rule": "AAA",
                                "delay_execute": 3
                                },
                                {
                                "rule": "BBB",
                                "delay_execute": 2
                                },
                                {
                                "rule": "CCC",
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
                }] // empty, so its always triggered
            }
        }
        // setup rules in DB
        Parse.db.Rule = [
            dbitem,
            testDummyRule('AAA'),
            testDummyRule('BBB'),
            testDummyRule('CCC')
        ]
        BRE.loadRuleConfigs = () => {
           return new Promise( (resolve, reject) => resolve( Parse.db.Rule ))
        }
    })
      
    z.test('run wave rule (installs RuleWave state)', async () => new Promise( async (resolve,reject) => {
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

        await BRE.run({foo:1})
        for( var i = 0; i < 8; i++ )
            setTimeout( async () => await Parse.Cloud.jobs["Rule engine (waves)"](), i*50 )
        
        setTimeout( () => {
            //console.log( JSON.stringify(result))
            //console.dir(output)
            
            z.ok( JSON.stringify(result) == JSON.stringify(expected.result), "check output runWave()"  )
            output = output.map( (o) => { delete o.runid; return o})
            z.ok( JSON.stringify(output) == JSON.stringify(expected.output), "rules output ok")
            resolve()
        },1000)
    }))
      
}