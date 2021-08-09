const path = require("path");
const fs = require("fs");
const {t} = require("clvm");

let benchmarkRoot = path.resolve(__dirname, "..", "test-programs");

function getrandbits(bits){
  return Math.round(Math.random() * (2**bits));
}

function make_value(length){
  let ret = "0x";
  for(let i=0;i<length;i++){
    ret += ((getrandbits(7) << 1) + 1).toString(16).padStart(2, "0");
  }
  return ret;
}

function make_lookup(depth){
  let path = 1;
  let tree = "42";
  while(depth > 0){
    path <<= 1;
    const leg = getrandbits(1);
    if(leg === 0){
      tree = "(" + tree + " . 0x1337)";
    }
    else{
      tree = "(0x1337 . " + tree + ")";
    }
    path |= leg;
    depth -= 1;
  }
  return t(`${path}`, tree);
}

function generate_args(n, name, value_size, filename){
  let ret = "(" + name;
  for(let i=0;i<n;i++){
    ret += " (q . " + make_value(value_size) + ")";
  }
  ret += ")";
  return [`${filename}_args-${value_size}-${n}`, ret, "()"];
}

function generate_nested(n, name, value_size, filename, arity=2){
  let ret = "";
  for(let i=0;i<n;i++){
    ret += `(${name} `;
    for(let k=0;k<arity-1;k++){
      ret += "(q . " + make_value(value_size) + ") ";
    }
  }
  ret += "(q . " + make_value(value_size) + ")";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`${filename}_nest-${value_size}-${n}`, ret, "()"];
}

function generate_nested_1(n, name, value_size, filename, arity=2){
  let ret = "";
  for(let i=0;i<n;i++){
    ret += `(${name} `;
    for(let k=0;k<arity-1;k++){
      ret += "(q . 1) ";
    }
  }
  ret += "(q . " + make_value(value_size) + ")";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`${filename}_nest1-${value_size}-${n}`, ret, "()"];
}

function size_of_value(val){
  if(val.startsWith("0x")){
    return (val.length - 2) / 2;
  }
  if(val.startsWith('"') && val.endsWith('"')){
    return val.length - 2;
  }
  console.log(`don't know how to interpret value: ${val}`);
  process.exit(1);
}

function generate_args_value(n, name, value, filename){
  let ret = "(" + name;
  for(let i=0;i<n;i++){
    ret += " (q . " + value + ")";
  }
  ret += ")";
  return [`${filename}_args-${size_of_value(value)}-${n}`, ret, "()"];
}

function generate_nested_value(n, name, value, filename, arity=2){
  let ret = "";
  for(let i=0;i<n;i++){
    ret += `(${name} `;
    for(let k=0;k<arity-1;k++){
      ret += "(q . " + value + ") ";
    }
  }
  ret += "(q . " + value + ")";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`${filename}_nest-${size_of_value(value)}-${n}`, ret, "()"];
}

// use a different value for right hand and left hand. e.g. shift has limits on
// how large the right hand side can be
function generate_nested_2values(n, name, value_sizes, filename, arity=2){
  let ret = "";
  for(let i=0;i<n;i++){
    ret += `(${name} `;
  }
  ret += "(q . " + make_value(value_sizes[0]) + ")";
  for(let i=0;i<n;i++){
    for(let k=0;k<arity-1;k++){
      ret += " (q . " + make_value(value_sizes[1]) + ")";
    }
    ret += ")";
  }
  return [`${filename}_nest-${value_sizes[0]}-${n}`, ret, "()"];
}

function generate_lookup(n){
  const [path, tree] = make_lookup(n);
  return [`lookup-2-${n}`, path, tree];
}

function generate_lookup_op_list(n){
  const [path, tree] = make_lookup(1);
  let ret = "";
  for(let i=0;i<n;i++){
    ret += "(c " + path + " ";
  }
  ret += "()";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`lookup_2-2-${n}`, ret, tree];
}

function generate_op_list(n, name, value_size, filename, arity=2){
  let ret = "";
  for(let i=0;i<n;i++){
    ret += `(c (${name}`;
    for(let k=0;k<arity;k++){
      ret += " (q . " + make_value(value_size) + ")";
    }
    ret += ") ";
  }
  ret += "()";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`${filename}-${value_size}-${n}`, ret, "()"];
}

function generate_list(n, name, filename){
  let ret = "";
  for(let i=0;i<n;i++){
    ret += `(c (${name} (q . (1 2 3))) `;
  }
  ret += "()";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`${filename}-1-${n}`, ret, "()"];
}

function generate_list_empty(n){
  let ret = "";
  for(let i=0;i<n;i++){
    ret += "(c (q . (1 2 3)) ";
  }
  ret += "()";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`first_empty-1-${n}`, ret, "()"];
}

function generate_if(n){
  let ret = "";
  // alternate between true and false
  const conditions = ["()", "(q . 1)"];
  for(let i=0;i<n;i++){
    ret += `(c (i ${conditions[i%2]} (q . 1) (q . 2)) `;
  }
  ret += "()";
  for(let i=0;i<n;i++){
    ret += ")";
  }
  return [`if-1-${n}`, ret, "()"];
}

function get_range(name){
  if(name.split("-")[0].endsWith("_empty")) return [3000, 40, [1]];
  if(name.startsWith('mul_nest1')) return [3000,50,[1, 25, 50, 100, 200, 400, 600, 800, 1000]];
  if(name.startsWith('mul')) return [3000,50,[1, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400]];
  if(name.startsWith('cons-')) return [3000,40,[1]];
  if(name.startsWith('lookup')) return [3000,40,[2]];
  if(name.startsWith('point_add')) return [300,4,[48]];
  if(name.startsWith('listp')) return [3000,40,[1]];
  if(name.startsWith('first')) return [3000,40,[1]];
  if(name.startsWith('rest')) return [3000,40,[1]];
  if(name.startsWith('if-')) return [3000,40,[1]];
  else return [3000,40,[1, 128, 1024]];
}

function print_files(fun){
  const {wid} = process.env;
  const name = fun(0, 1)[0];
  const [end, step, vsizes] = get_range(name);
  const folder = path.resolve(benchmarkRoot, name.split("-")[0].split("_")[0]);
  try{
    if(!fs.existsSync(folder)){
      fs.mkdirSync(folder);
    }
  }
  catch (e) { }
  
  for(const value_size of vsizes){
    for(let i=2;i<end;i+=step){
      const [name, prg, env] = fun(i, value_size);
      fs.writeFileSync(path.resolve(folder, `${name}.clvm`), prg);
      fs.writeFileSync(path.resolve(folder, `${name}.env`), env);
      console.log(`[process-${wid}] Generated ${name} into ${folder}`);
    }
  }
}

function gen_apply(n, name){
  const {wid} = process.env;
  const folder = path.resolve(benchmarkRoot, name);
  try{
    if(!fs.existsSync(folder)){
      fs.mkdirSync(folder);
    }
  }
  catch (e) { }
  const fd = fs.openSync(path.resolve(folder, `${name}-${n}.clvm`), "w+");
  try{
    for(let i=0;i<n;i++){
      fs.writeSync(fd, "(a (q . (lognot ");
    }
    
    fs.writeSync(fd, "(q . 1)");
    
    for(let i=0;i<n;i++){
      fs.writeSync(fd, ")) ())");
    }
  }
  catch(e){
    console.error(e);
  }
  finally {
    fs.closeSync(fd);
  }
  
  fs.writeFileSync(path.resolve(folder, `${name}-${n}.env`), "()");
  console.log(`[process-${wid}] Generated ${name}-${n} into ${folder}`);
}

const point_val = '0xb3b8ac537f4fd6bde9b26221d49b54b17a506be147347dae5d081c0a6572b611d8484e338f3432971a9823976c6a232b'

const benchmarkTasks = {
  concat_op_list: () => print_files((n, vs) => generate_op_list(n, 'concat', vs, 'concat')),
  concat_args: () => print_files((n, vs) => generate_args(n, 'concat', vs, 'concat')),
  divmod_op_list: () => print_files((n, vs) => generate_op_list(n, 'divmod', vs, 'divmod')),
  div_op_list: () => print_files((n, vs) => generate_op_list(n, '/', vs, 'div')),
  plus_args: () => print_files((n, vs) => generate_args(n, '+', vs, 'plus')),
  plus_op_list: () => print_files((n, vs) => generate_op_list(n, '+', vs, 'plus')),
  plus_empty_op_list: () => print_files((n, vs) => generate_op_list(n, '+', vs, 'plus_empty', 0)),
  minus_args: () => print_files((n, vs) => generate_args(n, '-', vs, 'minus')),
  minus_op_list: () => print_files((n, vs) => generate_op_list(n, '-', vs, 'minus')),
  minus_empty_op_list: () => print_files((n, vs) => generate_op_list(n, '-', vs, 'minus_empty', 0)),
  logand_args: () => print_files((n, vs) => generate_args(n, 'logand', vs, 'logand')),
  logand_op_list: () => print_files((n, vs) => generate_op_list(n, 'logand', vs, 'logand')),
  logand_empty_op_list: () => print_files((n, vs) => generate_op_list(n, 'logand', vs, 'logand_empty', 0)),
  logior_args: () => print_files((n, vs) => generate_args(n, 'logior', vs, 'logior')),
  logior_op_list: () => print_files((n, vs) => generate_op_list(n, 'logior', vs, 'logior')),
  logior_empty_op_list: () => print_files((n, vs) => generate_op_list(n, 'logior', vs, 'logior_empty', 0)),
  logxor_args: () => print_files((n, vs) => generate_args(n, 'logxor', vs, 'logxor')),
  logxor_op_list: () => print_files((n, vs) => generate_op_list(n, 'logxor', vs, 'logxor')),
  logxor_empty_op_list: () => print_files((n, vs) => generate_op_list(n, 'logxor', vs, 'logxor_empty', 0)),
  lognot_nested: () => print_files((n, vs) => generate_nested(n, 'lognot', vs, 'lognot', 1)),
  not_nested: () => print_files((n, vs) => generate_nested(n, 'not', vs, 'not', 1)),
  any_nested: () => print_files((n, vs) => generate_nested(n, 'any', vs, 'any')),
  any_args: () => print_files((n, vs) => generate_args(n, 'any', vs, 'any')),
  all_nested: () => print_files((n, vs) => generate_nested(n, 'all', vs, 'all')),
  all_args: () => print_files((n, vs) => generate_args(n, 'all', vs, 'all')),
  nested_2values_lsh: () => print_files((n, vs) => generate_nested_2values(n, 'lsh', [vs, 1], 'lsh')),
  nested_2values_ash: () => print_files((n, vs) => generate_nested_2values(n, 'ash', [vs, 1], 'ash')),
  op_list_eq: () => print_files((n, vs) => generate_op_list(n, '=', vs, 'eq')),
  op_list_gr: () => print_files((n, vs) => generate_op_list(n, '>', vs, 'gr')),
  op_list_grs: () => print_files((n, vs) => generate_op_list(n, '>s', vs, 'grs')),
  nested_cons: () => print_files((n, vs) => generate_nested(n, 'c', vs, 'cons')),
  nested_value_point_add: () => print_files((n, vs) => generate_nested_value(n, 'point_add', point_val, 'point_add')),
  args_value_point_add: () => print_files((n, vs) => generate_args_value(n, 'point_add', point_val, 'point_add')),
  sha_op_list: () => print_files((n, vs) => generate_op_list(n, 'sha256', vs, 'sha', 1)),
  sha_empty_op_list: () => print_files((n, vs) => generate_op_list(n, 'sha256', vs, 'sha_empty', 0)),
  args_sha: () => print_files((n, vs) => generate_args(n, 'sha256', vs, 'sha')),
  pubkey_op_list: () => print_files((n, vs) => generate_op_list(n, 'pubkey_for_exp', vs, 'pubkey', 1)),
  lookup: () => print_files((n, vs) => generate_lookup(n)),
  lookup_op_list: () => print_files((n, vs) => generate_lookup_op_list(n)),
  strlen_op_list: () => print_files((n, vs) => generate_op_list(n, 'strlen', vs, 'strlen', 1)),
  mul_op_list: () => print_files((n, vs) => generate_op_list(n, '*', vs, 'mul')),
  mul_nested: () => print_files((n, vs) => generate_nested_1(n, '*', vs, 'mul')),
  mul_empty_op_list: () => print_files((n, vs) => generate_op_list(n, '*', vs, 'mul_empty', 0)),
  listp_op_list: () => print_files((n, vs) => generate_op_list(n, 'l', vs, 'listp', 1)),
  first_list: () => print_files((n, vs) => generate_list(n, 'f', 'first')),
  list_empty: () => print_files((n, vs) => generate_list_empty(n)),
  rest_list: () => print_files((n, vs) => generate_list(n, 'r', 'rest')),
  if: () => print_files((n, vs) => generate_if(n)),
  apply: () => gen_apply(1000, 'apply'),
};

function select_task_names(grep_str){
  const task_names = [];
  const regex = new RegExp(grep_str);
  for(const name of Object.keys(benchmarkTasks)){
    if(grep_str && !regex.test(name)){
      continue;
    }
    task_names.push(name);
  }
  return task_names;
}



const cluster = require("cluster");
const process = require("process");
const {now} = require("./lib/performance");
const {ArgumentParser} = require("./lib/argparse");
const numCPUs = require("os").cpus().length;

function single_process_main(){
  console.warn("This system does not support cluster. It will take several minutes to complete");
  
  if(!fs.existsSync(path.resolve(benchmarkRoot))){
    fs.mkdirSync(path.resolve(benchmarkRoot));
  }
  
  for(const name of Object.keys(benchmarkTasks)){
    const task = benchmarkTasks[name];
    task();
  }
}

function cluster_master_main(){
  const {now} = require("./lib/performance");
  const start = now();
  const {ArgumentParser} = require("./lib/argparse");
  const parser = new ArgumentParser({
    prog: "generate-benchmark",
    description: "Generate files for benchmark.",
  });
  parser.add_argument(
    ["-d", "--root-dir"], {type: path.resolve,
      default: "",
      help: "Root directory of the benchmark files"},
  );
  parser.add_argument(
    ["-c", "--core"], {type: "int",
      default: numCPUs,
      help: "Number of cpu cores to use"},
  );
  parser.add_argument(
    ["-g", "--grep"], {default: "",
      help: "grep string to filter benchmark to generate"},
  );
  parser.add_argument(
    ["-l", "--list"], {action: "store_true",
      help: "grep string to filter benchmark to generate"},
  );
  
  const parsedArgs = parser.parse_args(process.argv.slice(2));
  if(parsedArgs.root_dir){
    benchmarkRoot = parsedArgs.root_dir;
  }
  
  let nCoreToUse = numCPUs;
  if(typeof parsedArgs.core === "number" && parsedArgs.core > 0 && parsedArgs.core <= numCPUs){
    nCoreToUse = parsedArgs.core;
  }
  let targetTasksNames = Object.keys(benchmarkTasks);
  if(parsedArgs.grep){
    targetTasksNames = select_task_names(parsedArgs.grep);
  }
  if(parsedArgs.list){
    console.log(targetTasksNames.join("\n"));
    process.exit(0);
    return;
  }
  
  if(!targetTasksNames.length){
    console.error("Specified benchmark tasks not found");
    process.exit(0);
    return;
  }
  
  console.log(`[main] primary process ${process.pid} has started`);
  
  if(!fs.existsSync(path.dirname(benchmarkRoot))){
    console.error(`${path.dirname(benchmarkRoot)} was not found`);
    process.exit(1);
  }
  if(!fs.existsSync(benchmarkRoot)){
    fs.mkdirSync(benchmarkRoot);
  }
  
  const workers = {};
  const deadWorkers = [];
  for(let i=0;i<nCoreToUse && i<targetTasksNames.length;i++){
    const env = {
      wid: i,
      benchmarkRoot,
      nCoreToUse,
      targetTasksNames: JSON.stringify(targetTasksNames),
    };
    const w = cluster.fork(env);
    workers[w.process.pid] = {i, pid: w.process.pid, time: now()};
  }
  
  cluster.on("exit", (worker, code, signal) => {
    const w = workers[worker.process.pid];
    console.log(`[main] worker process ${w.i}/${worker.process.pid} has completed in ${now() - w.time}ms`);
    deadWorkers.push(worker.process.pid);
    
    if(Object.keys(workers).length === deadWorkers.length){
      console.log(`[main] primary process ${process.pid} finished in ${now() - start}ms`);
      process.exit(0);
    }
  });
}

function cluster_worker_main(){
  const {
    wid,
    benchmarkRootEnv,
    nCoreToUse,
    targetTasksNames: targetTasksNames_json,
  } = process.env;
  console.log(`[main] worker process ${wid}/${process.pid} has started`);
  
  const targetTasksNames = JSON.parse(targetTasksNames_json);
  
  if(benchmarkRootEnv){
    if(!fs.existsSync(benchmarkRootEnv)){
      console.error(`[ERROR] Benchmark root folder was not found: ${benchmarkRootEnv}`);
      process.exit(1);
      return;
    }
    benchmarkRoot = benchmarkRootEnv;
  }
  const nCore = +nCoreToUse;
  if(isNaN(nCore) || !isFinite(nCore) || nCore < 0 || nCore > numCPUs){
    console.error(`[ERROR] Invalid number of cores: ${nCore}`);
    process.exit(1);
    return;
  }
  
  for(let i=0;i<targetTasksNames.length;i++){
    const taskName = targetTasksNames[i];
    if((i % nCore).toString() === wid){
      const task = benchmarkTasks[taskName];
      task();
    }
  }
  
  process.exit(0);
}

if(typeof cluster.isMaster !== "boolean" && typeof cluster.isPrimary !== "boolean"){
  single_process_main();
}
else if(cluster.isMaster || cluster.isPrimary){
  cluster_master_main();
}
else{
  cluster_worker_main();
}