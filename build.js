const { join } = require('path')
const { promisify } = require('util')
const fs = require('fs')

const ora = require('ora')
const ms = require('ms')
const Sass = require('sass')
const Yaml = require('yaml')
const Handlebars = require('handlebars')

const glob = promisify(require('glob'))
const readFile = promisify(fs.readFile)
// const readdir = promisify(fs.readdir)
const writeFile = promisify(fs.writeFile)
const renderSass = promisify(Sass.render)

const readYaml = async path => Yaml.parse(await readFile(path, 'utf8'))

function makeSass(variables) {
  let sass = ['// Sass variables [autogenerated]', '']

  let allColors = []

  for (let group in variables) {
    sass.push(...['//', `// ${group}`, '//'])

    for (let variableBlock of variables[group].colors || []) {
      for (let name in variableBlock) {
        allColors.push(`"${name}": $${name}`)
        sass.push(`$${name}: ${variableBlock[name]}`)
      }
    }

    for (let variableBlock of variables[group].fonts || []) {
      for (let name in variableBlock) {
        sass.push(`$${name}: ${variableBlock[name]}`)
      }
    }

    sass.push('')
  }

  sass.push(...['//', `// colors`, '//'])
  sass.push(`$colors: (${allColors.join(', ')})`)
  sass.push('')

  return sass.join('\n')
}

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

async function renderStyles(variables, base = 'src/styles') {
  let styles = []

  for (let file of await glob(join(base, '**/*.sass'))) {
    if (!file.endsWith('.sass')) continue

    let result = await renderSass({
      data: variables + (await readFile(file, 'utf8')),
      indentedSyntax: true,
      outputStyle: 'compressed'
    })

    styles.push(String(result.css))
  }

  await writeFile(`dist/styles.css`, styles.join(''))
}

async function renderTemplates(ctx, sass, base = 'src/templates') {
  let templates = await glob(join(base, '**/*.html.hbs'))

  let skeleton = Handlebars.compile(
    await readFile('src/skeleton/skeleton.html.hbs', 'utf8')
  )

  let style = await renderSass({
    data: sass + (await readFile('src/skeleton/skeleton.sass', 'utf8')),
    indentedSyntax: true,
    outputStyle: 'compressed'
  })

  await writeFile('dist/skeleton.css', style.css)

  for (let file of templates) {
    if (!file.endsWith('.html.hbs')) continue

    let templateData = await readFile(file, 'utf8')

    await writeFile(
      join('dist', nameTemplate(file, base, '.html.hbs', '.html')),
      skeleton({
        content: Handlebars.compile(templateData)(ctx, { data: ctx }),
        templates: templates.map(t => nameTemplate(t, base, '.html.hbs'))
      })
    )
  }
}

;(async () => {
  const startTime = Date.now()
  const spinner = ora().start('Building')

  try {
    const data = await loadData()

    const variables = await readYaml('src/variables.yml')

    await registerPartials()

    const sass = makeSass(variables)

    await writeFile('dist/variables.sass', sass)

    await renderStyles(sass)

    await renderTemplates({ data, variables }, sass)

    const duration = ms(Date.now() - startTime)
    spinner.succeed(`Built in ${duration}`)
  } catch (error) {
    spinner.fail(error.message)
    console.log(error.stack)
  }
})()
