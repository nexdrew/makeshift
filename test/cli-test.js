var tap = require('tap')
var path = require('path')
var exec = require('child_process').exec
var Promise = require('bluebird')
var readFile = Promise.promisify(require('fs').readFile)
var rimraf = Promise.promisify(require('rimraf'))
var userconfig = require('./utils').userconfig
var token = require('./utils').token
var registry = require('./utils').registry
var scope = require('./utils').scope
var figures = require('figures')
var parse = require('url-parse-as-address')

var BIN = ['node', path.resolve(__dirname, '..', 'cli.js')].join(' ')
var TEST_USERCONFIG = path.join(__dirname, '.npmrc')

tap.afterEach(function () {
  return rimraf(TEST_USERCONFIG)
})

tap.test('cli > exits 1 with invalid registry', function (assert) {
  return execBin('-r " " -s test').then(function (result) {
    assert.equal(result.err.code, 1)
    assert.equal(result.stderr, figures.warning + '  ERROR\nInvalid registry " "\n')
  })
})

tap.test('cli > applies args', function (assert) {
  return Promise.using(userconfig(TEST_USERCONFIG), function () {
    return execBin('-r 127.0.0.1:8080 -s test dev ci -t xyz123').then(function (result) {
      assert.notOk(result.err)
      assert.ok(result.stdout.match(new RegExp(figures.tick + ' Associate scope @test to registry http://127.0.0.1:8080')))
      assert.ok(result.stdout.match(new RegExp(figures.tick + ' Associate scope @dev to registry http://127.0.0.1:8080')))
      assert.ok(result.stdout.match(new RegExp(figures.tick + ' Associate scope @ci to registry http://127.0.0.1:8080')))
      assert.ok(result.stdout.match(new RegExp(figures.tick + ' Apply auth token to registry 127.0.0.1:8080')))
      return readFile(TEST_USERCONFIG, 'utf8')
    }).then(function (npmrc) {
      npmrc = npmrc && npmrc.toString().trim()
      assert.ok(npmrc.match(/@test:registry=http:\/\/127.0.0.1:8080/))
      assert.ok(npmrc.match(/@dev:registry=http:\/\/127.0.0.1:8080/))
      assert.ok(npmrc.match(/@ci:registry=http:\/\/127.0.0.1:8080/))
      assert.ok(npmrc.match(/\/\/127.0.0.1:8080\/:_authToken=xyz123/))
    })
  })
})

tap.test('cli > applies token with env var and no args', function (assert) {
  return Promise.using(userconfig(TEST_USERCONFIG), token('not_a_real_token'), function () {
    return execCmd('npm config get registry').then(function (result) {
      return result.stdout && parse(result.stdout.toString().trim()).host
    }).then(function (host) {
      return execBin().then(function (result) {
        assert.notOk(result.err)
        assert.ok(result.stdout.match(new RegExp(figures.tick + ' Apply auth token to registry ' + host)))
        return readFile(TEST_USERCONFIG, 'utf8')
      }).then(function (npmrc) {
        assert.equal(npmrc && npmrc.trim(), '//' + host + '/:_authToken=not_a_real_token')
      })
    })
  })
})

tap.test('cli > displays help with no args and no env vars', function (assert) {
  return Promise.using(userconfig(TEST_USERCONFIG), token(), function () {
    return execBin().then(function (result) {
      assert.notOk(result.err)
      assert.ok(result.stdout.match(/Usage: makeshift \[-s scope\] \[-r registry\] \[-t token\]/))
    })
  })
})

tap.test('cli > looks for NPM_REGISTRY and NPM_SCOPE env vars', assert => {
  return Promise.using(userconfig(TEST_USERCONFIG), registry('127.0.0.1:4000'), scope('one,two'), () => {
    return execBin().then(result => {
      assert.notOk(result.err)
      assert.ok(result.stdout.match(new RegExp(figures.tick + ' Associate scope @one to registry http://127.0.0.1:4000')))
      assert.ok(result.stdout.match(new RegExp(figures.tick + ' Associate scope @two to registry http://127.0.0.1:4000')))
      return readFile(TEST_USERCONFIG, 'utf8')
    }).then(function (npmrc) {
      npmrc = npmrc && npmrc.toString().trim()
      assert.ok(npmrc.match(/@one:registry=http:\/\/127.0.0.1:4000/))
      assert.ok(npmrc.match(/@two:registry=http:\/\/127.0.0.1:4000/))
    })
  })
})

function execBin (args) {
  return execCmd(BIN + (args ? ' ' + args : ''))
}

function execCmd (cmd) {
  var done
  var promise = new Promise(function (resolve) {
    done = resolve
  })

  exec(cmd, function (err, stdout, stderr) {
    var result = {
      stdout: stdout,
      stderr: stderr
    }
    if (err) result.err = err
    done(result)
  })

  return promise
}
