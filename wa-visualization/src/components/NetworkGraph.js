import { ForceGraph } from "./ForceGraph.js";
import { useEffect, useState } from "react";
import { Container, Row, Col, Table } from "react-bootstrap";

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

  // run over all nodes and remove those that are not part of a single edge
  let nodeIds = new Set();
  edges.forEach((edge) => {
    nodeIds.add(edge.source);
    nodeIds.add(edge.target);
  });
  nodes = nodes.filter((node) => nodeIds.has(node.id));

  // add to each node the number of edges it is part of
  // useful for force graph to adjust node size
  let nodeToEdgeCount = {};
  edges.forEach((edge) => {
    if (nodeToEdgeCount[edge.source] === undefined) {
      nodeToEdgeCount[edge.source] = 0;
    }
    if (nodeToEdgeCount[edge.target] === undefined) {
      nodeToEdgeCount[edge.target] = 0;
    }
    nodeToEdgeCount[edge.source] += 1;
    nodeToEdgeCount[edge.target] += 1;
  });
  nodes.forEach((node) => {
    node.edgeCount = nodeToEdgeCount[node.id];
  });

  return { nodes: nodes, edges: edges };
}

export function NetworkGraph({
  idToContact,
  idToGroup,
  messageStatsPerChat,
  selectedId,
  setSelectedId,
}) {
  const [network, setNetwork] = useState(null);
  const [empty, setEmpty] = useState(true);

  useEffect(() => {
    let data = createGraphObject(messageStatsPerChat, idToGroup, idToContact);

    setNetwork((prev) => {
      if (prev === null) {
        return new ForceGraph("#network", data, setSelectedId);
      } else if (data.nodes.length === 0) {
        prev.clear();
        return new ForceGraph("#network", data, setSelectedId);
      } else {
        return prev.update(data);
      }
    });
  }, [messageStatsPerChat, idToGroup, idToContact]);

  useEffect(() => {
    if (network !== null) {
      network.selectNode(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (Object.keys(idToGroup).length == 0 || Object.keys(idToContact).length == 0) {
      setEmpty(true);
    } else {
      setEmpty(false);
    }
  }, [idToGroup, idToContact]);

  return (
    <>
      <Container>
        { empty &&
        <>
        <Row style={{ paddingTop: "20px", paddingBottom: "20px" }}>
            <Col style={{ display: 'flex', alignItems: 'center' }}>
              There is currently no data to show a network graph for.
              Either log in to your WhatsApp account or load dummy data to look at the visualizations.
            </Col>
        </Row>
        <Row>
          <Col style={{ display: 'flex', alignItems: 'center' }}>
            <p class="text-justify m-0">As soon as contacts and groups to show are available, they will be displayed here.
              <span style={{ fontWeight: 'bold', color: '#9d00ff' }}> Groups</span> will have the node color violet, 
              and <span style={{ fontWeight: 'bold', color: '#698269' }}>contacts</span> will have the node color green.
            </p>
          </Col>
        </Row>
        </>
        }
        <Row
          style={{ paddingTop: "20px", paddingBottom: "20px", height: "100%"}}
        >
          <div
            id="network"
            style={{ height: "100%", backgroundColor: "white"}}
          ></div>
        </Row>
      </Container>
    </>
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
