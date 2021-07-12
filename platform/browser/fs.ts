export function readFileSync(path: string, option?: {encoding: "utf8"}): string {
  const data = window.localStorage.getItem(path);
  return data ? JSON.parse(data) : "";
}

export function writeFileSync(path: string, data: string): void {
  window.localStorage.setItem(path, JSON.stringify(data));
  return;
}

export function existsSync(path: string){
  return Boolean(window.localStorage.getItem(path));
}

export function statSync(path: string){
  return {
    isFile: () => {
      return existsSync(path);
    },
    mtimeMs: Date.now(),
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
      throw new Error("path contains invalid character");
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