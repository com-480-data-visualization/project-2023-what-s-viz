import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import TryWasm from './pages/TryWasm';
import About from './pages/About';
import 'bootstrap/dist/css/bootstrap.min.css';
import initSqlJs from './sql-wasm-debug.js';

function App() {
  const SQL = initSqlJs({
    locateFile: new URL('./sql-wasm-debug.wasm', import.meta.url)
  });

  return (
    <div className='App'>
      <Navigation />
      <Routes>                
          <Route path='/about' element={<About />}/>
          <Route path='/wasm' element={<TryWasm />}/>
          <Route path='/' element={<Home />}/>
      </Routes>
    </div>
  );
}

export default App;
