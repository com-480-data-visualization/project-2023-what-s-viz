import React, {useLayoutEffect, useRef, useState, useEffect} from 'react';
import BarChart from './BarChart';

function BarComponent({ ogData }) {
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
  
  // Handle data for the chart
  const [data, setData] = useState(ogData);
  
  const handleClick = (d) => {
    console.log("Clicked on ", d);
    //data.pop();
    //setData([...data])
  }

  return (
      <div ref={ref} className="container fill">
        <BarChart data={data} handleClick={handleClick} width={width} height={height} />
      </div>
  );
}

export default BarComponent;