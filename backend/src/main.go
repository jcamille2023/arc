package main

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"firebase.google.com/go/v4/db"
	"firebase.google.com/go/v4/messaging"
	socketio "github.com/googollee/go-socket.io"
)

var app *firebase.App
var client *auth.Client
var err error

type firebaseConfig struct {
	auth     *auth.Client
	database *db.Client
	msg      *messaging.Client
}

func main() {
	// firebase configuration
	conf := &firebase.Config{
		DatabaseURL: "https://arc-by-insight-default-rtdb.firebaseio.com/",
	}
	// app intialization
	app, err = firebase.NewApp(context.Background(), conf)
	if err != nil {
		log.Fatalf("Firebase failed to initalize.")
	}

	//
	client, err = app.Auth(context.Background())
	if err != nil {
		log.Fatalf("Firebase Authentication failed to initalize.")
	}

	db, err := app.Database(context.Background())
	if err != nil {
		log.Fatalf("Firebase Realtime Database failed to initalize")
	}
	msg, err := app.Messaging(context.Background())
	if err != nil {
		log.Fatalf("Firebase Messaging failed to initalize.")
	}

	arcConfig := firebaseConfig{client, db, msg}

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
