/*
 * the goal of this test is to see whether delayed 
 * rules (using the scheduler-rules) are fired at 
 * the right date 
 */
let RuleAction  = require('./../../channel/Rule')
var Javascript  = require('@coderofsalvation/jsreactor/channel/Javascript')
var Scheduler   = require('./../../channel/Scheduler')
const z         = require('zora')
var timemachine = require('timemachine')

var sleep      = (sec) => new Promise((r,j) => setTimeout(r,sec*1000) )
var offset 	   = -5
var delaydays = 4

var reminder1 = {
    config:{
	  "basic": {
		"name": "remind presentation submissions -14days",
		"notes": "this will run every hour to see whether (taken) timeslots still need a presentation, therefore reminder-notifications need to be sent out. "
	  },
	  "extra": {
		"disabled": false,
		"language": "ALL",
		"priority": 1000,
		"triggered": 0,
		"formschema": "{\n  \"type\":\"object\",\n  \"properties\":{\n    \"test\":{\n      \"type\":\"boolean\",\n      \"default\":true,\n      \"options\":{\"hidden\":true}\n    },\n    \"offset\":{\n      \"type\":\"integer\",\n      \"description\":\"amount of days before timeslot-date\",\n      \"default\":-14,\n      \"options\":{\"hidden\":true}\n    },\n    \"field\":{\n      \"type\":\"string\",\n      \"default\":\"Timeslot.date\",\n      \"options\":{\"hidden\":true}\n    },\n    \"bcc\":{\n      \"type\":\"string\",\n      \"format\":\"email\",\n      \"title\":\"email\",\n      \"default\":\"your@gmail.com\",\n      \"description\":\"for testing purposes (tweak email template variables e.g.\"\n    },\n    \"id_timeslot\":{\n      \"type\":\"string\",\n      \"default\":\"DMgB3H3BV8\",\n      \"description\":\"this will force-trigger this rule for this timeslot<br>this only works when test-mode is turned on in the trigger (leave empty to apply to all timeslots)\"\n    }\n  }\n}"
	  },
	  "action": [
		{
		  "config": {
			"type": "javascript",
			"config": {
			  "js": "if( input.item ) input.output.reminder1 = true;"
			}
		  },
		  "channel": "Javascript"
		},
		{
		  "config": {
			"type": "rule",
			"waves": [
			  {
				"rule": "DbyNXH0xjN",
				"delay_execute": delaydays*24
			  },
			  {
				"rule": "HcLZPZzNk5",
				"delay_execute": delaydays*24
			  }
			]
		  },
		  "channel": "Rule"
		}
	  ],
	  "trigger": [
		{
		  "config": {
			"test": false,
			"type": "matchDatabaseObject",
			"field": "Foo.targetDate",
            "offset": offset
		  },
		  "channel": "Scheduler"
		}
	  ]
	}
}

var reminder2 = {
	config:{
	  "basic": {
		"name": "remind presentation submissions  -7days",
		"notes": "this is a subrule of this rule: https://penna-lab.gitlab.io/webcomponents/component/app-bre/#3EbbBGGzVr"
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
			  "js": "if( input.item ) input.output.reminder2 = true; console.log('reminder r1!')"
			}
		  },
		  "channel": "Javascript"
		}
	  ],
	  "trigger": [
		{
		  "config": {
			"type": "onRuleWave"
		  },
		  "channel": "Rule"
		}
	  ]
	}
}

var reminder3 = {
	"config":{
	  "basic": {
		"name": "remind presentation submissions -12days",
		"notes": "this is a subrule of this rule: https://penna-lab.gitlab.io/webcomponents/component/app-bre/#3EbbBGGzVr"
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
			  	"js": "if( input.item ) input.output.reminder3 = true;console.log('reminder r2!')"
			}
		  },
		  "channel": "Javascript"
		}
	  ],
	  "trigger": [
		{
		  "config": {
			"type": "onRuleWave"
		  },
		  "channel": "Rule"
		}
	  ]
	}
}

const ParseMockDB = require('parse-mockdb');
const Parse = require('parse-shim');
require('./mock/Cloud')(Parse) 


let mockDB = async () => {
	ParseMockDB.mockDB();
	// create database-classes
	Parse.Object.extend('Rule')
	Parse.Object.extend('RuleWave') 
	Parse.Object.extend('Foo')
	const FooSchema = new Parse.Schema('Foo');
	FooSchema.addDate('targetDate')
	
	const RuleSchema = new Parse.Schema('Rule');
	RuleSchema.addObject('config')
}

var BRE = false
var channel
var hours = 0
var mins  = 0
timemachine.config({
	dateString: `April 22, 2020 ${hours}:${mins}:59`
});
var today     = new Date()
today.setHours(hours, mins, 0, 0);
var targetDate  = new Date(today);  // date in database
var _targetDate  = targetDate.getDate() + Math.abs(offset) * 2
var triggerDate = [
	new Date(today),
	new Date(today),
	new Date(today)
]

triggerDate[0].setDate( targetDate.getDate() + Math.abs(offset) ),
triggerDate[1].setDate( targetDate.getDate() + Math.abs(offset) + delaydays ),
triggerDate[2].setDate( targetDate.getDate() + Math.abs(offset) + (delaydays*2)    )
targetDate.setDate(  _targetDate );

var setup = async (z,reminder1,reminder2,reminder3) => {
	// not sure why, but we need the reminders passed as args
	// since we've somehow mysteriously lost scope here
	await mockDB()
    BRE = require('./../../.')(Parse) // index.js
    new Scheduler({bre:BRE})
    new Javascript({bre:BRE})
	channel = new RuleAction({bre:BRE})
    z.ok(true,"inited")
    // setup rules in DB
    var x = new Parse.Object("Rule")
	x.set('config',reminder1.config)
	await x.save()
	x = new Parse.Object("Rule")
    x.set('config',reminder2.config)
	await x.save()
	x = new Parse.Object("Rule")
	x.set('config',reminder3.config)
    await x.save()
	rules = await new Parse.Query("Rule").find() 
	z.equal(rules.length, 3,"3 rules should be saved to db")
	// update objectIds (so rule 0 refers to rule 1 & 2 )
    var reminder1 = rules[0].toJSON()
	reminder1.config.action[1].config.waves[0].rule = rules[1].id 
	reminder1.config.action[1].config.waves[1].rule = rules[2].id 
	rules[0].set('config',reminder1.config)
	await rules[0].save()
	z.ok(rules[1].id == reminder1.config.action[1].config.waves[0].rule, "fake id's were created and references were updated")
	
	// setup mock database object with a datefield 'targetDate'
    var u = new Parse.Object("Foo")
    u.set('targetDate', targetDate)
    await u.save()
    
    BRE.loadRuleConfigs = async () => {
        var rules = await new Parse.Query("Rule").find()
        return rules.map( (r) => r.toJSON() )
    }
}
    
z.test('run scheduler (match database date)', async (t) => {
	await setup(z,reminder1,reminder2,reminder3)
    var dates  = []
	dates.current = false
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
    BRE.Channel.runActions = function(dates,old,a,b,c,d){
		dates.push(dates.current || new Date())
        return new Promise( (resolve,reject) => {
            old(a,b,c,d)
            .then( (a) => output.push(a) )
            .then( ( ) => resolve( output[output.length-1] ) )
            .catch( reject )
        })
    }.bind(BRE.Channel,dates,BRE.Channel.runActions)

    var input     = {schedulerDaily:true}
	var execution = await BRE.run(input)
    await sleep(0.2)
	// we do timeouts because BRE rules run seperated by time
    var waves = await new Parse.Query("RuleWave").find()
    if( waves.length > 0 ) throw 'wave should not be installed'
	
	// rewind the date to the 1st trigger
	timemachine.config({
		dateString: triggerDate[0].toString().substr(0,21)
	});
    var execution = await BRE.run(input)
	// now the ruleWave has been triggered / saved in db
    await sleep(1) 
    
	// we do timeouts because BRE rules run seperated by time
    var waves = await new Parse.Query("RuleWave").find()
	t.ok( waves.length > 0, 'wave was installed')
    if( waves.length != 1 ) throw 'wave should be installed'
	//console.log(JSON.stringify(waves[0].toJSON(),null,2))
	
	console.log("offset days                : "+offset)
	console.log("fictional today's date     : "+ (new Date(today)))
	console.log("date in db-record          : "+targetDate)
	console.log("expected trigger  #1 date  : "+triggerDate[0].toString() )
	console.log("expected reminder #r1 date : "+triggerDate[1].toString() )
	console.log("expected reminder #r2 date : "+triggerDate[2].toString() )	
	console.log("---")
	console.log("running timemachine:")
	
    // we do timeouts because Cloud jobs run seperated by time
    for( var i = 0; i < (Math.abs(offset)+(delaydays*2))*24; i++ ){
		dates.current	= new Date()
		dates.current.setHours(i, mins, 0, 0);
		process.stdout.write("\r"+dates.current)
        Parse.Cloud.startJob("Rule engine (waves)")
        await sleep(0.1)
    }
	console.dir(dates)
	t.equal( triggerDate[1].toString(), dates[1].toString(), "trigger #2 was triggered at the right date/time")
	t.equal( triggerDate[2].toString(), dates[2].toString(), "trigger #3 was triggered at the right date/time")
	t.ok(input.output.reminder1,"reminder1 js was triggered "+offset+" days before current date")
})
    