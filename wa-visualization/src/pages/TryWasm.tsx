import { useState, useEffect } from 'react';
import initSqlJs from '../sql-wasm-debug.js';

function TestSQL(SQL: any) {
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
}

function TryWasm() {
  useEffect(()=>{
    // Test run of https://github.com/sql-js/sql.js
    initSqlJs({
      locateFile: () => 'sql-wasm-debug.wasm'
    }).then((SQL: any) => {
      // Some minor console tests
      TestSQL(SQL)

      // Hand the SQL object over to Go WebAssembly
      window.handSQL(SQL)
    }).catch((err: any) => {
      console.log(err)
    });
  }, []); //only run once

  // Hand the setRes func to go to run the create Data
  const [res, setRes] = useState("not Inited");
  
  useEffect(()=>{
    new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        reject("Didn't hand over in time");
      }, 1000);
  
      console.log("Inited go wasm and gave handle")
      resolve(window.handSetData(setRes))
    }).catch( err => console.log(err) );
  }, []); //only run once
  
  // updated by Go WebAssembly
  console.log("Component updated with new state: " + res)

  return (
    <div className="container fill">
      <p>Trying WASM, response state (changed by Go WebAssembly):</p>
      <p>{res}</p>
    </div>
  );
}

export default TryWasm;