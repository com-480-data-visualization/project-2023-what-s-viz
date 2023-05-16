import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Container } from "react-bootstrap";
import exportFromJSON from 'export-from-json';

function DebugSaveLoad({
  idToMessage, idToGroup, idToContact,
  doMsg, doContacts, doGroups }:any) {
    
  const saveHandler = (e:any) => {
    e.preventDefault();
    console.log("Clicked save; export all current data")
    // Save
    const data = { messages: idToMessage, contacts: idToContact, groups: idToGroup}
    const fileName = 'exportOfReceivedRawData'
    const exportType =  exportFromJSON.types.json

    exportFromJSON({ data, fileName, exportType })
  }

  const loadHandler = (e:any) => {
      e.preventDefault();
      console.log("Clicked load")
      const fileReader = new FileReader();
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = loaded => {
        if (loaded === null || loaded.target === null || loaded.target.result === null) {
          console.log("Error loading file")
        } else {
          const data = JSON.parse(loaded.target.result as string)
          console.log("Was able to read the file, lets run them!")
          doMsg(data.messages)
          doContacts(data.contacts)
          doGroups(data.groups)
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
