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

var messages chan map[string]interface{}

var totalSyncedConversations int

// This function takes a string and a js.Value and console.logs it
func ConsoleLog(s string, v js.Value) {
	js.Global().Get("console").Call("log", s, v)
}

func parseJID(arg string) (types.JID, bool) {
	if arg[0] == '+' {
		arg = arg[1:]
	}
	if !strings.ContainsRune(arg, '@') {
		return types.NewJID(arg, types.DefaultUserServer), true
	} else {
		recipient, err := types.ParseJID(arg)
		if err != nil {
			fmt.Printf("Invalid JID %s: %v", arg, err)
			return recipient, false
		} else if recipient.User == "" {
			fmt.Printf("Invalid JID %s: no server specified", arg)
			return recipient, false
		}
		return recipient, true
	}
}

func doMessage(evt *events.Message) {
	metaParts := []string{fmt.Sprintf("pushname: %s", evt.Info.PushName), fmt.Sprintf("timestamp: %s", evt.Info.Timestamp)}
	if evt.Info.Type != "" {
		metaParts = append(metaParts, fmt.Sprintf("type: %s", evt.Info.Type))
	}
	if evt.Info.Category != "" {
		metaParts = append(metaParts, fmt.Sprintf("category: %s", evt.Info.Category))
	}
	if evt.IsDocumentWithCaption {
		metaParts = append(metaParts, "document with caption")
	}
	if evt.IsEdit {
		metaParts = append(metaParts, "edit")
	}

	// Queue up the message info for the JS side

	// We built the message with:
	// ID as key, timestamp, message, contact by whom sent, chat it was sent in
	msgMap := make(map[string]interface{})
	msgMap["id"] = evt.Info.ID
	msgMap["timestamp"] = evt.Info.Timestamp.String()
	msgMap["chat"] = evt.Info.MessageSource.Chat.User
	msgMap["sent-by"] = evt.Info.MessageSource.Sender.User

	if msg := evt.Message.GetConversation(); len(msg) > 0 {
		msgMap["message"] = msg
		messages <- msgMap
	} else if evt.Message != nil {
		if msg2 := evt.Message.ExtendedTextMessage; msg2 != nil && len(msg2.GetText()) > 0 {
			msgMap["message"] = msg2.GetText()
			messages <- msgMap
		}
	} else {
		fmt.Printf("Unknow type of converstaion: %+v", evt)
	}
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
		fmt.Printf("Receipt at %v for %v", evt.Timestamp, evt.MessageIDs)
		fmt.Println()

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
		store.DeviceProps.RequireFullSync = proto.Bool(false)
		// For info about these check: https://github.com/mautrix/whatsapp/blob/6df2ff725999ff82d0f3b171b44d748533bf34ee/example-config.yaml#L141
		days_of_history := uint32(365 * 15)
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
		// run all of the code that needs that stream to JS
		go StartMeow(clientChannel)

		// Print that we received the object
		fmt.Println("Loading SQL & setting up DB")

		// We don't return anything
		return nil
	})
}

// Streaming is possible: https://withblue.ink/2020/10/03/go-webassembly-http-requests-and-promises.html
func handNewMsgsFunc() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		// Get the setData function from the JS side
		// this function must take a new message as update
		handNewData := args[0]

		go func() {
			fmt.Println("Started data handling for messages")
			// Aggregate messages into single list for JS
			for {
				aggregate := make(map[string]interface{})
			innerFor:
				for {
					select {
					case msg := <-messages:
						// Aggregate messages and send them
						aggregate[msg["id"].(string)] = msg
					case <-time.After(10 * time.Millisecond):
						// After doing a few messages we go on
						break innerFor
					}
				}
				if len(aggregate) > 0 {
					fmt.Printf("Got %d messages through channel\n", len(aggregate))
					// And send them
					handNewData.Invoke(aggregate)
				}

				// Lets send at least every second data to the JS side
				time.Sleep(1000 * time.Millisecond)
			}
		}()

		return nil
	})
}

func handNewContactsFunc() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		//cli.GetUserInfo(jids)
		//pic, err := cli.GetProfilePictureInfo(jid, &whatsmeow.GetProfilePictureParams{
		return nil
	})
}

func handNewChatsFunc() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		//groups, err := cli.GetJoinedGroups()
		//resp, err := cli.GetGroupInfo(group)
		return nil
	})
}

func main() {
	ch := make(chan struct{})
	// Use bool lock to make sure the client is only loaded once & only used when loaded
	clientLoaded = &atomic.Bool{}
	clientLoaded.Store(false)

	// prepare the streaming of messages
	messages = make(chan map[string]interface{}, 250)

	// For the handover
	clientChannel := make(chan *whatsmeow.Client)
	js.Global().Set("loadSQL", LoadSQL(clientChannel))
	js.Global().Set("loginUser", LoginUser())
	js.Global().Set("logoutUser", LogoutUser())
	js.Global().Set("handNewMsgs", handNewMsgsFunc())
	js.Global().Set("handNewContacts", handNewContactsFunc())
	js.Global().Set("handNewChats", handNewChatsFunc())

	// Trick to keep the program running
	<-ch
}
