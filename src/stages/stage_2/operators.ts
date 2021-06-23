import {
  EvalError,
  OPERATOR_LOOKUP as ORIGINAL_OPERATOR_LOOKUP,
} from "clvm";
import {read_ir} from "../../ir/reader";
import {write_ir_to_stream} from "../../ir/writer";
import {assemble_from_ir, disassemble_to_ir} from "../../clvm_tools/binutils";
import {
  run_program as run_program_0,
} from "../stage_0";
import {} from "./compile";
import {make_do_opt} from "./optimize";