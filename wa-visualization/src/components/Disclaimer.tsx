import React, { useState } from 'react';
import { Container, Row } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';

// https://react-bootstrap.github.io/components/modal/
function Disclaimer() {  
    const [show, setShow] = useState(true);
  
    const handleClose = () => setShow(false);
  
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
            <Container>
              <Row className="m-3">
                We want to be transparent with our users; Please note that using the WhatsApp API, like this page does, may go against its terms of service, but it is a common practice.
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