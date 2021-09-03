export type TPrinter = (...data: any[]) => unknown;

export const dev_null: TPrinter = (...data) => { return };

let printer: TPrinter = console.log;
let errPrinter: TPrinter = dev_null;

export function setStdout(p: TPrinter){
  printer = p;
}

export function print(message?: string){
  printer(message);
}

export function setStderr(p: TPrinter){
  errPrinter = p;
}

export function printError(message?: string){
  errPrinter(message);
}
