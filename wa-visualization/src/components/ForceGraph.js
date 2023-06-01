import * as d3 from "d3";

/*
 * Network graph class to show contacts landscape
 */
export class ForceGraph {
  constructor(container, data, onClickNode, withNodePictures = false) {
    this.withNodePictures = withNodePictures;
    this.container = d3.select(container);
    this.nodes = data.nodes;
    this.edges = data.edges;
    // Log scale for the node size
    this.selectedId = "";
    this.onClickNode = (id) => {
      if (id === this.selectedId) {
        this.selectedId = "";
        onClickNode(undefined);
      } else {
        this.selectedId = id;
        onClickNode(id);
      }
      this.updateGraph();
    };
    this.draw();
  }

  // update the data (add nodes and edges), we never remove nodes or edges
  update(data) {
    // to update run trough the data nodes and add the new ones
    this.simulation.stop();

    let edgeDict = {};
    for (let edge of this.edges) {
      edgeDict[edge.id] = edge;
    }
    for (let psb_new_node of data.nodes) {
      if (!this.nodes.find((n) => n.id === psb_new_node.id)) {
        // Give the nodes random initial positions within the graph
        psb_new_node.x = Math.random() * this.bb.width;
        psb_new_node.y = Math.random() * this.bb.height;

        this.nodes.push(psb_new_node);
        // add all edges from this node
        for (let psb_new_edge of data.edges) {
          if (
            psb_new_edge.source === psb_new_node.id ||
            psb_new_edge.target === psb_new_node.id
          ) {
            this.edges.push(psb_new_edge);
          } else {
            if (edgeDict[psb_new_edge.id]) {
              edgeDict[psb_new_edge.id].minLinkSourceTarget =
                psb_new_edge.minLinkSourceTarget;
            }
          }
        }
      } else {
        // update the node
        let node = this.nodes.find((n) => n.id === psb_new_node.id);
        node.edgeCount = psb_new_node.edgeCount;
      }
    }

    this.updateGraph(0.15);
    return this;
  }

  // updated the selected ID
  selectNode(id) {
    if (id === undefined) {
      this.selectedId = "";
    } else {
      this.selectedId = id;
    }

    // Do not change the alpha, i.e. do not move
    this.updateGraph(0);
  }

  // update the graph
  updateGraph = (alpha) => {
    if (alpha === undefined) {
      alpha = 0.1;
    }
    // update links, nodes and reset the force simulation
    this.drawLinks();
    this.drawNodes();
    this.simulation.nodes(this.nodes);
    this.simulation.force(
      "link",
      d3
        .forceLink()
        .strength(function (d) {
          return (1 - Math.min(d.minLinkSourceTarget, 5) / 5 + 0.1) * 3;
        })
        .id(function (d) {
          return d.id;
        }) // This provide  the id of a node
        .links(this.edges)
    );
    this.simulation.alpha(alpha).restart();
  };

  // resize handler
  resize = () => {
    this.bb = this.container.node().getBoundingClientRect();
    this.svg.attr("width", this.bb.width);
    this.svg.attr("height", this.bb.height);
    // center the graph and reset the simulation
    this.simulation.force(
      "center",
      d3.forceCenter(this.bb.width / 2 - 25, this.bb.height / 2 - 25) //.strength(5)
    );
    this.simulation.alpha(0.1).restart();
  };

  calcNodeSize(node) {
    if (node.edgeCount === 1) {
      return 5;
    }
    let size = (Math.log(node.edgeCount) + 1) * 3;
    return size;
  }

  nodeColor(d) {
    if (d.id === this.selectedId) {
      return "#AA5656";
    }
    return d.isGroup ? "#9d00ff" : "#698269";
  }

  // setup graph and draw
  draw() {
    this.bb = this.container.node().getBoundingClientRect();
    this.svg = this.container
      .append("svg")
      .attr("width", this.bb.width)
      .attr("height", this.bb.height);

    d3.select(window).on("resize", this.resize);

    // create tooltip
    this.tooltip = this.container
      .append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("transform", "translateX(-50%)")
      .style("pointer-events", "none")
      .style("background-color", "white")
      .style("border-radius", "5px")
      .style("border", "1px solid black")
      .style("top", "0")
      .style("left", "0");

    // Initialize the links
    this.link = this.svg.append("g").selectAll("line");
    this.drawLinks();

    // initialize nodes
    this.node = this.svg.append("g").selectAll("g");
    this.drawNodes();

    // Let's list the force we wanna apply on the network
    this.simulation = d3
      .forceSimulation(this.nodes) // Force algorithm is applied to data.nodes
      .force(
        "link",
        d3
          .forceLink()
          .strength(function (d) {
            return (1 - Math.min(d.minLinkSourceTarget, 5) / 5 + 0.1) * 3;
          })
          //.strength((d) => Math.log(d.strength) + 1) // This force provides links between nodes
          .id(function (d) {
            return d.id;
          }) // This provide the id of a node
          .links(this.edges) // and this the list of links
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => {
          // calculate the charge based on the node size
          return -40 * this.calcNodeSize(d);
        })
      ) // This adds repulsion between nodes
      .force(
        "collide",
        d3
          .forceCollide()
          .radius(function (d) {
            return d.r + 1;
          })
          .strength(function (d) {
            return -1 * d.r;
          })
      )
      .force(
        "center",
        d3
          .forceCenter(this.bb.width / 2 - 25, this.bb.height / 2 - 25)
          .strength(0.5)
      ) // This force attracts nodes to the center of the this.svg area
      .on("tick", this.ticked);
  }

  // nodes
  drawNodes() {
    const that = this;

    this.node = this.node
      .data(this.nodes, (n) => n.id)
      .join(
        // when creating new nodes
        (enter) => {
          const node = enter
            .append("g")
            .style("cursor", "pointer")
            .call(this.drag(this.simulation)) // handle node drag
            .on("mouseover", function (ev, n) {
              // decrease brightness of the node
              d3.select(this)
                .transition()
                .duration("50")
                .attr("filter", "brightness(60%)");
              // show tooltip
              that.tooltip.transition().duration(50).style("opacity", 1);

              let defaultImg =
                process.env.PUBLIC_URL +
                "/no-profile-picture-icon-" +
                (n.isGroup ? "group" : "contact") +
                ".png";

              let imgLink = "";
              if (n.img) {
                imgLink = n.img;
              } else {
                imgLink = defaultImg;
              }
              that.tooltip.html(
                "<style> #main {display: flex;flex-direction: column;}</style><div id='main'><img height=200 width=200 style='object-fit: cover;' src='" +
                  imgLink +
                  "' onerror='this.onerror=null; this.src='" +
                  defaultImg +
                  "'/><b>" +
                  n.name +
                  "</b></div>"
              );
              // set tooltip position
              const { width, height } = that.tooltip
                .node()
                .getBoundingClientRect();
              // use max to prevent tooltip from going outside the window
              that.tooltip
                .style("left", Math.max(ev.pageX, width / 2) + "px")
                .style("top", Math.max(0, ev.pageY - height - 10) + "px");
            })
            .on("mousemove", function (ev, n) {
              // update tooltip position
              const { width, height } = that.tooltip
                .node()
                .getBoundingClientRect();

              that.tooltip
                .style("left", Math.max(ev.pageX, width / 2) + "px")
                .style("top", Math.max(0, ev.pageY - height - 10) + "px");
            })
            .on("mouseout", function (ev, n) {
              // reset brightness of node
              d3.select(this)
                .transition()
                .duration("50")
                .attr("filter", "brightness(100%)");
              // hide tooltip
              that.tooltip.transition().duration("50").style("opacity", 0);
            })
            .on("click", (ev, n) => {
              // when clicking on a node update all the graphs
              this.onClickNode(n.id);
            });

          // add node representation
          if (this.withNodePictures) {
            node
              .append("image")
              .attr("xlink:href", function (d) {
                // TODO adapt
                let defaultImg =
                  process.env.PUBLIC_URL +
                  "/no-profile-picture-icon-" +
                  (d.isGroup ? "group" : "contact") +
                  ".png";

                let imgLink = "";
                if (d.img) {
                  imgLink = d.img;
                } else {
                  imgLink = defaultImg;
                }
                return imgLink;
              })
              .attr("width", (d) => this.calcNodeSize(d) * 2)
              .attr("x", (d) => -this.calcNodeSize(d))
              .attr("y", (d) => -this.calcNodeSize(d));
          } else {
            node
              .append("circle")
              .attr("r", this.calcNodeSize)
              .style("fill", this.nodeColor);
          }

          // add node text
          node
            .append("text")
            .text(function (d) {
              return ""; //d.name;
            })
            .attr("dy", (d) => {
              // in accordnace with the size of the node
              return 20 + "px";
            })
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "black")
            .style("text-anchor", "middle")
            .style("dominant-baseline", "middle");
          return node;
        },
        (update) => {
          // when updating a node
          if (this.withNodePictures) {
            update
              .select("image")
              .attr("width", (d) => this.calcNodeSize(d) * 2)
              .attr("x", (d) => -this.calcNodeSize(d))
              .attr("y", (d) => -this.calcNodeSize(d));
          } else {
            update
              .select("circle")
              .attr("r", this.calcNodeSize)
              .style("fill", this.nodeColor);
          }
          return update;
        }
      );
  }

  clear() {
    this.nodes = [];
    this.container.selectAll("*").remove();
  }

  // links
  drawLinks() {
    const that = this;
    this.link = this.link
      .data(this.edges, (d) => d.source + "-" + d.target)
      .join("line")
      .style("cursor", "pointer")
      .style("stroke", (d) => {
        if (
          d.source.id === this.selectedId ||
          d.target.id === this.selectedId
        ) {
          return "#858383";
        } else {
          return "rgba(0,0,0,0.04)";
        }
      })
      .style("stroke-width", function (d) {
        return 5 + "px";
      })
      .on("mouseover", function (ev, l) {
        // decrease brightness of connected nodes and the link
        // that.node
        //   .filter((n) => {
        //     return n.id === l.source.id || n.id === l.target.id;
        //   })
        //   .select("circle")
        //   .transition()
        //   .duration("50")
        //   .attr("filter", "brightness(60%)");
        d3.select(this)
          .transition()
          .duration("50")
          .style("stroke", "rgba(0,0,0,0.7)");

        // show tooltip
        that.tooltip.transition().duration(50).style("opacity", 1);
        that.tooltip.html(
          "<b>" + l.source.name + " and " + l.target.name + "</b>"
        );

        // set tooltip position
        const { width, height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", Math.max(ev.pageX, width / 2) + "px")
          .style("top", Math.max(0, ev.pageY - height - 10) + "px");
      })
      .on("mousemove", function (ev, n) {
        // set tooltip position
        const { width, height } = that.tooltip.node().getBoundingClientRect();
        that.tooltip
          .style("left", Math.max(ev.pageX, width / 2) + "px")
          .style("top", Math.max(0, ev.pageY - height - 10) + "px");
      })
      .on("mouseout", function (ev, l) {
        // reset brightness of connected nodes and the link
        d3.select(this)
          .transition()
          .duration("50")
          .style("stroke", "rgba(0,0,0,0.05)");
        // that.node
        //   .filter((n) => {
        //     return n.id === l.source.id || n.id === l.target.id;
        //   })
        //   .select("circle")
        //   .transition()
        //   .duration("50")
        //   .attr("filter", "brightness(100%)");
        // hide tooltip
        that.tooltip.transition().duration("50").style("opacity", 0);
      });
  }

  // prevent nodes to leave the window
  checkBounds(d) {
    let marginLT = 10;
    let marginRB = 10;
    if (d.x < marginLT) d.x = marginLT;
    if (d.x > this.bb.width - marginRB) d.x = this.bb.width - marginRB;
    if (d.y < marginLT) d.y = marginLT;
    if (d.y > this.bb.height - marginRB) d.y = this.bb.height - marginRB;
  }

  // This function is run at each iteration of the force algorithm, updating the nodes position.
  ticked = () => {
    this.link
      .attr("x1", (d) => {
        this.checkBounds(d.source);
        return d.source.x;
      })
      .attr("y1", (d) => {
        return d.source.y;
      })
      .attr("x2", (d) => {
        this.checkBounds(d.target);
        return d.target.x;
      })
      .attr("y2", (d) => {
        return d.target.y;
      });

    this.node.attr("transform", (d) => {
      this.checkBounds(d);
      return "translate(" + d.x + "," + d.y + ")";
    });
  };

  // handle node dragging
  drag() {
    const dragstarted = (event) => {
      if (!event.active) this.simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    };

    const dragged = (event) => {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    };

    const dragended = (event) => {
      if (!event.active) this.simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    };

    return d3
      .drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }
}
