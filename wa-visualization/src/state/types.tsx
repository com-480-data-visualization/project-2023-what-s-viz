  // ============================= Types ============================ //
  interface stringDict { [index: string]: any }
  interface counter { [index: string]: number }

  interface bagWords { [index: string]: { [index: string]: { [index: string]: any } } }

  interface contact{
    name: string,
    avatar: string,
    status: string,
  }
  interface contactDict{ [index: string]: contact}

  interface chatStats { 
    idSendCount: counter,
    timestamp: Array<String>,
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
  interface groupDict{ [index: string]: group }

  interface message {
    chat: string,
    message: string,
    'sent-by': string,
    timestamp: string,
  }
  interface messageDict{ [index: string]: message }

  interface contactStats { 
    numMessages: number,
    numWords: number,
    timestamp: Array<String>,
  }
interface contactStatsDict{ [index: string]: contactStats }
  
export type {contactStatsDict, contactStats, messageStats, group, groupDict, message, messageDict, contact, contactDict, stringDict, counter, bagWords}

  // =============================================================== //