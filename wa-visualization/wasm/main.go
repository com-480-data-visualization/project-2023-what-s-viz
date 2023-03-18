package main

import (
	"database/sql"
	"fmt"
	"syscall/js"
	"time"

	"go.mau.fi/whatsmeow"
	"go.mau.fi/whatsmeow/store/sqlstore"
	waLog "go.mau.fi/whatsmeow/util/log"

	sqljs "wasm/sqljs"
)

func StartMeow(SQLobj <-chan js.Value) {
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	// Make sure you add appropriate DB connector imports, e.g. github.com/mattn/go-sqlite3 for SQLite
	//container, err := sqlstore.New("sqljs", "file:examplestore.db?_foreign_keys=on", dbLog)

	//SQL := <-SQLobj
	// Find way to give this SQL to the sqljs driver

	driver := &sqljs.SQLJSDriver{}
	sql.Register("sqljs-reader", driver)
	sqlDB, err := sql.Open("sqljs-reader", "")

	if err != nil {
		panic(err)
	}
	//sqlDB, err := sql.Open("sqljs", ":memory:")

	container := sqlstore.NewWithDB(sqlDB, "sqlite3", dbLog)

	err = container.Upgrade()
	if err != nil {
		panic(err)
	}

	// If you want multiple sessions, remember their JIDs and use .GetDevice(jid) or .GetAllDevices() instead.
	deviceStore, err := container.GetFirstDevice()
	if err != nil {
		panic(err)
	}
	clientLog := waLog.Stdout("Client", "DEBUG", true)
	client := whatsmeow.NewClient(deviceStore, clientLog)

	// print the client
	fmt.Println(client)
}

func HandSQL() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Get the setData function from the JS side
		// args[0] is a js.Value, so we need to get a string out of it
		SQLobj := args[0]

		// Trying a stream update of top level
		SQLobjChan := make(chan js.Value, 1)

		// run all of the code that needs that stream to JS
		go StartMeow(SQLobjChan)

		// Print that we received the object
		fmt.Println("Received the SQL object")

		// Send the setData function to the channel
		SQLobjChan <- SQLobj

		// We don't return anything
		return nil
	})
}

// Streaming is possible: https://withblue.ink/2020/10/03/go-webassembly-http-requests-and-promises.html

func HandSetData() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Get the setData function from the JS side
		// args[0] is a js.Value, so we need to get a string out of it
		setData := args[0]

		// Trying a stream update of top level
		setDataFun := make(chan js.Value, 1)

		// run all of the code that needs that stream to JS
		go CreateData(setDataFun)
		//go WaitAndTest(setDataFun)

		// Send the setData function to the channel
		setDataFun <- setData

		// We don't return anything
		return nil
	})
}

func WaitAndTest(setDataFun <-chan js.Value) {
	// Get the setData function from the channel
	setData := <-setDataFun

	// Wait a second
	time.Sleep(time.Second)

	setData.Invoke("Starting SQLite3 DB in memroy")
	db, err := sql.Open("sqlite3", ":memory:")

	if err != nil {
		panic(err)
	}

	defer db.Close()

	setData.Invoke("SQLite3 DB in memroy created")
	var version string
	err = db.QueryRow("SELECT SQLITE_VERSION()").Scan(&version)

	setData.Invoke("query done")

	if err != nil {
		panic(err)
	}

	setData.Invoke("Current version: " + version)
}

func CreateData(setDataFun <-chan js.Value) {
	// Get the setData function from the channel
	setData := <-setDataFun

	// Create some string data every second and send it to the JS side
	for {
		// Create the data, the current time as string
		data := js.ValueOf(time.Now().String())

		// Call the setData function
		setData.Invoke(data)

		// Wait a second
		time.Sleep(time.Second)
	}
}

func InitServer() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		name := args[0].String()
		ret := fmt.Sprintf("Server was inited with '%s.'", name)
		return ret
	})
}

func main() {
	ch := make(chan struct{}, 0)
	js.Global().Set("initServer", InitServer())

	js.Global().Set("handSetData", HandSetData())
	js.Global().Set("handSQL", HandSQL())

	// Trick to keep the program running
	<-ch
}
