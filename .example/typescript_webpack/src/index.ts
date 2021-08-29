import "./index.scss";
import * as clvm_tools from "clvm_tools/browser";

// The element which holds command result output
let outputEl: HTMLElement;

window.onload = async function(){
  /*
   * Initialize button's onclick handler
   */
  const buttons = document.querySelectorAll(".buttons button:not(:last-child)") as NodeListOf<HTMLButtonElement>;
  if(!buttons || buttons.length < 1){
    throw new Error("Button was not found");
  }
  buttons.forEach(b => {
    b.onclick = onButtonClicked;
  });
  const clearButton = document.getElementById("clear-btn") as HTMLButtonElement;
  if(!clearButton){
    throw new Error("Clear button was not found");
  }
  clearButton.onclick = function(){
    outputEl.textContent = "";
  }
  
  // Load blsjs.wasm and clvm_rs_bg.wasm
  await clvm_tools.initialize();
  
  /*
   * Initialize command output element/direction
   */
  outputEl = document.getElementById("output") as HTMLElement;
  if(!outputEl){
    throw new Error("output box was not found");
  }
  // By default command output is printed via console.log. So change output direction to html element.
  const printFn = (...messages: any[]) => {
    outputEl.textContent = (outputEl.textContent || "") + messages.join(" ") + "\n";
  };
  clvm_tools.setPrintFunction(printFn, printFn);
}


/**
 * Retrieve current option values from form
 */
function getOptionsFromForm(){
  const form = document.querySelector("form.options") as HTMLFormElement;
  if(!form){
    throw new Error("Form element not found");
  }
  const fd = new FormData(form);
  const options = [];
  for(const [key, value] of fd.entries()){
    if(key === "backend"){
      options.push("--experiment-backend", "rust");
    }
    else{
      options.push(`--${key}`);
    }
  }
  return options;
}

/**
 * onclick handler for buttons
 * @param {MouseEvent} e
 */
async function onButtonClicked (e: MouseEvent) {
  const buttonEl = (e.currentTarget as HTMLButtonElement);
  const command = buttonEl.id === "brun-btn" ? "brun" : "run";
  outputEl.textContent = "";
  const prgEl = document.getElementById("prg") as HTMLTextAreaElement;
  const envEl = document.getElementById("env") as HTMLTextAreaElement;
  const options = getOptionsFromForm();
  clvm_tools.go(command, prgEl.value, envEl.value, ...options);
}
