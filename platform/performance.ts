// eslint-disable-next-line @typescript-eslint/no-var-requires
const {performance} = require("perf_hooks");

export function now(){
  return performance.now() / 1000.0;
}
