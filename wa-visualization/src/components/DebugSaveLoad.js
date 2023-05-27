import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import { Container } from "react-bootstrap";
import exportFromJSON from 'export-from-json';
import { useState, useEffect } from 'react';
import fetchToBase64 from '../utils/fetchImages';

function DebugSaveLoad({
  idToMessage, idToGroup, idToContact, resetData,
  doMsg, doContacts, doGroups }) {

  const debug = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  const [showDummyLoad, setShowDummyLoad] = useState(true);

  useEffect(() => {
    // whenever we have no messages, no groups and no contacts, show the dummy load
    if (Object.keys(idToMessage).length === 0 && Object.keys(idToGroup).length === 0 && Object.keys(idToContact).length === 0) {
      setShowDummyLoad(true);
    } else {
      setShowDummyLoad(false);
    }
  }, [idToMessage, idToGroup, idToContact]);
    
  const saveHandler = (e) => {
    e.preventDefault();
    console.log("Clicked save; export all current data")

    Promise.allSettled(fetchToBase64(idToContact)).then(() => {
      console.log("All contacts fetched")
    })
    Promise.allSettled(fetchToBase64(idToGroup)).then(() => {
      console.log("All groups fetched")
    })

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
          }, 2000);
          
          // After 30 seconds, stop the interval
          setTimeout(() => {
            clearInterval(updateID);
          }, 30000);
        }
      };
    }

  const dummyDataLoad = (e) => {
    e.preventDefault();
    console.log("Clicked dummy data load")
    // load dummy data json from server and run it
    fetch(process.env.PUBLIC_URL +'/dummy-data.json')
      .then(response => response.json())
      .then(data => {
        console.log("Was able to load dummy file, lets run it!")
        doUpdate(data)
        // Run every n seconds a chunk adding
        const updateID = setInterval(() => {
          console.log("Running dummy chunk")
          doUpdate(data)
        }, 2000);
        
        // After 30 seconds, stop the interval
        setTimeout(() => {
          clearInterval(updateID);
        }, 30000);
      }
    );
  }

  const clearData = (e) => {
    e.preventDefault();
    // Clear all messages, contacts and groups
    console.log("Clicked clear")
    resetData();
  } 

  return (
    <>
      <Container>
        <Row>
          <Col xs="8" style={{ display: 'flex', alignItems: 'center' }}>
            { showDummyLoad ? 'Or load dummy data for visualizations:' : null}
            { !showDummyLoad ? 'Clear all current data:' : null}
          </Col>
          <Col xs="4">
            { showDummyLoad && debug &&
                    <input type="file" className="btn btn-primary ml-2 mx-2" onChange={loadHandler} />
                }
            { showDummyLoad && <button type="button" className="btn btn-primary ml-2 float-end" onClick={dummyDataLoad}>Dummy data</button>
            }
            { !showDummyLoad && debug &&
                    <button type="button" className="btn btn-primary ml-2 mx-2 float-end" onClick={saveHandler}>Export data</button>
                }
            { !showDummyLoad &&
              <button type="button" className="btn btn-primary ml-2 float-end" onClick={clearData}>Clear all data</button>
            }
          </Col>
        </Row>
      </Container>
    </>
  );
}

export default DebugSaveLoad;
