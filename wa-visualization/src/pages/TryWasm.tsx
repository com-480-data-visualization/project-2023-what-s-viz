import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";

function TryWasm() {

  // Hand the setRes func to go to run the create Data
  const [res, setRes] = useState("not logged in");
  const [loggedIn, setLoggedIn] = useState(false);
  
  useEffect(()=>{
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject("Didn't hand over in time");
      }, 1000);
  
      console.log("Inited go wasm and gave handle")
      setLoggedIn(true)
      resolve(window.loginUser(setRes))
    }).catch( err => console.log(err) );
  }, []); //only run once
  
  // updated by Go WebAssembly
  console.log("Component updated with new state: " + res)

  return (
    <div className="container fill">
      {res == 'not logged in'? <p>Need to login! Just wait a moment</p>: null }
      {res != 'not logged in' && res != 'timeout' && res != 'success' && loggedIn ? <QRCode value={res} /> : null }
      {res != 'success' && !loggedIn ? <p>Some error: {res}</p> : null}
      {res == 'success' && loggedIn ? <p>Logged you in now! Here logout</p> : null}
      {res == 'timeout' && loggedIn ? <p>Timeout, reload and scan faster!</p> : null}
    </div>
  );
}

export default TryWasm;