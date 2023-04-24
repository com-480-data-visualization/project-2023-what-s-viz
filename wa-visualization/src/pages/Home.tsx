import { useState, useEffect } from 'react';
import initSqlJs from '../sql-wasm-debug.js';
import exportFromJSON from 'export-from-json';
import { NetworkGraph } from '../components/NetworkGraph.js';
import AuthModule from '../components/Authentification.js';
import styles from './Home.module.css'
import { WordCloud } from '../components/WordCloud.js';
import { updateBagOfWord } from '../utils/Utils';

import {contactStatsDict, messageStats, groupDict,
  messageDict, contactDict, stringDict, bagWords} from '../state/types'

// We need SQL to be global, otherwise the js.Global() in Go won't find it
declare global {
  interface Window {
      SQL:any;
      WAdb: any;
  }
}

function Home() {
  
  // ============================= State ============================ //
  const [update, setUpdate] = useState(0);
  const [stats, setStats] = useState({
    messages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Messages for export
  const [idToMessage, setIdToMessage] = useState<messageDict>({})

  // Maps from id to contacts / groups info
  const [idToGroup, setIdToGroup] = useState<groupDict>({})
  const [idToContact, setIdToContact] = useState<contactDict>({})

  // Number of occurrence of each word accross all messages
  const [bagOfWord, setBagOfWord] = useState<bagWords>({})

  // Number of messages sent by each user in each chat
  const [messageStatsPerChat, setMessageStatsPerChat] = useState<messageStats>({})
  // Number of messages sent by each user
  const [messageStatsPerContact, setMessageStatsPerContact] = useState<contactStatsDict>({})
  
  const [selectedId, setSelectedId] = useState<string>()
  const [selected, setSelected] = useState<string>()


  // =============================================================== //
  
  // ==================== State update function ==================== //
  function reduceCounter(prevCount:stringDict, changed_value:stringDict){
    let summed: { [index: string]: any }= {}
    for (let [key, value] of Object.entries(changed_value)) {
      if (prevCount.hasOwnProperty(key)) {
        summed[key] = value + prevCount[key]
      } else {
        summed[key] = value
      }
    }
    return { ...prevCount, ...summed}
  }

  useEffect(() => {
    if (selectedId === undefined) {
      setSelected('All messages ever.')
    } else {
      if (idToGroup.hasOwnProperty(selectedId)) {
        setSelected(idToGroup[selectedId].name)
      } else {
        setSelected(idToContact[selectedId].name)
      }
    }
  }, [selectedId])

  function updateMessageStatsPerContact(messages: any) {

    let updated_stats: messageStats = {}
    Object.keys(messages).forEach((key) => {
      let chat_id = messages[key].chat
      let sender = messages[key]["sent-by"]

      // If the chat is not in the dict, add it
      if (!updated_stats[chat_id]) {
        updated_stats[chat_id] = { idSendCount: {} }
      }
      // If the sender is not in the chat, add it
      if (!updated_stats[chat_id].idSendCount[sender]) {
        updated_stats[chat_id].idSendCount[sender] = 0
      }
      updated_stats[chat_id].idSendCount[sender] += 1;
    })

    //console.log("updated_stats: ", updated_stats)

    function reduceMessageStats(prev: messageStats, updated_stats: messageStats) {
      let merged: messageStats = {}
      for (let [chat_id, chat_stats] of Object.entries(updated_stats)) {
        if (prev.hasOwnProperty(chat_id)) {
          merged[chat_id] = prev[chat_id]
          merged[chat_id].idSendCount = reduceCounter(prev[chat_id].idSendCount, chat_stats.idSendCount)
        } else {
          merged[chat_id] = chat_stats
        }
      }
      let res = {...prev, ...merged}
      //console.log("merged_stats: ", res)
      return {...prev, ...merged}
    }
    setMessageStatsPerChat(prev => (reduceMessageStats(prev, updated_stats)))
    //console.log("Message stats: ", messageStatsPerChat)
  }

  function updateMessageStatsPerChat(messages: any) {
    let updated_stats: contactStatsDict = {}
    Object.keys(messages).forEach((key) => {
      let sender = messages[key]["sent-by"]

      if (!updated_stats[sender]) {
        updated_stats[sender] = { numMessages: 0, numWords: 0 }
      }

      updated_stats[sender].numMessages += 1
      updated_stats[sender].numWords += messages[key].message.split(" ").length
    })

    function reduceContactStats(prev: contactStatsDict, updated_stats: contactStatsDict) {
      let merged: contactStatsDict = {}
      for (let [contact_id, contact_stats] of Object.entries(updated_stats)) {
        if (prev.hasOwnProperty(contact_id)) {
          merged[contact_id] = prev[contact_id]
          merged[contact_id].numMessages += contact_stats.numMessages
          merged[contact_id].numWords += contact_stats.numWords
        } else {
          merged[contact_id] = contact_stats
        }
      }
      return { ...prev, ...merged }
    }
    setMessageStatsPerContact(prev => (reduceContactStats(prev, updated_stats)))
  }

  // =============================================================== //


  // ====================== Setup function ====================== //

  function doMsg(messages: any) {
    updateBagOfWord(messages, setBagOfWord, bagOfWord)
    updateMessageStatsPerContact(messages)
    updateMessageStatsPerChat(messages)

    // Update the stats
    let num_message = Object.keys(messages).length
    setStats(prevStats => ({ ...prevStats, messages: prevStats.messages + num_message}))
    setUpdate(prevUpdate => (prevUpdate + 1))
    setIdToMessage(prev => ({ ...prev, ...messages }))
  }

  function doContacts(contacts:any) {
    setIdToContact(prev => ({ ...prev, ...contacts }))
  }

  function doGroups(groups:any) {
    setIdToGroup(prev => ({ ...prev, ...groups }))
  }

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

      // Give the handler to get new messages
      window.handNewMsgs(doMsg)

      // Give the handler to get new contacts
      window.handNewContacts(doContacts)

      // Give the handler to get new groups info
      window.handNewGroups(doGroups)
      
      // We are done loading
      setIsLoading(false);
    }).catch((err: any) => {
      console.log(err)
    });
  }

  useEffect(doSetup, []); //only run once

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

  return (
    <div className={styles.container} >
      <div className={styles.graphContainer}>
        <div className={styles.globalstatsContainer}>
          <div className={styles.itemsStatsContainer}>
            <p className={styles.statsItem} > Contacts: {Object.keys(idToContact).length}</p>
            <p className={styles.statsItem} > Messages: {stats.messages}</p>
            <p className={styles.statsItem} > Groups: {Object.keys(idToGroup).length}</p>
          </div>
          <div className={styles.itemsStatsContainer}>
            <button type="button" className="btn btn-primary ml-2" onClick={saveHandler}>Save received data</button>
            <input type="file" className="btn btn-primary ml-2" onChange={loadHandler} />
          </div>
        </div>
        <NetworkGraph idToContact ={idToContact}
            idToGroup = {idToGroup}
          messageStatsPerChat={messageStatsPerChat}
          setSelectedId={setSelectedId}
          />
      </div>
      <div className={styles.sideContainer}>
        <AuthModule isLoading={isLoading} doSetup={doSetup} />
        <p>Selected: {selected}</p>
        <WordCloud bagOfWord={bagOfWord}
            selectedId={selectedId}
          />
      </div>
    </div>
  );
}

export default Home;

/*
        <Histogram data={computeAverageMessageLengthPerContact()} title={"Average length of message per contact"} width={200} height={200} />
        <Histogram data={computeNumberMessagePerContact()} title={"Average number of message per contact"} width={200} height={200} />
<div className="container">
        <h3>Message overview per chat:</h3>
        {disaplyMessagePerChat()}
      </div>

      <div>{"Number chat : " + Object.keys(messageStatsPerChat).length}</div> 
      <div>{"Number unique token: " + Object.keys(bagOfWord).length}</div> 
      <div>{"Most frequent words: "+ topWords() }</div>        
      <div>{"Number sync update: " + update}</div>   
      {disaplyAvergaeMessageLength()}
    
     */