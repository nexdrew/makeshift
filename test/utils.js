var Promise = require('bluebird')

exports.userconfig = function userconfig (newValue) {
  return env('npm_config_userconfig', newValue)
}

exports.token = function token (newValue) {
  return env('NPM_TOKEN', newValue)
}

function env (varName, newValue) {
  return Promise.method(envSet)(varName, newValue).disposer(envRestore)
}

function envSet (varName, newValue) {
  var oldValue = process.env[varName]
  if (!newValue) delete process.env[varName]
  else process.env[varName] = newValue
  return {
    varName: varName,
    oldValue: oldValue
  }
}

function envRestore (restore) {
  process.env[restore.varName] = restore.oldValue
}
