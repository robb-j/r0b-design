const { join, extname } = require('path')
const { promisify } = require('util')
const fs = require('fs')

const ora = require('ora')
const ms = require('ms')
const Sass = require('sass')
const Handlebars = require('handlebars')
const Fiber = require('fibers')

const glob = promisify(require('glob'))
const rimraf = promisify(require('rimraf'))
const exec = promisify(require('child_process').exec)
const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const renderSass = promisify(Sass.render)

const _set = require('lodash.set')

const { StopWatch } = require('./stop-watch')

function nameTemplate(file, base, extension, newExtension = '') {
  return file.replace(`${base}/`, '').replace(extension, '') + newExtension
}

async function registerPartials(base = 'src/partials') {
  for (let file of await glob(join(base, '**/*.html.hbs'))) {
    if (!file.endsWith('.html.hbs')) continue

    let name = nameTemplate(file, base, '.html.hbs')

    Handlebars.registerPartial(name, await readFile(file, 'utf8'))
  }
}

async function loadData(base = 'src/data') {
  let data = {}
  for (let file of await glob(join(base, '**/*.json'))) {
    if (!file.endsWith('.json')) continue

    Object.assign(data, JSON.parse(await readFile(file, 'utf8')))
  }
  return data
}

async function loadAssets(base = 'src/assets') {
  let assets = {}
  for (let file of await glob(join(base, '**/*.*'))) {
    let ext = extname(file)
    _set(
      assets,
      nameTemplate(file, base, ext).split('/'),
      await readFile(file, 'utf8')
    )
  }
  return assets
}

async function renderStyles(generateWebsite = false) {
  const [theme, skeleton] = await Promise.all([
    renderSass({
      file: 'src/styles/index.sass',
      includePaths: [join(__dirname, '../node_modules')],
      outputStyle: 'compressed',
      Fiber
    }),
    generateWebsite &&
      renderSass({
        file: 'src/skeleton/skeleton.sass',
        indentedSyntax: true,
        outputStyle: 'compressed',
        Fiber
      })
  ])

  await Promise.all([
    writeFile(`dist/styles.css`, theme.css),
    generateWebsite && writeFile('dist/skeleton.css', skeleton.css)
  ])
}

async function setupDistFolder() {
  try {
    // If we have access to the folder, remove its contents
    fs.statSync('dist')
    await rimraf('dist/*')
  } catch (error) {
    // If we don't have access, make the folder
    fs.mkdirSync('dist')
  }
}

// Filter template file paths to generate a name and filter out non-numbered names
function makeSiteNav(templates, base) {
  return templates
    .map(t => nameTemplate(t, base, '.html.hbs'))
    .filter(name => /^\d+-.+$/.test(name))
}

async function renderTemplates(data, sass, base = 'src/templates') {
  let templates = await glob(join(base, '**/*.html.hbs'))

  let skeleton = Handlebars.compile(
    await readFile('src/skeleton/skeleton.html.hbs', 'utf8')
  )

  let ctx = {
    data,
    sitenav: makeSiteNav(templates, base)
  }

  for (let file of templates) {
    if (!file.endsWith('.html.hbs')) continue

    let templateData = await readFile(file, 'utf8')

    await writeFile(
      join('dist', nameTemplate(file, base, '.html.hbs', '.html')),
      skeleton({
        content: Handlebars.compile(templateData)(ctx, { data: ctx }),
        data: data,
        sitenav: ctx.sitenav
      })
    )
  }
}

async function generateAssets({ website = false, verbose = false }) {
  const startTime = Date.now()
  const spinner = ora().start('Building')
  const watch = new StopWatch()

  try {
    const data = await loadData()
    watch.record('#loadData')

    await setupDistFolder()
    watch.record('#setupDistFolder')

    await registerPartials()
    watch.record('#registerPartials')

    await renderStyles(website)
    watch.record('#renderStyles')

    data.assets = await loadAssets()
    watch.record('#loadAssets')

    await exec(`cp -R src/assets/* dist`)
    watch.record('#copyAssets')

    if (website) {
      await renderTemplates(data)
      watch.record('#renderTemplates')
    }

    const duration = ms(Date.now() - startTime)
    spinner.succeed(`Built in ${duration}`)

    if (verbose) {
      watch.dump()
    }
  } catch (error) {
    spinner.fail(error.message)
    console.log(error.stack)
  }
}

module.exports = { generateAssets }
