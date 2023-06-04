
import * as d3 from "d3";
import { useD3 } from "../hooks/useD3";
import { useLayoutEffect, useState, useEffect, useRef } from "react";
import { Container, Row } from "react-bootstrap";
import { lineRadial } from 'd3';


export default function HistogramTime({ title, messageStatsPerChat, selectedId }) {
  const refContainer = useRef();
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [times, setTimes] = useState([]);

  // Build the words with size depending on the frequency in this conversation
  useEffect(() => {
    // If we have an ID selected run for that ID, otherwise sum over all chats & users
    var timeCounts = {};
    var time_indexes = Array.from({ length: 24 }, (_, index) => index + 1);
    for (var t of time_indexes){
        timeCounts[t] = 0.2
    }
    if (selectedId !== undefined) {
      // Iterate over every chat and person participating in a chat
      for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
        if (chat_id === selectedId){
          for (var time of chatsStats.timestamp){
            var digits = time.split(" ")[1]
            digits = digits.split(":")[0]  
            
            if (digits in timeCounts){
              timeCounts[digits] += 1
            }
          }
        }
      }
    } else {
      for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
          for (var time of chatsStats.timestamp){
              var digits = time.split(" ")[1]
              digits = digits.split(":")[0]  

              if (digits in timeCounts){
                  timeCounts[digits] += 1
              }
          }
        }
    }
      console.log("new update")
      console.log(timeCounts)
      setTimes(timeCounts);
}, [messageStatsPerChat, selectedId]);

function drawGrid(svg, radialScale, angleScale, data, maxValue, times) {
  const gridLevels = 5; 

  // Circular grid
  for (let level = 0; level <= gridLevels; ++level) {
    svg.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", radialScale(maxValue / gridLevels * level))
      .attr("fill", "none")
      .attr("stroke", "grey")
      .attr("stroke-dasharray", "2,2");
  }

  

  // Radial grid
  svg.selectAll(".line")
    .data(Object.keys(times))
    .enter()
    .append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => radialScale(maxValue) * Math.cos(angleScale(i) - Math.PI / 2)) 
    .attr("y2", (d, i) => radialScale(maxValue) * Math.sin(angleScale(i) - Math.PI / 2))
    .attr("stroke", "grey")
    .attr("stroke-dasharray", "2,2");

}

function drawGridLabels(svg, radialScale, angleScale, data, maxValue, times) {
  const gridLevels = 5; 

    for (let level = 0; level <= gridLevels; ++level) {

   svg.append("text")
      .attr("x", 0)
      .attr("y", -radialScale((maxValue / gridLevels * level)))
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .style("fill", "black")
      .style("font-size", "10px")
      .style("font-weight", "bolder")
      .text((maxValue / gridLevels * level).toFixed(2));
}
}


const createPieChart = (svg) => {

  var data = [];

  var  maxValue = Math.max(...Object.values(times));

  var new_data = []
  var sum_tot = 0

  for (let [key, val] of Object.entries(times)){
        sum_tot += val
  }

  for (let [key, val] of Object.entries(times)){
        new_data.push({time:parseInt(key), value: val/sum_tot})
  }
  new_data.sort((a, b) => a.time - b.time); 
  data = new_data
  maxValue = maxValue/sum_tot
  

  // Configuration
  const margin = 40;
  const width = dimensions.width - margin * 2;
  const height = dimensions.height - margin * 2;
  const radius = Math.min(width, height) / 2 - margin;

  // Create the radar chart SVG
  const g = svg.attr("width", width)
    .attr("height", height)
    .append("g")
    .attr('transform', `translate(${width / 2 + margin}, ${height / 2 + margin/3})`);

  
  // Create a radial scale for the plot
  const radialScale = d3.scaleLinear()
    .domain([0, maxValue])
    .range([0, radius]);

  // Create a scale for the angles
  const angleScale = d3.scaleLinear()
    .domain([0, data.length])
    .range([0, 2 * Math.PI]);


  // Function to convert data to line
  const lineGenerator = d3.lineRadial()
    .curve(d3.curveLinear)
    .radius(d => radialScale(d.value))
    .angle((d, i) => angleScale(i));


  

  // Add labels
g.selectAll("text")
  .data(data)
  .enter()
  .append("text")
  .attr("x", (d, i) => {
    const angle = angleScale(i) - Math.PI / 2;
    const x = (radius + 10) * Math.cos(angle); 
    const textLength = d && d.time ? d.time.length : 0;
    if (angle > 0 && angle < Math.PI/2) {
      return x + 2;  // Rough estimate of text height
    }
    //if (angle > -Math.PI && angle < 0) {
    //  return x - (textLength * 6);  // Rough estimate of text width
    //}

    if (angle > Math.PI/2 && angle < Math.PI) {
      return x - 7;  // Rough estimate of text height
    }

    if (angle == Math.PI) {
      return x - 7;  // Rough estimate of text height
    }

    if (angle > Math.PI && angle < 3 * Math.PI / 2) {
      return x - 4;  // Rough estimate of text height
    }

    if (angle > (3 * Math.PI / 2.0) && angle < 2 * Math.PI ) {
      return x + 20;  // Rough estimate of text height
    }

    return x;
  })
  .attr("y", (d, i) => {
    const angle = angleScale(i) - Math.PI / 2;
    const y = (radius + 10) * Math.sin(angle);  

    if (angle > 0 && angle < Math.PI/2) {
      return y + 7;  // Rough estimate of text height
    }

    if (angle == Math.PI/2) {
      return y + 7;  // Rough estimate of text height
    }

    if (angle > Math.PI/2 && angle < Math.PI) {
      return y + 7;  // Rough estimate of text height
    }

    if (angle > Math.PI && angle < 3 * Math.PI / 2) {
      return y - 1;  // Rough estimate of text height
    }

    if (angle == 0) {
      return y + 4;  // Rough estimate of text height
    }

    return y;
  })
  .text(d => d.time) // <-- Add the label text
  .attr("font-size", "10px")  // Set the size of the text
  .attr("text-anchor", "middle") // To center the text
  .style("fill", "green");

  drawGrid(g, radialScale, angleScale, data, maxValue, times);

  //draw outline
 g.append("path")
    .datum(data)
    .attr("fill", "rgba(157, 0, 255, 0.7)") // Increase transparency
    .attr("stroke", "#9d00ff")
    .attr("d", lineGenerator);

  drawGridLabels(g, radialScale, angleScale, data, maxValue, times);


};


 const destroyed = (svg) => {
  svg.selectAll("g").remove();
};

  const ref = useD3(createPieChart, [times, dimensions], destroyed);

useEffect(() => {
    if (refContainer.current) {
      setDimensions({
        width: refContainer.current.clientWidth,
        height: refContainer.current.clientHeight,
      });
    }
  }, [refContainer]);

  
  useEffect(() => {
    function handleWindowResize() {
      if (refContainer.current) {
        setDimensions({
          width: refContainer.current.clientWidth,
          height: refContainer.current.clientHeight,
        });
      }
    }
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  return (
    <Container fluid className="h-100">
      <Row
        className="p-0 m-0 h-100"
        style={{
          height: "100%",
        }}
        ref={refContainer}
      >
        <svg
          ref={ref}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            marginRight: "0px",
            marginLeft: "0px",
            marginBottom: "50px",
          }}
        >
          <g className="plot-area" />
        </svg>
      </Row>
    </Container>
  );
      }
