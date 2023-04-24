

export default function Facts({ idToContact, idToGroup, messageStatsPerContact, messageStatsPerChat, bagOfWord }) {
  // ============================= State ============================ //

  
  // ====================== Display functions ====================== //

  function topWords() {
    // Create items array
    let items = Object.keys(bagOfWord).map(function (key) {
      return [key, bagOfWord[key]];
    });

    // Sort the array based on the second element
    items.sort(function(first, second) {
      return second[1] - first[1];
    });

    return items.slice(0, 5)
  }

  function disaplyAvergaeMessageLength() {
    let totalWords = 0
    let totalMessages = 0
    for (let [id, stats] of Object.entries(messageStatsPerContact)) {
      totalWords += stats.numWords
      totalMessages += stats.numMessages
    }
    return <p>Average message length: {totalMessages === 0 ? 0: totalWords / totalMessages} words</p>
  }

  function disaplyMessagePerChat() {
    let res = []
    for (let [chat_id, chat_stats] of Object.entries(messageStatsPerChat)) {
      let temp = []
      let sortedMembers = Object.entries(chat_stats.idSendCount).sort(function (first, second) {
        return second[1] - first[1];
      })
      for (let [id, count] of sortedMembers) {
        temp.push(<p>{id in idToContact ? idToContact[id].name: id} sent {count} messages</p>)
      }
      let name = chat_id in idToContact ? idToContact[chat_id].name + "- PM": (chat_id in idToGroup ? idToGroup[chat_id].name  : "Unknown")
      res.push(<div><h4>{name}</h4>{temp}</div>)
    }
    return res
  }

  function computeAverageMessageLengthPerContact() {
    let averageLengthPerContact = []
    for (let [id, stats] of Object.entries(messageStatsPerContact)) {
      averageLengthPerContact.push(stats.numMessages === 0 ? 0 : stats.numWords / stats.numMessages)
    }
    return averageLengthPerContact
  }

  function computeNumberMessagePerContact() {
    let averageNumMessagePerContact = []
    for (let [id, stats] of Object.entries(messageStatsPerContact)) {
      averageNumMessagePerContact.push(stats.numMessages)
    }
    return averageNumMessagePerContact
  }

  // =============================================================== //


  return (
    <div>
      <h2>E.g. facts about chosen JID</h2>
    </div>
  );
}