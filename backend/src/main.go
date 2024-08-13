package main

import (
	"context"
	"fmt"
	"log"

	"time"

	"strconv"

	"math/rand/v2"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"firebase.google.com/go/v4/db"
	"firebase.google.com/go/v4/messaging"
	socketio "github.com/googollee/go-socket.io"
)

var arcConfig firebaseConfig

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
	id      int
	name    string
	members []PrivateUser
	admin   []PrivateUser
	valid   bool
}
type Arc struct {
	id      int
	name    string
	members [2]PrivateUser
	valid   bool
}

type Message struct {
	id      int
	content string
	author  PrivateUser
	date    time.Time
	arc     bool
}

func main() {
	// firebase configuration
	conf := &firebase.Config{
		DatabaseURL: "https://arc-by-insight-default-rtdb.firebaseio.com/",
	}
	// app intialization
	app, err := firebase.NewApp(context.Background(), conf)
	if err != nil {
		log.Fatalf("Firebase failed to initalize.")
	}

	//
	client, err := app.Auth(context.Background())
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
			cir := &Circle{}
			if err := ref.Get(context.Background(), cir); err != nil {
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
			s.Emit("error", "Token verification failed.")
		}
	})
	server.OnEvent("/", "send_message", func(s socketio.Conn, content string, token string, id int, circle bool) {
		uid := getUIDfromToken(token)
		if uid == "403" {
			s.Emit("Token verification failed")
			return
		}
		if circle {
			c := get_circle(id)
			if c.valid {
				m, err := c.construct_message(uid, content)
				if err != nil {
					s.Emit(err.Error())
					return
				}
				server.BroadcastToRoom("/", strconv.Itoa(id), "new message", m)
				msg_err := post_message(m, c)
				if msg_err != nil {
					s.Emit("error", "posting message")
				}
			}
		} else {
			var arc Arc
			ref := arcConfig.database.NewRef("/messages/arcs/" + strconv.Itoa(id))
			if err := ref.Get(context.Background(), &arc); err != nil {
				s.Emit("error", "This Arc may not exist. Try again later.")
			}

		}

	})

}

// constructors
func (c Circle) construct_message(uid string, content string) (Message, error) {
	if !contains(c.members, uid) {
		return Message{}, fmt.Errorf("This user is not in this Circle.")
	}
	msg_id := int(time.Now().UnixMilli()) + 1000000*(1+rand.IntN(1000000))
	u, err := getUserByUID(uid)
	if err != nil {
		return Message{}, fmt.Errorf("User does not exist.")
	}
	return Message{
		id:      msg_id,
		content: content,
		author:  u.toPrivateUser(),
		date:    time.Now(),
		arc:     false,
	}, nil
}

func (a Arc) construct_message(uid string, content string) (Message, error) {
	if uid != a.members[0].uid && uid != a.members[1].uid {
		return Message{}, fmt.Errorf("This User is not in this Arc.")
	}
	msg_id := int(time.Now().UnixMilli()) + 1000000*(1+rand.IntN(1000000))
	u, err := getUserByUID(uid)
	if err != nil {
		return Message{}, fmt.Errorf("User does not exist.")
	}
	return Message{
		id:      msg_id,
		content: content,
		author:  u.toPrivateUser(),
		date:    time.Now(),
		arc:     true,
	}, nil
}

// getters from db
func get_circle(id int) Circle {
	var c Circle
	ref := arcConfig.database.NewRef("circles/" + strconv.Itoa(id))
	if err := ref.Get(context.Background(), &c); err != nil {
		fmt.Println("Circle ID not valid.")
		return Circle{valid: false}
	}
	return c

}

func get_arc(id int) Arc {
	var a Arc
	ref := arcConfig.database.NewRef("arcs/" + strconv.Itoa(id))
	if err := ref.Get(context.Background(), &a); err != nil {
		fmt.Println("Circle ID not valid.")
		return Arc{valid: false}
	}
	return a
}
func getUserByUID(uid string) (User, error) {
	ref := arcConfig.database.NewRef("/users/" + uid)
	u := User{}
	if err := ref.Get(context.Background(), &u); err != nil {
		return User{}, fmt.Errorf("User may not exist.")
	}
	return u, nil

}
func getUIDfromToken(t string) string {
	token, err := arcConfig.auth.VerifyIDToken(context.Background(), t)
	if err == nil {
		fmt.Println("Token retrieval failed.")
		return "403"
	}
	return token.UID
}

// setters to db

// parameter v MUST be either an Arc or a Circle
func post_message(m Message, v interface{}) error {
	var ref *db.Ref
	switch v := v.(type) {
	case Arc:
		ref = arcConfig.database.NewRef("/messages/arcs/" + strconv.Itoa(v.id) + "/" + strconv.Itoa(m.id))
	case Circle:
		ref = arcConfig.database.NewRef("/messages/circles/" + strconv.Itoa(v.id) + "/" + strconv.Itoa(m.id))
	default:
		return fmt.Errorf("An object that was neither an Arc nor a Circle was provided.")
	}
	if err := ref.Set(context.Background(), m); err != nil {
		return fmt.Errorf("failed to post message: %v", err)
	}
	return nil

}

// misc
// ONLY FOR USE WITH CIRCLES AND CHECKING UIDS.
func contains(slice []PrivateUser, item string) bool {
	for _, s := range slice {
		if s.uid == item {
			return true
		}
	}
	return false
}

// can ONLY check if given type is Arc or Circle.
func check_type(v interface{}) string {
	switch v.(type) {
	case Arc:
		return "Arc"
	case Circle:
		return "Circle"
	default:
		return "Neither Arc nor Circle."
	}
}
