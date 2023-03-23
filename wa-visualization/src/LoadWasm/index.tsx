import './wasm_exec.js';
import './wasmTypes.d.ts';
import './LoadWasm.css';
import initSqlJs from '../sql-wasm-debug.js';
import React, { useEffect, useState } from 'react';

async function loadWasm(): Promise<void> {
  const goWasm = new window.Go();
  const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), goWasm.importObject);
  goWasm.run(result.instance);
}

// We need SQL to be global, otherwise the js.Global() in Go won't find it
declare global {
    interface Window {
        SQL:any;
        WAdb: any;
    }
}

export const LoadWasm: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // First load the Go WebAssembly
    loadWasm()
      .then(() => {
        // Test run of https://github.com/sql-js/sql.js
        initSqlJs({
          locateFile: () => 'sql-wasm-debug.wasm'
        }).then((tSQL: any) => {
          // Set the gloval SQL value, this way Go can access it
          window.SQL = tSQL

          // Tell go to load the DB
          window.loadSQL()
          
          // We are done loading
          setIsLoading(false);
        }).catch((err: any) => {
          console.log(err)
        });
      });
  }, []); //only run once

  if (isLoading) {
    return (
      <div className='LoadWasm'>
        loading WebAssembly...
      </div>
    );
  } else {
    return <React.Fragment>{props.children}</React.Fragment>;
  }
};
