var z = require('zora')
 
z.test('some grouped assertions', t => {
    t.ok( parse != undefined, "Parse object should be defined")  
    t.ok(true, 'true is truthy')
    t.equal('bar', 'bar', 'that both string are equivalent')
    t.isNot({}, {}, 'those are not the same reference')
})

z.test('exiting server', t => {
    setTimeout( process.exit, 5000 )
})
