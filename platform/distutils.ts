import {fs_exists, fs_stat} from "./io";

export class log {
  public static info(msg: string){
    console.log(msg);
  }
}

export class dep_util {
  public static newer(input_path: string, output_path: string){
    const exists_input_file = fs_exists(input_path);
    if(!exists_input_file){
      const errMsg = "source does not exist";
      // printError(`Error: ${errMsg}`);
      throw new Error(errMsg);
    }
    
    const exists_output_file = fs_exists(output_path);
    if(!exists_output_file){
      return true;
    }
    
    const stat_input_file = fs_stat(input_path);
    const stat_output_file = fs_stat(output_path);
    return stat_input_file.mtimeMs > stat_output_file.mtimeMs;
  }
}