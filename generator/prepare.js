const fs = require("fs");

const applyFileModifications = () => {

}

/**
 * Aasdfd
 * @param {string} path 
 * @return {Promise<string[]>}
 */
const getFilesInDirectoryRecursive = async (path) => {
  const allFiles = []
  const runners  = []

  // read dir and get entries
  const files = await fs.promises.readdir(path, {withFileTypes: true})
  files.forEach(async (f) => {
    if(f.isFile()){
      allFiles.push(`${path}/${f.name}`)
    }else if(f.isDirectory()){
      const r = getFilesInDirectoryRecursive(`${path}/${f.name}`)
      .then(entries => allFiles.push(...entries))
      
      runners.push(r)
    }
  })
  
  return Promise.all(runners).then(() => allFiles)
}

const files = getFilesInDirectoryRecursive('downloaded/recipes')
  .then(files => {
    console.log(`RESULTS:`)
    files.forEach(f => console.log(f))
  })
