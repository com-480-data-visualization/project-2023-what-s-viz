import { ForceGraph } from "./ForceGraph.js";
import { useEffect, useState } from "react";

function createForceGraphNode(idToContact, idToGroup) {
  let nodes = [];
  // Add contacts
  for (let [id, contact] of Object.entries(idToContact)) {
    nodes.push({
      id: id,
      name: contact.name,
      isGroup: false,
      img: contact.avatar,
    });
  }
  // Add groups
  for (let [id, group] of Object.entries(idToGroup)) {
    nodes.push({
      id: id,
      name: group.name,
      isGroup: true,
      img: group.avatar,
    });
  }
  return nodes;
}

function createForceGraphEdge(nodes, messageStatsPerChat, idToGroup) {
  let edges = [];
  let totalCount = 0;

  // Iterate over every chat and person participating in a chat
  for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
    for (let [contact_id, count] of Object.entries(chatsStats.idSendCount)) {
      // Chat ID is either a group or a contact
      // Check that source and target are not the same node and check both are in the nodes
      if (
        chat_id !== contact_id &&
        nodes.find((node) => node.id === chat_id) &&
        nodes.find((node) => node.id === contact_id)
      ) {
        edges.push({ source: chat_id, target: contact_id, strength: count });
        totalCount += count;
      }
    }
  }

  // Add link for group members
  // What if pair already exists?
  for (let [group_id, group] of Object.entries(idToGroup)) {
    group.participants.forEach((contact_id) => {
      if (
        nodes.find((node) => node.id === group_id) &&
        nodes.find((node) => node.id === contact_id)
      ) {
        edges.push({ source: group_id, target: contact_id, strength: 1 });
        totalCount += 1;
      }
    });
  }

  // scale strength between 0 and 1
  for (let edge of edges) {
    edge.strength = edge.strength / totalCount;
  }
  return edges;
}

function createGraphObject(messageStatsPerChat, idToGroup, idToContact) {
  let nodes = createForceGraphNode(idToContact, idToGroup);
  // take online 10 * count nodea
  //nodes = nodes.slice(0, 10 * count);
  let edges = createForceGraphEdge(nodes, messageStatsPerChat, idToGroup);

  return { nodes: nodes, edges: edges };
}

export function NetworkGraph({
  idToContact,
  idToGroup,
  messageStatsPerChat,
  setSelectedId,
}) {
  const [network, setNetwork] = useState(null);
  useEffect(() => {
    let data = createGraphObject(messageStatsPerChat, idToGroup, idToContact);

    setNetwork((prev) => {
      if (prev === null) {
        return new ForceGraph("#network", data, setSelectedId);
      } else {
        return prev.update(data);
      }
    });
  }, [messageStatsPerChat, idToGroup, idToContact]);

  return (
    <div
      id="network"
      style={{ height: "100%", backgroundColor: "white" }}
    ></div>
  );
}

//   const [count, setCount] = useState(0);

//   function onClick() {
//     setCount((prev) => prev + 1);
//   }

//   function onClickAll() {
//     setCount(10000000);
//   }

//     <div style={{ height: "100%" }}>
//       <button type="button" className="btn btn-primary ml-2" onClick={onClick}>
//         Add new contacts (testing)
//       </button>
//       <button
//         type="button"
//         className="btn btn-primary ml-2"
//         onClick={onClickAll}
//       >
//         Add all contacts (testing)
//       </button>
//       <ForceGraph attributes={data} onClickNode={setSelectedId} />
//     </div>
//   );
// }
