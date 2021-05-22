const fs = require("fs");
const sourcePath = 'downloaded/recipes'
const destPath = 'src/stories'
const suffix = 'stories'
const type = 'md'

/**
 * Aasdfd
 * @param {string} path 
 * @return {Promise<{path: string, name: string}>}
 */
const getFilesInDirectoryRecursive = async (path) => {
  const allFiles = []
  const runners  = []

  // read dir and get entries
  const files = await fs.promises.readdir(path, {withFileTypes: true})
  files.forEach(async (f) => {
    if(f.isFile()){
      allFiles.push({path, name: f.name})
    }else if(f.isDirectory()){
      const r = getFilesInDirectoryRecursive(`${path}/${f.name}`)
      .then(entries => allFiles.push(...entries))
      
      runners.push(r)
    }
  })
  
  return Promise.all(runners).then(() => allFiles)
}

/**
 * 
 * @param {string} path 
 */
const getCategories = (path) => {
  const blacklist = sourcePath.split('/')
  return path.split('/').filter(c => !blacklist.includes(c) && !c.endsWith(`.${type}`))
}

/**
 * Creates a story using the provided file path
 * @param {{path: string, name: string}} file
 */
const createStory = (file) => {
  const fileName = file.name.substr(0, file.name.length -3)
  const categories = getCategories(file.path)
  const header = 
  `import { Meta } from '@storybook/addon-docs/blocks';

<Meta title="Rezepte/${categories.join('/')}/${fileName}" />\n\n`
  const content = fs.readFileSync(`${file.path}/${file.name}`)

  fs.writeFileSync(`${destPath}/${fileName}.${suffix}.${type}x`, header + content)
}

getFilesInDirectoryRecursive(sourcePath)
  .then(files => {
    console.log(`RESULTS:`)
    files.forEach(f => {
      console.log(`${f.path}/${f.name}`)
      createStory(f)
    })
  })
