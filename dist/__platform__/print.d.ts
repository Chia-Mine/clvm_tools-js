export declare type TPrinter = (...data: any[]) => unknown;
export declare function setPrinter(p: TPrinter): void;
export declare function print(message?: string): void;
