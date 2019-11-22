> WARNING: this project is in BETA

An flexible IFTTT-engine with generated gui. 
This is basically a wrapper for [json-rules-engine](https://npmjs.com/package/json-rules-engine).

## Installation

    npm install parse-server-jsreactor --save

then in your cloud-code entrypoint (`cloud/index.js` e.g.) add this:

```
// add the business rule engine (BRE) + channels
var BRE         = require('parse-server-jsreactor')
var Database    = require('parse-server-jsreactor/channel/Database')
var Input       = BRE.Channel.Input 

var bre = new BRE(Parse)
bre.Parse = Parse    // allow channels to access Parse

new Database({bre})
new Input({bre})

bre.init()
```

Then specify which (database) classes you want to expose to it:

![](https://raw.githubusercontent.com/coderofsalvation/parse-server-business-rule-engine/master/doc/config.png)

## Running the BRE

This will pass {foo:1} into the BRE (channels)
```
var res = await Parse.Cloud.run('bre',{foo:1})
```

## What are Channels?

A channel is basically an object which describes triggers and/or actions.
For example, Twilio (the smsservice) can be seen as a channel with triggers (receive sms) and actions (send sms)

> search for `jsreactor-channel` on npm, and check the [jsreactor docs](https://npmjs.com/package/jsreactor) on how to use them    