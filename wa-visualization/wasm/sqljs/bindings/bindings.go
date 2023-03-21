//go:build js
// +build js

// Package bindings provides minimal GopherJS bindings around the SQL.js (https://github.com/lovasoa/sql.js)
package bindings

import (
	"bytes"
	"errors"
	"fmt"
	"io"

	"syscall/js"
)

type Database struct {
	js.Value
}

type Statement struct {
	js.Value
}

type Transaction struct {
	js.Value
}

// This function takes a string and a js.Value and console.logs it
func ConsoleLog(s string, v js.Value) {
	js.Global().Get("console").Call("log", s, v)
}

// New returns a new database by creating a new one in memory
//
// See http://lovasoa.github.io/sql.js/documentation/class/Database.html#constructor-dynamic
func New() *Database {
	var db js.Value
	// First load the js global sqljs DB and check if it is defined
	db = js.Global().Get("WAdb")
	if db.IsUndefined() {
		// If not, we create it
		SQL := js.Global().Get("SQL")
		db = SQL.Get("Database").New()
		js.Global().Set("WAdb", db)
		ConsoleLog("WA db is: ", db)
	} else {
		db = js.Global().Get("WAdb")
		ConsoleLog("Loaded old WAdb to: ", db)
	}
	return &Database{db}
}

// OpenReader opens an existing database, referenced by the passed io.Reader
//
// See http://lovasoa.github.io/sql.js/documentation/class/Database.html#constructor-dynamic
func OpenReader(r io.Reader) *Database {
	buf := new(bytes.Buffer)
	buf.ReadFrom(r)
	db := js.Global().Get("SQL").Get("Database").New([]uint8(buf.Bytes()))
	return &Database{db}
}

func captureError(fn func()) (e error) {
	defer func() {
		if r := recover(); r != nil {
			switch r.(type) {
			case *js.Error:
				e = r.(*js.Error)
			case error:
				e = r.(error)
			default:
				fmt.Println("Unknown error type: ", r)
			}
		}
	}()
	fn()
	return nil
}

// Run will execute one or more SQL queries (separated by ';'), ignoring the rows it returns
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#run-dynamic
func (d *Database) Run(query string) (e error) {
	fmt.Println("Run: ", query)
	return captureError(func() {
		d.Call("run", query)
	})
}

// RunParams will execute a single SQL query, along with placeholder parameters, ignoring what it returns
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#run-dynamic
func (d *Database) RunParams(query string, params []interface{}) (e error) {
	fmt.Println("Run params: ", query, ", params: ", params)
	return captureError(func() {
		d.Call("run", query, params)
	})
}

// Export the contents of the database to an io.Reader
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#export-dynamic
func (d *Database) Export() io.Reader {
	// new def: func CopyBytesToGo(dst []byte, src Value) int
	array := []byte{}
	js.CopyBytesToGo(array, d.Call("export"))
	return bytes.NewReader(array)
}

// Close the database and all associated prepared statements.
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#close-dynamic
func (d *Database) Close() (e error) {
	fmt.Println("Close")
	return captureError(func() {
		d.Call("close")
	})
}

func (d *Database) prepare(query string, params interface{}) (*Statement, error) {
	var s js.Value
	err := captureError(func() {
		s = d.Call("prepare", query, params)
		fmt.Println("Prepare: ", query, ", params: ", params)
	})
	return &Statement{s}, err
}

// Prepare an SQL statement
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#prepare-dynamic
func (d *Database) Prepare(query string) (s *Statement, e error) {
	return d.prepare(query, nil)
}

// Prepare an SQL statement, with array of parameters
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#prepare-dynamic
func (d *Database) PrepareParams(query string, params []interface{}) (s *Statement, e error) {
	return d.prepare(query, params)
}

// Prepare an SQL statement, with named parameters
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#prepare-dynamic
func (d *Database) PrepareNamedParams(query string, params map[string]interface{}) (s *Statement, e error) {
	return d.prepare(query, params)
}

// GetRowsModified returns the number of rows modified, inserted or deleted by
// the most recently completed INSERT, UPDATE or DELETE statement. Executing
// any other type of SQL statement does not modify the value returned by this
// function.
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#getRowsModified-dynamic
func (d *Database) GetRowsModified() int64 {
	var res js.Value
	err := captureError(func() {
		res = d.Call("getRowsModified")
	})
	if err != nil {
		fmt.Println("Error get rows modified: ", err)
		return -1
	}
	return int64(res.Int())
}

type Result struct {
	Columns []string
	Values  [][]interface{}
}

// Exec will execute an SQL query, and return the result.
//
// This is a wrapper around Database.Prepare(), Statement.Step(),
// Statement.Get(), and Statement.Free().
//
// The result is an array of Result elements. There are as many result elements
// as the number of statements in your sql string (statements are separated by
// a semicolon).
//
// See http://kripken.github.io/sql.js/documentation/class/Database.html#exec-dynamic
func (d *Database) Exec(query string) (r []Result, e error) {
	fmt.Println("Exec: ", query)
	var result js.Value
	e = captureError(func() {
		result = d.Call("exec", query)
	})
	if e != nil {
		fmt.Println("Exec: ", query, ", e: ", e)
		return nil, e
	}
	r = make([]Result, result.Length())
	for i := 0; i < result.Length(); i++ {
		cols := result.Index(i).Get("columns")
		rows := result.Index(i).Get("values")
		r[i].Columns = make([]string, cols.Length())
		for j := 0; j < cols.Length(); j++ {
			r[i].Columns[j] = cols.Index(j).String()
		}
		r[i].Values = make([][]interface{}, rows.Length())
		for j := 0; j < rows.Length(); j++ {
			vals := rows.Index(j)
			r[i].Values[j] = make([]interface{}, vals.Length())
			for k := 0; k < vals.Length(); k++ {
				r[i].Values[j][k] = backConvert(vals.Index(k))
			}
		}
	}
	fmt.Println("Exec: ", query, ", result: ", r)
	return r, nil
}

func (d *Database) Begin() (t *Transaction, e error) {
	// Open a transaction
	//db.exec("BEGIN TRANSACTION;");
	err := captureError(func() {
		res := d.Call("exec", "BEGIN TRANSACTION;")
		ConsoleLog("Begin: ", res)
	})
	return &Transaction{d.Value}, err
}

func (t *Transaction) Commit() (e error) {
	// return unimplemented error
	// Commit
	//db.exec("COMMIT;");
	err := captureError(func() {
		res := t.Call("exec", "COMMIT;")
		ConsoleLog("Commit: ", res)
	})
	return err
}

func (t *Transaction) Rollback() (e error) {
	// return unimplemented error
	// Rollback
	//db.exec("ROLLBACK;");
	err := captureError(func() {
		res := t.Call("exec", "ROLLBACK;")
		ConsoleLog("Rollback: ", res)
	})
	return err
}

// Step executes the statement if necessary, and fetches the next line of the result which
// can be retrieved with Get().
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#step-dynamic
func (s *Statement) Step() (ok bool, e error) {
	ConsoleLog("Step: ", s.Value)
	err := captureError(func() {
		ok = s.Call("step").Bool()
	})
	fmt.Println("Step: ", ok, ", err: ", err)
	return ok, err
}

func convertParamsAny(params interface{}) interface{} {
	switch par := params.(type) {
	case []uint8:
		anyL := make([]any, len(par))
		for i, v := range par {
			// we need this conversion for js.ValueOf to work
			anyL[i] = any(v)
		}
		return anyL
	case []interface{}:
		anyL := make([]any, len(par))
		for i, v := range par {
			anyL[i] = convertParamsAny(v)
		}
		return anyL
	case map[string]interface{}:
		anyM := make(map[string]any)
		for k, v := range params.(map[string]interface{}) {
			anyM[k] = convertParamsAny(v)
		}
		return anyM
	default:
		return params
	}
}

func backConvert(x js.Value) interface{} {
	switch x.Type() {
	case js.TypeString:
		return x.String()
	case js.TypeNull:
		return nil
	case js.TypeBoolean:
		return x.Bool()
	case js.TypeNumber:
		return x.Int()
	case js.TypeObject:
		ConsoleLog("backConvert object: ", x)

		// check if it is a typed array with bytes_per_element and then create it
		if x.Get("BYTES_PER_ELEMENT").Type() == js.TypeNumber {
			// TypedArray
			switch x.Get("BYTES_PER_ELEMENT").Int() {
			case 1:
				// Uint8Array
				// build a []uint8 from the x and return it
				var ret []uint8
				for i := 0; i < x.Length(); i++ {
					ret = append(ret, uint8(x.Index(i).Int()))
				}
				return ret
			case 2:
				// Uint16Array
				var ret []uint16
				for i := 0; i < x.Length(); i++ {
					ret = append(ret, uint16(x.Index(i).Int()))
				}
				return ret
			case 4:
				// Uint32Array
				var ret []uint32
				for i := 0; i < x.Length(); i++ {
					ret = append(ret, uint32(x.Index(i).Int()))
				}
				return ret
			default:
				panic("bad type object typed array: " + x.Type().String() + " not implemented")
			}
		} else {
			// not a typed array
			panic("bad type object: " + x.Type().String() + " not implemented")
		}

	default:
		panic("bad type: " + x.Type().String())
	}
}

func (s *Statement) get(params interface{}) (r []interface{}, e error) {
	params = convertParamsAny(params)
	fmt.Println("Get params: ", params)
	err := captureError(func() {
		results := s.Call("get", params)
		r = make([]interface{}, results.Length())
		for i := 0; i < results.Length(); i++ {
			r[i] = backConvert(results.Index(i))
		}
	})
	fmt.Println("Get r: ", r, ", err: ", err)
	return r, err
}

// Get one row of results of a statement. Step() must have been called first.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#get-dynamic
func (s *Statement) Get() (r []interface{}, e error) {
	return s.get(nil)
}

// GetParams will get one row of results of a statement after binding the parameters and executing the statement.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#get-dynamic
func (s *Statement) GetParams(params []interface{}) (r []interface{}, e error) {
	return s.get(params)
}

// GetNamedParams will get one row of results of a statement after binding the parameters and executing the statement.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#get-dynamic
func (s *Statement) GetNamedParams(params map[string]interface{}) (r []interface{}, e error) {
	return s.get(params)
}

// GetColumnNames list of column names of a row of result of a statement.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#getColumnNames-dynamic
func (s *Statement) GetColumnNames() (c []string, e error) {
	cols := s.Call("getColumnNames")
	ConsoleLog("GetColumnNames: ", cols)
	c = make([]string, cols.Length())
	for i := 0; i < cols.Length(); i++ {
		c[i] = cols.Index(i).String()
	}
	return c, nil
}

func (s *Statement) bind(params interface{}) (e error) {
	var tf bool
	params = convertParamsAny(params)
	fmt.Println("Start bind with: ", params)
	err := captureError(func() {
		tf = s.Call("bind", params).Bool()
	})
	fmt.Println("Bind: ", params, " res: ", tf, ", err: ", err)
	if err != nil {
		return err
	}
	if !tf {
		return errors.New("unknown error binding parameters")
	}
	return nil
}

// Bind values to parameters, after having reset the statement.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#bind-dynamic
func (s *Statement) Bind(params []interface{}) (e error) {
	return s.bind(params)
}

// BindNamed binds values to named parameters, after having reset the statement.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#bind-dynamic
func (s *Statement) BindNamed(params map[string]interface{}) (e error) {
	return s.bind(params)
}

// Reset a statement, so that it's parameters can be bound to new values. It
// also clears all previous bindings, freeing the memory used by bound parameters.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#reset-dynamic
func (s *Statement) Reset() {
	ConsoleLog("Resetting statement: ", s.Value)
	s.Call("reset")
}

// Freemem frees memory allocated during paramater binding.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#freemem-dynamic
func (s *Statement) Freemem() {
	ConsoleLog("Freemem statement: ", s.Value)
	s.Call("freemem")
}

// Free frees any memory used by the statement.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#free-dynamic
func (s *Statement) Free() bool {
	var res js.Value
	err := captureError(func() {
		res = s.Call("free")
	})
	if err != nil {
		fmt.Println("Error free:", err)
		return false
	}
	return res.Bool()
}

func (s *Statement) getAsMap(params interface{}) (m map[string]interface{}, e error) {
	err := captureError(func() {
		o := s.Call("getAsObject", params)
		m = make(map[string]interface{}, o.Length())
		ConsoleLog("getAsMap not implemented; need keys of: ", o)
		panic("getAsMap")
		//for _, key := range js.Keys(o) {
		//	m[key] = o.Get(key)
		//}
	})
	return m, err
}

// GetAsMap will get one row of result as a javascript object, associating
// column names with their value in the current row.
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#getAsObject-dynamic
func (s *Statement) GetAsMap() (m map[string]interface{}, e error) {
	return s.getAsMap(nil)
}

// GetAsMapParams will get one row of result as a javascript object, associating
// column names with their value in the current row, after binding the parameters
// and executing the statement
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#getAsObject-dynamic
func (s *Statement) GetAsMapParams(params []interface{}) (m map[string]interface{}, e error) {
	return s.getAsMap(params)
}

// GetAsMapNamedParams will get one row of result as a javascript object, associating
// column names with their value in the current row, after binding the parameters
// and executing the statement
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#getAsObject-dynamic
func (s *Statement) GetAsMapNamedParams(params map[string]interface{}) (m map[string]interface{}, e error) {
	return s.getAsMap(params)
}

// Testing function to see types
func PrintParams(params []interface{}) {
	for _, ch := range params {
		fmt.Printf("Type %T\n", ch)
		fmt.Printf("Value %v\n", ch)
	}
}

func (s *Statement) run(params interface{}) (e error) {
	params = convertParamsAny(params)
	fmt.Println("Run with params", params)
	ConsoleLog("Run s: ", s.Value)
	return captureError(func() {
		res := s.Call("run", params)
		ConsoleLog("Run result: ", res)
	})
}

// Run is shorthand for Bind() + Step() + Reset(). Bind the values, execute the
// statement, ignoring the rows it returns, and resets it
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#run-dynamic
func (s *Statement) Run() (e error) {
	return s.run(nil)
}

// RunParams is shorthand for Bind() + Step() + Reset(). Bind the values, execute the
// statement, ignoring the rows it returns, and resets it
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#run-dynamic
func (s *Statement) RunParams(params []interface{}) (e error) {
	return s.run(params)
}

// RunNamedParams is shorthand for Bind() + Step() + Reset(). Bind the values, execute the
// statement, ignoring the rows it returns, and resets it
//
// See http://kripken.github.io/sql.js/documentation/class/Statement.html#run-dynamic
func (s *Statement) RunNamedParams(params map[string]interface{}) (e error) {
	return s.run(params)
}
