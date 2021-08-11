const glob = require("glob");
const path = require("path");
const fs = require("fs");
const process = require("process");
const child_process = require("child_process");
const {ArgumentParser} = require("./lib/argparse");

let open_files = {};
let counter = 0;
let force_run = false;
let grepString = "";

function toPosixPath(p){
  return p.replace(/\\/g, "/");
}

function toOSPath(posixPath){
  if(path.resolve(process.cwd(), "/") === "/"){
    return posixPath;
  }
  return posixPath.replace(/[/]/g, "\\");
}

function get_file(folder, name, dry_run){
  const full_path = path.join(folder, `results-${name}.csv`);
  const posix_full_path = toPosixPath(full_path);
  if(posix_full_path in open_files){
    return open_files[posix_full_path];
  }
  
  let fd;
  if(dry_run){
    fd = false;
  }
  else {
    fd = fs.openSync(full_path, "a");
  }
  open_files[posix_full_path] = fd;
  
  if(dry_run){
    return fd;
  }
  
  fs.writeSync(fd, "#cost,assemble_from_ir,to_sexp_f,run_program,multiplier\n");
  return fd;
}

function run_benchmark_file(fn, existing_results){
  const folder = path.dirname(fn);
  const filename = path.basename(fn);
  
  if(!new RegExp(grepString).test(filename)){
    return;
  }
  
  // if we have a csv file for this run already, skip running it again
  const dry_run = !force_run && path.basename(fn).split('-')[0] in existing_results;
  
  if(!dry_run){
    console.log(`${counter.toString().padStart(4, '0')}: ${toOSPath(fn)}`);
  }
  counter += 1;
  
  const counters = {};
  // the filename is expected to be in the form:
  // name "-" value_size "-" num_calls
  if(!dry_run){
    const env = fs.readFileSync(fn.replace(/\.clvm$/, ".env"));
    const commandPath = path.resolve(__dirname, "..", ".dist", "npm", "bin", "cli.js");
    if(!fs.existsSync(commandPath)){
      console.error(`You need to build clvm_tools first. Executable not found at: ${commandPath}`);
      process.exit(1);
      return;
    }
    const command = `node "${commandPath}" brun -c --quiet --time "${toOSPath(fn)}" "${env}"`;
    const outputBuffer = child_process.execSync(command);
    const outputLines = outputBuffer.toString("ascii").split(/\n/g, 5);
    const output = outputLines.slice(0, outputLines.length-1);
    
    for(const o of output){
      try{
        if(o.includes(":")){
          const [key, value] = o.split(":");
          counters[key.trim()] = value.trim();
        }
        else if(o.includes("=")){
          const [key, value] = o.split("=");
          counters[key.trim()] = value.trim();
        }
      }
      catch(e){
        console.error(e);
        console.error(`ERROR parsing: ${o}`);
      }
    }
    console.log(JSON.stringify(counters));
  }
  
  const name_components = filename.split("-");
  const fd = get_file(folder, name_components.slice(0, name_components.length-1).join("-"), dry_run);
  if(!dry_run){
    const line = counters["cost"] + ","
      + counters["assemble_from_ir"] + ","
      + counters["to_sexp_f"] + ","
      + counters["run_program"] + ","
      + name_components[name_components.length-1].split(".")[0]
      + "\n";
    fs.writeSync(fd, line); // `fd` will be closed later
  }
}

function run_benchmark_folder(directory){
  const existing_results = [];
  for(const r of glob.sync(toPosixPath(path.resolve(directory, "*.csv")))){
    existing_results.push(path.basename(r).split('-')[1]);
  }
  
  for(const fn of glob.sync(toPosixPath(path.resolve(directory, "*.clvm")))){
    run_benchmark_file(fn, existing_results);
  }
  
  open_files = {};
}

function run_benchmark_all(rootFolder){
  for(const directory of glob.sync(toPosixPath(path.resolve(rootFolder, "*")))){
    run_benchmark_folder(directory);
  }
}

function main(){
  let benchmarkRoot = path.resolve(__dirname, "..", "test-programs");
  
  const {ArgumentParser} = require("./lib/argparse");
  const parser = new ArgumentParser({
    prog: "run-benchmark",
    description: "Run benchmark.",
  });
  parser.add_argument(
    ["-r", "--root-dir"], {type: path.resolve,
      default: "",
      help: "Root directory of the benchmark files"},
  );
  parser.add_argument(
    ["-g", "--grep"], {default: "",
      help: "grep string applied to benchmark file name"},
  );
  parser.add_argument(
    ["-f", "--force"], {action: "store_true",
      help: "Run regardless result file exists"},
  );
  
  const parsedArgs = parser.parse_args(process.argv.slice(2));
  if(parsedArgs.root_dir){
    benchmarkRoot = parsedArgs.root_dir;
  }
  if(parsedArgs.force){
    force_run = true;
  }
  if(parsedArgs.grep){
    grepString = parsedArgs.grep;
  }
  
  run_benchmark_all(benchmarkRoot);
}

main();
