export class log {
  public static info(msg: string){
    console.log(msg);
  }
}

export class dep_util {
  public static newer(input_path: string, output_path: string){
    const FS = require("fs");
    const exists_input_file = FS.existsSync(input_path);
    if(!exists_input_file){
      throw new Error("source does not exist");
    }
    
    const exists_output_file = FS.existsSync(output_path);
    if(!exists_output_file){
      return true;
    }
    
    const stat_input_file = FS.statSync(input_path);
    const stat_output_file = FS.statSync(output_path);
    return stat_input_file.mtimeMs > stat_output_file.mtimeMs;
  }
}