package main

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"sync/atomic"
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

var clientLoaded *atomic.Bool
var client *whatsmeow.Client

var messages chan string

var totalSyncedConversations int

// This function takes a string and a js.Value and console.logs it
func ConsoleLog(s string, v js.Value) {
	js.Global().Get("console").Call("log", s, v)
}

func doMessage(evt *events.Message) {
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

	// For now still print all messages as well
	fmt.Printf("Received message %s from %s (%s): %+v metaParameters: \n", evt.Info.ID, evt.Info.SourceString(), strings.Join(metaParts, ", "), evt.Message)

	// But also hand it to JS
	//msg := fmt.Sprintf("Received message %s from %s (%s): %+v metaParameters: \n", evt.Info.ID, evt.Info.SourceString(), strings.Join(metaParts, ", "), evt.Message)
	msg := evt.Message.GetConversation()
	if len(msg) > 0 {
		fmt.Println("Sending to JS:", msg)
		messages <- msg
	} else {
		fmt.Println("Empty msg")
	}

	fmt.Println()
}

func eventHandler(rawEvt interface{}) {
	switch evt := rawEvt.(type) {
	case *events.Message:
		doMessage(evt)

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
	//case *events.QR:
	// print the QR code every 30 seconds
	//fmt.Println("QR code:", evt.Codes)
	case *events.PairSuccess:
		// print the pairing information
		fmt.Println("Pairing successful")
	case *events.PairError:
		// print the pairing error
		fmt.Println("Pairing error")
	}
}

func StartMeow(doneClient chan *whatsmeow.Client) {
	if !clientLoaded.Load() {
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
		days_of_history := uint32(365 * 15)
		days_of_history = uint32(5)
		config := &waproto.DeviceProps_HistorySyncConfig{
			FullSyncDaysLimit:   proto.Uint32(days_of_history), // supposedly only really 3 years worth of data can be gotten
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
		//fmt.Println("GetFullSyncDaysLimit: ", store.DeviceProps.HistorySyncConfig.GetFullSyncDaysLimit())
		//fmt.Println("GetFullSyncSizeMbLimit: ", store.DeviceProps.HistorySyncConfig.GetFullSyncSizeMbLimit())
		//fmt.Println("GetStorageQuotaMb: ", store.DeviceProps.HistorySyncConfig.GetStorageQuotaMb())

		// If you want multiple sessions, remember their JIDs and use .GetDevice(jid) or .GetAllDevices() instead.
		deviceStore, err := container.GetFirstDevice()

		if err != nil {
			panic(err)
		}
		clientLog := waLog.Stdout("Client", "INFO", true)
		client = whatsmeow.NewClient(deviceStore, clientLog)
		client.AddEventHandler(eventHandler)

		clientLoaded.CompareAndSwap(false, true)
	}
}

func LoginUser() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		if clientLoaded.Load() {
			// get the setter function from javascript for the QR-code
			setQRCode := args[0]

			go func() {
				// Wait for the client & DB to be ready
				if client.Store.ID == nil {
					// No ID stored, new login
					qrChan, _ := client.GetQRChannel(context.Background())
					err := client.Connect()
					if err != nil {
						panic(err)
					}
					for evt := range qrChan {
						if evt.Event == "code" {
							// Render the QR code in react
							// or just manually `echo 2@... | qrencode -t ansiutf8` in a terminal
							//fmt.Println("echo ", evt.Code, " | qrencode -t ansiutf8")
							setQRCode.Invoke(evt.Code)
						} else {
							//fmt.Println("Login event:", evt.Event)
							setQRCode.Invoke(evt.Event)
						}
					}
				} else {
					// Already logged in, so when reloaded, but the DB still there
					err := client.Connect()
					if err != nil {
						panic(err)
					}
				}
			}()
		}
		return nil
	})
}

func LogoutUser() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Handler for the Promise: this is a JS function
		// It receives two arguments, which are JS functions themselves: resolve and reject
		handler := js.FuncOf(func(this js.Value, args []js.Value) interface{} {
			resolve := args[0]
			// Commented out because this Promise never fails
			reject := args[1]
			if !clientLoaded.Load() {
				reject.Invoke("Client not loaded")
				return nil
			}
			// Now that we have a way to return the response to JS, spawn a goroutine
			// This way, we don't block the event loop and avoid a deadlock
			go func() {
				// logout the user
				err := client.Logout()
				fmt.Println("Logged out through JS")
				if err != nil {
					reject.Invoke(err)
				}
				totalSyncedConversations = 0
				// Resolve the Promise, passing anything back to JavaScript
				// This is done by invoking the "resolve" function passed to the handler
				resolve.Invoke("Logged out")
			}()

			// The handler of a Promise doesn't return any value
			return nil
		})

		// Create and return the Promise object
		promiseConstructor := js.Global().Get("Promise")
		return promiseConstructor.New(handler)
	})
}

func LoadSQL(clientChannel chan *whatsmeow.Client) js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// args[0] is a js.Value, so we need to get a string out of it

		// run all of the code that needs that stream to JS
		go StartMeow(clientChannel)

		// Print that we received the object
		fmt.Println("Loading SQL & setting up DB")

		// We don't return anything
		return nil
	})
}

// Streaming is possible: https://withblue.ink/2020/10/03/go-webassembly-http-requests-and-promises.html
func handNewDataFunc() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Get the setData function from the JS side
		// this function must take a new message as update
		handNewData := args[0]

		go func() {
			fmt.Println("Started data handling")
			// First aggregate messages then set them once
			for {
				// Lets send every second data to the JS side
				time.Sleep(time.Second)
				fmt.Println("Aggregating data for JS")

				// Aggregate messages and send them
				var aggregate string
				for i := 0; i < 500; i++ {
					aggregate += <-messages + "\n"
				}

				// And send them
				fmt.Println("Sending data to JS")
				handNewData.Invoke(aggregate)
			}
		}()

		return nil
	})
}

func main() {
	ch := make(chan struct{})
	// Use bool lock to make sure the client is only loaded once & only used when loaded
	clientLoaded = &atomic.Bool{}
	clientLoaded.Store(false)

	// prepare the streaming of messages
	messages = make(chan string)

	// For the handover
	clientChannel := make(chan *whatsmeow.Client)
	js.Global().Set("loadSQL", LoadSQL(clientChannel))
	js.Global().Set("loginUser", LoginUser())
	js.Global().Set("logoutUser", LogoutUser())
	js.Global().Set("handNewData", handNewDataFunc())

	// Trick to keep the program running
	<-ch
}
