export declare type TPrinter = (...data: any[]) => unknown;
export declare function setStdout(p: TPrinter): void;
export declare function print(message?: string): void;
export declare function setStderr(p: TPrinter): void;
export declare function printError(message?: string): void;
