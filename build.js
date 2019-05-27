const { join, extname } = require('path')
const { promisify } = require('util')
const fs = require('fs')

const ora = require('ora')
const ms = require('ms')
const Sass = require('sass')
// const Yaml = require('yaml')
const Handlebars = require('handlebars')
const Fiber = require('fibers')

const glob = promisify(require('glob'))
// const ncp = promisify(require('ncp').ncp)
const exec = promisify(require('child_process').exec)
const readFile = promisify(fs.readFile)
// const readdir = promisify(fs.readdir)
const writeFile = promisify(fs.writeFile)
const renderSass = promisify(Sass.render)

const _set = require('lodash.set')

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

async function renderStyles() {
  const [theme, skeleton] = await Promise.all([
    renderSass({
      file: 'src/styles/index.sass',
      includePaths: [join(__dirname, 'node_modules')],
      outputStyle: 'compressed',
      Fiber
    }),
    renderSass({
      file: 'src/skeleton/skeleton.sass',
      indentedSyntax: true,
      outputStyle: 'compressed',
      Fiber
    })
  ])

  await Promise.all([
    writeFile(`dist/styles.css`, theme.css),
    writeFile('dist/skeleton.css', skeleton.css)
  ])
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

class StopWatch {
  constructor() {
    this.startedAt = Date.now()
    this.timeseries = []
  }

  record(title) {
    this.timeseries.push({ title, time: Date.now() })
  }

  dump() {
    let currentTime = this.startedAt

    for (let item of this.timeseries) {
      console.log(`- ${ms(item.time - currentTime)} ${item.title}`)
      currentTime = item.time
    }
  }
}

;(async () => {
  const startTime = Date.now()
  const spinner = ora().start('Building')
  const watch = new StopWatch()

  try {
    const data = await loadData()
    watch.record('#loadData')

    await registerPartials()
    watch.record('#registerPartials')

    await renderStyles()
    watch.record('#renderStyles')

    data.assets = await loadAssets()
    watch.record('#loadAssets')

    await exec(`cp -R src/assets dist/assets`)
    watch.record('#copyAssets')

    await renderTemplates(data)
    watch.record('#renderTemplates')

    const duration = ms(Date.now() - startTime)
    spinner.succeed(`Built in ${duration}`)
    // watch.dump()
  } catch (error) {
    spinner.fail(error.message)
    console.log(error.stack)
  }
})()
