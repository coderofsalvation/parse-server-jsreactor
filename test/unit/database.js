let RuleAction = require('./../../channel/Rule')
var Javascript = require('@coderofsalvation/jsreactor/channel/Javascript')
var Input      = require('@coderofsalvation/jsreactor/channel/Input')
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
                "js": "console.log(typeof input.request.object); console.log(typeof input.request.object.get);"
              }
            },
            "channel": "Javascript"
          }
        ],
        "trigger": [{ 
            "config": {
                "type": "exist",
                "value": "foo"
            },
            "channel": "Input"
        }]
    },
})


const ParseMockDB = require('parse-mockdb');
const Parse = require('parse-shim');
ParseMockDB.mockDB(Parse);
require('./mock/Cloud')(Parse) 
// create database-classes
Parse.Object.extend('Rule') 

Parse.Config.get = () => new Promise( (resolve,reject) => resolve({
    attributes:{
        breClasses:["User"]
    }
}))

var BRE = false
var channel

 

ParseMockDB.registerHook('_User', 'afterSave', (request) => new Promise( (resolve,reject) => {
  console.log("user created")
  resolve(request)
}));

var setup = async (z) => {
    BRE = require('./../../.')(Parse) // index.js
    new Input({bre:BRE})
    new Javascript({bre:BRE})
    channel = new RuleAction({bre:BRE})

    z.ok(true,"inited")

    // setup rules in DB
    var rules = [testRule('AAA')]
    for( var i in rules ){
      var rule = rules[i]
      var r    = new Parse.Object('Rule')
      for( var i in rule ) r.set(i,rule[i])
      await r.save()
    }

    var user = new Parse.User();
    user.set("username", "my name");
    user.set("password", "my pass");
    user.set("email", "email@example.com");
    await user.signUp();
    user = await new Parse.Query("User").get(user.id)
    z.ok(user.id,"new user was created")

    BRE.loadRuleConfigs = async () => {
        var rules = await new Parse.Query("Rule").find()
        return rules.map( (r) => r.toJSON() )
    }
    return user
}
      
z.test('test if BRE database hooks truely receive parse objects', async () => {
    var user = await setup(z)
    await BRE.run({foo:1,request:{object:user}})
    await sleep(0.3)
    z.ok(true,'done')
})