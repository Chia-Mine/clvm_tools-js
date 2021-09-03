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
const blsWasmSrcPath = path.join(__dirname, "node_modules", "clvm", "browser", "blsjs.wasm");
const blsWasmDestPath = path.join(browserDir, "blsjs.wasm");
if(!fs.existsSync(blsWasmSrcPath)){
  console.error("blsjs.wasm not found at:");
  console.error(blsWasmSrcPath);
  console.error("Probably you haven't execute npm install yet");
  return;
}
fs.copyFileSync(blsWasmSrcPath, blsWasmDestPath);

const clvmrsWasmSrcPath = require.resolve("clvm_rs/clvm_rs_bg.wasm");
const clvmrsWasmDestPath = path.join(browserDir, "clvm_rs_bg.wasm");
if(!fs.existsSync(clvmrsWasmSrcPath)){
  console.error("clvm_rs_bg.wasm not found at:");
  console.error(clvmrsWasmSrcPath);
  console.error("Probably you haven't execute npm install yet");
  return;
}
fs.copyFileSync(clvmrsWasmSrcPath, clvmrsWasmDestPath);

const browserDtsPath = path.join(browserDir, "index.d.ts");
fs.writeFileSync(browserDtsPath, 'export * from "..";\n');


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
