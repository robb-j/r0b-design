#!/usr/bin/env node

const yargs = require('yargs')
const { generateAssets } = require('./generate')

const HttpServer = require('http-server')
const chokidar = require('chokidar')
const _debounce = require('lodash.debounce')

yargs
  .help()
  .alias('h', 'help')
  .command(
    ['build', '$0'],
    'Generate assets',
    yargs =>
      yargs
        .option('website', {
          describe: 'Generate the ux website',
          default: false,
          type: 'boolean'
        })
        .option('verbose', {
          describe: 'Output debug info',
          default: false,
          type: 'boolean'
        }),
    args => generateAssets(args)
  )
  .command(
    'watch',
    'Watch for changes and serve the site locally',
    yargs =>
      yargs.option('port', {
        describe: 'The port to run on',
        default: 8080,
        type: 'number'
      }),
    async args => {
      //
      // Start a http server
      //
      let server = HttpServer.createServer({ root: 'dist' })
      await new Promise(resolve => server.listen(args.port, resolve))
      console.log(`Listening on :${args.port}`)

      // Create a function to generate assets 300ms after its last call
      const generate = _debounce(
        () => generateAssets({ website: true, verbose: false }),
        300
      )

      // Create a watcher for files inside 'src'
      const watcher = chokidar.watch('src/**/*.*', {
        cwd: process.cwd(),
        ignoreInitial: true
      })

      // Listen to file changes
      watcher
        .on('add', p => generate())
        .on('change', p => generate())
        .on('unlink', p => generate())

      // Initially generate assets
      await generateAssets({ website: true, verbose: false })
    }
  )

yargs.parse()
