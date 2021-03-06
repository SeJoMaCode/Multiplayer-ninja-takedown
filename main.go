package main

import (
	"fmt"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{}

func main() {
	port := os.Getenv("PORT")
	// port := "8080"

	http.Handle("/", http.FileServer(http.Dir("./site")))

	log.Print("Running on: " + port)

	connections := []*websocket.Conn{}
	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		var conn, _ = upgrader.Upgrade(w, r, nil)
		connections = append(connections, conn)
		defer func() {
			for i, c := range connections {
				if c == conn {
					connections = append(connections[:i], connections[i:]...)
				}
			}
		}()

		for {
			msg := JSON{}
			err := conn.ReadJSON(&msg)

			if err != nil {
				fmt.Println(err)
				return
			}

			// fmt.Println(msg)
			for _, connection := range connections{
				connection.WriteJSON(msg)
			}
			
			// if string(msg) == "loaded" {
			// 	fmt.Println("User Connected")
			// 	conn.WriteJSON(currentBoxes)
			// }
		}
	})

	http.ListenAndServe(":"+port, nil)
}

type JSON struct {
	Game	string
	Name	string
	Message	string
}