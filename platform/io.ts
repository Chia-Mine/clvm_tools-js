import {b, Bytes, Stream, isBytes} from "clvm";

export function fs_write(path: string, data: string){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require("fs");
  FS.writeFileSync(path, data);
}

export function fs_read(path: string){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require("fs");
  return FS.readFileSync(path, {encoding: "utf8"});
}

export function* fs_readlineSync(path: string): Generator<string, any, boolean>{
  const data = fs_read(path);
  const lines = data.split(/\r?\n/);
  let outputOnce = false;
  for(let i=0;i<lines.length;i++){
    if(outputOnce){
      yield lines.slice(i).join("\n");
      return;
    }
    outputOnce = yield lines[i];
  }
  return;
}

export function fs_readdir(path: string){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require("fs");
  return FS.readdirSync(path, {encoding: "utf8", withFileTypes: true});
}

export function fs_isFile(path: string){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require("fs");
  const stat = FS.statSync(path);
  return stat.isFile();
}

export function fs_exists(path: string){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require("fs");
  return FS.existsSync(path);
}

export function fs_stat(path: string){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const FS = require("fs");
  return FS.statSync(path);
}

export type WalkTree = Array<{dirpath: string, dirnames: string[], filenames: string[]}>;
export function os_walk(dirpath: string, stack?: WalkTree){
  const entries = fs_readdir(dirpath);
  const result = {
    dirpath,
    dirnames: [] as string[],
    filenames: [] as string[],
  };
  
  stack = stack || [];
  
  for(const d of entries){
    if(d.isDirectory()){
      result.dirnames.push(d.name);
      os_walk(path_join(dirpath, d.name), stack);
      continue;
    }
    result.filenames.push(d.name);
  }
  
  stack.push(result);
  return stack;
}

export function path_join(...paths: string[]){
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const PATH = require("path");
  return PATH.resolve(...paths);
}



export class FileStream extends Stream {
  private readonly _path: string;
  public constructor(path: string) {
    super();
    this._path = path;
  }
  
  public write(data: Bytes|string): number {
    const d = isBytes(data) ? data : b(data);
    return super.write(d);
  }
  
  public flush(){
    const data = this.getValue();
    fs_write(this._path, data.decode());
  }
}

export class Path {
  private _path: string;
  
  public constructor(p: string) {
    this._path = p;
  }
  
  public static join(...paths: string[]){
    const p = path_join(...paths);
    return new Path(p);
  }
  
  public is_file(){
    return fs_isFile(this._path);
  }
  
  public toString(){
    return this._path;
  }
}