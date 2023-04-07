// https://dev.to/gilfink/creating-a-force-graph-using-react-and-d3-76c

import * as d3 from "d3";
import { useState, useEffect, useRef } from "react";

import "./ForceGraph.module.css";

export function ForceGraph({ nodes, edges, charge, onClickNode }) {
  const refContainer = useRef();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  function updateLinks() {
    let u = d3
      .select(".links")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("x1", function (d) {
        return Math.min(
          Math.max(d.source.x, d.source.r),
          dimensions.width - d.source.r
        );
      })
      .attr("y1", function (d) {
        return Math.min(
          Math.max(d.source.y, d.source.r),
          dimensions.height - d.source.r
        );
      })
      .attr("x2", function (d) {
        return Math.min(
          Math.max(d.target.x, d.target.r),
          dimensions.width - d.target.r
        );
      })
      .attr("y2", function (d) {
        return Math.min(
          Math.max(d.target.y, d.target.r),
          dimensions.height - d.target.r
        );
      });
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

    // Images, must be doing something wrong => lagy (maybe request image at each iteration?)
    // d3.select(".node")
    //   .selectAll("image")
    //   .data(nodes)
    //   .join("image")
    //   .attr("xlink:href", (d) => d.img)
    //   .attr("x", (d) => Math.min(Math.max(d.x, d.r), dimensions.width - d.r))
    //   .attr("y", (d) => Math.min(Math.max(d.y, d.r), dimensions.height - d.r))
    //   .attr("width", (d) => d.r * 2)
    //   .attr("height", (d) => d.r * 2);

    // Round points
    d3.select(".node")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("id", (d) => d.id)
      .attr("r", 5)
      .attr("cx", function (d) {
        return Math.min(Math.max(d.x, d.r), dimensions.width - d.r);
      })
      .attr("cy", function (d) {
        return Math.min(Math.max(d.y, d.r), dimensions.height - d.r);
      })
      .on("click", function (d) {
        onClickNode(d.target.id);
      });
  }

  useEffect(() => {
    // const simulation = d3
    //   .forceSimulation()
    //   .force("x", d3.forceX(400))
    //   .force("y", d3.forceY(300))
    //   .force("charge", d3.forceManyBody().strength(charge))
    //   .force("collision", d3.forceCollide(5));
    if (refContainer.current) {
      setDimensions({
        width: refContainer.current.offsetWidth,
        height: refContainer.current.offsetHeight,
      });
    }

    let simulation = d3
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-100))
      .force(
        "center",
        d3.forceCenter(dimensions.width / 2, dimensions.height / 2)
      )
      .force(
        "link",
        d3
          .forceLink()
          .links(edges)
          .id((d) => d.id)
          .distance((d) => (1 - d.strength) * 10)
      )
      .force("collision", d3.forceCollide(5));

    // update state on every frame
    simulation.on("tick", () => {
      updateNodes();
      updateLinks();
    });

    // slow down with a small alpha
    simulation.alpha(0.1);

    // restart simulation at every change
    //simulation.restart();

    // stop simulation on unmount
    return () => simulation.stop();
  }, [nodes, charge, edges]);

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
