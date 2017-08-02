#!/usr/bin/env node
const sywac = require('sywac')
const chalk = require('chalk')
const figures = require('figures')
const util = require('util')

sywac
  .usage(
    'Usage: makeshift [-s scope] [-r registry] [-t token]\n\n' +
    'Associate scopes and/or auth token to a registry in .npmrc'
  )
  .stringArray('-s, --scope', {
    desc: 'One or more scopes to associate'
  })
  .string('-r, --registry', {
    desc: 'The registry to apply scopes/token to'
  })
  .string('-t, --token', {
    desc: 'The token value to set for the registry'
  })
  .help('-h, --help')
  .version('-v, --version')
  .check(argv => {
    if (!argv.t && process.env.NPM_TOKEN) argv.t = process.env.NPM_TOKEN
    if (!argv.r && process.env.NPM_REGISTRY) argv.r = process.env.NPM_REGISTRY
    if (!argv.s.length && process.env.NPM_SCOPE) argv.s = process.env.NPM_SCOPE.split(',')
  })
  .outputSettings({ maxWidth: 80 })
  .parseAndExit()
  .then(argv => {
    return require('./')({
      scopes: argv.s,
      registry: argv.r,
      token: argv.t,
      run: true
    })
  })
  .then(npmCmds => {
    if (!npmCmds.length) return console.log(sywac.getHelp())
    npmCmds.forEach(npmCmd => {
      console.log(chalk.green(figures.tick) + ' ' + util.format.apply(
        util,
        [npmCmd.desc.msg].concat(npmCmd.desc.args.map(arg => chalk.bold(arg)))
      ))
    })
  })
  .catch(err => {
    console.error(chalk.red(figures.warning + '  ERROR'))
    console.error(err)
    process.exit(1)
  })
