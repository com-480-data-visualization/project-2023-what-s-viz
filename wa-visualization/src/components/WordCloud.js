// https://dev.to/gilfink/creating-a-force-graph-using-react-and-d3-76c

import * as d3 from "d3";
import * as cloud from "d3-cloud";
import { useD3 } from '../hooks/useD3';
import { useLayoutEffect, useState, useEffect, useRef } from "react";
import { Container } from 'react-bootstrap';

export function WordCloud({
    bagOfWord,
    selectedId,
}) {
  const refContainer = useRef();
  const [dimensions, setDimensions] = useState({ width: 500, height: 500 });

  // The cloud layout function
  var layout = cloud()

  const [words, setWords] = useState([]);
  // Build the words with size depending on the frequency in this conversation
  useEffect(() => {
    // If we have an ID selected run for that ID, otherwise sum over all chats & users
    var wordCounts = {};
    if (selectedId !== undefined) {
      for (let [chat, innerWords] of Object.entries(bagOfWord)) {
        for (let [word, value] of Object.entries(innerWords)) {
          if (word.length > 0 && (chat === selectedId)) {
            if (word in wordCounts) {
              wordCounts[word] += value;
            } else {
              wordCounts[word] = value;
            }
          }
        }
      }
    } else {
      for (let [chat, innerWords] of Object.entries(bagOfWord)) {
        for (let [word, value] of Object.entries(innerWords)) {
          if (word.length > 0) {
            if (word in wordCounts) {
              wordCounts[word] += value;
            } else {
              wordCounts[word] = value;
            }
          }
        }
      }
    }
    //console.log("WordCloud useEffect starting with ",  Object.keys(wordCounts).length, "words")
    let newWords = [];
    for (let [word, value] of Object.entries(wordCounts)) {
      newWords.push({text: word, value: value});
    }
    // amount fitted for:
    // 100 for 370, 500
    // 400 for 936, 500
    // 600 for 936, 800
    // 480 for 696, 800
    let amount = -0.00215694*dimensions.width
      -0.10104737*dimensions.height
      + 0.00094683*dimensions.width*dimensions.height;
    //console.log("WordCloud useEffect done with ", newWords.length, "words, min: ", newWords[newWords.length-1].value, ", max: ", newWords[0].value)
    if (newWords.length > amount) {
      // only keep the top amount words by size of value
      newWords.sort((a, b) => b.value - a.value);
      newWords = newWords.slice(0, amount);
    } else if (newWords.length == 0) {
      newWords.push({text: '', value: 0});
    }
    // Use d3 to delete all existing text elements
    setWords(newWords);
  }, [selectedId, bagOfWord, dimensions]);

  useLayoutEffect(() => {
    setDimensions({
        width: refContainer.current.clientWidth,
        height: refContainer.current.clientHeight
    });
  }, []);

  useEffect(() => {
    function handleWindowResize() {
        setDimensions({
            width: refContainer.current.clientWidth,
            height: refContainer.current.clientHeight
        });
    }
    window.addEventListener('resize', handleWindowResize);
    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);

  const d3Ref = useD3(
    (svg) => {
      function draw(words) {
        svg.append("g")
            .attr("transform", "translate(" + layout.size()[0] / 2 + "," + layout.size()[1] / 2 + ")")
          .selectAll("text")
            .data(words)
          .enter().append("text")
            .style("font-size", function(d) { return d.size + "px"; })
            .style("font-family", "Impact")
            .attr("text-anchor", "middle")
            .attr("transform", function(d) {
              return "translate(" + [d.x, d.y] + ")rotate(" + d.rotate + ")";
            })
            .text(function(d) { return d.text; });
      }
      
      if (words.length === 0) {
        return;
      }
      const word_size = d3.scaleLog()
        .domain([words[0].value, words[words.length-1].value])
        .range([35, 8]);
      
      layout.stop();
      svg.selectAll("g").remove();

      layout.size([dimensions.width-50, dimensions.height])
        .words(words)
        .padding(1)
        .rotate(function() { return ~~(Math.random() * 8) * 45/4; })
        .font("Impact")
        .fontSize(function(word) { return word_size(word.value); })
        .on("end", draw);

      layout.start();
    },
    [words],
    () => {
      // cleanup
      layout.stop();
    }
  );

  return (
    <Container>
    <div
      className='row'
      id="content"
      style={{
        height: "100%",
      }}
      ref={refContainer}
    >
      <svg
        ref={d3Ref}
        width={dimensions.width} height={dimensions.height}
      >
      </svg>
    </div>
    </Container>
  );
}
