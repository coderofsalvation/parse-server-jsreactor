module.exports = function(opts){
    var bre          = opts.bre
    var Parse        = bre.Parse
    this.title       = "Url"
    this.description = "node express endpoints"  
    this.init = async () => {
        this.trigger = {
            schema: [
                {
                    type:"object",
                    title:"url equals",
                    properties:{
                        type:{type:"string",default:"urlEquals",pattern:"^urlEquals$",options:{hidden:true}},
                        value:{ type:"string",default:"/foo"}
                    }
                }    
            ]
        }
        
        this.action  = {
            schema: []            
        }
    }

    opts.bre.engine.addFact('urlEquals', (params, f) => {
        var result = true
        return new Promise( (resolve, reject) => {
        f
        .factValue('beforeSave') // get beforeSave
        .then( (beforeSave) => resolve(beforeSave) )
        .catch( reject )
        })
    })

    opts.bre.addChannel(this)
  
    return this
}
