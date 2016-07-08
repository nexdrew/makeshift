var Promise = require('bluebird')
var exec = Promise.promisify(require('child_process').exec)
var parse = require('url-parse-as-address')
var fmt = require('util').format

module.exports = function (opts) {
  var npmCmds = []
  var token
  var registry
  var scopes
  opts = opts || {}

  // sanitize args
  if (opts.token) token = argToString(opts.token)
  if (opts.registry) registry = argToString(opts.registry)
  if (opts.scopes) {
    scopes = [].concat(opts.scopes).map(function (s) {
      s = argToString(s)
      if (s) s = '@' + s.replace(/@/g, '')
      return s
    })
  }

  if (!token && !scopes) return Promise.resolve(npmCmds)

  // if no registry given, get default value from npm
  if (!registry) {
    registry = exec('npm config get registry').then(function (stdout) {
      return (stdout || '').toString().trim()
    }).catchReturn('https://registry.npmjs.org/')
  }

  var npmCommands = Promise.resolve(registry).then(function (rstring) {
    // parse registry string
    var r = parse(rstring)
    if (!r.host) return Promise.reject(fmt('Invalid registry "%s"', rstring))

    // associate scopes to registry
    if (scopes) {
      scopes.forEach(function (s) {
        npmCmds.push({
          cmd: fmt('npm config set %s:registry %s//%s', s, r.protocol, r.host),
          desc: {
            msg: 'Associate scope %s to registry %s',
            args: [s, fmt('%s//%s', r.protocol, r.host)]
          }
        })
      })
    }

    // apply token to registry
    if (token) {
      npmCmds.push({
        cmd: fmt('npm config set //%s/:_authToken %s', r.host, token),
        desc: {
          msg: 'Apply auth token to registry %s',
          args: [r.host]
        }
      })
    }
  }).return(npmCmds)

  // run commands if requested
  if (opts.run) {
    npmCommands = Promise.mapSeries(npmCommands, function (c) {
      return exec(c.cmd)
    }).return(npmCmds)
  }

  return npmCommands
}

function argToString (arg) {
  return '' + [].concat(arg)[0]
}
