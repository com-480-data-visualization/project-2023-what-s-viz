// https://dev.to/gilfink/creating-a-force-graph-using-react-and-d3-76c

import * as d3 from "d3";
import { useState, useEffect, useRef } from "react";

import "./ForceGraph.module.css";

export function ForceGraph({ attributes, onClickNode }) {
  const refContainer = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [graphNodes, setNodes] = useState([]);
  const [graphEdges, setEdges] = useState([]);
  const [ownId, setOwnId] = useState(""); // TODO manually set ownId for now
  const [imageFetchCount, setImageFetchCount] = useState(0); // TODO manually set ownId for now

  const simulation = d3
    .forceSimulation([])
    .force("charge", d3.forceManyBody().strength(-200))
    .force(
      "center",
      d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
    )
    // .force("centerX", d3.forceX(dimensions.width / 2))
    // .force("centerY", d3.forceY(dimensions.height / 2))

    .force(
      "collision",
      d3.forceCollide((d) => d.r)
    )
    .force(
      "link",
      d3
        .forceLink()
        //.links(valideEdges)
        .id((d) => d.id)
        .strength(1)
        .distance((d) => 0.1)
    );

  // simulation.force("bounding-rect", () => {
  //   graphNodes.forEach((node) => {
  //     if (node.x < node.r) {
  //       node.x = node.r;
  //     }
  //     if (node.x > dimensions.width - node.r) {
  //       node.x = dimensions.width - node.r;
  //     }
  //     if (node.y < node.r) {
  //       node.y = node.r;
  //     }
  //     if (node.y > dimensions.height - node.r) {
  //       node.y = dimensions.height - node.r;
  //     }
  //   });
  // });

  simulation.on("tick", () => {
    updateNodes();
    updateEdges();
  });

  simulation.alpha(1);

  function updateEdges() {
    d3.select(".links")
      .selectAll("line")
      .data(graphEdges)
      .join("line")
      .attr("x1", (d) => d.source.x)
      .attr("x2", (d) => d.target.x)
      .attr("y1", (d) => d.source.y)
      .attr("y2", (d) => d.target.y);
  }

  function updateNodes() {
    // Try round image
    // d3.select(".node")
    //   .selectAll("circle")
    //   .data(nodes)
    //   .join("circle")
    //   .attr("x", (d) => Math.min(Math.max(d.x, d.r), width - d.r))
    //   .attr("y", (d) => Math.min(Math.max(d.y, d.r), height - d.r))
    //   .join("defs")
    //   .attr("x", (d) => Math.min(Math.max(d.x, d.r), width - d.r))
    //   .attr("y", (d) => Math.min(Math.max(d.y, d.r), height - d.r))
    //   .join("pattern")
    //   .attr("id", function (d, i) {
    //     return "pic_" + d.id;
    //   })
    //   .attr("x", (d) => Math.min(Math.max(d.x, d.r), width - d.r))
    //   .attr("y", (d) => Math.min(Math.max(d.y, d.r), height - d.r))
    //   .attr("r", (d) => d.r)
    //   .join("image")
    //   .attr("xlink:href", (d) => d.img)
    //   .attr("x", (d) => Math.min(Math.max(d.x, d.r), width - d.r))
    //   .attr("y", (d) => Math.min(Math.max(d.y, d.r), height - d.r))
    //   .attr("width", (d) => d.r * 2)
    //   .attr("height", (d) => d.r * 2);

    // d3.select(".node")
    //   .selectAll("circle")
    //   .attr("x", (d) => Math.min(Math.max(d.x, d.r), width - d.r))
    //   .attr("y", (d) => Math.min(Math.max(d.y, d.r), height - d.r))
    //   .style("fill", function (d, i) {
    //     return "url(#pic_" + d.id + ")";
    //   });

    graphNodes.forEach((d) => {
      d.x =
        d.id === ownId
          ? dimensions.width / 2
          : Math.min(Math.max(d.x, d.r), dimensions.width - d.r);
      d.y =
        d.id === ownId
          ? dimensions.height / 2
          : Math.min(Math.max(d.y, d.r), dimensions.height - d.r);
    });

    // // Images, must be doing something wrong => lagy (maybe request image at each iteration?)
    // d3.select(".node")
    //   .selectAll("image")
    //   .data(graphNodes)
    //   .join("image")
    //   .attr("xlink:href", function (d) {
    //     setImageFetchCount((prev) => prev + 1);
    //     //return d.img;
    //     return "http://www.snut.fr/wp-content/uploads/2015/08/image-de-paysage.jpg";
    //   })
    //   .attr("x", (d) => Math.min(Math.max(d.x, d.r), dimensions.width - d.r))
    //   .attr("y", (d) => Math.min(Math.max(d.y, d.r), dimensions.height - d.r))
    //   .attr("width", (d) => d.r * 2)
    //   .attr("height", (d) => d.r * 2);
    // console.log("imageFetchCount", imageFetchCount);

    // Round points
    d3.select(".node")
      .selectAll("circle")
      .data(graphNodes)
      .join("circle")
      .attr("id", (d) => d.id)
      .attr("r", 5)
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .on("click", function (d) {
        onClickNode(d.target.id);
      });
  }

  useEffect(() => {
    const { nodes, edges } = attributes;

    setNodes((prev) => {
      // Add new nodes
      const newNodes = nodes.filter((node) => {
        return !prev.find((prevNode) => prevNode.id === node.id);
      });
      newNodes.forEach((node) => {
        let x = Math.random() * 2 - 1;
        let y = Math.sqrt(1 - x * x) * (Math.random() < 0.5 ? -1 : 1);
        node.x = x * (dimensions.width / 4) + dimensions.width / 2;
        node.y = y * (dimensions.height / 4) + dimensions.height / 2;

        // let x = Math.random();
        // let y = Math.random();
        // node.x = x * dimensions.width;
        // node.y = y * dimensions.height;
      });
      let merge = [...prev, ...newNodes];

      setEdges((prev) => {
        // TODO adpat for update in edge strength
        let new_edges = edges.filter((edge) => {
          return !prev.find(
            (prevEdge) =>
              prevEdge.source.id === edge.source &&
              prevEdge.target.id === edge.target
          );
        });

        let augmented_edges = new_edges.map((edge) => {
          let source = merge.find((node) => node.id === edge.source);
          let target = merge.find((node) => node.id === edge.target);

          if (source && target) {
            edge.source = source;
            edge.target = target;
          }

          return edge;
        });

        let nodes_id = merge.map((node) => node.id);
        let valideEdges = augmented_edges.filter((edge) => {
          return (
            nodes_id.includes(edge.source.id) &&
            nodes_id.includes(edge.target.id)
          );
        });
        simulation.force("link").links(valideEdges);

        return [...prev, ...augmented_edges];
      });

      return merge;
    });
  }, [attributes]);

  function addEges() {
    let nodes_id = graphNodes.map((node) => node.id);
    let valideEdges = graphEdges.filter((edge) => {
      return (
        nodes_id.includes(edge.source.id) && nodes_id.includes(edge.target.id)
      );
    });
    console.log("Edge for links force", valideEdges);

    //simulation.force("link").initialize(valideEdges);
    simulation.force("link").links(valideEdges);
  }

  useEffect(() => {
    simulation.nodes(graphNodes);

    addEges();
  }, [graphNodes]);

  useEffect(() => {
    //addEges();
  }, [graphEdges]);

  useEffect(() => {
    if (refContainer.current) {
      setDimensions({
        width: refContainer.current.offsetWidth,
        height: refContainer.current.offsetHeight,
      });
    }
  }, [refContainer]);

  useEffect(() => {
    // stop simulation on unmount
    return () => simulation.stop();
  }, []);

  return (
    <div
      id="content"
      style={{
        height: "100%",
        backgroundColor: "grey",
      }}
      ref={refContainer}
    >
      <svg width={dimensions.width} height={dimensions.height}>
        <g class="links"></g>
        <g class="node"></g>
      </svg>
    </div>
  );
  //         <g class="nodes"></g>
}
