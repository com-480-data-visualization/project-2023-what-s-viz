package main

import (
	"context"
	"database/sql"
	"fmt"
	"syscall/js"
	"time"

	"wasm/whatsmeow"
	"wasm/whatsmeow/store/sqlstore"
	"wasm/whatsmeow/types/events"
	waLog "wasm/whatsmeow/util/log"

	_ "wasm/sqljs"
)

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		fmt.Println("Received a message!", v.Message.GetConversation())
	}
}

func StartMeow(clientChannel chan *whatsmeow.Client) {
	dbLog := waLog.Stdout("Database", "DEBUG", true)
	// Make sure you add appropriate DB connector imports, e.g. github.com/mattn/go-sqlite3 for SQLite
	//container, err := sqlstore.New("sqljs", "file:examplestore.db?_foreign_keys=on", dbLog)

	sqlDB, err := sql.Open("sqljs", "")
	if err != nil {
		panic(err)
	}

	// Try to make whatsmewo work with the sqljs driver
	container := sqlstore.NewWithDB(sqlDB, "sqlite", dbLog)
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
	client.AddEventHandler(eventHandler)

	clientChannel <- client
}

func LoginUser(clientChannel <-chan *whatsmeow.Client) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		go func() {
			client := <-clientChannel
			if client.Store.ID == nil {
				// No ID stored, new login
				qrChan, _ := client.GetQRChannel(context.Background())
				err := client.Connect()
				if err != nil {
					panic(err)
				}
				for evt := range qrChan {
					if evt.Event == "code" {
						// Render the QR code here
						// e.g. qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
						// or just manually `echo 2@... | qrencode -t ansiutf8` in a terminal
						fmt.Println("echo ", evt.Code, " | qrencode -t ansiutf8")
					} else {
						fmt.Println("Login event:", evt.Event)
					}
				}
			} else {
				// Already logged in, just connect
				// should never happen
				panic("Called login with already logged in client")
				err := client.Connect()
				if err != nil {
					panic(err)
				}
			}
		}()
		return nil
	})
}

func LoadSQL(clientChannel chan *whatsmeow.Client) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Get the setData function from the JS side
		// args[0] is a js.Value, so we need to get a string out of it

		// run all of the code that needs that stream to JS
		go StartMeow(clientChannel)

		// Print that we received the object
		fmt.Println("Received the start signal")

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
		//go CreateData(setDataFun)
		go WaitAndTest(setDataFun)

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

	clientChannel := make(chan *whatsmeow.Client)

	// For the handover
	js.Global().Set("loadSQL", LoadSQL(clientChannel))
	js.Global().Set("loginUser", LoginUser(clientChannel))

	// Trick to keep the program running
	<-ch
}
