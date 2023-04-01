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

  const [update, setUpdate] = useState(0);
  const [asyncUpdate, setAsyncUpdate] = useState(0);


  const [bagOfWord, setBagOfWord] = useState<{ [index: string]: any }>({})

  const [numberMessagePerContact, setNumberMessagePerContact] = useState<{ [index: string]: any }>({})

  
  function reduceCounter(prevCount: { [index: string]: any }, changed_value: { [index: string]: any }){
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
    var items = Object.keys(bagOfWord).map(function(key) {
      return [key, bagOfWord[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
      return second[1] - first[1];
    });

    return items.slice(0, 5)
  }

  function updateNumberMessagePerContact(messages: any) {

    let updated_mpc: { [index: string]: any } = {}
    Object.keys(messages).forEach((key) => {
      let chat_id = messages[key].chat

      if (!updated_mpc[chat_id]) {
        updated_mpc[chat_id] = 0
      }
      updated_mpc[chat_id] += 1;
    })
    setNumberMessagePerContact(prev => (reduceCounter(prev, updated_mpc)))
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
        updateNumberMessagePerContact(messages)

        // Update the stats
        let num_message = Object.keys(messages).length
        setStats(prevStats => ({ ...prevStats, messages: prevStats.messages + num_message}))

      
        setUpdate(prevUpdate => (prevUpdate + 1))


        //console.log(messages)
      })

      // Give the handler to get new contacts
      window.handNewContacts((contact:any) => {
        // See console for now what the data looks like

        let num_contact = Object.keys(contact).length
        setStats(prevStats => ({ ...prevStats, contacts: prevStats.contacts + num_contact}))
        console.log(contact)
      })

      // Give the handler to get new groups info
      window.handNewGroups((group:any) => {
        // See console for now what the data looks like

        let num_group = Object.keys(group).length
        setStats(prevStats => ({ ...prevStats, groups: prevStats.groups + num_group}))
        console.log(group)
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
      <div>{"Number of contact(s) retrived: " + stats.contacts}</div>
      <div>{"Number of groups(s) retrived: " + stats.groups}</div>   
      <div>{"Number unique token: " + Object.keys(bagOfWord).length}</div> 
      <div>{"Most frequent words: "+ topWords() }</div>        
      <div>{"Number sync update: " + update}</div>        

      <div>{data}</div>
    </div>
  );
}

export default Home;


{/*  */ }

//       <div>{"Number total words: " + stats.words}</div>    
