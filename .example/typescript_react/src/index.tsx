import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

/**
 * Note:
 * `clvm_tools.initialize()` (called inside <App/>) loads `blsjs.wasm` and
 * `clvm_wasm_bg.wasm`. When the code runs as an ESModule (like this Vite
 * project), the wasm files are fetched from the root path of the current url.
 * The dev-server proxy in `vite.config.ts` rewrites those requests to
 * `/public/assets/`, where the wasm files of this example are stored.
 * See the README for production deployment.
 */

const nodeToRender = document.getElementById('root');
if (!nodeToRender) {
  throw new Error('#root Element was not found');
}

ReactDOM.createRoot(nodeToRender).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
