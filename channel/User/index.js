var _ = require('@coderofsalvation/jsreactor/_')

module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "User" // this is the channel name
    this.description = "triggers actions based on user state"  
    
    this.init = async () => {
        opts.bre.log("registering "+this.title)
        
        this.trigger = {
            schema:  [
                {
                    type:"object",
                    title:"is logged in",
                    properties:{
                        type: bre.addType('userLoggedIn', (input,cfg,results) => _.get(input,'user.objectId.length') ? true : false)
                    }
                },
                {
                    type:"object",
                    title:"is not logged in",
                    properties:{
                        type: bre.addType('userNotLoggedIn', (input,cfg,results) => _.get(input,'user.objectId.length') ? false : true),
                    }
                },
                {
                    type:"object",
                    title:"has verified email",
                    properties:{
                        type: bre.addType('userVerifiedEmail', (input,cfg,results) => _.get(input,'user.emailVerified') ? true : false ),
                    }
                },
                {
                    type:"object",
                    title:"has not verified email",
                    properties:{
                        type: bre.addType('userVerifiedEmail', (input,cfg,results) => _.get(input,'user.emailVerified') ? true : false ),
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
