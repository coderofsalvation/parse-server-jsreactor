var Parse = require('./mock/Parse.js')

module.exports = function(z){

    z.test('test Parse mock',  async (t) => {
        var n = 5
        for( var i = 0; i < n; i++ ){
            var f = Parse.Object.extend('Foo')
            await f.save()
        }
        var q = new Parse.Query("Foo")
        var c = await q.count()
        t.ok( c == n, "count ok")

        var a = await q.find()
        var last = a[a.length-1]
        last.i = 100
        await last.save()
        last = await q.get(last.objectId)
        t.ok(last.objectId == 5 && last.i == 100, "object updated")
    })

}