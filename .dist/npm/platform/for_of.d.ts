export declare function for_of<T = unknown, TReturn = any, TNext = unknown>(iterator: Generator<T, TReturn, TNext>, lambda: (el: T, index: number) => ("stop" | void)): boolean;
