
import * as d3 from "d3";
import { useD3 } from "../hooks/useD3";
import { useLayoutEffect, useState, useEffect, useRef } from "react";
import { Container, Row } from "react-bootstrap";
import { lineRadial } from 'd3';


export default function HistogramContacts({ title, messageStatsPerChat, selectedId, idToContact, idToGroup }) {
  const refContainer = useRef();
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });
  const [chats, setChats] = useState([]);
  var key = function(d){ return d.data.label; };
  // Build the words with size depending on the frequency in this conversation
  useEffect(() => {
    // If we have an ID selected run for that ID, otherwise sum over all chats & users
    var idCounts = {};
    if (selectedId !== undefined) {
      // Iterate over every chat and person participating in a chat
      for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
        for (let [contact_id, count] of Object.entries(chatsStats.idSendCount)) {
              if (chat_id !== contact_id && chat_id === selectedId){
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

    const createPieChart = (svg) => {
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

   
    const data = Object.entries(chat_mapped_capped).map(([key, value]) => ({key, value}));
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const margin = 40;
    const width = dimensions.width - margin * 2;
    const height = dimensions.height - margin * 2;

    const radius = Math.min(width, height) / 2;    

    const pie = d3.pie().value(d => d.value)(data);

  const arc = d3.arc()
    .innerRadius(0)
    .outerRadius(radius);
  
  const outerArc = d3.arc()
    .innerRadius(radius * 0.9)
    .outerRadius(radius * 0.9);
  
  const g = svg.append('g')
    .attr('transform', `translate(${width / 2 + margin}, ${height / 2 + margin})`);

  g.selectAll("path")
    .data(pie)
    .join("path")
    .attr("d", arc)
    .attr("fill", (_, i) => color(i));


  let isGreaterThanThreshold = data.some(d => (d.value/sum_tot) > 0.75);
  const text = g.selectAll("text")
    .data(pie)
    .enter()
    .append("text")
    .attr("dy", ".35em")
    .text(function(d) {
        // If any value is greater than 0.75, only show those labels.
        if (isGreaterThanThreshold) {
            return (d.data.value/sum_tot) > 0.75 ? d.data.key : '';
        }
        // Otherwise, show all labels.
        else {
            return d.data.key;
        }
    });
  
  function midAngle(d){
    return d.startAngle + (d.endAngle - d.startAngle) / 2;
  }
  
  text.transition().duration(1000)
    .attr("transform", function(d) {
      var pos = outerArc.centroid(d);
      pos[0] = radius * (midAngle(d) < Math.PI ? 1.07 : -1.07);
      return "translate(" + pos + ")";
    })
    .style("text-anchor", function(d){
      return midAngle(d) < Math.PI ? "start":"end";
    });
  
  const polyline = g.selectAll("polyline")
    .data(pie)
    .enter()
    .append("polyline")
    .attr("stroke", "black")    
    .attr("fill", "none");      

polyline.transition().duration(1000)
    .attr("points", function(d){
      var pos = outerArc.centroid(d);
      pos[0] = radius * 1.03 * (midAngle(d) < Math.PI ? 1 : -1);
      return isGreaterThanThreshold && (d.data.value/sum_tot) <= 0.75 ? '' : [arc.centroid(d), outerArc.centroid(d), pos];
    });
    
  };

 const destroyed = (svg) => {
  svg.selectAll("g").remove();
};

  const ref = useD3(createPieChart, [chats, dimensions], destroyed);

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
        <svg
          ref={ref}
          width={dimensions.width}
          height={dimensions.height}
          style={{
            marginRight: "0px",
            marginLeft: "0px",
          }}
        >
          <g className="plot-area" />
        </svg>
      </Row>
    </Container>
  );
      }
