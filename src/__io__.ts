import {Bytes, Stream} from "clvm";

export function write(path: string, data: string){
  const FS = require("fs");
  FS.writeFileSync(path, data);
}

export function read(path: string){
  const FS = require("fs");
  return FS.readFileSync(path, {encoding: "utf8"});
}

export function path_join(...paths: string[]){
  const PATH = require("path");
  return PATH.resolve(...paths);
}

export function path_is_file(path: string){
  const FS = require("fs");
  const stat = FS.statSync(path);
  return stat.isFile();
}

export class FileStream extends Stream {
  private readonly _path: string;
  public constructor(path: string) {
    super();
    this._path = path;
  }
  
  public flush(){
    const data = this.getValue();
    write(this._path, data.decode());
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
    return path_is_file(this._path);
  }
  
  public toString(){
    return this._path;
  }
}