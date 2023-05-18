import React, { useState, useEffect } from 'react';
import { Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import useCookies from '@js-smart/react-cookie-service';

// https://react-bootstrap.github.io/components/modal/
function Disclaimer() {  
    const [show, setShow] = useState(false);
    const { getCookie, setCookie } = useCookies();
  
    function handleClose() {
      setShow(false);

      // Also save the cookie
      setCookie('disclaimer-accepted', 'true', { path: '/' }); 
    }

    useEffect(() => {
      // Check if the cookie is set, otherwise show the disclaimer
      if (getCookie('disclaimer-accepted') === 'true') {
        setShow(false);
      } else {
        setShow(true);
      }
    }, [getCookie]);
  
    return (
      <>
        <Modal show={show}
            size='lg'
            aria-labelledby="contained-modal-title-vcenter"
            centered backdrop="static" keyboard={ false }>
          <Modal.Header closeButton>
            <Modal.Title>Disclaimer Regarding Use of WhatsApp API</Modal.Title>
          </Modal.Header>
          <Modal.Body className='white-space: pre-line'  style={{display: 'flex', alignItems: 'center' }}>
            <Container className='disclaimer-container'>
              <Row className="m-3">
                Please note that using the WhatsApp multi-device API from an unofficial WhatsApp client, like this page does, may go against WhatsApp' terms of service. Despite this restriction, WhatsApp itself cannot distinguish between a real web client and an unofficial implementation, resulting in no adverse when using What's Viz.
              </Row>
              <Row className="m-3">
                We advise our users to not run the whole login multiple times within an hour, as this may trigger security measures by WhatsApp. We are not responsible for any consequences that may arise from the use of this page and disclaim all liability for any damages, losses, or costs.
              </Row>
              <Row className="m-3">
                By using our website, you acknowledge that you have read, understood, and agreed to this disclaimer regarding the use of WhatsApp API.
              </Row>
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleClose}>
              Accept
            </Button>
          </Modal.Footer>
        </Modal>
      </>
    );
  }
  

export default Disclaimer;