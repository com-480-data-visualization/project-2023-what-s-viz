import { useEffect, useState } from "react";
import { ForceGraph } from "./ForceGraph.js";

export function NetworkGraph({
  idToContact,
  idToGroup,
  messageStatsPerChat,
  width,
  height,
}) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  function createForceGraphNode(idToContact, idToGroup) {
    let nodes = [];
    // Add contacts
    for (let [id, contact] of Object.entries(idToContact)) {
      nodes.push({ id: id, r: 10, name: contact.name, isGroup: false });
    }
    // Add groups
    for (let [id, group] of Object.entries(idToGroup)) {
      nodes.push({ id: id, r: 10, name: group.name, isGroup: true });
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

  useEffect(() => {
    let updatedNodes = createForceGraphNode(idToContact, idToGroup);
    let updatedEdges = createForceGraphEdge(
      updatedNodes,
      messageStatsPerChat,
      idToGroup
    );

    // TODO check if liste are merged or additively updated with dynmaic data
    setNodes([...updatedNodes]);
    setEdges([...updatedEdges]);
  }, [idToContact, idToGroup, messageStatsPerChat]);

  return (
    <ForceGraph nodes={nodes} edges={edges} width={width} height={height} />
  );
}
