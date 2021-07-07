export type TPrinter = (...data: any[]) => unknown;

let printer: TPrinter = console.log;
let errPrinter: TPrinter = console.error;

export function setStdout(p: TPrinter){
  printer = p;
}

export function print(message?: string){
  printer(message);
}

export function setStderr(p:TPrinter){
  errPrinter = p;
}

export function printError(message?: string){
  errPrinter(message);
}
