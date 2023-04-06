// https://dev.to/gilfink/creating-a-force-graph-using-react-and-d3-76c

import * as d3 from "d3";
import { useEffect } from "react";

import "./ForceGraph.css";

export function ForceGraph({ nodes, edges, charge, width, height }) {
  function updateLinks() {
    let u = d3
      .select(".links")
      .selectAll("line")
      .data(edges)
      .join("line")
      .attr("x1", function (d) {
        return d.source.x;
      })
      .attr("y1", function (d) {
        return d.source.y;
      })
      .attr("x2", function (d) {
        return d.target.x;
      })
      .attr("y2", function (d) {
        return d.target.y;
      });
  }

  function updateNodes() {
    d3.select(".circle")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 5)
      .attr("cx", function (d) {
        return Math.min(Math.max(d.x, d.r), width - d.r);
      })
      .attr("cy", function (d) {
        return Math.min(Math.max(d.y, d.r), height - d.r);
      });

    // let u = d3
    //   .select(".nodes")
    //   .selectAll("text")
    //   .data(nodes)
    //   .join("text")
    //   .text(function (d) {
    //     return d.id;
    //   })
    //   .attr("x", function (d) {
    //     return d.x;
    //   })
    //   .attr("y", function (d) {
    //     return d.y;
    //   })
    //   .attr("dy", function (d) {
    //     return 5;
    //   });
  }

  useEffect(() => {
    // const simulation = d3
    //   .forceSimulation()
    //   .force("x", d3.forceX(400))
    //   .force("y", d3.forceY(300))
    //   .force("charge", d3.forceManyBody().strength(charge))
    //   .force("collision", d3.forceCollide(5));

    let simulation = d3
      .forceSimulation(nodes)
      .force("charge", d3.forceManyBody().strength(-100))
      .force("center", d3.forceCenter(width / 2, height / 2))
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
    <div id="content">
      <svg width={width} height={height}>
        <g class="links"></g>
        <g class="circle"></g>
      </svg>
    </div>
  );
  //         <g class="nodes"></g>
}
