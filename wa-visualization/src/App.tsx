import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import About from './pages/About';
import './custom.scss';
import Testing from './pages/Testing';

function App() {
  return (
    <div className='App'>
      <Navigation />
      <Routes>                
          <Route path='/about' element={<About />}/>
          <Route path='/testing' element={<Testing />}/>
          <Route path='/' element={<Home />}/>
      </Routes>
    </div>
  );
}

export default App;
