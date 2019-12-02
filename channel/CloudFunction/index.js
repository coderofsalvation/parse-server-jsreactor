module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Cloud function"
    this.description = "Parse custom API endpoint"  
    this.init = async () => {

        this.cloudFunction = (input,cfg,results) => new Promise( async (resolve,reject) => {
            // bind cloudfunctions to Parse object so that actions can access it
            Parse.Cloud.on = Parse.Cloud.on || {}
            Parse.Cloud.on[cfg.name] = (req) => ({
                congrats: "cloud function is now activated)"
            })
            Parse.Cloud.define( cfg.name, (req) => {
                var cb = Parse.Cloud.on[cfg.name]
                return cb ? cb(req) : {error:`Parse.Cloud.on.${cfg.name} was not initialized (yet, try again)`}
            })
            resolve(true)
        })
        
        this.trigger = {
            schema: [
                {
                    type:"object",
                    title:" ",
                    properties:{
                        type: bre.addType('cloudFunction', this.cloudFunction ),
                        name:{ type:"string",default:"foo",description:"usage: call using Parse.Cloud.run('foo',{...}) and define handler using Parse.Cloud.on.foo = (req) => { ...result_or_promise... }"}
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
