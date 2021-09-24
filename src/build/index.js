const { existsSync, statSync } = require('fs')
const { readdir, stat, writeFile, mkdir, copyFile } = require('fs/promises')
const { dirname } = require('path')
const path = require('path')
const { isAbsolute, join } = path

const render = require('./render')

const docsDefaults = {
  title: 'Simple docs',
  description: 'Simple docs',
  source: 'docs/',
  dist: 'site/',
  root: '/',
}

async function build(source = '') {
  if (source == '') {
    source = process.cwd()
  } else {
    if (!path.isAbsolute(source)) {
      source = path.join(process.cwd(), source)
    }
  }

  if (!existsSync(source) || statSync(source).isFile()) {
    console.error(`${source} is not a directory`)
    process.exit(1)
  }

  const { docs: packageDocs } = require(path.join(source, 'package.json'))
  const config = { ...docsDefaults, ...packageDocs }

  const docsDirectory = path.join(source, config.source)
  const outDirectory = path.join(source, config.dist)
  const docsFiles = (await walkDirectory(docsDirectory)).filter((file) =>
    file.endsWith('.md')
  )

  const docsPromise = docsFiles.map(async (file) => {
    const rendered = await render(file, docsFiles, source, config).catch(
      (e) => {
        console.log('function: render')
        console.error(e)
        process.exit(1)
      }
    )

    const outFile = file
      .replace(docsDirectory, outDirectory)
      .replace('.md', '.html')

    const outDir = dirname(outFile)

    console.log(`Writing ${outFile}`)

    await mkdir(outDir, { recursive: true })
    await writeFile(outFile, rendered)
  })

  await Promise.all(docsPromise)

  await mkdir(join(outDirectory, 'assets'), { recursive: true })
  await copyFile(
    join(__dirname, '..', 'static', 'docs.css'),
    join(outDirectory, 'assets', 'docs.css')
  )
  await copyFile(
    join(__dirname, '..', 'static', 'docs.js'),
    join(outDirectory, 'assets', 'docs.js')
  )
}

async function walkDirectory(dirName) {
  const output = []

  if (!isAbsolute(dirName)) {
    log.askForReport()
    log.error('Please provide an absolute input to walkDirectory')
  }

  try {
    const directoryContents = await readdir(dirName)

    for (const file of directoryContents) {
      const fullPath = join(dirName, file)
      const fStat = await stat(fullPath)

      if (fStat.isDirectory()) {
        for (const newFile of await walkDirectory(fullPath)) {
          output.push(newFile)
        }
      } else {
        output.push(fullPath)
      }
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }

  return output
}

module.exports = build
