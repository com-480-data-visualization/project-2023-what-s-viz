
import * as d3 from "d3";
import { useD3 } from "../hooks/useD3";
import { useLayoutEffect, useState, useEffect, useRef } from "react";
import { Container, Row } from "react-bootstrap";
import { lineRadial } from 'd3';


export default function HistogramContacts({ title, messageStatsPerChat, selectedId, idToContact, idToGroup }) {
  const refContainer = useRef();
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [chats, setChats] = useState([]);
  // Build the words with size depending on the frequency in this conversation
  useEffect(() => {
    // If we have an ID selected run for that ID, otherwise sum over all chats & users
    var idCounts = {};
    if (selectedId !== undefined) {
      // Iterate over every chat and person participating in a chat
      for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
        for (let [contact_id, count] of Object.entries(chatsStats.idSendCount)) {
              if ( chat_id === selectedId){
                  if (contact_id in idCounts) {
                    idCounts[contact_id] += count;
                } else {
                    idCounts[contact_id] = count;
              }
            }
          }
        } 
    } else {
      for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
        for (let [contact_id, count] of Object.entries(chatsStats.idSendCount)) {

              if (chat_id !== contact_id){
                  if (contact_id in idCounts) {
                    idCounts[contact_id] += count;
                } else {
                    idCounts[contact_id] = count;
              }
            }
          }
        } 
    }

      setChats(idCounts);
}, [messageStatsPerChat, selectedId]);

const createBarChart = (svg) => {
  var chat_capped = Object.fromEntries(Object
        .entries(chats)
        .sort(([, a], [, b]) => b - a)                
        .filter((s => ([, v]) => s.add(v).size <= 5)(new Set)));
    
    var chat_mapped_capped = {};
    var sum_tot = 0
    for (const [key, value] of Object.entries(chat_capped)) {
      if (idToContact[key] !== undefined){
        chat_mapped_capped[idToContact[key]["name"]] = value;
        sum_tot += value;
      }
      if (idToGroup[key] !== undefined){
        chat_mapped_capped[idToGroup[key]["name"]] = value;
        sum_tot += value;
      }
    }

  
  const margin = {top: 20, right: 20, bottom: 70, left: 40},
        width = dimensions.width - margin.left - margin.right,
        height = dimensions.height - margin.top - margin.bottom;


  var x = d3.scaleBand().rangeRound([0, width]).padding(0.1);
  var xAxis = d3.axisBottom().scale(x);


  var y = d3.scaleLinear().range([height, 0]);
  var yAxis = d3.axisLeft().scale(y);

  var g = svg.append('g')
              .attr('transform', `translate(${margin.left}, ${margin.top})`);

  // entries of the data
  const data = Object.entries(chat_mapped_capped).map(([key, value]) => ({key, value}));

  // transformations
  x.domain(data.map(d => d.key));
  y.domain([0, d3.max(data, d => d.value)]);

  
g.append("g")
    .attr("class", "x axis")
    .attr("transform", `translate(0, ${height})`)
    .call(xAxis)
    .selectAll("text")
    .style("text-anchor", "end")
    .attr("dx", "-.8em")
    .attr("dy", ".55em")
    .attr("transform", "rotate(-25)");

 
  g.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Value");


  
  const bars = g.selectAll(".bar")
      .data(data)
      .enter()
      .append("rect")
      .style("fill", "rgba(7, 121, 81, 0.851)")
      .attr("x", d => x(d.key))
      .attr("width", x.bandwidth())
      .attr("y", d => y(d.value))
      .attr("height", d => height - y(d.value));

  // for hovering
  const tooltip = svg.append("text")
      .attr("x", 0)
      .attr("y", 0)
      .style("font-size", "16px")
      .style("fill", "black")
      .style("visibility", "hidden");

  
  bars.on("mouseover", function(event, d) {
  const percentage = (d.value / sum_tot * 100).toFixed(2) + "%";
  let textPosition = y(d.value) + 15;
  if(height - y(d.value) < 20) {
    textPosition = y(d.value) - 5; 
  }
  tooltip.text(percentage)
      .attr("x", x(d.key) + x.bandwidth() / 2 + 37)
      .attr("y", textPosition)  
      .style("text-anchor", "middle") 
      .style("visibility", "visible");
}).on("mouseout", function() {
  tooltip.style("visibility", "hidden");
});

};



 const destroyed = (svg) => {
  svg.selectAll("g").remove();
};

  const ref = useD3(createBarChart, [chats, dimensions], destroyed);

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
        height: "150%",
      }}
      ref={refContainer}
    >
      {Object.keys(chats).length === 0 ? (
        <div style={{ margin: "auto" }}>No data to display
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{
            marginRight: "0px",
            marginLeft: "0px",
          }}
        ></svg>
        </div>
      
      ) : (
        <svg
          ref={ref}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            marginRight: "0px",
            marginLeft: "0px",
          }}
        ></svg>
      )}
    </Row>
  </Container>
);
      }
