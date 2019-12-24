module.exports = function(opts){

    return [
        {
            type:"object",
            title:"retrieve matching objects",
            description:"this feature is not implemented (yet), use javascript-block",
            properties:{
                property:{
                    type:"array",
                    format:"grid",
                    items:{
                        type:"object",
                        properties:{
                            property:{ type:"string","$ref":"#/definitions/dbpath" },
                            value:{type:"string"}
                        }
                    }
                }
            }
        },
        {
            type:"object",
            title:"update",
            description:"this feature is not implemented (yet), use javascript-block",
            properties:{
                property:{ type:"string","$ref":"#/definitions/dbpath" },
                match:{type:"string"}   
            }
        },
        {
            type:"object",
            title:"create",
            properties:{
                item:{
                    type:"string",
                    enum: opts.classes
                },
                config:{
                    type:"object",
                    title:"json data",
                    description:"this feature is not implemented (yet), use javascript-block",
                    options:{disable_collapse:false,collapsed:true},
                    properties:{
                        js:{ 
                            type:"string", 
                            title:"json",
                            default:"{\n\t\"foo\":\"bar\"\n}",
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