import { useState, useEffect } from 'react';
import initSqlJs from '../sql-wasm.js';
import { NetworkGraph } from '../components/NetworkGraph.js';
import AuthModule from '../components/Authentification.js';
import SearchField from '../components/SearchField.js';
import styles from './Home.module.css'
import { WordCloud } from '../components/WordCloud.js';
import { updateBagOfWord } from '../utils/Utils';
import PopUp from '../components/PopUp'
import DebugSaveLoad from '../components/DebugSaveLoad';

import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';


import {contactStatsDict, messageStats, groupDict,
  messageDict, contactDict, stringDict, bagWords} from '../state/types'

// We need SQL to be global, otherwise the js.Global() in Go won't find it
declare global {
  interface Window {
      SQL:any;
      WAdb: any;
      bootstrap: any;
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
  
  // Selected group or contact node id in the graph
  const [selectedId, setSelectedId] = useState<string>() // No group or contact will ever have ID 0
 
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
      locateFile: () => 'sql-wasm.wasm'
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

  // =============================================================== //
  
  return (
    <Container fluid className="h-100" >
      <Row className="h-100" style={{ backgroundColor: "rgb(204, 211, 209)" }}>
        <Col sm={8} style={{ display: 'flex' }}>
              <NetworkGraph idToContact ={idToContact}
                  idToGroup = {idToGroup}
                messageStatsPerChat={messageStatsPerChat}
                setSelectedId={setSelectedId}
                />
        </Col>
        <Col sm={4}>
          <Container className="p-2 rounded border border-secondary">
            <Row className="p-2" ><AuthModule isLoading={isLoading} doSetup={doSetup} /></Row>
            <Row className="p-2" >
              {/* TODO make the nice plots of this! */}
              <Col>Contacts: {Object.keys(idToContact).length}</Col>
              <Col>Messages: {stats.messages}</Col>
              <Col>Groups: {Object.keys(idToGroup).length}</Col>
            </Row>
            <Row className="p-2" >
              <DebugSaveLoad
                idToMessage={idToMessage} idToContact={idToContact} idToGroup={idToGroup}
                doMsg={doMsg} doContacts={doContacts} doGroups={doGroups}/>
            </Row>
            <Row className="p-2" ><SearchField selected={selectedId} setSelected={setSelectedId} idToGroup={idToGroup} idToContact={idToContact} /> </Row>
            <Row className="p-2" ><WordCloud bagOfWord={bagOfWord} selectedId={selectedId} /></Row>
          </Container>
        </Col>
      </Row>
      <PopUp heading='Disclaimer Regarding Use of WhatsApp API' body="We want to be transparent with our users; Please note that using the WhatsApp API, like this page does, may go against its terms of service, but it is a common practice.

We advise our users to not run the whole login multiple times within an hour, as this may trigger security measures by WhatsApp. We are not responsible for any consequences that may arise from the use of this page and disclaim all liability for any damages, losses, or costs.

By using our website, you acknowledge that you have read, understood, and agreed to this disclaimer regarding the use of WhatsApp API."></PopUp>
      </Container>      
  );
}

export default Home;