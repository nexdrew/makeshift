#!/usr/bin/env node
var yargs = require('yargs')
  .usage(
    'Usage: makeshift [-s scope] [-r registry] [-t token]\n\n' +
    'Associate scopes and/or auth token to a registry in .npmrc'
  )
  .option('s', {
    alias: 'scope',
    desc: 'One or more scopes to associate',
    type: 'array'
  })
  .option('r', {
    alias: 'registry',
    desc: 'The registry to apply scopes/token to',
    type: 'string'
  })
  .option('t', {
    alias: 'token',
    desc: 'The token value to set for the registry',
    type: 'string'
  })
  .env('NPM')
  .help().alias('h', 'help')
  .version().alias('v', 'version')

var argv = yargs.argv
var chalk = require('chalk')
var figures = require('figures')
var util = require('util')

require('./')({
  scopes: argv.s,
  registry: argv.r,
  token: argv.t,
  run: true
}).then(function (npmCmds) {
  if (!npmCmds.length) return yargs.showHelp('log')
  npmCmds.forEach(function (npmCmd) {
    console.log(chalk.green(figures.tick) + ' ' + util.format.apply(
      util,
      [npmCmd.desc.msg].concat(npmCmd.desc.args.map(function (arg) {
        return chalk.bold(arg)
      }))
    ))
  })
}).catch(function (err) {
  console.error(chalk.red(figures.warning + '  ERROR'))
  console.error(err)
  process.exit(1)
})
