// parse object mock
var debug = require('@coderofsalvation/jsreactor/node_modules/debug')('Parse')
var Parse
Parse = {
    db:{},
    Cloud: {
        jobs:{},
        define: function(){},
        job: function(k,f){
            Parse.Cloud.jobs[k] = f
        }
    },
    Object: {
        extend: (c) => {
            Parse.db[c] = Parse.db[c] || []
            var x = function(){}
            x.prototype = {}
            x.prototype.set  = function(k,v){ this[k] = v }
            x.prototype.save = function(){ 
                var me = this
                return new Promise( function(resolve,reject){
                    var y = Parse.db[c].find( (a) => a.objectId == me.objectId ? a : false )
                    if( !y ){
                        debug('save() new')
                        if( !me.objectId ) me.objectId = Parse.db[c] ? Parse.db[c].length+1 : 0
                        Parse.db[c].push(me)
                    }else{
                        debug('save() update')
                        for( var i in me ) y[i] = me[i]
                    }
                    resolve()
                })
            }
            return new x()
        }
    },

    Query: function(c){
        this._skip = 0
        this.find = () => new Promise((resolve,reject) => {
            var arr = 
            Parse.db[c].slice(this._skip, this._skip + this._limit || undefined)
            .map( (x) => {
                var o = Parse.Object.extend(c)
                for( var i in x ) o.set(i,x[i])
                return o
            })
            resolve(arr)
        })
        this.get   = (i) => new Promise((resolve,reject) => {
            resolve(Parse.db[c].find( (r) => r.objectId == i ? r : false))
        })
        this.skip  = (i) => {
            this._skip = i
            return this 
        }
        this.limit = (i) => {
            this._limit = i
            return this
        }
        this.count = () => new Promise((resolve,reject) => resolve( Parse.db[c] ? Parse.db[c].length : 0) )
        return this
    },
    Schema: function(c){
      return {
        addString: () => false,
        addBoolean: () => false,
        addObject: () => false,
        addNumber: () => false,
        save: () => new Promise((resolve,reject)=>resolve()),
        get: () => new Promise( (resolve,reject) => PromiseRejectionEvent({fields:{objectId:'dummy',x:Math.random()}}) )    
      }
    }
} 

module.exports = Parse
