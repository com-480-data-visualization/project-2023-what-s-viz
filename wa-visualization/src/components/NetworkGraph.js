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

function edgeId(source, target) {
  if (source < target) {
    return source + "-to-" + target;
  } else {
    return target + "-to-" + source;
  }
}

function createForceGraphEdge(nodes, messageStatsPerChat, idToGroup) {
  let edges = [];
  // Iterate over every chat and person participating in a chat
  for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
    for (let [contact_id, count] of Object.entries(chatsStats.idSendCount)) {
      // Chat ID is either a group or a contact
      // Check that source and target are not the same node and check both are in the nodes
      // TODO: eddge (or add count) for people sending you PMs
      let chat_node = nodes.find((node) => node.id === chat_id);
      if (
        chat_id !== contact_id &&
        chat_node &&
        nodes.find((node) => node.id === contact_id)
      ) {
        edges.push({
          source: chat_id,
          target: contact_id,
          strength: count * chat_node.isGroup ? 1 : 2, // Take into account message received in PM
          id: edgeId(chat_id, contact_id),
        });
      }
    }
  }
  // Add link for group members
  // What if pair already exists?
  for (let [group_id, group] of Object.entries(idToGroup)) {
    group.participants.forEach((contact_id) => {
      if (
        nodes.find((node) => node.id === group_id) &&
        nodes.find((node) => node.id === contact_id) &&
        !edges.find(
          (edge) => edge.source === group_id && edge.target === contact_id
        )
      ) {
        edges.push({
          source: group_id,
          target: contact_id,
          strength: 1,
          id: edgeId(group_id, contact_id),
        });
      }
    });
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

  edges.forEach((edge) => {
    edge.minLinkSourceTarget = Math.min(
      nodeToEdgeCount[edge.source],
      nodeToEdgeCount[edge.target]
    );
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
      if (empty) {
        return null;
      }
      if (prev === null) {
        return new ForceGraph("#network", data, setSelectedId);
      } else if (data.nodes.length === 0) {
        prev.clear();
        return new ForceGraph("#network", data, setSelectedId);
      } else {
        return prev.update(data);
      }
    });
  }, [messageStatsPerChat, idToGroup, idToContact, empty]);

  useEffect(() => {
    if (network !== null) {
      network.selectNode(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (
      Object.keys(idToGroup).length == 0 ||
      Object.keys(idToContact).length == 0
    ) {
      setEmpty(true);
    } else {
      setEmpty(false);
    }
  }, [idToGroup, idToContact]);

  return (
    <>
      <Container>
        {empty && (
          <Row
            style={{
              paddingTop: "20px",
              paddingBottom: "20px",
              paddingRight: "40px",
              paddingLeft: "40px",
              textAlign: "center",
            }}
          >
            <h1>Welcome to What’viz ! </h1>
            <p>
              Log in to your WhatsApp account to explore your network <br /> or{" "}
              <br /> load dummy data to preview the visualizations.
            </p>
            <p>
              <span style={{ fontWeight: "bold", color: "#9d00ff" }}>
                {" "}
                Groups
              </span>{" "}
              will have the node color violet, and{" "}
              <span style={{ fontWeight: "bold", color: "#698269" }}>
                contacts
              </span>{" "}
              will have the node color green.
            </p>
            <h3>Data Privacy</h3>
            <p>
              This website runs fully local in your web browser. Your private data
              is only shared from WhatsApp servers to your computer and stored locally
              in browser memory while you’re on this page. Your data
              remains exclusively between WhatsApp and you. Once you exit this
              page, all retrieved data is removed from your computer.
            </p>
          </Row>
        )}
        {!empty && (
          <div
            style={{
              height: "100%",
              paddingTop: "20px",
            }}
          >
            <Row
              style={{
                paddingTop: "20px",
                paddingBottom: "20px",
                height: "100%",
              }}
            >
              <div
                id="network"
                style={{ height: "100%", backgroundColor: "white" }}
              ></div>
            </Row>
          </div>
        )}
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
