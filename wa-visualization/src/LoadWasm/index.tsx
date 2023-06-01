import './wasm_exec.js';
import './wasmTypes.d.ts';
import './LoadWasm.css';
import React, { useEffect, useState } from 'react';

async function loadWasm(): Promise<void> {
  const goWasm = new window.Go();
  const result = await WebAssembly.instantiateStreaming(fetch(process.env.PUBLIC_URL + '/main.wasm'), goWasm.importObject);
  goWasm.run(result.instance);
}

export const LoadWasm: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // First load the Go WebAssembly
    loadWasm()
      .then(() => {
        setIsLoading(false)
        console.log("Loaded wasm")
      });
  }, []); //only run once

  if (isLoading) {
    return (
      <div className='LoadWasm'>
        Please wait, loading page content...
      </div>
    );
  } else {
    return <React.Fragment>{props.children}</React.Fragment>;
  }
};
