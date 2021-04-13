const dropbox_1 = require("dropbox");
const fs = require("fs");
const path = require("path");

const fileExtension = ".md";
const outDir = "downloaded";
const token = "";

fs.rmdirSync(outDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

/**
 *
 * @param {dropbox_1.Dropbox} dbx
 * @param {*} path
 * @returns
 */
const getFilesInFolder = async (dbx, path) => {
  const response = await dbx.filesListFolder({ path });
  return response.result.entries;
};

/**
 *
 * @param {dropbox_1.Dropbox} dbx
 * @param {dropbox_1.files.FileMetadataReference |
 *  dropbox_1.files.FolderMetadataReference |
 *  dropbox_1.files.DeletedMetadataReference} entry
 */
const downloadFile = (dbx, entry) => {
  dbx.filesDownload({ path: entry.path_lower }).then(f => {
    if (f.result.content_hash !== entry.content_hash) {
      throw new Error("Content hash does not match!");
    }
    // write file to disk
    fs.mkdir(path.dirname(entry.path_lower), { recursive: true }, err => {
      if (err) {
        throw err;
      }
      fs.writeFile(
        outDir + entry.path_lower,
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

const dbx = new dropbox_1.Dropbox({ accessToken: token });
dbx
  .filesListFolder({ path: "/recipes" })
  .then(response => {
    console.log(JSON.stringify(response.result.entries));
    const entries = response.result.entries;
    entries
      .filter(e => e[".tag"] === "file")
      .filter(e => e.name.endsWith(fileExtension))
      .forEach(e => downloadFile(dbx, e));
  })
  .catch(err => {
    console.log(err);
  });
