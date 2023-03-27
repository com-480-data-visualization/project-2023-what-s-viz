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

	lru "github.com/hraban/lrucache"
	"google.golang.org/protobuf/proto"

	_ "wasm/sqljs"
)

var clientLoaded *atomic.Bool
var client *whatsmeow.Client

var messages chan map[string]interface{}
var contactsJIDs chan types.JID
var groupsJIDs chan types.JID
var seenJIDs *lru.Cache

var totalSyncedConversations int

// This function takes a string and a js.Value and console.logs it
func ConsoleLog(s string, v js.Value) {
	js.Global().Get("console").Call("log", s, v)
}

func convertParamsAny(params interface{}) interface{} {
	switch par := params.(type) {
	case []string:
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

// This function looks what type of JID it is and then
// enques it for processing
func gotJID(jid types.JID) {
	// Check in cache if we already have seen this JID
	// If not, add it to the filter and send it to the JS side
	s := jid.String()
	_, err := seenJIDs.Get(s)
	if err == lru.ErrNotFound {
		if strings.Contains(s, "s.whatsapp.net") {
			contactsJIDs <- jid
		} else if strings.Contains(s, "g.us") || strings.Contains(s, "c.us") {
			groupsJIDs <- jid
		} else {
			fmt.Printf("Unknown JID type: %+v", jid)
			fmt.Println()
		}
		seenJIDs.Set(s, s)
	}
}

func doMessage(evt *events.Message) {
	metaParts := []string{fmt.Sprintf("pushname: %s", evt.Info.PushName), fmt.Sprintf("timestamp: %s", evt.Info.Timestamp)}
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
	gotJID(evt.Info.MessageSource.Chat)
	msgMap["sent-by"] = evt.Info.MessageSource.Sender.User
	gotJID(evt.Info.MessageSource.Sender)

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
			FullSyncSizeMbLimit: proto.Uint32(100),
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
				clientLoaded.Store(false)
				err := client.Logout()
				fmt.Println("Logged out through JS")
				if err != nil {
					reject.Invoke(fmt.Sprintf("Error logging out: %v", err))
					return
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
					totalSyncedConversations += len(aggregate)
					fmt.Printf("Got %d messages through channel (total %d)\n", len(aggregate), totalSyncedConversations)
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

func getAvatar(jid types.JID) string {
	//fmt.Printf("Doing jid picture %v\n", jid)
	pic, err := client.GetProfilePictureInfo(jid, &whatsmeow.GetProfilePictureParams{
		Preview: true,
		//IsCommunity: false,
		//ExistingID: "",
	})
	if err != nil {
		//fmt.Printf("Failed to get avatar: %v", err)
		//fmt.Println()
		return ""
	} else if pic != nil {
		//fmt.Printf("Got avatar ID %s: %s", pic.ID, pic.URL)
		//fmt.Println()
		return pic.URL
	}
	return ""
}

func handNewContactsFunc() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		handNewContacts := args[0]

		go func() {
			for {
				if clientLoaded.Load() && client.Store.Contacts != nil {
					aggregate := make(map[string]interface{})
					jids := make([]types.JID, 0)
				innerFor:
					for {
						select {
						case jid := <-contactsJIDs:
							jids = append(jids, jid)
						case <-time.After(10 * time.Millisecond):
							// After getting a few we go on
							break innerFor
						}
					}

					fmt.Printf("Getting contact info for jids: %v\n", jids)

					// Actually get the user information for the new users
					resp, err := client.GetUserInfo(jids)
					if err != nil {
						fmt.Printf("Failed to get user info: %v\n", err)
						fmt.Println()
					} else {
						for jid, info := range resp {
							// build the aggregate map of the user info
							cur := make(map[string]interface{})
							//cur["id"] = jid.User
							cur["status"] = info.Status
							userInfo, err := client.Store.Contacts.GetContact(jid)
							if err != nil {
								if strings.Contains(err.Error(), "429: rate-overlimit") {
									// We are too fast, lets slow down
									time.Sleep(500 * time.Microsecond)
									// we need to put the JID back into the queue
									contactsJIDs <- jid
								} else {
									fmt.Printf("Failed to get contact info: %v", err)
									fmt.Println()
								}
								continue
							}
							if !userInfo.Found {
								// Not sure what the reason is for not finding someone...
								cur["name"] = jid.User
								// lets retry finding this person
								// for now lets not, might loop infintely
								//contactsJIDs <- jid
							} else {
								if len(userInfo.FullName) > 0 {
									cur["name"] = userInfo.FullName
								} else if len(userInfo.FirstName) > 0 {
									cur["name"] = userInfo.FirstName
								} else {
									cur["name"] = userInfo.PushName
								}
							}
							// Get avatar
							cur["avatar"] = getAvatar(jid)
							// Save the users info for their jid
							aggregate[jid.User] = cur
							time.Sleep(100 * time.Microsecond)
						}
					}

					if len(aggregate) > 0 {
						fmt.Printf("Got %d contacts through channel\n", len(aggregate))
						// And send them
						handNewContacts.Invoke(aggregate)
					}
				}

				// Lets send at least every 5 seconds data to the JS side
				// Getting profile pictures is super slow
				time.Sleep(5000 * time.Millisecond)
			}
		}()
		return nil
	})
}

func handNewGroupsFunc() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		handNewGroups := args[0]

		go func() {
			for {
				if clientLoaded.Load() && client.Store.Contacts != nil {
					//groups, err := cli.GetJoinedGroups()
					aggregate := make(map[string]interface{})
					jids := make([]types.JID, 0)
				innerFor:
					for {
						select {
						case jid := <-groupsJIDs:
							jids = append(jids, jid)
						case <-time.After(10 * time.Millisecond):
							// After getting a few we go on
							break innerFor
						}
					}

					fmt.Printf("Getting group info for jids: %v\n", jids)

					// Actually get the group information for the new users
					for _, jid := range jids {
						info, err := client.GetGroupInfo(jid)
						if err != nil {
							if strings.Contains(err.Error(), "429: rate-overlimit") {
								fmt.Println("Slowing down in groups!")
								// We are too fast, lets slow down
								time.Sleep(2 * time.Second)
								// we need to put the JID back into the queue
								contactsJIDs <- jid
							} else {
								fmt.Printf("Failed to get user info: %v\n", err)
								fmt.Println()
							}
							continue
						} else {
							// build the aggregate map of the group info
							cur := make(map[string]interface{})
							cur["name"] = info.GroupName.Name
							cur["owner_id"] = info.OwnerJID.User
							cur["topic"] = info.GroupTopic.Topic
							// Create participants JID list
							mapped := make([]string, len(info.Participants))
							for i, e := range info.Participants {
								mapped[i] = e.JID.User
							}
							cur["participants"] = convertParamsAny(mapped)

							// Get avatar, does not seem to work for many groups??
							cur["avatar"] = getAvatar(info.JID)

							// Save the users info for their jid
							aggregate[info.JID.User] = cur
						}
						time.Sleep(100 * time.Microsecond)
					}

					if len(aggregate) > 0 {
						fmt.Printf("Got %d groups through channel\n", len(aggregate))
						// And send them
						handNewGroups.Invoke(aggregate)
					}
				}

				// Lets send at least every 5 seconds data to the JS side
				// Getting profile pictures is super slow & rate limiting
				time.Sleep(5000 * time.Millisecond)
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
	seenJIDs = lru.New(500) // Should be enough for chats for most users

	// prepare the streaming of messages
	messages = make(chan map[string]interface{}, 500)
	contactsJIDs = make(chan types.JID, 250)
	groupsJIDs = make(chan types.JID, 250)

	// For the handover
	clientChannel := make(chan *whatsmeow.Client)
	js.Global().Set("loadSQL", LoadSQL(clientChannel))
	js.Global().Set("loginUser", LoginUser())
	js.Global().Set("logoutUser", LogoutUser())
	js.Global().Set("handNewMsgs", handNewMsgsFunc())
	js.Global().Set("handNewContacts", handNewContactsFunc())
	js.Global().Set("handNewGroups", handNewGroupsFunc())

	// Trick to keep the program running
	<-ch
}
