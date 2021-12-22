const dropbox_1 = require("dropbox");
const fs = require("fs");
const path = require("path");

const remoteDir = '/recipes';
const fileExtension = ".md";
const outDir = path.join(__dirname, '..', 'downloaded');
const blacklist = ['readme.md', 'template.md']
const token = process.env.DROPBOX_API_TOKEN || fs.readFileSync('generator/token').toString();


fs.rmdirSync(outDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

try{
  console.log('testing download destination...')
  fs.writeFileSync(path.join(outDir, 'test'), 'test')
  console.log('success!')
}catch(e){
  console.err('failed!')
  throw e
}


/**
 *
 * @param {dropbox_1.Dropbox} dbx
 * @param {dropbox_1.files.FileMetadataReference |
 *  dropbox_1.files.FolderMetadataReference |
 *  dropbox_1.files.DeletedMetadataReference} entry
 */
const downloadFile = (dbx, entry) => {
  if(blacklist.includes(entry.name.toLowerCase())){
    console.info(`File ${entry.name} is on the blacklist, not downloading.`)
    return
  }
  
  const destination = outDir + entry.path_lower
  dbx.filesDownload({ path: entry.path_lower }).then(f => {
    if (f.result.content_hash !== entry.content_hash) {
      throw new Error("Content hash does not match!");
    }
    if(!entry.name.endsWith(fileExtension)){
      console.warn(`File ${entry.name} does not have the expected ending.`)
      return
    }
    // write file to disk
    fs.mkdir(path.dirname(destination), { recursive: true }, err => {
      if (err) {
        throw err;
      }
      fs.writeFile(
        destination,
        f.result.fileBinary,
        { encoding: "binary" },
        err2 => {
          if (err2) {
            throw err2;
          }
          console.log(`File: ${entry.name} saved.`);
        }
      );
    });
  });
};

/**
 *
 * @param {dropbox_1.Dropbox} dbx
 * @param {(dropbox_1.files.FileMetadataReference |
 *  dropbox_1.files.FolderMetadataReference |
 *  dropbox_1.files.DeletedMetadataReference)[]} folderContent
 */
const downloadFilesInFolder = (dbx, folderContent) => {
  folderContent.forEach(e => {
    if(e[".tag"] === "file"){
      downloadFile(dbx, e)
    }else if(e[".tag"] ===  "folder"){
      listFilesInFolder(dbx, e.path_lower)
        .then(entries => downloadFilesInFolder(dbx, entries))
    }else{
      console.warn(`unhandled file tag: ${e[".tag"]}!`)
    }        
  });
}

/**
 * 
 * @param {dropbox_1.Dropbox} dbx
 * @param {string} path 
 * @return {Promise<(dropbox_1.files.FileMetadataReference | 
 * dropbox_1.files.FolderMetadataReference | 
 * dropbox_1.files.DeletedMetadataReference)[]>} All entries in this folder
 */
const listFilesInFolder = (dbx, path) => {
  return dbx
  .filesListFolder({ path })
  .then(response => {
    return response.result.entries;
  })
  .catch(err => {
    console.log(err);
  });
}

const dbx = new dropbox_1.Dropbox({ accessToken: token });
listFilesInFolder(dbx, remoteDir)
  .then(entries => downloadFilesInFolder(dbx, entries))

