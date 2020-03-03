let RuleAction = require('./../../../channel/Rule')
var Javascript = require('@coderofsalvation/jsreactor/channel/Javascript')
var Scheduler  = require('./../../../channel/Scheduler')

var offset = -4

var testDummyRule = {
    config:{
        "basic": {
        "name": "testscheduler",
        "notes": ""
        },
        "extra": {
        "disabled": false,
        "language": "ALL",
        "priority": 1000,
        "triggered": 0,
        "formschema": ""
        },
        "action": [
        {
            "config": {
            "type": "javascript",
            "config": {
                "js": "console.log('hello world');"
            }
            },
            "channel": "Javascript"
        }
        ],
        "trigger": [
        {
            "config": {
            "type": "matchDatabaseObject",
            "field": "User.createdAt",
            "offset": offset
            },
            "channel": "Scheduler"
        }
        ]
    }
}

module.exports = function(z,Parse){
    
    var BRE = false
    var channel
    var today     = new Date()
    today.setHours(0, 0, 0, 0);
    var mydate  = new Date(today);
    mydate.setDate(mydate.getDate() + offset);

    z.test('init BRE',  async (t) => {
        BRE = require('./../../../.')(Parse) // index.js
        new Scheduler({bre:BRE})
        new Javascript({bre:BRE})
        channel = new RuleAction({bre:BRE})
        t.ok(true,"inited")
    })
      
    z.test('loadRuleConfigs', async (t) => {
        // setup rules in DB
        Parse.db.Rule = [testDummyRule]
        BRE.loadRuleConfigs = () => {
           return new Promise( (resolve, reject) => resolve( Parse.db.Rule ))
        }
    })
      
    z.test('run scheduler (match database date)', async (t) => new Promise( async (resolve,reject) => {
        Parse.db.User = [{objectId:"lk3l4k34",createdAt:mydate}]
        //console.log("offsetdate: "+mydate)
        //console.log("today: "+today)
        var result = []
        var output = []
        
        var result = await BRE.run({schedulerDaily:true})
        t.ok(result.output.items.length == 1)
        resolve()
    }))
      
}