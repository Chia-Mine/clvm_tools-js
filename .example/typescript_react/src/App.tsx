import {useState, useEffect, type ChangeEvent, type MouseEvent} from 'react';
import './App.css';
import * as clvm_tools from "clvm_tools/browser";

function App() {
  const [output, setOutput] = useState("");
  const [prg, setPrg] = useState("");
  const [env, setEnv] = useState("");
  const [options, setOptions] = useState({
    time: false,
    backend: false,
    quiet: false,
    mempool: false,
    hex: false,
    verbose: false,
    table: false,
  });
  
  useEffect(() => {
    const printFn = (...messages: any[]) => {
      setOutput((prevState => prevState + messages.join(" ") + "\n"));
    };
    clvm_tools.setPrintFunction(printFn);
    clvm_tools.initialize().catch(e => {
      setOutput(e instanceof Error ? e.message : JSON.stringify(e));
    });
  }, []);
  
  const onTextAreaChanged = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textareaEl = e.currentTarget as HTMLTextAreaElement;
    const setValue = textareaEl.id === "prg" ? setPrg : setEnv;
    setValue(textareaEl.value);
  };
  
  const onButtonClicked = (e: MouseEvent) => {
    const buttonEl = e.currentTarget as HTMLButtonElement;
    const command = buttonEl.id === "brun-btn" ? "brun" : "run";
    setOutput("");
    const cli_options: string[] = [];
    Object.entries(options).forEach(([k, v]) => {
      if(!v){
        return;
      }
      if(k === "backend"){
        cli_options.push("--backend", "rust");
      }
      else{
        cli_options.push(`--${k.replace(/_/g, "-")}`);
      }
    });
    
    try{
      clvm_tools.go(command, prg, env, ...cli_options);
    }
    catch (e) {
      if(e instanceof Error){
        setOutput(`${e.name}: ${e.message}`);
      }
      else{
        setOutput(typeof e === "string" ? e : JSON.stringify(e));
      }
    }
  };
  
  const onClearButtonClicked = () => {
    setOutput("");
  };
  
  const onOptionChanged = (e: ChangeEvent<HTMLInputElement>) => {
    const inputEl = e.currentTarget as HTMLInputElement;
    const id = inputEl.id;
    setOptions((prevState => {
      return {
        ...prevState,
        [id]: inputEl.checked,
      };
    }));
  };
  
  return (
    <div className="app-root">
      <h1>Chia-Mine/clvm_tools-js</h1>
      <div className="input">
        <label htmlFor="prg">program</label>
        <textarea id="prg" rows={3} onChange={onTextAreaChanged} />
      </div>
      <div className="input">
        <label htmlFor="env">env</label>
        <textarea id="env" rows={3} onChange={onTextAreaChanged} />
      </div>
      <form className="options">
        <div>
          <label>options</label>
        </div>
        <label>
          <input type="checkbox" id="time" name="time" onChange={onOptionChanged} />
          --time
        </label>
        <label>
          <input type="checkbox" id="backend" name="backend" onChange={onOptionChanged} />
          --backend rust
        </label>
        <label>
          <input type="checkbox" id="quiet" name="quiet" onChange={onOptionChanged} />
          --quiet
        </label>
        <label>
          <input type="checkbox" id="mempool" name="mempool" onChange={onOptionChanged} />
          --mempool
        </label>
        <label>
          <input type="checkbox" id="hex" name="hex" onChange={onOptionChanged} />
          --hex
        </label>
        <label>
          <input type="checkbox" id="verbose" name="verbose" onChange={onOptionChanged} />
          --verbose
        </label>
        <label>
          <input type="checkbox" id="table" name="table" onChange={onOptionChanged} />
          --table
        </label>
      </form>
      <div className="buttons">
        <button id="brun-btn" onClick={onButtonClicked}>
          brun
        </button>
        <button id="run-btn" onClick={onButtonClicked}>
          run
        </button>
        <button id="clear-btn" onClick={onClearButtonClicked}>
          clear
        </button>
      </div>
      <div className="output-container">
        <label>Output</label>
        <pre id="output">{output}</pre>
      </div>
    </div>
  );
}

export default App;
