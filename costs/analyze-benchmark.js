const glob = require("glob");
const path = require("path");
const fs = require("fs");
const child_process = require("child_process");
const {ArgumentParser} = require("./lib/argparse");
const process = require("process");

function toPosixPath(p){
  return p.replace(/\\/g, "/");
}

function least_squares(X, Y){
  const N = X.length;
  let SX = 0;
  let SY = 0;
  let SXY = 0;
  let SXX = 0;
  
  for(let i=0;i<N;i++){
    const x = X[i];
    const y = Y[i];
    SX += x;
    SY += y;
    SXY += x*y;
    SXX += x*x;
  }
  
  const m = (SXY - SX*SY / N) / (SXX - SX*SX/N);
  const c = SY / N - m*SX / N;
  return {m, c};
}

function linear_regression_no_outliners(ops, runtime){
  const num_points = ops.length;
  
  // we want to remove the 5% worst points
  const n5Percent = Math.floor(num_points/20);
  for(let counter=0;counter<n5Percent;counter++){
    const {m, c} = least_squares(ops, runtime);
    // find the point farthest from the line defined by x*m+c
    // and remove it
    let worst = -1;
    let dist = 0;
    for(let i=0;i<ops.length;i++){
      const f = ops[i] * m + c;
      const d = Math.abs(f - runtime[i]);
      if(d > dist){
        worst = i;
        dist = d;
      }
    }
    
    if(worst >= 0){
      ops.splice(worst, 1);
      runtime.splice(worst, 1);
    }
  }
  
  return least_squares(ops, runtime);
}

function try_to_run_gnuplot(gnuplot_filename){
  try{
    child_process.execSync(`gnuplot ${gnuplot_filename}`);
  }
  catch(e){}
}

function generate_and_run_trends_analysis(directory){
  const gnuplot_filename = path.resolve(directory, "render-trends.gnuplot");
  const gnuplot_fd = fs.openSync(gnuplot_filename, "w+");
  const filenames = glob.sync(toPosixPath(path.resolve(directory, "results-*.csv")));
  filenames.sort((a, b) => {
    const match_a= /results-[^-]+[-]([0-9]+)\.csv$/.exec(a);
    const match_b= /results-[^-]+[-]([0-9]+)\.csv$/.exec(b);
    return +match_a[1] - +match_b[1];
  });
  
  let xMax = 0;
  let yMax = 0;
  const lines_to_write = [];
  for(let i=0;i<filenames.length;i++){
    const fn = filenames[i];
    let cont = ", \\";
    if(i === filenames.length-1){
      cont = "";
    }
    const ops = [];
    const runtime = [];
    const lines = fs.readFileSync(fn, "utf-8").split("\n");
    for(const line of lines){
      if(!line || line.startsWith("#")){
        continue;
      }
      const cols = line.split(",");
      const x = +cols[4];
      const y = +cols[3];
      runtime.push(y);
      ops.push(x);
      if(x > xMax) xMax = x;
      if(y > yMax) yMax = y;
    }
  
    const {m, c} = linear_regression_no_outliners(ops, runtime);
  
    const name = fn.split("results-")[1].split(".csv")[0];
    console.log(`${name.padStart(30, " ")}: ${m*1000000} (${c*1000000})`);
  
    lines_to_write.push(`x*${m}+${c} title "${name}" lc ${i}${cont}\n`);
  }
  
  const xLog10 = Math.floor(Math.log10(xMax));
  xMax = Math.ceil(xMax/(10**xLog10)) * 10**xLog10;
  const yLog10 = Math.floor(Math.log10(yMax));
  yMax = Math.ceil(yMax/(10**yLog10)) * 10**yLog10;
  
  fs.writeSync(gnuplot_fd, `set output "./timing-trends.png"
set term png size 1400,900 small
set termoption enhanced
set ylabel "run-time (s)"
set xlabel "number of ops"
set xrange [0:${xMax}]
set yrange [0:${yMax}]
set datafile separator ","
plot `);
  
  console.log("microseconds per operation");
  for(let i=0;i<lines_to_write.length;i++){
    fs.writeSync(gnuplot_fd, lines_to_write[i]);
  }
  
  fs.writeSync(gnuplot_fd, "y=0\n");
  fs.closeSync(gnuplot_fd);
  try_to_run_gnuplot(gnuplot_filename);
}

function generate_and_run_timings_analysis(directory){
  const gnuplot_filename = path.resolve(directory, "render-timings.gnuplot");
  const gnuplot_fd = fs.openSync(gnuplot_filename, "w+");
  const filenames = glob.sync(toPosixPath(path.resolve(directory, "results-*.csv")));
  filenames.sort((a, b) => {
    const match_a= /results-[^-]+[-]([0-9]+)\.csv$/.exec(a);
    const match_b= /results-[^-]+[-]([0-9]+)\.csv$/.exec(b);
    return +match_a[1] - +match_b[1];
  });
  
  let xMax = 0;
  let yMax = 0;
  const lines_to_write = [];
  for(let i=0;i<filenames.length;i++){
    const fn = filenames[i];
    let cont = ", \\";
    if(i === filenames.length-1){
      cont = "";
    }
    const lines = fs.readFileSync(fn, "utf-8").split("\n");
    for(const line of lines){
      if(!line || line.startsWith("#")){
        continue;
      }
      const cols = line.split(",");
      const x = +cols[4];
      const y = +cols[3];
      if(x > xMax) xMax = x;
      if(y > yMax) yMax = y;
    }
    
    const name = fn.split("results-")[1].split(".csv")[0];
    lines_to_write.push(`"./${fn.replace(/^.+[/]/, "")}" using 5:4 with points lc ${i} title "${name}"${cont}\n`);
  }
  
  const xLog10 = Math.floor(Math.log10(xMax));
  xMax = Math.ceil(xMax/(10**xLog10)) * 10**xLog10;
  const yLog10 = Math.floor(Math.log10(yMax));
  yMax = Math.ceil(yMax/(10**yLog10)) * 10**yLog10;
  
  const writeContent = `set output "./timings.png"
set datafile separator ","
set term png size 1400,900 small
set termoption enhanced
set ylabel "run-time (s)"
set xlabel "number of ops"
set xrange [0:*]
set yrange [0:0.3]
plot `;
  fs.writeSync(gnuplot_fd, writeContent);
  for(let i=0;i<lines_to_write.length;i++){
    fs.writeSync(gnuplot_fd, lines_to_write[i]);
  }
  
  fs.closeSync(gnuplot_fd);
}

function main(){
  let benchmarkRoot = path.resolve(__dirname, "..", "test-programs");
  let grep = "";
  
  const {ArgumentParser} = require("./lib/argparse");
  const parser = new ArgumentParser({
    prog: "analyze-benchmark",
    description: "Analyze benchmark result.",
  });
  parser.add_argument(
    ["-r", "--root-dir"], {type: path.resolve,
      default: "",
      help: "Root directory of the benchmark files"},
  );
  parser.add_argument(
    ["-g", "--grep"], {default: "",
      help: "grep string applied to benchmark folder name"},
  );
  
  const parsedArgs = parser.parse_args(process.argv.slice(2));
  if(parsedArgs.root_dir){
    benchmarkRoot = parsedArgs.root_dir;
  }
  if(parsedArgs.grep){
    grep = parsedArgs.grep;
  }
  
  for(const directory of glob.sync(toPosixPath(path.resolve(benchmarkRoot, "*")))){
    if(grep && !(new RegExp(grep).test(path.basename(directory)))){
      continue;
    }
    
    generate_and_run_trends_analysis(directory);
    generate_and_run_timings_analysis(directory);
  }
}

main();
