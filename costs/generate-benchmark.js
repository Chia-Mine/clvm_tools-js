const path = require("path");
const fs = require("fs");
const {t} = require("clvm");

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

function gen_apply(n, name){
  const folder = path.resolve(__dirname, "..", "test-programs", name);
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
  console.log(`${name}-${n} has been generated in ${folder}`);
}

function get_range(name){
  if(name.split("-")[0].endsWith("_empty")) return [3000, 300, [1]];
  if(name.startsWith('mul_nest1')) return [3000,300,[1, 25, 50, 100, 200, 400, 600, 800, 1000]];
  if(name.startsWith('mul')) return [3000,300,[1, 25, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100, 1200, 1300, 1400]];
  if(name.startsWith('cons-')) return [3000,300,[1]];
  if(name.startsWith('lookup')) return [3000,300,[2]];
  if(name.startsWith('point_add')) return [300,30,[48]];
  if(name.startsWith('listp')) return [3000,300,[1]];
  if(name.startsWith('first')) return [3000,300,[1]];
  if(name.startsWith('rest')) return [3000,300,[1]];
  if(name.startsWith('if-')) return [3000,300,[1]];
  else return [3000,300,[1, 128, 1024]];
}

function print_files(fun){
  const name = fun(0, 1)[0];
  const [end, step, vsizes] = get_range(name);
  const folder = path.resolve(__dirname, "..", "test-programs", name.split("-")[0].split("_")[0]);
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
      console.log(`${name} has been generated in ${folder}`);
    }
  }
}

const write_file_tasks = [];
function add_print_files_task(fun){
  write_file_tasks.push(() => print_files(fun));
}

if(!fs.existsSync(path.resolve(__dirname, "..", "test-programs"))){
  fs.mkdirSync(path.resolve(__dirname, "..", "test-programs"));
}

add_print_files_task((n, vs) => generate_op_list(n, 'concat', vs, 'concat'));
add_print_files_task((n, vs) => generate_args(n, 'concat', vs, 'concat'));

add_print_files_task((n, vs) => generate_op_list(n, 'divmod', vs, 'divmod'));
add_print_files_task((n, vs) => generate_op_list(n, '/', vs, 'div'));

add_print_files_task((n, vs) => generate_args(n, '+', vs, 'plus'));
add_print_files_task((n, vs) => generate_op_list(n, '+', vs, 'plus'));
add_print_files_task((n, vs) => generate_op_list(n, '+', vs, 'plus_empty', 0));

add_print_files_task((n, vs) => generate_args(n, '-', vs, 'minus'));
add_print_files_task((n, vs) => generate_op_list(n, '-', vs, 'minus'));
add_print_files_task((n, vs) => generate_op_list(n, '-', vs, 'minus_empty', 0));

add_print_files_task((n, vs) => generate_args(n, 'logand', vs, 'logand'));
add_print_files_task((n, vs) => generate_op_list(n, 'logand', vs, 'logand'));
add_print_files_task((n, vs) => generate_op_list(n, 'logand', vs, 'logand_empty', 0));

add_print_files_task((n, vs) => generate_args(n, 'logior', vs, 'logior'));
add_print_files_task((n, vs) => generate_op_list(n, 'logior', vs, 'logior'));
add_print_files_task((n, vs) => generate_op_list(n, 'logior', vs, 'logior_empty', 0));

add_print_files_task((n, vs) => generate_args(n, 'logxor', vs, 'logxor'));
add_print_files_task((n, vs) => generate_op_list(n, 'logxor', vs, 'logxor'));
add_print_files_task((n, vs) => generate_op_list(n, 'logxor', vs, 'logxor_empty', 0));

add_print_files_task((n, vs) => generate_nested(n, 'lognot', vs, 'lognot', 1));
add_print_files_task((n, vs) => generate_nested(n, 'not', vs, 'not', 1));

add_print_files_task((n, vs) => generate_nested(n, 'any', vs, 'any'));
add_print_files_task((n, vs) => generate_args(n, 'any', vs, 'any'));

add_print_files_task((n, vs) => generate_nested(n, 'all', vs, 'all'));
add_print_files_task((n, vs) => generate_args(n, 'all', vs, 'all'));

add_print_files_task((n, vs) => generate_nested_2values(n, 'lsh', [vs, 1], 'lsh'));
add_print_files_task((n, vs) => generate_nested_2values(n, 'ash', [vs, 1], 'ash'));

add_print_files_task((n, vs) => generate_op_list(n, '=', vs, 'eq'));
add_print_files_task((n, vs) => generate_op_list(n, '>', vs, 'gr'));
add_print_files_task((n, vs) => generate_op_list(n, '>s', vs, 'grs'));

add_print_files_task((n, vs) => generate_nested(n, 'c', vs, 'cons'));

const point_val = '0xb3b8ac537f4fd6bde9b26221d49b54b17a506be147347dae5d081c0a6572b611d8484e338f3432971a9823976c6a232b'
add_print_files_task((n, vs) => generate_nested_value(n, 'point_add', point_val, 'point_add'));
add_print_files_task((n, vs) => generate_args_value(n, 'point_add', point_val, 'point_add'));

add_print_files_task((n, vs) => generate_op_list(n, 'sha256', vs, 'sha', 1));
add_print_files_task((n, vs) => generate_op_list(n, 'sha256', vs, 'sha_empty', 0));
add_print_files_task((n, vs) => generate_args(n, 'sha256', vs, 'sha'));

add_print_files_task((n, vs) => generate_op_list(n, 'pubkey_for_exp', vs, 'pubkey', 1));

add_print_files_task((n, vs) => generate_lookup(n));
add_print_files_task((n, vs) => generate_lookup_op_list(n));

add_print_files_task((n, vs) => generate_op_list(n, 'strlen', vs, 'strlen', 1));

add_print_files_task((n, vs) => generate_op_list(n, '*', vs, 'mul'));
add_print_files_task((n, vs) => generate_nested_1(n, '*', vs, 'mul'));
add_print_files_task((n, vs) => generate_op_list(n, '*', vs, 'mul_empty', 0));

add_print_files_task((n, vs) => generate_op_list(n, 'l', vs, 'listp', 1));

add_print_files_task((n, vs) => generate_list(n, 'f', 'first'));
add_print_files_task((n, vs) => generate_list_empty(n));

add_print_files_task((n, vs) => generate_list(n, 'r', 'rest'));

add_print_files_task((n, vs) => generate_if(n));
write_file_tasks.push(() => gen_apply(1000, 'apply'));

/*
 * Dispatch child processes for performance
 */

const cluster = require("cluster");
const process = require("process");
const numCPUs = require("os").cpus().length;

if((typeof cluster.isMaster === "boolean" && cluster.isMaster) || (typeof cluster.isPrimary === "boolean" && cluster.isPrimary)){
  const start = Date.now();
  console.log(`Primary ${process.pid} has started`);
  
  const workers = {};
  const deadWorkers = [];
  for(let i=0;i<numCPUs && i<write_file_tasks.length;i++){
    const w = cluster.fork({wid: i});
    workers[w.process.pid] = {i, pid: w.process.pid, time: Date.now()};
  }
  
  cluster.on("exit", (worker, code, signal) => {
    const w = workers[worker.process.pid];
    console.log(`worker ${w.i}/${worker.process.pid} has completed in ${Date.now() - w.time}ms`);
    deadWorkers.push(worker.process.pid);
    
    if(Object.keys(workers).length === deadWorkers.length){
      console.log(`Primary ${process.pid} finished in ${Date.now() - start}ms`);
      process.exit(0);
    }
  });
}
else{
  console.log(`Worker ${process.env.wid}/${process.pid} has started`);
  
  for(let i=0;i<write_file_tasks.length;i++){
    const task = write_file_tasks[i];
    if((i % numCPUs).toString() === process.env.wid){
      task();
    }
  }
  
  process.exit(0);
}