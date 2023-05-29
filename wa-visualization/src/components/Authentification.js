import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Container, Row, Col } from "react-bootstrap";

export default function Home({ isLoading, loginHook, logoutHook }) {
  // ============================= State ============================ //
  // Hand the setRes func to go to run the create Data
  const [res, setRes] = useState("not logged in");
  const [loggedIn, setLoggedIn] = useState(false);
  const [userJID, setUserJID] = useState(null);

  // Now that we are setup do the actual handling
  const loginHandler = (e) => {
    e.preventDefault();
    console.log("Clicked login");
    loginHook();
    if (!isLoading) {
      // Login the user
      new Promise((resolve, reject) => {
        setTimeout(() => {
          reject("Didn't login the user in time.");
        }, 1000);

        setLoggedIn(true);
        resolve(
          window.loginUser(setRes, (loggedInJID) => {
            // Logged in is a list of JIDs
            console.log("Logged in sucessfully with following number:");
            console.log(loggedInJID);
            setUserJID(loggedInJID);
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
      logoutHook();
      // Logout the user and reset if it is a sucess
    window
      .logoutUser()
      .then((_) => {
        setLoggedIn(false);
        setRes("not logged in");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const [showQR, setShowQR] = useState(false);
  
  function handleClose() {
      setShowQR(false);
      setLoggedIn(false);
      logoutHook();
      window
        .logoutUser()
        .then((_) => {
          setLoggedIn(false);
          setRes("not logged in");
        })
        .catch((err) => {
          console.log(err);
          setLoggedIn(false);
          setRes("not logged in");
        });
    }

  useEffect(() => {
    if (res !== "not logged in" && res !== "timeout" && res !== "success" && loggedIn)
      setShowQR(true);
    else
      setShowQR(false);
  }, [res, loggedIn]);

  return (
      <>
      <Container>
        <Row>
          <Col xs="9" style={{ display: 'flex', alignItems: 'center' }}>
            {res === "not logged in" ? "Login to WhatsApp to use What's Viz!" : null}
            {res !== "success" && res !== "not logged in" && !loggedIn ? (
              "Some error, please try again!"
            ) : null}
            {res === "success" && loggedIn ? (
              "Logged you in now! Keep app open to do sync."
            ) : null}
            {res === "timeout" && loggedIn ? (
              "Timeout, reload and scan faster!"
            ) : null}
          </Col>
          <Col xs="3">
            {!loggedIn ? <button
              type="button"
              className="btn btn-primary float-end"
              onClick={loginHandler}
            >
              Login
            </button> : null}
            {loggedIn ? <button
              type="button"
              className="btn btn-primary ml-2 float-end"
              onClick={logoutHandler}
            >
              Logout
            </button> : null}
          </Col>
        </Row>
      </Container>
      <Modal show={showQR} onHide={handleClose} 
          size="xl"
          aria-labelledby="contained-modal-title-vcenter"
          centered >
        <Modal.Body style={{display: 'flex', alignItems: 'center' }}>
          <Container>
              <Row>
                  <Col xs="8">
                      <Row className="p-2">
                          <h3>Using What's Viz</h3>
                      </Row>
                      <Row className="m-3">
                          1. Open WhatsApp on your phone
                      </Row>
                      <Row className="m-3">
                          2. Tap Menu or Settings and select Linked Devices
                      </Row>
                      <Row className="m-3">
                          3. Tab on Link a Device
                      </Row>
                      <Row className="m-3">
                          4. Point your phone to this screen to capture the QR code
                      </Row>
                  </Col>
                  <Col xs="4 mt-5" style={{ display: 'flex', alignItems: 'center' }}>
                    <QRCode value={res} fgColor="#022224ff" size={200} />
                  </Col>
              </Row>
              <Row className="p-2 m-3">
                <b>Note:</b>
                <p>Your loaded WhatApp data of the last three years is only stored locally in browser memory and not sent to any server. This also means that you have to login every time you leave this site!</p>
              </Row>
          </Container>
        </Modal.Body>
      </Modal>
    </>
  );
}

/*
to make it not closable:
backdrop="static" keyboard={ false }
*/