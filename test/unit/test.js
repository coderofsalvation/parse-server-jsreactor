var z = require('zora')

var Parse = require('./mock/Parse.js')
/*
z.test('some grouped assertions', t => {
    t.ok(true, 'true is truthy')
    t.equal('bar', 'bar', 'that both string are equivalent')
    t.isNot({}, {}, 'those are not the same reference')
})
*/

z.test('some grouped assertions', t => {
  var BRE = require('./../../.')(Parse)
})
