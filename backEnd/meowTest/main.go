package main

import (
	"context"
	"database/sql"
	"fmt"
	"os"
	"os/signal"
	"syscall"

	"meowTest/whatsmeow"
	"meowTest/whatsmeow/store/sqlstore"
	"meowTest/whatsmeow/types/events"
	waLog "meowTest/whatsmeow/util/log"

	_ "github.com/mattn/go-sqlite3"

	sqldblogger "github.com/simukti/sqldb-logger"
	logrusadapter "github.com/simukti/sqldb-logger/logadapter/logrusadapter"
	logrus "github.com/sirupsen/logrus"
	"github.com/snowzach/rotatefilehook"
)

func eventHandler(evt interface{}) {
	switch v := evt.(type) {
	case *events.Message:
		fmt.Println("Received a message!", v.Message.GetConversation())
	}
}

func main() {
	// Set the log level for sql to "DEBUG" to see the SQL queries
	logger := logrus.New()
	logger.Level = logrus.DebugLevel           // miminum level
	logger.Formatter = &logrus.TextFormatter{} // logrus automatically add time field
	rotateFileHook, err := rotatefilehook.NewRotateFileHook(rotatefilehook.RotateFileConfig{
		Filename:   "console.log",
		MaxSize:    50, // megabytes
		MaxBackups: 3,  // amouts
		MaxAge:     28, //days
		Level:      logrus.DebugLevel,
		Formatter:  &logrus.JSONFormatter{},
	})
	if err != nil {
		logrus.Fatalf("Failed to initialize file rotate hook: %v", err)
	}
	logger.AddHook(rotateFileHook)

	dsn := ":memory:?_foreign_keys=on"
	sqlDB, err := sql.Open("sqlite3", dsn)
	if err != nil {
		panic(err)
	}

	sqlDB = sqldblogger.OpenDriver(dsn, sqlDB.Driver(), logrusadapter.New(logger) /*, using_default_options*/) // db is STILL *sql.DB

	dbLog := waLog.Stdout("Database", "DEBUG", true)
	// Make sure you add appropriate DB connector imports, e.g. github.com/mattn/go-sqlite3 for SQLite
	//	container, err := sqlstore.New("sqlite3", dsn, dbLog)

	container := sqlstore.NewWithDB(sqlDB, "sqlite3", dbLog)
	err = container.Upgrade()
	if err != nil {
		panic(err)
	}

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

	if client.Store.ID == nil {
		// No ID stored, new login
		qrChan, _ := client.GetQRChannel(context.Background())
		err = client.Connect()
		if err != nil {
			panic(err)
		}
		for evt := range qrChan {
			if evt.Event == "code" {
				// Render the QR code here
				// e.g. qrterminal.GenerateHalfBlock(evt.Code, qrterminal.L, os.Stdout)
				// or just manually `echo 2@... | qrencode -t ansiutf8` in a terminal
				fmt.Println("echo", evt.Code, "| qrencode -t ansiutf8")
			} else {
				fmt.Println("Login event:", evt.Event)
			}
		}
	} else {
		// Already logged in, just connect
		err = client.Connect()
		if err != nil {
			panic(err)
		}
	}

	// Listen to Ctrl+C (you can also do something else that prevents the program from exiting)
	c := make(chan os.Signal)
	signal.Notify(c, os.Interrupt, syscall.SIGTERM)
	<-c
	client.Logout()
	client.Disconnect()
}
