import {Bytes} from "clvm/__type_compatibility__";

export type TEncodingOption = "utf8"|string;
export type TFileObj = {
  mTimeMs: number;
  encode: "string"|"hex";
  data: string;
};
export type TFileReadWriteOption = {
  encode: TEncodingOption;
};

export function createFileContent(data: string|Uint8Array, option?: TFileReadWriteOption): string {
  let fileObj: TFileObj;
  const now = Date.now();
  if(typeof data === "string"){
    fileObj = {
      mTimeMs: now,
      encode: "string",
      data,
    }
  }
  else if(option && /^utf[-]?8$/i.test(option.encode)){
    const decoder = new TextDecoder(option.encode);
    data = decoder.decode(data);
    fileObj = {
      mTimeMs: now,
      encode: "string",
      data,
    };
  }
  else{
    data = (new Bytes(data)).hex();
    fileObj = {
      mTimeMs: now,
      encode: "hex",
      data,
    };
  }
  return JSON.stringify(fileObj);
}

export function getFileObj(data: unknown): TFileObj|false {
  try{
    let fileObj: Record<string, unknown>;
    if(typeof data === "string"){
      fileObj = JSON.parse(data as string);
    }
    else if(data && typeof data === "object"){
      fileObj = data as Record<string, unknown>;
    }
    else{
      return false;
    }
    const isFileObj =
      Object.hasOwnProperty.call(fileObj, "mTimeMs")
      && Object.hasOwnProperty.call(fileObj, "encode")
      && Object.hasOwnProperty.call(fileObj, "data")
      && (fileObj.encode === "string" || fileObj.encode === "hex")
      && typeof fileObj.data === "string"
    ;
    if(isFileObj){
      return fileObj as TFileObj;
    }
    return false;
  }
  catch (e){
    return false;
  }
}

export function parseFileContent<T extends TFileReadWriteOption|undefined>(data: string, option?: T): T extends undefined ? Uint8Array : string {
  const fileObj = getFileObj(data);
  if(!fileObj){
    const errMsg = "Not a valid file object";
    // printError(`Error: ${errMsg}`);
    throw new Error(errMsg);
  }
  if(option){
    if(fileObj.encode === "hex"){
      const uint8 = Bytes.from(fileObj.data, "hex").raw();
      const decoder = new TextDecoder(option.encode);
      return decoder.decode(uint8) as T extends undefined ? Uint8Array : string;
    }
    return fileObj.data as T extends undefined ? Uint8Array : string;
  }
  else if(fileObj.encode === "hex"){
    return Bytes.from(fileObj.data, "hex").raw() as T extends undefined ? Uint8Array : string;
  }
  const encoder = new TextEncoder();
  return encoder.encode(fileObj.data) as T extends undefined ? Uint8Array : string;
}

/**
 * When `option.encode` is set, it returns `string`. Otherwise it returns `Uint8Array`.
 * @param {string} path
 * @param {TFileReadWriteOption} option?
 */
export function readFileSync<T extends undefined|TFileReadWriteOption>(path: string, option?: T): T extends undefined ? Uint8Array : string {
  const data = window.localStorage.getItem(path);
  if(data === null){
    const errMsg = `File not found at: ${path}`;
    // printError(`Error: ${errMsg}`);
    throw new Error(errMsg);
  }
  return parseFileContent(data, option);
}

export function writeFileSync(path: string, data: string|Uint8Array, option?: TFileReadWriteOption){
  window.localStorage.setItem(path, createFileContent(data, option));
}

export function existsSync(path: string){
  const data = window.localStorage.getItem(path);
  if(data === null){
    return false;
  }
  const fileObj = getFileObj(data);
  return Boolean(fileObj);
}

export function statSync(path: string){
  const data = window.localStorage.getItem(path);
  if(data === null){
    const errMsg = `File not found at: ${path}`;
    // printError(`Error: ${errMsg}`);
    throw new Error(errMsg);
  }
  const fileObj = getFileObj(data);
  if(!fileObj){
    const errMsg = "Not a valid file object";
    // printError(`Error: ${errMsg}`);
    throw new Error(errMsg);
  }
  
  return {
    isFile: () => {
      return true;
    },
    mtimeMs: fileObj.mTimeMs,
  };
}

export function readdirSync(path: string){
  const n = window.localStorage.length;
  const dirEntries: Array<{name: string, isDirectory: () => boolean}> = [];
  
  for(let i=0;i<n;i++){
    const key = window.localStorage.key(i);
    if(!key){
      continue;
    }
    const item = window.localStorage.getItem(key);
    if(!item){
      continue;
    }
    
    // Check forbidden chars
    if(/[<>:"\\|?*]/.test(path)){
      const errMsg = "path contains invalid character";
      // printError(`Error: ${errMsg}`);
      throw new Error(errMsg);
    }
    
    // Remove trailing '/'
    path = path.replace(/[/]+$/, "");
    // escape '.'
    path = path.replace(/[.]/g, "[.]");
    const isDescendantRegex = new RegExp(`^${path}/`);
    if(!isDescendantRegex.test(key)){
      continue;
    }
    const isDirectChildFileRegex = new RegExp(`^${path}/[^/]+$`);
    if(isDirectChildFileRegex.test(key)){
      dirEntries.push({
        name: key,
        isDirectory: () => false,
      });
      continue;
    }
    const isDirectChildDirRegex = new RegExp(`^(${path}/[^/]+)/[^/]+`);
    const dirname = isDirectChildDirRegex.exec(key);
    if(dirname){
      dirEntries.push({
        name: dirname[1],
        isDirectory: () => true,
      });
    }
  }
  
  return dirEntries;
}