var z = require('zora')

var Parse = require('./mock/Parse.js')

require('./Parse')(z)
//require('./action/rule')(z,Parse)
require('./action/scheduler')(z,Parse)
