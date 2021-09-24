#!/bin/node

const { program } = require('commander')

const { version } = require('../package.json')

program.version(version)

program
  .command('build [source]')
  .description('Build the source code')
  .action(require('./build'))

program.parse()
