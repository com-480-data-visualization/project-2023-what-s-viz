import { useState, useEffect, useReducer } from 'react';
import QRCode from "react-qr-code";
import initSqlJs from '../sql-wasm-debug.js';

// We need SQL to be global, otherwise the js.Global() in Go won't find it
declare global {
  interface Window {
      SQL:any;
      WAdb: any;
  }
}

function Home() {
	const [data, setData] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  // Store statistics about the data
  const [stats, setStats] = useState({
    contacts: 0,
    groups: 0,
    messages: 0,
    words: 0,
  });

  interface stringDict { [index: string]: any }
  interface counter { [index: string]: number }

  interface contact{
    name: string,
    avatar: string,
    status: string,
  }
  interface contactDict{ [index: string]: contact}

  interface chatStats { 
    idSendCount: counter,
  }
  interface messageStats {
    [index: string]: chatStats
  }
  interface group {
    name: string,
    avatar: string,
    topic: string,
    owner_id: string,
    participants: string[],
  }
  interface groupDict{ [index: string]: group}

  

  const [update, setUpdate] = useState(0);
  const [asyncUpdate, setAsyncUpdate] = useState(0);

  // Maps from id to contacts / groups info
  const [idToGroup, setIdToGroup] = useState<groupDict>({})
  const [idToContact, setIdToContact] = useState<contactDict>({})


  const [bagOfWord, setBagOfWord] = useState<counter>({})

  const [messageStatsPerChat, setMessageStatsPerChat] = useState<messageStats>({})
  

  
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

  function updateBagOfWOrd(messages: any) {
    let filters = ["the"]
    let updated_value_bag: { [index: string]: any } = {}

    let count_words = 0
    Object.keys(messages).forEach((key) => {
      let words = messages[key].message.split(" ")
        .map((token: string) => token.toLowerCase())
        .filter((token: string) => filters.indexOf(token) == -1)
      
      count_words += words.length

      words.forEach((w: string) => {
        if (!updated_value_bag[w]) {
          updated_value_bag[w] = 0//bagOfWord.hasOwnProperty(key) ? bagOfWord[key] : 0;
        }
        updated_value_bag[w] += 1;
      })
    })
    
    setBagOfWord(bag => (reduceCounter(bag, updated_value_bag)))
  }

  function topWords() {
    // Create items array
    let items: [string, number][] = Object.keys(bagOfWord).map(function (key) {
      return [key, bagOfWord[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first:[string, number], second:[string, number]) {
      return second[1] - first[1];
    });

    return items.slice(0, 5)
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

    console.log("updated_stats: ", updated_stats)

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
      console.log("merged_stats: ", res)
      return {...prev, ...merged}
    }
    setMessageStatsPerChat(prev => (reduceMessageStats(prev, updated_stats)))
    console.log("Message stats: ", messageStatsPerChat)
  }

  function disaplyMessagePerChat() {
    let res = []
    for (let [chat_id, chat_stats] of Object.entries(messageStatsPerChat)) {
      let temp = []
      let sortedMembers = Object.entries(chat_stats.idSendCount).sort(function (first: [string, number], second: [string, number]) {
        return second[1] - first[1];
      })
      for (let [id, count] of sortedMembers) {
        temp.push(<p>{id in idToContact ? idToContact[id].name: id} sent {count} messages</p>)
      }
      let name = chat_id in idToContact ? idToContact[chat_id].name + "- PM": (chat_id in idToGroup ? idToGroup[chat_id].name  : "Unknown")
      res.push(<div><h2>{name}</h2>{temp}</div>)
    }
    return res
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
      window.handNewMsgs((messages: any) => {
        // Append the new message to the data
        //setData(data + message)

        updateBagOfWOrd(messages)
        updateMessageStatsPerContact(messages)

        // Update the stats
        let num_message = Object.keys(messages).length
        setStats(prevStats => ({ ...prevStats, messages: prevStats.messages + num_message}))
      
        setUpdate(prevUpdate => (prevUpdate + 1))
        //console.log(messages)
      })

      // Give the handler to get new contacts
      window.handNewContacts((contacts:any) => {
        // See console for now what the data looks like
        setIdToContact(prev => ({ ...prev, ...contacts }))
        console.log(contacts)
      })

      // Give the handler to get new groups info
      window.handNewGroups((groups:any) => {
        // See console for now what the data looks like
        setIdToGroup(prev => ({ ...prev, ...groups }))
        console.log(groups)
      })
      
      // We are done loading
      setIsLoading(false);
    }).catch((err: any) => {
      console.log(err)
    });
  }

  useEffect(doSetup, []); //only run once


  // Now that we are setup do the actual handling

  // Hand the setRes func to go to run the create Data
  const [res, setRes] = useState("not logged in");
  const [loggedIn, setLoggedIn] = useState(false);
  
  
  const loginHandler = (e:any) => {
		e.preventDefault();
    console.log("Clicked login")
    if (!isLoading) {
      // Login the user
      new Promise<void>((resolve, reject) => {
        setTimeout(() => {
          reject("Didn't login the user in time.");
        }, 1000);
    
        setLoggedIn(true)
        resolve(window.loginUser(setRes))
      }).catch( err => console.log(err) );
    } else {
      console.log("Still loading!")
    }
	};

  const logoutHandler = (e:any) => {
		e.preventDefault();
    console.log("Clicked logout")
    // Logout the user and reset if it is a sucess
    window.logoutUser()
      .then((_) => {
        setLoggedIn(false)
        setRes("not logged in")
        setData("")
        doSetup()
      })
      .catch((err) => {
        console.log(err)
      })
	};


  return (
    <div className="container fill">
      <p>Login to your WhatApp and see the message in the console for now.</p>
      <div>
        <form className="Form" onSubmit={loginHandler}>
          <button> Login </button>
        </form>
      </div>
      <div>
        <form className="Form" onSubmit={logoutHandler}>
          <button> Logout </button>
        </form>
      </div>
      <div className="container fill">
        {res === 'not logged in'? <p>Need to login!</p>: null }
        {res !== 'not logged in' && res !== 'timeout' && res !== 'success' && loggedIn ? <QRCode value={res} /> : null }
        {res !== 'success' && res !== 'not logged in' && !loggedIn ? <p>Some error: {res}</p> : null}
        {res === 'success' && loggedIn ? <p>Logged you in now! Keep app open to do sync.</p> : null}
        {res === 'timeout' && loggedIn ? <p>Timeout, reload and scan faster!</p> : null}
      </div>
      <div>{"Number of message(s) retrived: " + stats.messages}</div>
      <div>{"Number of contact(s) retrived: " + Object.keys(idToContact).length}</div>
      <div>{"Number of groups(s) retrived: " + Object.keys(idToGroup).length}</div>   
      <div>{"Number unique token: " + Object.keys(bagOfWord).length}</div> 
      <div>{"Most frequent words: "+ topWords() }</div>        
      <div>{"Number sync update: " + update}</div>   
      {disaplyMessagePerChat()}

      <div>{data}</div>
    </div>
  );
}

export default Home;


{/*  */ }

//       <div>{"Number total words: " + stats.words}</div>    
