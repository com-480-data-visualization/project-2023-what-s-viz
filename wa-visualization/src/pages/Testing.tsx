import { useState, useEffect, useCallback } from 'react';
import exportFromJSON from 'export-from-json';
import { WordCloud } from '../components/WordCloud.js';
import { Container } from 'react-bootstrap';
import {contactStatsDict, messageStats, groupDict,
  messageDict, contactDict, stringDict, bagWords} from '../state/types.js'
import { updateBagOfWord } from '../utils/Utils';

declare global {
  interface Window {
    changer:any;
  }
}

function Testing() {
  
  // ============================= State ============================ //
  const [stats, setStats] = useState({
    messages: 0,
  });

  // Messages for export
  const [idToMessage, setIdToMessage] = useState<messageDict>({})

  // Maps from id to contacts / groups info
  const [idToGroup, setIdToGroup] = useState<groupDict>({})
  const [idToContact, setIdToContact] = useState<contactDict>({})

  // Number of occurrence of each word accross all messages
  const [bagOfWord, setBagOfWord] = useState<bagWords>({})

  const [selectedId, setSelectedId] = useState<number>()

  window.changer = Object.assign({setSelectedId: setSelectedId}, window.changer)

  // =============================================================== //

  // ====================== Setup function ====================== //

  function doMsg(messages: any) {
    updateBagOfWord(messages, setBagOfWord, bagOfWord)

    // Update the stats
    let num_message = Object.keys(messages).length
    setStats(prevStats => ({ ...prevStats, messages: prevStats.messages + num_message}))
    setIdToMessage(prev => ({ ...prev, ...messages }))
  }

  function doContacts(contacts:any) {
    setIdToContact(prev => ({ ...prev, ...contacts }))
  }

  function doGroups(groups:any) {
    setIdToGroup(prev => ({ ...prev, ...groups }))
  }

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
  // =============================================================== //

  /*
  const { Language } = require('node-nlp');
  const language = new Language();
  // Read the browser languages
  let browser_languages = navigator.languages

  function addLanguage(messages: any) {
    let updated_messages: any = {};
    console.log("Browser languages: ", browser_languages);
    return messages;
  }

  useEffect(() => {
    // Add the browser language to the messages
    console.log(browser_languages);
    const guess = language.guess(
      'When the night has come And the land is dark And the moon is the only light we see',
    );
    console.log(guess[0]);
  }, [])
  */
  
  return (
    <Container>
      <Container>
        <div className='row p-1'>
          <div className='col-sm' > Contacts: {Object.keys(idToContact).length}</div>
          <div className='col-sm' > Messages: {stats.messages}</div>
          <div className='col-sm' > Groups: {Object.keys(idToGroup).length}</div>
        </div>
        <div className='row p-1'>
          <button type="button" className="btn btn-primary col-sm ml-1" onClick={saveHandler}>Save received data</button>
          <input type="file" className="btn btn-primary col-sm ml-1" onChange={loadHandler} />
        </div>
      </Container>
    </Container>
  );
}

export default Testing;

/*
      <WordCloud bagOfWord={bagOfWord} selectedId={selectedId}/>
*/