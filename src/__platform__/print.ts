export type TPrinter = (...data: any[]) => unknown;
let printer: TPrinter = console.log;

export function setPrinter(p: TPrinter){
  printer = p;
}

export function print(message?: string){
  printer(message);
}
