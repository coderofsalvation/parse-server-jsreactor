let RuleAction = require('./../../channel/Rule')
var Javascript = require('@coderofsalvation/jsreactor/channel/Javascript')
var Scheduler  = require('./../../channel/Scheduler')
const z         = require('zora')

var sleep      = (sec) => new Promise((r,j) => setTimeout(r,sec*1000) )
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
                        "js": "if( input.item ) input.output.succes = 123;"
                    }
                },
                "channel": "Javascript"
            }
        ],
        "trigger": [
        {
            "config": {
            "type": "matchDatabaseObject",
            "field": "Foo.targetDate",
            "offset": offset
            },
            "channel": "Scheduler"
        }
        ]
    }
}


const ParseMockDB = require('parse-mockdb');
const Parse = require('parse-shim');
require('./mock/Cloud')(Parse) 

ParseMockDB.mockDB();
// create database-classes
Parse.Object.extend('Rule') 
Parse.Object.extend('Foo')
const FooSchema = new Parse.Schema('Foo');
FooSchema.addDate('targetDate')


var BRE = false
var channel
var today     = new Date()
today.setHours(14, 10, 0, 0);
var targetDate  = new Date(today);
targetDate.setDate(targetDate.getDate() + (-offset) );
console.log("todays date:"+ (new Date(today)))
console.log("target date:"+targetDate)


var setup = async (z) => {
    BRE = require('./../../.')(Parse) // index.js
    new Scheduler({bre:BRE})
    new Javascript({bre:BRE})
    channel = new RuleAction({bre:BRE})
    z.ok(true,"inited")
        // setup rules in DB
    var Rule = new Parse.Object("Rule")
    await Rule.save(testDummyRule)
    rules = await new Parse.Query("Rule").find() 
    z.equal(rules.length, 1,"1 rules should be saved to db")
    // setup User
    
    var u = new Parse.Object("Foo")
    u.set('targetDate', targetDate)
    await u.save()
    
    BRE.loadRuleConfigs = async () => {
        var rules = await new Parse.Query("Rule").find()
        return rules.map( (r) => r.toJSON() )
    }
}
    
z.test('run scheduler (match database date)', async (t) => new Promise( async (resolve,reject) => {
    //console.log("offsetdate: "+targetDate)
    //console.log("today: "+today)
    await setup(z)
    var result = []
    var output = []
    
    var input  = {schedulerDaily:true}
    var result = await BRE.run(input)
    sleep(1) 
    console.dir(result)
    t.ok(input.output.succes,"item was passed to javascript")
    resolve()
}))
    