package main

import (
	"context"
	"fmt"
	"log"

	"time"

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

type User struct {
	firstName string
	lastName  string
	email     string
	uid       string
	photoURL  string
	arcs      []string
	circles   []string
}

type PrivateUser struct {
	firstName string
	lastName  string
	uid       string
	photoURL  string
}

func (s User) toPrivateUser() PrivateUser {
	return PrivateUser{
		firstName: s.firstName,
		lastName:  s.lastName,
		uid:       s.uid,
		photoURL:  s.photoURL,
	}
}

type Circle struct {
	id      int32
	name    string
	members []PrivateUser
	admin   []PrivateUser
}
type Arc struct {
	id      int32
	name    string
	members [2]string
}

type Message struct {
	id      int32
	content string
	author  string
	date    time.Time
	arc     bool
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
	server.OnEvent("/", "join", func(s socketio.Conn, id string, token string, circle bool) {
		uid := getUIDfromToken(token)
		if uid != "403" {
			var source string
			if circle {
				source = "circles"
			} else {
				source = "arcs"
			}
			ref := arcConfig.database.NewRef(source + "/" + id)
			var cir Circle
			if err := ref.Get(context.Background(), &cir); err != nil {
				s.Emit("error", "This Arc/Circle may not exist. Try again later.")
			} else {
				for _, user := range cir.members {
					if uid == user.uid {
						s.Join(id)
						s.Emit(cir.name + ": Success")
						break
					}
				}
			}
		} else {
			s.Emit("Token verification failed.")
		}
	})
	server.OnEvent("/", "send_message", func(s socketio.Conn, content string, token string, id string, circle bool) {
		uid := getUIDfromToken(token)
		if uid == "403" {
			s.Emit("Token verification failed")
			return
		}
		if circle {
			var cir Circle
			if err := ref.Get(context.Background(), &cir); err != nil {
				s.Emit("error", "This Circle may not exist. Try again later.")
			}
		} else {
			var arc Arc
			if err := ref.Get(context.Background(), &arc); err != nil {
				s.Emit("error", "This Circle may not exist. Try again later.")
			}
		}

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

func auth_circle(c Circle, token string, admin bool) {
	if admin {
		ref := arcConfig.database.NewRef("circles/" + c.id)
	}
}
