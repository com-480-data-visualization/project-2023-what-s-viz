package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"syscall/js"
	"time"

	"wasm/whatsmeow"
	"wasm/whatsmeow/store"
	"wasm/whatsmeow/store/sqlstore"
	"wasm/whatsmeow/types"
	"wasm/whatsmeow/types/events"
	waLog "wasm/whatsmeow/util/log"

	waproto "wasm/whatsmeow/binary/proto"

	"google.golang.org/protobuf/proto"

	_ "wasm/sqljs"
)

var client *whatsmeow.Client
var totalSyncedConversations int

func printMessage(evt *events.Message) {
	metaParts := []string{fmt.Sprintf("pushname: %s", evt.Info.PushName), fmt.Sprintf("timestamp: %s", evt.Info.Timestamp)}
	if evt.Info.Type != "" {
		metaParts = append(metaParts, fmt.Sprintf("type: %s", evt.Info.Type))
	}
	if evt.Info.Category != "" {
		metaParts = append(metaParts, fmt.Sprintf("category: %s", evt.Info.Category))
	}
	if evt.IsViewOnce {
		metaParts = append(metaParts, "viewonce")
	}
	if evt.IsViewOnce {
		metaParts = append(metaParts, "ephemeral")
	}
	if evt.IsViewOnceV2 {
		metaParts = append(metaParts, "ephemeral (v2)")
	}
	if evt.IsDocumentWithCaption {
		metaParts = append(metaParts, "document with caption")
	}
	if evt.IsEdit {
		metaParts = append(metaParts, "edit")
	}

	fmt.Printf("Received message %s from %s (%s): %+v metaParameters: \n", evt.Info.ID, evt.Info.SourceString(), strings.Join(metaParts, ", "), evt.Message)
	fmt.Println()
}

func eventHandler(rawEvt interface{}) {
	switch evt := rawEvt.(type) {
	case *events.Message:
		printMessage(evt)

		// TODO show user info n stuff
		//userInfo, err := client.GetUserInfo(client.ID)
		//if err != nil {
		//	fmt.Println("Error getting user info:", err)
		//}
		//fmt.Println(userInfo)

	case *events.HistorySync:
		// The chat JID can be found in the Conversation data:
		conversations := evt.Data.GetConversations()
		for _, conv := range conversations {
			chatJID, err := types.ParseJID(conv.GetId())
			if err != nil {
				fmt.Println("Error parsing conversation JID:", err)
			} else {
				for _, historyMsg := range conv.GetMessages() {
					evt, err := client.ParseWebMessage(chatJID, historyMsg.GetMessage())
					if err != nil {
						fmt.Println("Error parsing message:", err)
						continue
					}
					eventHandler(evt)
				}
			}
		}
		totalSyncedConversations += len(conversations)
		fmt.Println("Synced total", totalSyncedConversations, "conversations")

	case *events.Receipt:
		// print the receipt information
		fmt.Println("Receipt at %v for %v", evt.Timestamp, evt.MessageIDs)

	case *events.Connected:
		// print the connection information
		fmt.Println("Connected to WhatsApp")
	case *events.Disconnected:
		// print the disconnection information
		fmt.Println("Disconnected from WhatsApp")
	case *events.LoggedOut:
		// print the disconnection information
		fmt.Println("Logged out from WhatsApp")
	case *events.QR:
		// print the QR code every 30 seconds
		fmt.Println("QR code:", evt.Codes)
	case *events.PairSuccess:
		// print the pairing information
		fmt.Println("Pairing successful")
	case *events.PairError:
		// print the pairing error
		fmt.Println("Pairing error")
	}
}

func StartMeow(clientChannel chan *whatsmeow.Client) {
	dbLog := waLog.Stdout("Database", "INFO", true)
	// Make sure you add appropriate DB connector imports, e.g. github.com/mattn/go-sqlite3 for SQLite
	//container, err := sqlstore.New("sqljs", "file:examplestore.db?_foreign_keys=on", dbLog)

	sqlDB, err := sql.Open("sqljs", "")
	if err != nil {
		panic(err)
	}

	// Lets modify the protoBuf store properties to get more history
	store.DeviceProps.RequireFullSync = proto.Bool(true)
	// For info about these check: https://github.com/mautrix/whatsapp/blob/6df2ff725999ff82d0f3b171b44d748533bf34ee/example-config.yaml#L141
	config := &waproto.DeviceProps_HistorySyncConfig{
		FullSyncDaysLimit:   proto.Uint32(365 * 15), // supposedly only really 3 years worth of data can be gotten
		FullSyncSizeMbLimit: proto.Uint32(50),
		StorageQuotaMb:      proto.Uint32(5000),
	}
	store.DeviceProps.HistorySyncConfig = config

	// Use the sqljs driver for whatsmeow
	container := sqlstore.NewWithDB(sqlDB, "sqlite", dbLog)
	err = container.Upgrade()
	if err != nil {
		panic(err)
	}

	// Check if the limits are still there
	fmt.Println("GetFullSyncDaysLimit: ", store.DeviceProps.HistorySyncConfig.GetFullSyncDaysLimit())
	fmt.Println("GetFullSyncSizeMbLimit: ", store.DeviceProps.HistorySyncConfig.GetFullSyncSizeMbLimit())
	fmt.Println("GetStorageQuotaMb: ", store.DeviceProps.HistorySyncConfig.GetStorageQuotaMb())

	// If you want multiple sessions, remember their JIDs and use .GetDevice(jid) or .GetAllDevices() instead.
	deviceStore, err := container.GetFirstDevice()

	if err != nil {
		panic(err)
	}
	clientLog := waLog.Stdout("Client", "INFO", true)
	client = whatsmeow.NewClient(deviceStore, clientLog)
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
