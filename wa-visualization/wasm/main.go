package main

import (
	"fmt"
	"syscall/js"
	"time"
)

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

		// Send the setData function to the channel
		setDataFun <- setData

		// We don't return anything
		return nil
	})
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

	// Trick to keep the program running
	<-ch
}
