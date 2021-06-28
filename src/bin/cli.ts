#!/usr/bin/env node

import {initialize} from "../";
import {
  read_ir,
  opc,
  opd,
  run,
  brun,
} from "../clvm_tools/cmds";

const COMMANDS: Record<string, (args: string[]) => unknown> = {
  read_ir,
  opc,
  opd,
  run,
  brun,
};

main().catch(e => {
  console.error("Unexpected error");
  console.error(e);
});

async function main(){
  if(process.argv.length < 3){
    console.error("Insufficient argument");
    return;
  }
  const argv = process.argv.slice(2);
  const command = argv[0];
  
  if(!(command in COMMANDS)){
    console.error(`Unknown command: ${command}`);
    return;
  }

  // Async load BLS modules
  await initialize();

  COMMANDS[command](argv);
}