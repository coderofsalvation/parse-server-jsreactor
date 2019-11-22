module.exports = function(opts){

    return [
        {
            type:"object",
            title:"create item",
            properties:{
                item:{
                    type:"string",
                    enum: opts.classes
                }
            }
        }
    ]
}