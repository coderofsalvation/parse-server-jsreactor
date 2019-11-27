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

  customized.sendMail = sendMail

  customized.sendVerificationEmail = options =>
    Parse.Cloud.run("bre",{
      verifyUser:true,
      link: options.link,
      email: options.user.get('email'),
      username: options.user.get('username'),
      appName: options.appName
    })      

  customized.sendPasswordResetEmail = options =>
    Parse.Cloud.run("bre",{
      passwordReset:true,
      link: options.link,
      email: options.user.get('email'),
      username: options.user.get('username'),
      appName: options.appName
    })

  return Object.freeze(Object.assign(customized, adapter));
}