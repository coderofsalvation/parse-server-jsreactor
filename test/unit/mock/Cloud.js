module.exports = function(Parse,ParseMockDB){
    
    let hook = function(type,className,cb){
        ParseMockDB.registerHook(className, type, (request) => new Promise( (resolve,reject) => {
            cb(request)
            .then(resolve)
            .catch(reject)
        }));
    }
    
    Parse.Cloud = {
        jobs:{},
        define: function(){},
        job: function(k,f){
            Parse.Cloud.jobs[k] = f
        },
        startJob: function(k,v){
            return Parse.Cloud.jobs[k](v)
        }
    }
    var types = ['afterFind','afterSave','beforeSave','beforeFind','beforeDelete','afterDelete']
    types.map( (type) => Parse.Cloud[type] = hook.bind(null,type) )
    
}