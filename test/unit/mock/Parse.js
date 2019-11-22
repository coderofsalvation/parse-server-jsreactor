// parse object mock
module.exports = {
    Cloud: {
        define: function(){}
    },
    Object: {
        extend:function(){}
    },
    Query: function(){
        this.find = () => new Promise((resolve,reject) => {
            return {foo:"bar"}  
        })
        return this
    },
    Schema: function(c){
      return {
        get: () => new Promise( (resolve,reject) => resolve({fields:{objectId:'dummy',x:Math.random()}}) )    
      }
    }
} 