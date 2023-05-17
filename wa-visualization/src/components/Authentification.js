import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import { Container, Row, Col } from "react-bootstrap";

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

  const [showQR, setShowQR] = useState(false);
  
  const handleClose = () => setShowQR(false);

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
          centered>
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
                  <Col xs="4" className="float-end">
                    <QRCode value={res} fgColor="#022224ff" />
                  </Col>
              </Row>
          </Container>
        </Modal.Body>
      </Modal>
    </>
  );
}
