import { Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import TryWasm from './pages/TryWasm';
import About from './pages/About';
import 'bootstrap/dist/css/bootstrap.min.css';
import initSqlJs from './sql-wasm-debug.js';

function App() {
  // Test run of https://github.com/sql-js/sql.js
  initSqlJs({
    locateFile: () => 'sql-wasm-debug.wasm'
  }).then((SQL: any) => {
    const db = new SQL.Database();
    console.log("SQL loaded")
    console.log(db)

    // Execute a single SQL string that contains multiple statements
    let sqlstr = "CREATE TABLE hello (a int, b char); \
    INSERT INTO hello VALUES (0, 'hello'); \
    INSERT INTO hello VALUES (1, 'world');";
    db.run(sqlstr); // Run the query without returning anything

    // Prepare an sql statement
    const stmt = db.prepare("SELECT * FROM hello WHERE a=:aval AND b=:bval");

    // Bind values to the parameters and fetch the results of the query
    const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});
    console.log(result); // Will print {a:1, b:'world'}

    // Bind other values
    stmt.bind([0, 'hello']);
    while (stmt.step()) console.log(stmt.get()); // Will print [0, 'hello']
    // free the memory used by the statement
    stmt.free();
  })

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
