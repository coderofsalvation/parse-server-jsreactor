> NOTE: Only use cloud functions when 3rd parties need REST-access. Otherwise just use the Input-trigger & Parse API (client)

## Usage

define a javascript-action with the handler-code:

```
Parse.Cloud.on.foo = async (req) => { 
  return {foo:"bar"}   
}
```

Now you can call the Cloud function using any REST-client or Parse API client using `await Parse.Cloud.run('foo',{foo:1})`. However the latter is not adviced, since the cloudfunctions run totally isolated from the rule-engine.
