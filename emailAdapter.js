/*
 * forward email to BRE (original source:https://github.com/InnoCells/parse-server-mail-template-sendgrid-adapter)
 */ 

let fs = require('fs')

module.exports = mailOptions => {

  const customized = {}
  
  let sendMail = ({to, subject, text}) => Parse.Cloud.run('bre',{
    email:to,
    subject,
    text
  })

  const adapter = mailOptions => {
    return Object.freeze({sendMail: sendMail})
  }

  let getUser = (user) => {
    var u  = {}
    var _u = user.toJSON()
    for ( var i in _u )
      if( !i.match(/^_/) ) u[i] = _u[i] // only allow public vars 
    return u
  }

  customized.sendMail = sendMail

  customized.sendVerificationEmail = options => {
    Parse.Cloud.run("bre",{
      verifyUser:true,
      link: options.link,
      user: getUser(options.user),
      email: options.user.get('email'),
      username: options.user.get('username'),
      appName: options.appName
    })      
  }

  customized.sendPasswordResetEmail = options => {
    Parse.Cloud.run("bre",{
      passwordReset:true,
      user: getUser(options.user),
      link: options.link,
      email: options.user.get('email'),
      username: options.user.get('username'),
      appName: options.appName
    })
  }

  return Object.freeze(Object.assign(customized, adapter));
}