import React, {useLayoutEffect, useRef, useState, useEffect} from 'react';
import ScatterChart from './ScatterChart';

function ScatterComponent({ ogData }) {
  // Handle resizing of the chart
  const ref = useRef(null);
  const [width, setWidth] = useState(500);
  const [height, setHeight] = useState(500);

  useLayoutEffect(() => {
    setWidth(ref.current.clientWidth);
    setHeight(ref.current.clientHeight);
  }, []);

  useEffect(() => {
    function handleWindowResize() {
      setWidth(ref.current.clientWidth);
      setHeight(ref.current.clientHeight);
    }

    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.removeEventListener('resize', handleWindowResize);
    };
  }, []);
  
  const handleClick = (d) => {
    console.log("Clicked on ", d);
    //data.pop();
    //setData([...data])
  }

  return (
      <div ref={ref}>
        <ScatterChart data={ogData} handleClick={handleClick} width={width} height={height} />
      </div>
  );
}

export default ScatterComponent;