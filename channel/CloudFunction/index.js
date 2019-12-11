module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Cloud function"
    this.description = "Parse custom API endpoint"  
    this.init = async () => {

        var docs = `click for <a href="${process.env.JSREACTOR_CLOUDFUNCTION_DOC ? process.env.JSREACTOR_CLOUDFUNCTION_DOC : "https://github.com/coderofsalvation/parse-server-jsreactor/blob/master/doc/cloudfunction.md"}" target="_blank">documentation here</a>`

        this.cloudFunction = (input,cfg,results) => new Promise( async (resolve,reject) => {
            // bind cloudfunctions to Parse object so that actions can access it
            Parse.Cloud.on = Parse.Cloud.on || {}
            if( Parse.Cloud.on[cfg.name] ) resolve(false) // dont run again
            Parse.Cloud.on[cfg.name] = (req) => ({
                congrats: "cloud function is now activated)"
            })
            Parse.Cloud.define( cfg.name, (req) => {
                var cb = Parse.Cloud.on[cfg.name]
                return cb ? cb(req,input,cfg,results) : {error:`Parse.Cloud.on.${cfg.name} was not initialized (yet, try again)`}
            })
            resolve(true)
        })
        
        this.trigger = {
            schema: [
                {
                    type:"object",
                    title:" ",
                    description:docs,
                    properties:{
                        type: bre.addType('cloudFunction', this.cloudFunction ),
                        name:{ type:"string",default:"foo"},
                        config:{
                            type:"object",
                            title:"edit input jsonschema",
                            options:{disable_collapse:false,collapsed:true},
                            properties:{
                                schema:{ 
                                    type:"string", 
                                    title:"jsonschema",
                                    default:JSON.stringify({
                                        "type":"object",
                                        "properties":{
                                          "action":{
                                            "type":"string",
                                            "pattern":"^foo$",
                                            "required":true
                                          },
                                          "param1":{
                                            "type":"boolean",
                                            "required":true
                                          },
                                          "param2_optional":{
                                            "type":"integer",
                                            "minimum":0
                                          }
                                        }
                                    },null,2),
                                    "description":'example validates {action:"foo",param1:false}',
                                    format: "javascript",
                                    "options": {
                                        "ace": {
                                            "theme": "ace/theme/monokai",
                                            "tabSize": 2,
                                            "useSoftTabs": true,
                                            "wrap": true,
                                            maxLines:20,
                                            minLines:20,
                                            fontSize:'14px'
                                        }
                                    }
                                }
                            }
                        }
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
