const marked = require('marked')
const { readFile, stat, readdir } = require('fs/promises')
const { existsSync } = require('fs')
const { join } = require('path')
const { lexer } = require('marked')

let sidebarIndex = 0

function page(contains, root) {
  return `<!DOCTYPE html><html><head><link rel="stylesheet" href="${root}assets/docs.css"><meta charset="UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body>${contains}<script src="${root}assets/docs.js"></script></body></html>`
}

async function render(file, files, source, config) {
  const docsDir = join(source, config.source)

  async function sidebar(files, currentFile, current) {
    return `<div class="sidebar panel ${current ? 'open' : ''}">${(
      await Promise.all(
        files.map((file) =>
          sidebarItem(file, currentFile).catch((e) => {
            console.error('function: sidebarItem')
            console.error(e)
            process.exit(1)
          })
        )
      )
    ).join('')}</div>`
  }

  /**
   *
   * @param {String} path
   * @param {String} currentFile
   */
  async function sidebarItem(path, currentFile) {
    const info = await stat(path)
    const active = currentFile.includes(path)

    let name
    let file

    // Find the name
    if (info.isDirectory()) {
      if (existsSync(join(path, 'index.md'))) {
        file = join(path, 'index.md')

        const lexed = lexer(await readFile(file, 'utf8'))
        const firstHeading = lexed.filter(
          (token) => token.type === 'heading' && token.depth == 1
        )[0]

        if (firstHeading) {
          name = firstHeading.text
        } else {
          name = path.split('/').pop()
        }
      } else {
        name = path.split('/').pop()
      }
    } else {
      file = path

      const lexed = lexer(await readFile(path, 'utf8'))
      const firstHeading = lexed.filter(
        (token) => token.type === 'heading' && token.depth == 1
      )[0]

      if (firstHeading) {
        name = firstHeading.text
      } else {
        name = path.split('/').pop()
      }
    }

    return `<a ${
      file
        ? `href="${join(config.root, path.replace(docsDir, '')).replace(
            '.md',
            '.html'
          )}"`
        : ''
    } class="sidebar button ${active ? 'active' : ''}">${name}</a>${
      info.isDirectory()
        ? await sidebar(
            (await readdir(path))
              .map((file) => join(path, file))
              .filter((file) => !file.includes('index.md')),
            currentFile,
            active
          ).catch((e) => {
            console.error('function: sidebar')
            console.error(e)
            process.exit(1)
          })
        : ''
    }`
  }

  const fileContents = await readFile(file, 'utf8')
  const rendered = marked(fileContents)

  return page(
    `<div id="page"><div id="sidebar">${await sidebar(
      (await readdir(docsDir)).map((file) => join(docsDir, file)),
      file,
      true
    ).catch((e) => {
      console.error('function: render')
      console.error(e)
      process.exit(1)
    })}</div><div id="container">${rendered}</div></div>`,
    config.root
  )
}

module.exports = render
