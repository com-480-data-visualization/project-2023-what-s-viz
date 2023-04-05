import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Weather from './pages/Weather';
import Home from './pages/Home';
import About from './pages/About';
import './custom.scss';

function App() {
  return (
    <div className='App'>
      <Navigation />
      <Routes>                
          <Route path='/weather' element={<Weather />}/>
          <Route path='/about' element={<About />}/>
          <Route path='/' element={<Home />}/>
      </Routes>
    </div>
  );
}

export default App;
