// default conditional operators from json-logic-schema
var _         = require('@coderofsalvation/jsreactor/_')
var pMemoize = require('p-memoize')

module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Role" // this is the channel name
    this.description = "filters input based on user Role"  
    this.roles = []
    this.getRoles = (c) => new Promise( (resolve,reject) => {
        console.log("getting roles")
        var q = new Parse.Query("_Role")
        q.find()
        .then( (roles) => this.roles = roles.map( (r) => r.get('name') ) )
        .then(resolve)
        .catch(reject)
    })
    // cache the output of this function for 2 mins  1000*60*2
    this.getRoles = pMemoize(this.getRoles,{maxAge: opts.MEMOIZE_AGE})

    this.init = async () => {
        this.roles = await this.getRoles()
        
        this.trigger = {
            schema:  [
                {
                    type:"object",
                    title:" ",
                    properties:{
                        type: bre.addType('Role', (input,cfg,results) => input.user && input.user[cfg.name] === true ),
                        name:{ type:"string",enum:this.roles}
                    }
                }               
            ]
        }
        
        this.action  = {
            schema: []            
        }
    }

    opts.bre.addChannel(this)
  
    return this
}
