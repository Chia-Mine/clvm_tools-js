const glob = require("glob");
const path = require("path");
const fs = require("fs");
const process = require("process");
const child_process = require("child_process");

function toPosixPath(p){
  return p.replace(/\\/g, "/");
}

function toOSPath(posixPath){
  if(path.resolve(process.cwd(), "/") === "/"){
    return posixPath;
  }
  return posixPath.replace(/[/]/g, "\\");
}

let open_files = {};

let dry_run = false;

function get_file(folder, name){
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

let counter = 0;

let force_run = false;

let benchmarkRoot = path.resolve(__dirname, "..", "test-programs");
const {ArgumentParser} = require("./lib/argparse");
const parser = new ArgumentParser({
  prog: "run-benchmark",
  description: "Run benchmark.",
});
parser.add_argument(
  ["-d", "--root-dir"], {type: path.resolve,
    default: "",
    help: "Root directory of the benchmark files"},
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
for(const directory of glob.sync(toPosixPath(path.resolve(benchmarkRoot, "*")))){
  const existing_results = [];
  for(const r of glob.sync(toPosixPath(path.resolve(directory, "*.csv")))){
    existing_results.push(path.basename(r).split('-')[1]);
  }
  
  for(const fn of glob.sync(toPosixPath(path.resolve(directory, "*.clvm")))){
    // if we have a csv file for this run already, skip running it again
    dry_run = !force_run && path.basename(fn).split('-')[0] in existing_results;
    
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
      console.log(counters);
    }
    
    const folder = path.dirname(fn);
    const filename = path.basename(fn);
    const name_components = filename.split("-");
    const fd = get_file(folder, name_components.slice(0, name_components.length-1).join("-"));
    if(!dry_run){
      const line = counters["cost"] + ","
        + counters["assemble_from_ir"] + ","
        + counters["to_sexp_f"] + ","
        + name_components[name_components.length-1].split(".")[0]
        + "\n";
      fs.writeSync(fd, line); // `fd` will be closed later
    }
  }
  
  const gnuplot_filename = path.resolve(directory, "render-timings.gnuplot");
  const gnuplot_fd = fs.openSync(gnuplot_filename, "w+");
  
  const writeContent = `set output "./timings.png"
set datafile separator ","
set term png size 1400,900 small
set termoption enhanced
set ylabel "run-time (s)"
set xlabel "number of ops"
set xrange [0:*]
set yrange [0:0.3]
`;
  fs.writeSync(gnuplot_fd, writeContent);
  
  let color = 0;
  fs.writeSync(gnuplot_fd, "plot ");
  let count = Object.keys(open_files).length;
  for(const [n, v] of Object.entries(open_files)){
    let cont = ", \\";
    if(color + 1 === count){
      cont = "";
    }
    const name = n.split("results-")[1].split(".csv")[0];
    fs.writeSync(gnuplot_fd, `"./${n.replace(/^.+[/]/, "")}" using 5:4 with points lc ${color} title "${name}"${cont}\n`);
    color += 1;
    if(v !== false){
      fs.closeSync(v);
    }
  }
  
  fs.closeSync(gnuplot_fd);
  open_files = {};
  // os.system(`gnuplot ${gnuplot_filename}`) should be executed in `analyze-benchmark.js`
}