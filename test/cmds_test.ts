import * as os_path from "path";
import * as fs from "fs";
import * as shlex from "shlex";
import * as console_scripts from "../src/clvm_tools/cmds";
import {fs_readlineSync, os_walk} from "../src/__platform__/io";
import {print, setStdout, setStderr} from "../src/__platform__/print";

// # If the REPAIR environment variable is set, any tests failing due to
// # wrong output will be corrected. Be sure to do a "git diff" to validate that
// # you're getting changes you expect.

const REPAIR = Boolean(process.env.REPAIR);

function get_test_cases(path: string){
  const PREFIX = __dirname;
  const TESTS_PATH = os_path.resolve(PREFIX, path);
  const paths: string[] = [];
  
  for(const {dirpath, dirnames, filenames} of os_walk(TESTS_PATH)){
    for(const fn of filenames){
      if(fn.endsWith(".txt") && fn[0] !== "."){
        paths.push(os_path.resolve(dirpath, fn));
      }
    }
  }
  
  paths.sort();
  const test_cases: Array<[string, string[], string, string[], string]> = [];
  for(const p of paths){
    const f = fs_readlineSync(p);
    // # allow "#" comments at the beginning of the file
    const cmd_lines: string[] = [];
    const comments: string[] = [];
    let itr = f.next();
    while(!itr.done){
      const l = itr.value;
      const line = l.trimEnd();
      if(line.length < 1 || line[0] !== "#"){
        if(line[line.length-1] === "\\"){
          cmd_lines.push(line.substr(0, line.length-1));
          itr = f.next();
          continue;
        }
        cmd_lines.push(line);
        itr = f.next(true);
        break;
      }
      comments.push(line + "\n");
      itr = f.next();
    }
    const expected_output = itr.value;
    const test_name = os_path.relative(PREFIX, p).replace(/\./g, "_").replace(/\//g, "_").replace(/\\/g, "_");
    test_cases.push([test_name, cmd_lines, expected_output, comments, p]);
  }
  return test_cases;
}

function invoke_tool(cmd_line: string){
  const stdout_buffer: string[] = [];
  const stderr_buffer: string[] = [];
  
  setStdout((...args: any[]) => {
    stdout_buffer.push(args.map(a => a.toString()).join(" "));
    stdout_buffer.push("");
  });
  setStderr((...args: any[]) => {
    stderr_buffer.push(args.map(a => a.toString()).join(" "));
    stderr_buffer.push("");
  });
  
  const args = shlex.split(cmd_line);
  const v = console_scripts[args[0] as "run"|"brun"|"opc"|"opd"|"read_ir"](args);
  
  setStdout(console.log);
  setStderr(console.error);
  
  return [v, stdout_buffer.join("\n"), stderr_buffer.join("\n")];
}

function make_f(cmd_lines: string[], expected_output: string, comments: string[], path: string){
  return function f(){
    const cmd = cmd_lines.join("");
    let r, actual_output, actual_stderr;
    for(const c of cmd.split(/;/)){
      ([r, actual_output, actual_stderr] = invoke_tool(c));
    }
    if(actual_output !== expected_output){
      /*
      print(path);
      print(cmd);
      print(actual_output as string);
      print(expected_output);
       */
      console.log(`${path}\n${cmd}\n${actual_output}\n${expected_output}`);
      if(REPAIR){
        const f = fs.createWriteStream(path);
        f.write(comments.join(""));
        for(const line of cmd_lines.slice(0, cmd_lines.length-1)){
          f.write(line);
          f.write("\\\n");
        }
        f.write(cmd_lines[cmd_lines.length-1]);
        f.write("\n");
        f.end(actual_output);
        f.close();
      }
    }
    expect(actual_output).toBe(expected_output);
  };
}

function inject(...paths: string[]){
  for(const path of paths){
    const test_cases = get_test_cases(path);
    for(const [name, i, o, comments, path] of test_cases){
      const name_of_f = `test_${name}`;
      test(name_of_f, make_f(i, o, comments, path));
    }
  }
}

inject("opc");
inject("opd");
// inject("stage_1");
// inject("stage_2");
// inject("clvm_runtime");
// inject("cmd");
// inject("opc");
