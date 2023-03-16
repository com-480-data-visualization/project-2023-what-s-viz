import React from 'react';
import { useState } from 'react';
import ScatterComponent from '../components/ScatterComponent';
import { useFetch } from '../hooks/useFetch';

//const weatherUrl = "https://api.weatherbit.io/v2.0/forecast/daily?city=Lausanne&days=7&key=de7baa6dfedd4ee8b140662b5298b160"
//const weatherUrl = "http://localhost:8000/testData.json"

function Home() {
	const [city, setCity] = useState('Lausanne');

	const url = city && `https://api.weatherbit.io/v2.0/forecast/daily?city=${city}&days=7&key=de7baa6dfedd4ee8b140662b5298b160`;

	const { status, data, error } = useFetch(url);

  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]

  const handleSubmit = (e) => {
		e.preventDefault();

		const query = e.target.search.value;
		if (query) {
			setCity(query);
			e.target.search.value = '';
			e.target.search.placeholder = query;
		}
	};

  const weatherbitToTemperatures = (weatherBitData) => {
    // Converts the weatherbit data to the following format
    // array of {'y': temperature, 'x': number_of_day, 'name': day_name}
    if (!weatherBitData || !weatherBitData.data) return []
    var temperatures = []
    for (var i = 0; i < weatherBitData.data.length; i++) {
      var day = weatherBitData.data[i]
      var date = new Date(day.datetime);
      temperatures.push({
        'y': day.high_temp,
        'x': i,
        'name': weekdays[date.getDay()]
      })
    }
    return temperatures
  }

  return (
    <div className="container fill">
      <p>Search for a place and get it's temperature of the last 7 days plotted:</p>
      <form className="Form" onSubmit={handleSubmit}>
				<input
					type="text"
					autoFocus
					autoComplete="off"
					name="search"
					placeholder="Lausanne"
				/>
				<button> Search </button>
			</form>
      <div className="container fill">
        {status === 'idle' && (
					<div> Let's get started by searching for weather from a place! </div>
				)}
				{status === 'error' && <div>{error}</div>}
				{status === 'fetching' && <div className="loading">Loading.</div>}
				{
					<>
            <div styles={status === 'fetched' ? "display:none" : ""}>
              <ScatterComponent data={weatherbitToTemperatures(data)} />
            </div>
					</>
				}
      </div>
    </div>
  );
}

export default Home;