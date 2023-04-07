import { useState } from "react";
import QRCode from "react-qr-code";

export default function Home({ isLoading, doSetup }) {
  // ============================= State ============================ //
  // Hand the setRes func to go to run the create Data
  const [res, setRes] = useState("not logged in");
  const [loggedIn, setLoggedIn] = useState(false);

  // Now that we are setup do the actual handling
  const loginHandler = (e) => {
    e.preventDefault();
    console.log("Clicked login");
    if (!isLoading) {
      // Login the user
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject("Didn't login the user in time.");
        }, 1000);

        setLoggedIn(true);
        resolve(
          window.loginUser(setRes, (loggedIn) => {
            // Logged in is a list of JIDs
            console.log("Logged in sucessfully with following number:");
            console.log(loggedIn);
          })
        );
      }).catch((err) => console.log(err));
    } else {
      console.log("Still loading!");
    }
  };

  const logoutHandler = (e) => {
    e.preventDefault();
    console.log("Clicked logout");
    // Logout the user and reset if it is a sucess
    window
      .logoutUser()
      .then((_) => {
        setLoggedIn(false);
        setRes("not logged in");
        doSetup();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  return (
    <div>
      <p>Login to your WhatApp and see the message in the console for now.</p>
      <div className="container">
        <button
          type="button"
          className="btn btn-primary"
          onClick={loginHandler}
        >
          Login
        </button>
        <button
          type="button"
          className="btn btn-primary ml-2"
          onClick={logoutHandler}
        >
          Logout
        </button>
      </div>
      <div className="container fill">
        {res === "not logged in" ? <p>Need to login!</p> : null}
        {res !== "not logged in" &&
        res !== "timeout" &&
        res !== "success" &&
        loggedIn ? (
          <QRCode value={res} fgColor="#022224ff" />
        ) : null}
        {res !== "success" && res !== "not logged in" && !loggedIn ? (
          <p>Some error: {res}</p>
        ) : null}
        {res === "success" && loggedIn ? (
          <p>Logged you in now! Keep app open to do sync.</p>
        ) : null}
        {res === "timeout" && loggedIn ? (
          <p>Timeout, reload and scan faster!</p>
        ) : null}
      </div>
    </div>
  );
}
