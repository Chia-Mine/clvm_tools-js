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
import {initialize as initClvmRs, TInitOption as TInitClvmRsOption} from "./platform/clvm_rs";

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

export type TInitOption = {
  initClvmRsOption: TInitClvmRsOption;
};
/**
 * Wait wasm files to be loaded before you call any of `clvm_tools` functions.
 */
export async function initialize(option?: Partial<TInitOption>){
  await Promise.all([initClvm(), initClvmRs(option?.initClvmRsOption)]);
}