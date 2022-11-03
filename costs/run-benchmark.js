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
let only_heaviest = false;
let number_of_iterations = 1;
let overwrite = false;
let useRust = false;
const now = (new Date()).toLocaleString();

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
  
  const file_already_exists = fs.existsSync(full_path);
  
  let fd;
  if(dry_run){
    fd = false;
  }
  else {
    fd = fs.openSync(full_path, overwrite ? "w" : "a");
  }
  open_files[posix_full_path] = fd;
  
  if(dry_run){
    return fd;
  }
  
  if(!file_already_exists || overwrite){
    fs.writeSync(fd, "#time,env,file,cost,assemble_from_ir,to_sexp_f,run_program,multiplier,n\n");
  }
  return fd;
}

function find_heaviest_benchmark_files(directory){
  const is_apply_bench = path.basename(directory) === "apply";
  const clvm_files = glob.sync(toPosixPath(path.resolve(directory, "*.clvm")));
  if(is_apply_bench){
    return clvm_files[0];
  }
  
  const regex = /(.+)-([0-9]+)-([0-9]+)\.clvm/;
  const obj = {};
  for(let i=0;i<clvm_files.length;i++){
    const fn = clvm_files[i];
    const filename = path.basename(fn);
    const match = regex.exec(filename);
    if(!match || match.length < 3 || isNaN(+match[2]) || isNaN(+match[3])){
      continue;
    }
    const name = match[1];
    const bytes = +match[2];
    const n = +match[3];
    if(!obj[name]){
      obj[name] = {
        max_bytes: bytes,
        max_n: n,
        heaviest_i: i,
      };
    }
    else if(bytes >= obj[name].max_bytes && n >= obj[name].max_n){
      obj[name].max_bytes = bytes;
      obj[name].max_n = n;
      obj[name].heaviest_i = i;
    }
  }
  
  const heaviest_i_all = Object.keys(obj).map(k => obj[k].heaviest_i);
  return clvm_files.filter((_, i) => {
    return heaviest_i_all.includes(i);
  });
}

function run_benchmark_file(fn, existing_results){
  const folder = path.dirname(fn);
  const filename = path.basename(fn);
  
  if(!new RegExp(grepString).test(filename)){
    return;
  }
  
  counter += 1;
  
  // if we have a csv file for this run already, skip running it again
  const dry_run = !force_run && (!existing_results || existing_results.find(r => r === path.basename(fn).split('-')[0]));
  if(dry_run){
    console.log(`${counter.toString().padStart(4, '0')}: ${toOSPath(fn)} SKIPPED`);
    return;
  }
  
  console.log(`${counter.toString().padStart(4, '0')}: ${toOSPath(fn)}`);
  const counters = {};
  // the filename is expected to be in the form:
  // name "-" value_size "-" num_calls
  const envPath = fn.replace(/\.clvm$/, ".env");
  const commandPath = path.resolve(__dirname, "..", ".dist", "npm", "bin", "cli.js");
  if(!fs.existsSync(commandPath)){
    console.error(`You need to build clvm_tools first. Executable not found at: ${commandPath}`);
    process.exit(1);
    return;
  }
  
  const command = [
    "node",
    `"${commandPath}"`, "brun", "-c", "--quiet", "--time", `--backend ${useRust ? "rust" : "js"}`,
    `"${toOSPath(fn)}"`, `"${toOSPath(envPath)}"`
  ].join(" ");
  for(let i=0;i<number_of_iterations;i++){
    const outputBuffer = child_process.execSync(command);
    const outputLines = outputBuffer.toString("ascii").split(/\n/g, 5);
    const output = outputLines.slice(0, outputLines.length-1);
  
    const regex = /^(.+)[:=](.+)$/;
    for(const o of output){
      const matcher = regex.exec(o);
      if(!matcher){
        console.error(`ERROR parsing: ${o}`);
        continue;
      }
      const key = matcher[1].trim();
      const value = +matcher[2].trim();
      counters[key] = (counters[key] || 0) + value;
    }
  }
  for(const name in counters){
    counters[name] /= number_of_iterations;
  }
  console.log(JSON.stringify(counters));
  
  const name_components = filename.split("-");
  const fd = get_file(folder, name_components.slice(0, name_components.length-1).join("-"), dry_run);
  const line = ""
    + now + ","
    + `clvm_tools(js)-clvm(${useRust ? "rust" : "js"})` + ","
    + filename + ","
    + counters["cost"] + ","
    + counters["assemble_from_ir"] + ","
    + counters["to_sexp_f"] + ","
    + counters["run_program"] + ","
    + name_components[name_components.length-1].split(".")[0] + ","
    + number_of_iterations
    + "\n";
  fs.writeSync(fd, line); // `fd` will be closed later
}

function run_benchmark_folder(directory){
  const existing_results = [];
  for(const r of glob.sync(toPosixPath(path.resolve(directory, "*.csv")))){
    existing_results.push(path.basename(r).split('-')[1]);
  }
  
  const heaviest_benchmark_fn = find_heaviest_benchmark_files(directory);
  for(const fn of glob.sync(toPosixPath(path.resolve(directory, "*.clvm")))){
    if(only_heaviest && !heaviest_benchmark_fn.includes(fn)){
      continue;
    }
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
  parser.add_argument(
    ["-o", "--only-heaviest"], {action: "store_true",
      help: "Run only the heaviest benchmark for each benchmark type"},
  );
  parser.add_argument(
    ["-n", "--number-of-try"], {type: "int", default: 1,
      help: "Number of benchmark iterations for accurate benchmark result"},
  );
  parser.add_argument(
    ["-w", "--overwrite"], {action: "store_true",
      help: "Overwrite previous benchmark result if it exists"},
  );
  parser.add_argument(
    ["-b", "--backend"], { default: "js",
    help: 'rust/js'}
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
  if(parsedArgs.only_heaviest){
    only_heaviest = true;
  }
  number_of_iterations = parsedArgs.number_of_try;
  if(parsedArgs.overwrite){
    overwrite = true;
  }
  useRust = parsedArgs.backend === "rust";
  
  run_benchmark_all(benchmarkRoot);
}

main();
