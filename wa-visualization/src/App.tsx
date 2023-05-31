import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import About from './pages/About';
import './custom.scss';

function App() {
  return (
    <div className='App'>
      <Navigation />
      <Routes>                
          <Route path={process.env.PUBLIC_URL + '/'} element={<Home />}/>
          <Route path={process.env.PUBLIC_URL + '/about'} element={<About />}/>
      </Routes>
    </div>
  );
}

export default App;
