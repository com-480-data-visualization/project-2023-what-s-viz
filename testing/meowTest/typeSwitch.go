package main

import (
	"fmt"
)

func goPrint(str any) {
	fmt.Printf("valT: %T\n", str)
	fmt.Printf("valV: %v\n", str)
	//fmt.Println(js.ValueOf(any(str)))
}

func test(in interface{}) {
	// switch on type of a
	switch a := any(in).(type) {
	case string:
		fmt.Println("a is a string:", a)
	case int:
		fmt.Println("a is an int:", a)
	case []any:
		fmt.Println("a is a slice:", a)
		for i, v := range a {
			fmt.Printf("a[%d] with %T is %v\n", i, v, v)
		}
	default:
		fmt.Println("a is another type:", a)
	}
}

func convertByteArrayAny(in []byte) []any {
	// convert the uintL to an []any list and run test
	anyL := make([]any, len(in))
	for i, v := range in {
		anyL[i] = any(v)
	}
	return anyL
}

func main() {
	uintL := []uint8{1, 2, 3}
	test(uintL)
	test("hello")
	test(1)
	// convert the uintL to an []any list and run test
	test(convertByteArrayAny(uintL))
}
