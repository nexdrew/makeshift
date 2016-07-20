var makeshift = require('../')
var parse = require('url-parse-as-address')
var path = require('path')
var tap = require('tap')
var Promise = require('bluebird')
var exec = Promise.promisify(require('child_process').exec)
var readFile = Promise.promisify(require('fs').readFile)
var rimraf = Promise.promisify(require('rimraf'))
var userconfig = require('./utils').userconfig

var TEST_USERCONFIG = path.join(__dirname, '.npmrc')

tap.afterEach(function () {
  return rimraf(TEST_USERCONFIG)
})

tap.test('module > resolves commands for all opts', function (assert) {
  return makeshift({
    token: 'abc123',
    registry: 'localhost:8080',
    scopes: ['@demo', 'test']
  }).then(function (npmCmds) {
    assert.equal(npmCmds.length, 3)
    assert.ok(containsCmd(npmCmds, 'npm config set @demo:registry http://localhost:8080'))
    assert.ok(containsCmd(npmCmds, 'npm config set @test:registry http://localhost:8080'))
    assert.ok(containsCmd(npmCmds, 'npm config set //localhost:8080/:_authToken abc123'))
  })
})

tap.test('module > resolves empty with no opts', function (assert) {
  return makeshift().then(function (npmCmds) {
    assert.equal(npmCmds.length, 0)
  })
})

tap.test('module > resolves a command for default registry', function (assert) {
  return exec('npm config get registry').then(function (stdout) {
    return makeshift({
      token: '17b18d9507644940cf46589210a2fa6f706776d3'
    }).then(function (npmCmds) {
      assert.equal(npmCmds.length, 1)
      assert.ok(containsCmd(npmCmds, 'npm config set //' + parse(stdout.toString().trim()).host + '/:_authToken 17b18d9507644940cf46589210a2fa6f706776d3'))
    })
  })
})

tap.test('module > ignores paths in registry value', function (assert) {
  return makeshift({
    registry: 'http://registry.myorg.co/paths-ignored',
    scopes: 'myorg'
  }).then(function (npmCmds) {
    assert.equal(npmCmds.length, 1)
    assert.ok(containsCmd(npmCmds, 'npm config set @myorg:registry http://registry.myorg.co'))
  })
})

tap.test('module > rejects invalid registry', function (assert) {
  var catchCalled = false
  return makeshift({
    token: 'yolo',
    registry: ' '
  }).catch(function (err) {
    catchCalled = true
    assert.equal(err, 'Invalid registry " "')
  }).then(function () {
    assert.ok(catchCalled)
  })
})

tap.test('module > resolves and runs a command', function (assert) {
  return Promise.using(userconfig(TEST_USERCONFIG), function () {
    return makeshift({
      registry: 'localhost',
      scopes: '@test',
      run: true
    }).then(function (npmCmds) {
      assert.equal(npmCmds.length, 1)
      assert.ok(containsCmd(npmCmds, 'npm config set @test:registry http://localhost'))
      return readFile(TEST_USERCONFIG, 'utf8')
    }).then(function (npmrc) {
      assert.equal(npmrc && npmrc.trim(), '@test:registry=http://localhost')
    })
  })
})

function containsCmd (npmCmds, expected) {
  return npmCmds && npmCmds.some(function (obj) {
    return obj.cmd === expected
  })
}
