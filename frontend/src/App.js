import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import About from './pages/About';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {

  return (        
    <div className='App'>
      <Navigation />
      <Routes>                
          <Route path='/about' element={<About />}/>
          <Route exact path='/' element={<Home />}/>
      </Routes>
    </div>
  );
}

export default App;