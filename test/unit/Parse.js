const ParseMockDB = require('parse-mockdb');
const Parse = require('parse-shim');
ParseMockDB.mockDB();
Parse.Object.extend('Foo') // create database-class
const z         = require('zora')
    
z.test('test Parse mock',  async (t) => {
    var n = 5
    try{
        for( var i = 0; i < n; i++ ){
            var f = new Parse.Object('Foo')
            f.set('a',1)
            await f.save()
        }
        var q = new Parse.Query('Foo')
        var c = await q.count()
        t.ok( c == n, "count ok")

        var a = await q.find()
        var last = a[a.length-1]
        
        last.set('a',2)
        await last.save()
        
        last = await q.get(last.id)
        last.set('a', last.get('a')+1)
        await last.save()
        
        last = await q.get(last.id)
        
        t.ok(last.get('a') == 3, "object updated")
    }catch(e){
        console.error(e)
        t.ok(false,e)
    }    

})
