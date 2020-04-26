let RuleAction = require('./../../channel/Rule')
var Javascript = require('@coderofsalvation/jsreactor/channel/Javascript')
var Database      = require('./../../channel/Database')
const z        = require('zora')

var sleep      = (sec) => new Promise((r,j) => setTimeout(r,sec*1000) )
var ids        = {}
var testRule = (id) => ({
    "name": id,
    "config": {
        "basic": {
          "name": "apply default-role & ACL when user registers",
          "notes": "by default users need to receive default actions (bundled by default-role).\n\ndevelopers:\n* emitter:This event is internally sent by Parse when Parse.signUp() is called\n* webcomponent(s): <app-register>"
        },
        "extra": {
          "disabled": false,
          "language": "ALL",
          "priority": 500,
          "triggered": 0,
          "formschema": ""
        },
        "action": [
          {
            "config": {
              "type": "javascript",
              "config": {
                "js": "console.log('DATABASECREATE');console.log(typeof input.request.object); console.log(typeof input.request.object.get);"
              }
            },
            "channel": "Javascript"
          }
        ],
        "trigger": [
          {
            "config": {
              "item": "Group",
              "type": "onDatabaseCreated"
            },
            "channel": "Database"
          }
        ]
    },
})


const ParseMockDB = require('parse-mockdb');
const Parse = require('parse-shim');
ParseMockDB.mockDB(Parse);
require('./mock/Cloud')(Parse, ParseMockDB) 
// create database-classes
Parse.Object.extend('Rule') 

Parse.Config.get = () => new Promise( (resolve,reject) => resolve({
    attributes:{
        breClasses:["Group"]
    }
}))

var BRE = false

var setup = async (z,result) => {
    BRE = require('./../../.')(Parse) // index.js
    new Database({bre:BRE,classes:['Group']})
    new Javascript({bre:BRE})
    
    z.ok(true,"inited")

    // setup rules in DB
    var rules = [testRule('AAA')]
    for( var i in rules ){
      var rule = rules[i]
      var r    = new Parse.Object('Rule')
      for( var i in rule ) r.set(i,rule[i])
      await r.save()
      console.log("save rule")
    }

    BRE.loadRuleConfigs = async () => {
      var rules = await new Parse.Query("Rule").find()
      return rules.map( (r) => r.toJSON() )
    }

    await BRE.init()
    var run = BRE.run
    BRE.run = async (f,input) => {
      if( input.className == 'Group' && input.request.object ) result.executed = true
      f(input)
    }
    BRE.run = BRE.run.bind(BRE,run)
    
    var group = new Parse.Object("Group")
    group.set("name", "foo@example.com");
    await group.save()
    group = await new Parse.Query("Group").get(group.id)
    z.ok(group.id,"new group was created")
}
      
z.test('test if BRE database hooks truely receive parse objects', async () => {
    var result = {}
    var group   = await setup(z,result)
    z.ok(result.executed,'run() executed')
})