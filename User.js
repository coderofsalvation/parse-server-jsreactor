var _   = require('@coderofsalvation/jsreactor/_')

var User = function(){

  this.getRoles = (user) => {
      user = user || this
      var queries = [
        new Parse.Query('_Role').equalTo('users', user)
      ];
      for (var i = 0; i < 2; i++) {
        queries.push(new Parse.Query('_Role').matchesQuery('roles', queries[i]));
      }
      return user.rolesPromise = Parse.Query.or.apply(Parse.Query, queries).find().then(
        function(roles) {
          return roles.map(function(role) {
            user[role.get('name')] = true 
            return role.get('name');
          });
        }
      );  
  }

  this.extend = (user,target) => new Promise( async (resolve,reject) => {
    var userfields = ['objectId','firstName','lastName','email','username','createdAt','updatedAt','roles']
    target.user = _.pluck(userfields,user.toJSON())
    target.user.roles = await this.getRoles(user)
    target.user.roles.map( (r) => target.user[r] = true )
    resolve()
  })

  return this
}

module.exports = new User()