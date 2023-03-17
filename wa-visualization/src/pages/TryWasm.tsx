import { useState } from 'react';

function TryWasm() {
  
  const [res, setRes] = useState("not Inited");

  new Promise<string>((resolve, reject) => {
    setTimeout(() => {
      reject("Didn't init in time");
    }, 1000);

    resolve(window.initServer("testInput from JS"))
  }).then( res => setRes(res) )
    .catch( err => setRes(err) );

  return (
    <div className="container fill">
      <p>Tring WASM, i.e. we get data after we init it:</p>
      <p>Inited Server response:</p>
      <p>{res}</p>
    </div>
  );
}

export default TryWasm;