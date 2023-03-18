import { useState, useEffect } from 'react';

function TryWasm() {
  // Then init the go code
  const [res, setRes] = useState("not Inited");
  
  useEffect(()=>{
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject("Didn't hand over in time");
      }, 1000);
  
      console.log("Inited go wasm and gave handle")
      resolve(window.handSetData(setRes))
    }).catch( err => console.log(err) );
  
  }, []); //only run once
  
  // updated by Go WebAssembly
  console.log("Component updated with new state: " + res)

  return (
    <div className="container fill">
      <p>Trying WASM, response state (changed by Go WebAssembly):</p>
      <p>{res}</p>
    </div>
  );
}

export default TryWasm;