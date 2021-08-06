const path = require("path");
const fs = require("fs");

const distDir = path.join(__dirname, ".dist");
if(!fs.existsSync(distDir)){
  fs.mkdirSync(distDir);
}

// clean and create output dir
const npmDir = path.join(__dirname, ".dist", "npm");
if(fs.existsSync(npmDir)){
  fs.rmdirSync(npmDir, {recursive: true});
}
fs.mkdirSync(npmDir);

// Copy wasm file
const browserDir = path.join(npmDir, "browser");
if(fs.existsSync(browserDir)){
  fs.rmdirSync(browserDir, {recursive: true});
}
fs.mkdirSync(browserDir);
const blsWasmSrcPath = path.join(__dirname, "node_modules", "@chiamine", "bls-signatures", "blsjs.wasm");
const blsWasmDestPath = path.join(browserDir, "blsjs.wasm");
if(!fs.existsSync(blsWasmSrcPath)){
  console.error("blsjs.wasm not found at:");
  console.error(blsWasmSrcPath);
  console.error("Probably you haven't execute npm install yet");
  return;
}
fs.copyFileSync(blsWasmSrcPath, blsWasmDestPath);


const packageJson = require("./package.json");
fs.writeFileSync(path.join(npmDir, "package.json"), JSON.stringify(packageJson, null, 2));

function copyFileToPublish(fileName){
  const srcPath = path.join(__dirname, fileName);
  const distPath = path.join(npmDir, fileName);
  if(fs.existsSync(srcPath)){
    fs.copyFileSync(srcPath, distPath);
  }
}

copyFileToPublish("CHANGELOG.md");
copyFileToPublish("LICENSE");
copyFileToPublish("README.md");
