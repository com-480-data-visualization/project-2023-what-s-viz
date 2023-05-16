import { useEffect, useState } from "react";
import { ForceGraph } from "./ForceGraph.js";
import { Container, Row, Col } from "react-bootstrap";

export function NetworkGraph({
  idToContact,
  idToGroup,
  messageStatsPerChat,
  setSelectedId,
}) {
  // Simulate new edges/nodes arriving
  const [count, setCount] = useState(0);
  let data = createGraphObject(messageStatsPerChat, idToGroup, idToContact);

  function createForceGraphNode(idToContact, idToGroup) {
    let nodes = [];
    // Add contacts
    for (let [id, contact] of Object.entries(idToContact)) {
      nodes.push({
        id: id,
        r: 10,
        name: contact.name,
        isGroup: false,
        img: contact.avatar,
      });
    }
    // Add groups
    for (let [id, group] of Object.entries(idToGroup)) {
      nodes.push({
        id: id,
        r: 10,
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

  function onClick() {
    setCount((prev) => prev + 1);
  }

  function onClickAll() {
    setCount(10000000);
  }

  return (
    <>
    {/* Rewrite the following using bootstrap rows */}
    <Container>
      { /*
      <Row>
        <Col>
        <button
          type="button"
          className="btn btn-primary ml-2"
          onClick={onClick}
        >
          Add new contacts (testing)
        </button>
        </Col>
        <Col>
        <button
          type="button"
          className="btn btn-primary ml-2"
          onClick={onClickAll}
        >
          Add all contacts (testing)
        </button>
        </Col>
      </Row>
      */}
      <Row style={{ paddingTop: '20px', paddingBottom: '20px', height: '100%' }}>
        <ForceGraph attributes={data} onClickNode={setSelectedId} />
      </Row>
    </Container>
    </>
  );
}
