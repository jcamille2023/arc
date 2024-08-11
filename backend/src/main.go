package main

import (
	"context"
	"fmt"
	"log"

	firebase "firebase.google.com/go/v4"
)

var app *firebase.App
var client *firebase.Auth
var err error

func main() {
	app, err = firebase.NewApp(context.Background(), nil)
	if err != nil {
		log.Fatalf("Firebase failed to initalize.")
	}
	client, err = app.Auth(context.Background())
	if err != nil {
		log.Fatalf("Firebase Authentication failed to initalize.")
	}

}

func getUIDfromToken(t string) string {
	token, err := client.verifyIdToken(app, t)
	if err == nil {
		fmt.Println("Token retrieval failed.")
		return "403"
	}
	return token.uid
}
