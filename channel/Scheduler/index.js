// default conditional operators from json-logic-schema
var _         = require('@coderofsalvation/jsreactor/_')
var pMemoize = require('p-memoize')

module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Scheduler" // this is the channel name
    this.description = "automatic recurring trigger"  

    this.init = async () => {
        this.definitions = { 
            day: { type:'string',enum:['monday','tuesday','wednesday','thursday','friday','saturday','sunday']}
        }
        this.trigger = {
            schema:  [
                {
                    type:"object",
                    title:"every hour",
                    properties:{
                        type: bre.addType('everyHour', (input,cfg,results) => input.schedulerHourly === true ),
                    }
                },
                {
                    type:"object",
                    title:"every 6 hours",
                    properties:{
                        type: bre.addType('every6Hour', (input,cfg,results) => input.scheduler6Hourly === true ),
                    }
                },
                {
                    type:"object",
                    title:"every day",
                    properties:{
                        type: bre.addType('everyDay', (input,cfg,results) => input.schedulerDaily === true)
                    }
                },
                {
                    type:"object",
                    title:"every X of the week",
                    properties:{
                        type: bre.addType('everyWeek', (input,cfg,results) => input.schedulerWeekly === true ),
                        day:{"$ref":"#/definitions/day"}
                    }
                },  
                {
                    type:"object",
                    title:"every X of the month",
                    properties:{
                        type: bre.addType('everyMonth', (input,cfg,results) => input.schedulerMonthly === true ),
                        day:{"$ref":"#/definitions/day"}
                    }
                },
                {
                    type:"object",
                    title:"match date in database",
                    description:"trigger x days before/after date-column",
                    properties:{
                        type: bre.addType('matchDatabaseObject', async (input,cfg,results) => {
                            if( !(input.schedulerDaily && cfg.offset && cfg.field) ) return false
                            var className = cfg.field.split('.')[0]
                            var property  = cfg.field.split('.')[1]
                            var date     = new Date()
                            date.setDate( date.getDate() + cfg.offset + 1)
                            date.setHours(0, 0, 0, 0);
                            var datePlusOne  = new Date(date);
                            datePlusOne.setDate(datePlusOne.getDate() + 1);
                            var q = new Parse.Query(className) 
                                        .greaterThanOrEqualTo(property, date)
                                        .lessThan(property, datePlusOne)
                            
                            input.output.offset = String(cfg.offset).replace(/-/,'')
                            input.output.items = await q.find()
                            var d = {
                                a: new Date(date).toISOString().substr(0,10),
                                b: new Date(datePlusOne).toISOString().substr(0,10)
                            }
                            console.log(`searching for ${className}-items with '${property}' between ${d.a} and ${d.b} (offset=${cfg.offset})`)
                            console.log( (input.output.items ? input.output.items.length : 0 ) + ` ${className}'s found` )
                            return input.output.items.length != 0 ? true : false
                        }),
                        field:{ type:"string","$ref":"#/definitions/dbpath" },
                        offset:{ type:"integer",format:"number",description:"days",minimum:-360,maximum:360}
                    }
                }                            
            ]
        }
        
        this.action  = {
            schema: []            
        }

    }

    var runScheduler = (args,req) => {
        return new Promise( (resolve,reject) => {
            Parse.Cloud.run('bre',args)
            .then(resolve)
            .catch(reject)
        })
    }

    Parse.Cloud.job("Rule engine (hourly)",  runScheduler.bind(this,{schedulerHourly:true}) )
    Parse.Cloud.job("Rule engine (6hourly)", runScheduler.bind(this,{scheduler6Hourly:true}) )
    Parse.Cloud.job("Rule engine (daily)",   runScheduler.bind(this,{schedulerDaily:true}) )
    //Parse.Cloud.job("Rule engine (weekly)",  runScheduler.bind(this,{schedulerWeekly:true}) )
    //Parse.Cloud.job("Rule engine (monthly)", runScheduler.bind(this,{schedulerMonthly:true}) )
        
    opts.bre.addChannel(this)
  
    return this
}
