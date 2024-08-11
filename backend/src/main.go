package main

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	socketio "github.com/googollee/go-socket.io"
)

var app *firebase.App
var client *auth.Client
var err error

func main() {
	conf := &firebase.Config{
		DatabaseURL: "https://arc-by-insight-default-rtdb.firebaseio.com/",
	}
	app, err = firebase.NewApp(context.Background(), conf)
	if err != nil {
		log.Fatalf("Firebase failed to initalize.")
	}
	client, err = app.Auth(context.Background())
	if err != nil {
		log.Fatalf("Firebase Authentication failed to initalize.")
	}

	server := socketio.NewServer(nil)
	server.OnConnect("/", func(s socketio.Conn) error {
		s.SetContext("")
		fmt.Println("New device connected to server, waiting for requests...")
		return nil
	})

}

func getUIDfromToken(t string) string {
	token, err := client.VerifyIDToken(context.Background(), t)
	if err == nil {
		fmt.Println("Token retrieval failed.")
		return "403"
	}
	return token.UID
}
