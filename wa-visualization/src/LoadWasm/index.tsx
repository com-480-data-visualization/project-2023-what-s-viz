import './wasm_exec.js';
import './wasmTypes.d.ts';
import './LoadWasm.css';
import initSqlJs from '../sql-wasm-debug.js';
import React, { useEffect } from 'react';

async function loadWasm(): Promise<void> {
  const goWasm = new window.Go();
  const result = await WebAssembly.instantiateStreaming(fetch('main.wasm'), goWasm.importObject);
  goWasm.run(result.instance);
}

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
  console.log(stmt)

  // Bind values to the parameters and fetch the results of the query
  const result = stmt.getAsObject({':aval' : 1, ':bval' : 'world'});
  console.log(result); // Will print {a:1, b:'world'}

  // Bind other values
  stmt.bind([0, 'hello']);
  while (stmt.step()) console.log(stmt.get()); // Will print [0, 'hello']
  // free the memory used by the statement
  console.log("Free ret: " + stmt.free());
}

// We need SQL to be global, otherwise the js.Global() in Go won't find it
declare global {
    interface Window {
        SQL:any;
        circType: any;
    }
}

function circType(value: any) {
  if (typeof value === 'number') {
    return value + 1
  }
  if (typeof value === 'boolean' && value === true) {
    return 1
  } else if (typeof value === 'boolean' && value === false) {
    return -1
  }
}

export const LoadWasm: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const [isLoading, setIsLoading] = React.useState(true);

  useEffect(() => {
    // First load the Go WebAssembly
    loadWasm()
      .then(() => {
        // Test run of https://github.com/sql-js/sql.js
        initSqlJs({
          locateFile: () => 'sql-wasm-debug.wasm'
        }).then((tSQL: any) => {
          // Some minor console tests of sql.js
          //TestSQL(tSQL)

          // Set the gloval SQL value, this way Go can access it
          window.SQL = tSQL
          window.circType = circType

          // Tell go to load the DB
          window.loadSQL()
          
          // We are done loading
          setIsLoading(false);
        }).catch((err: any) => {
          console.log(err)
        });
      });
  }, []); //only run once

  if (isLoading) {
    return (
      <div className='LoadWasm'>
        loading WebAssembly...
      </div>
    );
  } else {
    return <React.Fragment>{props.children}</React.Fragment>;
  }
};
