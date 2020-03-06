module.exports = function(Parse){
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
}