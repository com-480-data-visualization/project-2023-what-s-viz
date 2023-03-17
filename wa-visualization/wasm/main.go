package main

import (
	"fmt"
	"syscall/js"
)

func initServer() js.Func {
	return js.FuncOf(func(this js.Value, args []js.Value) interface{} {
		name := args[0].String()
		ret := fmt.Sprintf("Server was inited with '%s.'", name)
		return ret
		//		return args[0].Int() + args[1].Int()
	})
}

func main() {
	ch := make(chan struct{}, 0)
	js.Global().Set("initServer", initServer())

	// Trick to keep the program running
	<-ch
}
