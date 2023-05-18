import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Container } from "react-bootstrap";
import exportFromJSON from 'export-from-json';

function DebugSaveLoad({
  idToMessage, idToGroup, idToContact,
  doMsg, doContacts, doGroups }) {
    
  const saveHandler = (e) => {
    e.preventDefault();
    console.log("Clicked save; export all current data")
    // Save
    const data = { messages: idToMessage, contacts: idToContact, groups: idToGroup}
    const fileName = 'exportOfReceivedRawData'
    const exportType =  exportFromJSON.types.json

    exportFromJSON({ data, fileName, exportType })
  }

  function doUpdate(data) {
    if (Object.keys(data.messages).length > 0) {
      // Lets not add all of them at the same time, but in chunks
      let chunk_keys = Object.keys(data.messages).splice(0, 1000);
      
      // create a single chunk object from the keys
      let chunk = {};
      for (let i = 0; i < chunk_keys.length; i++) {
        chunk[chunk_keys[i]] = data.messages[chunk_keys[i]];
      }
      doMsg(chunk);

      // remove those chunk_keys from the data
      for (let i = 0; i < chunk_keys.length; i++) {
        delete data.messages[chunk_keys[i]];
      }
    }
    // Same with contacts
    if (Object.keys(data.contacts).length > 0) {
      let chunk_keys = Object.keys(data.contacts).splice(0, 25);
      
      // create a single chunk object from the keys
      let chunk = {};
      for (let i = 0; i < chunk_keys.length; i++) {
        chunk[chunk_keys[i]] = data.contacts[chunk_keys[i]];
      }
      doContacts(chunk);

      // remove those chunk_keys from the data
      for (let i = 0; i < chunk_keys.length; i++) {
        delete data.contacts[chunk_keys[i]];
      }
    }

    // Same with groups
    if (Object.keys(data.groups).length > 0) {
      let chunk_keys = Object.keys(data.groups).splice(0, 10);
      
      // create a single chunk object from the keys
      let chunk = {};
      for (let i = 0; i < chunk_keys.length; i++) {
        chunk[chunk_keys[i]] = data.groups[chunk_keys[i]];
      }
      doGroups(chunk);

      // remove those chunk_keys from the data
      for (let i = 0; i < chunk_keys.length; i++) {
        delete data.groups[chunk_keys[i]];
      }
    }
  }

  const loadHandler = (e) => {
      e.preventDefault();
      console.log("Clicked load")
      const fileReader = new FileReader();
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = loaded => {
        if (loaded === null || loaded.target === null || loaded.target.result === null) {
          console.log("Error loading file")
        } else {
          const data = JSON.parse(loaded.target.result)
          console.log("Was able to read the file, lets run them!")
          doUpdate(data)
          // Run every n seconds a chunk adding
          const updateID = setInterval(() => {
            console.log("Running chunk")
            doUpdate(data)
          }, 3000);
          
          // After 30 seconds, stop the interval
          setTimeout(() => {
            clearInterval(updateID);
          }, 30000);
        }
      };
    }

  return (
    <>
      <Container fluid>
        <Row>
          <div>Debug save & load WhatsApp state</div>
        </Row>
        <Row>
          <Col><button type="button" className="btn btn-primary ml-2" onClick={saveHandler}>Save received data</button></Col>
          <Col><input type="file" className="btn btn-primary ml-2" onChange={loadHandler} /></Col>
        </Row>
      </Container>
    </>
  );
}

export default DebugSaveLoad;
