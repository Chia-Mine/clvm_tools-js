import {read_ir, opc, opd, run, brun} from "./clvm_tools/cmds";
export * from "./clvm_tools/binutils";
export * from "./clvm_tools/clvmc";
export * from "./clvm_tools/cmds";
export * from "./clvm_tools/curry";
export * from "./clvm_tools/debug";
export * from "./clvm_tools/NodePath";
export * from "./clvm_tools/pattern_match";
export * from "./clvm_tools/sha256tree";

import {setStdout, TPrinter} from "./platform/print";
import {initialize as initClvm} from "clvm";

const COMMANDS: Record<string, (args: string[]) => unknown> = {
  read_ir,
  opc,
  opd,
  run,
  brun,
};

/**
 * Dispatch cli command.
 * - `go("run", "(mod ARGUMENT (+ ARGUMENT 3))")`
 * - `go("brun", "(+ 1 (q . 3))", "--time")`
 * 
 * @param {...string[]} args 
 */
export function go(...args: string[]){
  if(!args || args.length < 1){
    throw new Error("You need specify command");
  }
  const commandName = args[0];
  const command = COMMANDS[commandName];
  if(!command){
    throw new Error(`Unknown command: ${commandName}`);
  }
  
  return command(args);
}

/**
 * Change print function. Default is `console.log`.
 * If you want to print messages to file, variable or something, you need to change printer function by this function.
 * @param {(...msg: string[]) => void} printer
 */
export function setPrintFunction(printer: TPrinter){
  setStdout(printer);
}

/**
 * Wait BLS module to be initialized before you call any of `clvm_tools` functions.
 * 
 * 'initialize()' here is not required if you're so sure it never calls 'pubkey_for_exp' or 'point_add' operation.
 * When one of those operations is called without prior 'await initialize()', it will raise an Error.
 * If it is unknown whether 'pubkey_for_exp' or 'point_add' will be called, then put 'await initialize()' for safety.
 * I know this 'await initialize()' makes code asynchronous and really impacts on code architecture.
 * This is because 'clvm' relies on a wasm of 'bls-signatures', which requires asynchronous loading.
 */
export async function initialize(){
  return initClvm();
}