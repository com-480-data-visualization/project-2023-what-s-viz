
import * as d3 from "d3";
import * as pie from "d3-cloud";
import { useD3 } from "../hooks/useD3";
import { useLayoutEffect, useState, useEffect, useRef } from "react";
import { Container, Row } from "react-bootstrap";



export default function HistogramContacts({ title, messageStatsPerChat, selectedId }) {
  const refContainer = useRef();
  const [dimensions, setDimensions] = useState({ width: 500, height: 300 });


  // The histogram layout function
  var layout = pie().value(function (d) {
    return d.value;
  });

  const [chats, setChats] = useState([]);
  // Build the words with size depending on the frequency in this conversation
  useEffect(() => {
    // If we have an ID selected run for that ID, otherwise sum over all chats & users
    var idCounts = {};
    var idColor = {};
    if (selectedId !== undefined) {
      // Iterate over every chat and person participating in a chat
      for (let [chat_id, chatsStats] of Object.entries(messageStatsPerChat)) {
        for (let [contact_id, count] of Object.entries(chatsStats.idSendCount)) {
              if (chat_id !== contact_id && chat_id === selectedId){
                  if (contact_id in idCounts) {
                    idCounts[contact_id] += count;
                } else {
                    idCounts[contact_id] = count;
                    //idColor[contact_id] = color;
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
                    //idColor[contact_id] = color;
              }
            }
          }
        } 
    }
    console.log(idCounts);
    
      setChats(idCounts);
}, [messageStatsPerChat, selectedId]);

useLayoutEffect(()=>{
  console.log(chats)
})

  useLayoutEffect(() => {
    setDimensions({
      width: refContainer.current.clientWidth,
      height: refContainer.current.clientHeight,
    });
  }, []);

  useEffect(() => {
    function handleWindowResize() {
      setDimensions({
        width: refContainer.current.clientWidth,
        height: refContainer.current.clientHeight,
      });
    }
    window.addEventListener("resize", handleWindowResize);
    return () => {
      window.removeEventListener("resize", handleWindowResize);
    };
  }, []);

  const d3Ref = useD3(
    (svg) => {
      function draw(chats) {
        svg
          .append("g")
          .attr(
            "transform",
            "translate(" +
              layout.size()[0] / 2 +
              "," +
              layout.size()[1] / 2 +
              ")"
          )
          .selectAll("text")
          .data(chats)
          .enter()
          .append("text")
          .style("font-size", function (d) {
            return d.size + "px";
          })
          .style("font-family", "Impact")
          .style("fill", function (d, id) {
            return d.color;
          })
          .attr("text-anchor", "middle")
          .attr("transform", function (d) {
            return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
          })
          .text(function (d) {
            return d.text;
          });

  var radius = Math.min(layout.size()[0], layout.size()[1]) / 2
  // shape helper to build arcs:
  var arcGenerator = d3.arc().innerRadius(0).outerRadius(radius);
 

  var color = d3.scaleOrdinal().domain(data).range(d3.schemeSet2);

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  svg
    .selectAll("mySlices")
    .data(chats)
    .enter()
    .append("path")
    .attr("d", arcGenerator)
    .attr("fill", function (d) {
      return color(d.data.key);
    })
    .attr("stroke", "black")
    .style("stroke-width", "2px")
    .style("opacity", 0.7)
    .append("text")
    .text(function (d) {
      return "grp " + d.data.key;
    })
    .attr("transform", function (d) {
      return "translate(" + arcGenerator.centroid(d) + ")";
    })
    .style("text-anchor", "middle")
    .style("font-size", 17);
      }

      layout.stop();
      svg.selectAll("g").remove();
   
      layout
        .size([dimensions.width - 50, dimensions.height])
        .padding(1)
        .rotate(function () {
          return (~~(Math.random() * 8) * 45) / 4;
        })
        .font("Impact")
        .on("end", draw);
      layout.start();
    },
    [chats],
    () => {
      // cleanup
      layout.stop();
    }
  );

  return (
    <Container fluid className="h-100">
      <Row
        className={"p-0 m-0 h-100"}
        style={{
          height: "100%",
        }}
        ref={refContainer}
      >
        <div style={{ height: "100%", display:  "block" }}>
          <svg
            ref={d3Ref}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      </Row>
    </Container>
  );
}
