import { useState, useEffect } from 'react';
import QRCode from "react-qr-code";
import initSqlJs from '../sql-wasm-debug.js';

// We need SQL to be global, otherwise the js.Global() in Go won't find it
declare global {
  interface Window {
      SQL:any;
      WAdb: any;
  }
}

function Home() {
	const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  function doSetup() {
    setIsLoading(true);
    // Test run of https://github.com/sql-js/sql.js
    initSqlJs({
      locateFile: () => 'sql-wasm-debug.wasm'
    }).then((tSQL: any) => {
      // Set the gloval SQL value, this way Go can access it
      window.SQL = tSQL
  
      // Tell go to load the DB
      window.loadSQL()

      // Give the handler to set the data
      window.handNewMsgs((messages:any) => {
        // Append the new message to the data
        //setData(data + message)
        console.log(messages)
      })
      
      // We are done loading
      setIsLoading(false);
    }).catch((err: any) => {
      console.log(err)
    });
  }

  useEffect(doSetup, []); //only run once


  // Now that we are setup do the actual handling

  // Hand the setRes func to go to run the create Data
  const [res, setRes] = useState("not logged in");
  const [loggedIn, setLoggedIn] = useState(false);
  
  
  const loginHandler = (e:any) => {
		e.preventDefault();
    console.log("Clicked login")
    if (!isLoading) {
      // Login the user
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          reject("Didn't login the user in time.");
        }, 1000);
    
        setLoggedIn(true)
        resolve(window.loginUser(setRes))
      }).catch( err => console.log(err) );
    } else {
      console.log("Still loading!")
    }
	};

  const logoutHandler = (e:any) => {
		e.preventDefault();
    console.log("Clicked logout")
    // Logout the user and reset if it is a sucess
    window.logoutUser()
      .then((_) => {
        setLoggedIn(false)
        setRes("not logged in")
        setData("")
        doSetup()
      })
      .catch((err) => {
        console.log(err)
      })
	};


  return (
    <div className="container fill">
      <p>Login to your WhatApp and see the message in the console for now.</p>
      <div>
        <form className="Form" onSubmit={loginHandler}>
          <button> Login </button>
        </form>
      </div>
      <div>
        <form className="Form" onSubmit={logoutHandler}>
          <button> Logout </button>
        </form>
      </div>
      <div className="container fill">
        {res === 'not logged in'? <p>Need to login!</p>: null }
        {res !== 'not logged in' && res !== 'timeout' && res !== 'success' && loggedIn ? <QRCode value={res} /> : null }
        {res !== 'success' && res !== 'not logged in' && !loggedIn ? <p>Some error: {res}</p> : null}
        {res === 'success' && loggedIn ? <p>Logged you in now! Keep app open to do sync.</p> : null}
        {res === 'timeout' && loggedIn ? <p>Timeout, reload and scan faster!</p> : null}
      </div>
      <div>{data}</div>
    </div>
  );
}

export default Home;