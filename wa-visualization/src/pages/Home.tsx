import { useState, useEffect } from 'react';
import initSqlJs from '../sql-wasm.js';
import { NetworkGraph } from '../components/NetworkGraph.js';
import AuthModule from '../components/Authentification.js';
import SearchField from '../components/SearchField.js';
import { WordCloud } from '../components/WordCloud.js';
import { updateBagOfWord } from '../utils/Utils';
import Disclaimer from '../components/Disclaimer'
import DebugSaveLoad from '../components/DebugSaveLoad';
import Container from 'react-bootstrap/Container';
import LanguageStats from '../components/LanguageStats.js';
import HistogramContacts from '../components/HistogramContacts.js';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Legend from '../components/Legend.js';
import fetchToBase64 from '../utils/fetchImages';

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
  const debug = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';
  
  // ============================= State ============================ //
  const [update, setUpdate] = useState(0);
  const [stats, setStats] = useState({
    messages: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

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
  const [selectedId, setSelectedId] = useState<string>()
  const [usedLanguages, setUsedLanguages] = useState<Set<string>>(new Set([]))
 
  // =============================================================== //
 
  function resetData() {
    setStats({ messages: 0 })
    setIdToMessage({})
    setIdToGroup({})
    setIdToContact({})
    setBagOfWord({})
    setMessageStatsPerChat({})
    setMessageStatsPerContact({})
    setSelectedId(undefined)
  }

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

  // Use NLP to guess the language of each message  
  const { Language } = require('node-nlp');
  const language = new Language();

  // get browser languages
  const browserLanguages = navigator.languages;
  const allow_list = [ ...["en", "de", "fr", "it"], ...browserLanguages];

  function addLanguage(messages: any) {
    let updated_messages: any = {};
    Object.keys(messages).forEach((key) => {
      let message = messages[key].message
      if (message.split(" ").length > 3) {
        let guesses = language.guess(message, allow_list);
        //console.log("message: ", message)
        //console.log("guesses: ", guesses)
        if (guesses.length > 0 && guesses[0].score === 1) {
          messages[key].language = guesses[0].language;
          messages[key].lan = guesses[0].alpha2;
        } else {
          messages[key].language = "Unknown";
          messages[key].lan = "unk";
        }
      } else {
        messages[key].language = "Unknown";
        messages[key].lan = "unk";
      }
      updated_messages[key] = messages[key]
    })
    return updated_messages;
  }

  function doMsg(messages: any) {
    messages = addLanguage(messages)
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
    //Promise.allSettled(fetchToBase64(contacts)).then(() => {
      setIdToContact(prev => ({ ...prev, ...contacts }))
    //})
  }

  function doGroups(groups:any) {
    //Promise.allSettled(fetchToBase64(groups)).then(() => {
      setIdToGroup(prev => ({ ...prev, ...groups }))
    //})
  }

  function doSetup() {
    setIsLoading(true);
    setLoggedIn(false);
    // Test run of https://github.com/sql-js/sql.js
    initSqlJs({
      locateFile: () => process.env.PUBLIC_URL + '/sql-wasm.wasm'
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
    <Container fluid className='h-100' >
      <Row className='h-100' >
        <Col xs={8} style={{ display: 'flex' }}>
              <NetworkGraph idToContact ={idToContact}
                idToGroup = {idToGroup}
                messageStatsPerChat={messageStatsPerChat}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                />
        </Col>
        <Col xs={4} className='leftPadding20 topPadding20 rightPadding30'>
          <Row>
            <Container>
              <Row className="p-2 mb-2 rounded border border-secondary greenish" >
                <AuthModule isLoading={isLoading}
                  loginHook={() => {
                    resetData();
                    setLoggedIn(true);
                  }}
                  logoutHook={() => doSetup()} />
              </Row>
              { (!loggedIn || debug ) &&
                <Row className="p-2 mb-2 rounded border border-secondary greenish" >
                  <DebugSaveLoad
                    idToMessage={idToMessage} idToContact={idToContact} idToGroup={idToGroup}
                    resetData={resetData}
                    doMsg={doMsg} doContacts={doContacts} doGroups={doGroups}/>
                </Row>
              } 
              { /*Object.keys(idToMessage).length > 0 &&
              <Row className="p-2 mb-2 rounded border border-secondary greenish" >
                  <Col style={{ display: 'flex', alignItems: 'center' }}>
                    Histogram of messages 
                  </Col>
                <Row>
                  <HistogramContacts title="Histogram of messages" messageStatsPerChat={messageStatsPerChat} selectedId={selectedId}/>
                </Row>
              </Row>*/
              }
              {/* { Object.keys(idToMessage).length > 0 &&
                <Row className="p-2 mb-2 rounded border border-secondary greenish" >
                  <Legend />
                </Row>
              } */}
              {Object.keys(idToMessage).length > 0 &&
              <>
                <Row className="p-2 mb-2 rounded border border-secondary greenish" >
                    <Col style={{ display: 'flex', alignItems: 'center' }}>
                      Loaded {stats.messages} messages in {Object.keys(idToContact).length} contacts and {Object.keys(idToGroup).length} groups.
                    </Col>
                </Row>
                <Row className="p-2 mb-2 rounded border border-secondary greenish" >
                  <Row className="p-2" ><SearchField selected={selectedId} setSelected={setSelectedId} idToGroup={idToGroup} idToContact={idToContact} /> </Row>
                  <Row><LanguageStats title={"Language distribution of selected chat"} idToMessage={idToMessage} selectedId={selectedId} setUsedLanguages={setUsedLanguages} /></Row>
                  <Row className="p-2" ><WordCloud bagOfWord={bagOfWord} selectedId={selectedId} /></Row>
                  <Row ><Legend usedLanguages={usedLanguages} /></Row>
                </Row>
              </>
              }

              </Container>
          </Row>
        </Col>
      </Row>
      <Disclaimer />
      </Container>      
  );
}

export default Home;