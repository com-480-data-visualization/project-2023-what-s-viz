import { useD3 } from '../hooks/useD3';
import React from 'react';
import * as d3 from 'd3';

function ScatterChart({ data, handleClick, width, height }) {
  const ref = useD3(
    (svg) => {
      // TODO still called twice
      const max_y = d3.max(data, (d) => d.y)
      const min_y = d3.min(data, (d) => d.y)

      const y_scale = d3.scaleLinear()
        .domain([min_y-1, max_y+1])
        .range([0, 100]);

      const y_scale_inverted  = d3.scaleLinear()
          .domain([min_y-1, max_y+1])
          .range([100, 0]);

      const x_scale = d3.scaleLinear()
        .domain([0,6], 1)
        .range([0, 200]);

      // temperature scaling of color
      const color = d3.scaleLinear()
        //.domain([-25, 0, 15, 30, 45])
        //.range(["steelblue", "lightblue", "green", "yellow", "red"]);
        .domain([5, 20])
        .range(["blue", "red"]);

      var circle = svg.selectAll("circle")
        .data(data);

      //circle.exit().remove();

      circle.enter().append("circle")
          .attr("r", 2)
        .merge(circle)
          .attr("cx", function(d) { return x_scale(d.x); })
          .attr("cy", function(d) { return 100 - y_scale(d.y); })
          .style("fill", function(d) { return color(d.y); });
        //.on("click", d => {
        //  handleClick(d); // passed React method to handle click
        //});
      
      const yAxis = (g) =>
        g.attr("transform", `translate(-10,0)`)
          .style("font", "6px times")
          .style("color", "black")
          .call(d3.axisLeft(y_scale_inverted)
                  .ticks(null, "s")
                  .tickSizeOuter(0)
                  .tickSizeInner(0)
              )
          .call((g) => g.select(".domain").remove())
          
      svg.select(".y-axis").call(yAxis);

      var x_names = d3.scaleOrdinal()
          .domain([0, 6])
          .range(data.map(function(d) {
            return d.name;
          }))

      const xAxis = (g) =>
        g.attr("transform", `translate(0,100)`)
          .call(
            d3
              .axisBottom(x_scale)
              .tickFormat(d => (d % 1) === 0 ? x_names(d) : '')
              .tickSizeOuter(0)
              .tickSizeInner(0))
          .call((g) => g.select(".domain").remove())
          .style("font", "6px times")

      svg.select(".x-axis").call(xAxis);

      console.log('ScatterChart rendered');
    },
    [data.length, width, height]
  );
    // min-x min-y width height
    // viewBox="-10 -10 220 120"
  return (
    <svg
      ref={ref}
      style={{
        height: width * .5,
        width: "100%",
        marginRight: "0px",
        marginLeft: "0px",
      }}
      viewBox="-15 -10 220 120"
    >
      <g className="x-axis" />
      <g className="y-axis" />
    </svg>
  );
}

export default ScatterChart;