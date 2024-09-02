package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"math/rand/v2"
	"net/http"
	"strconv"
	"time"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/auth"
	"firebase.google.com/go/v4/db"
	"firebase.google.com/go/v4/messaging"

	"github.com/gorilla/websocket"
)

var arcConfig firebaseConfig

type firebaseConfig struct {
	auth     *auth.Client
	database *db.Client
	msg      *messaging.Client
}

type User struct {
	displayName string
	email       string
	uid         string
	photoURL    string
	arcs        []int
	circles     []MiniCircle
	flags       []string
	requests    map[string]PrivateUser
}

type PrivateUser struct {
	displayName string
	uid         string
	photoURL    string
}

func (s User) toPrivateUser() PrivateUser {
	return PrivateUser{
		displayName: s.displayName,
		uid:         s.uid,
		photoURL:    s.photoURL,
	}
}

type Circle struct {
	id      int
	name    string
	members []PrivateUser
	admin   []PrivateUser
	valid   bool
}
type MiniCircle struct {
	name  string
	id    int
	valid bool
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

	arcConfig = firebaseConfig{client, db, msg}
	// Set up CORS
	// ADD A CREATE USER HANDLER.
	http.HandleFunc("/data", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method != http.MethodGet {
			http.Error(w, "Invalid method", http.StatusBadRequest)
			return
		}
		token := r.URL.Query().Get("token")
		if uid := getUIDfromToken(token); uid != "403" {
			u, err := getUserByUID(uid)
			if err != nil {
				http.Error(w, "User has yet to undergo creation process.", http.StatusNotFound)
				t, err2 := arcConfig.auth.GetUser(context.Background(), uid)
				if err2 != nil {
					http.Error(w, "An error occured while retrieving the user object.", http.StatusInternalServerError)
				}
				u, err = create_user(t.DisplayName, t.Email, t.PhotoURL, t.UID)
				if err != nil {
					http.Error(w, "An error occured during user creation.", http.StatusInternalServerError)
					return
				}
			}
			w.Header().Set("Content-Type", "application/json")
			if err := json.NewEncoder(w).Encode(u); err != nil {
				http.Error(w, "Error generating JSON", http.StatusInternalServerError)
			}
		} else {
			http.Error(w, "Token is not valid", http.StatusUnauthorized)
			return
		}

	})
	http.HandleFunc("/new_circle", func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost {
			http.Error(w, "Invalid method", http.StatusBadRequest)
			return
		}
		var requestData struct {
			Token      string `json:"token"`
			CircleName string `json:"circle_name"`
		}
		if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
			http.Error(w, "Invalid request payload", http.StatusBadRequest)
			return
		}
		uid := getUIDfromToken(requestData.Token)
		if uid == "403" {
			http.Error(w, "Token is invalid", http.StatusBadRequest)
			return
		}
		u, err := getUserByUID(uid)
		if err != nil {
			http.Error(w, "User has yet to undergo creation process.", http.StatusBadRequest)
			return
		}

		cir, err2 := post_new_circle(requestData.CircleName, u.uid)
		if err2 != nil {
			http.Error(w, "There was an error creating the server", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		if err3 := json.NewEncoder(w).Encode(cir); err3 != nil {
			http.Error(w, "Error generating JSON", http.StatusInternalServerError)
		}

	})

	var upgrader = websocket.Upgrader{
		ReadBufferSize:  1024,
		WriteBufferSize: 1024,
		CheckOrigin: func(r *http.Request) bool {
			// Allow all connections by default
			return true
		},
	}
	type WSMessage struct {
		Event   string `json:"event"`
		Content string `json:"content"`
		User    string `json:"user"`
	}

	http.HandleFunc("/ws", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Failed to upgrade newest connection to WebSocket")
			return
		}
		defer conn.Close()
		for {
			var msg WSMessage
			err := conn.ReadJSON(&msg)
			if err != nil {
				log.Println("Error reading JSON:", err)
				break
			}
			switch msg.Event {
			case "message":
				// gotta return to this eventually
			}
		}
	})
	// add handlers to handle changes to settings
	s := &http.Server{
		Addr: ":8080",
	}

	if err := s.ListenAndServe(); err != nil {
		fmt.Println("Server failed:", err)
	}

}

// constructors
func (c Circle) construct_message(uid string, content string) (Message, error) {
	if !contains(c.members, uid) {
		return Message{}, fmt.Errorf("This user is not in this Circle.")
	}
	msg_id := int(time.Now().UnixMilli()) + 1000000*(1+rand.IntN(1000000))
	u, err := getUserByUID(uid)
	if err != nil {
		return Message{}, fmt.Errorf("User not found")
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
	msg_id := generate_timestamp_id()
	u, err := getUserByUID(uid)
	if err != nil {
		return Message{}, fmt.Errorf("User not found")
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

func (c Circle) get_mini_circle() MiniCircle {
	return MiniCircle{
		name:  c.name,
		id:    c.id,
		valid: c.valid,
	}
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
func post_new_circle(name string, creator_uid string) (Circle, error) {
	u, err := getUserByUID(creator_uid)
	if err != nil {
		return Circle{}, err
	}
	id := generate_timestamp_id()
	c := Circle{
		id:      id,
		name:    name,
		members: []PrivateUser{},
		admin:   []PrivateUser{u.toPrivateUser()},
	}
	//posts circle
	ref := arcConfig.database.NewRef("circles/" + strconv.Itoa(id))
	if err := ref.Set(context.Background(), c); err != nil {
		return Circle{}, fmt.Errorf("posting new Circle failed")
	}
	// adds circle to user profile
	u.circles = append(u.circles, c.get_mini_circle())
	m := make(map[string]interface{})
	m["circles"] = u.circles
	// posts modified user profile
	ref2 := arcConfig.database.NewRef("users/" + u.uid)
	if err2 := ref2.Update(context.Background(), m); err2 != nil {
		ref.Delete(context.Background())
		return Circle{}, fmt.Errorf("Failed to add user to new Circle, discarding changes")
	}
	return c, nil
}
func post_new_arc_request(uid1 string, uid2 string) error {
	u1, err1 := getUserByUID(uid1)
	if err1 != nil {
		return fmt.Errorf("user who made request not found")
	}
	u2, err2 := getUserByUID(uid2)
	if err2 != nil {
		return err2
	}
	//TODO: Add ability to block users.
	ref := arcConfig.database.NewRef("users/" + u2.uid + "/requests")
	m := make(map[string]interface{})
	m[u1.uid] = u1.toPrivateUser()
	if err := ref.Update(context.Background(), m); err != nil {
		return fmt.Errorf("failed to send request to create Arc")
	}
	return nil
}

// parameter v MUST be either an Arc or a Circle
func post_message(m Message, v interface{}) error {
	var ref *db.Ref
	switch v := v.(type) {
	case Arc:
		ref = arcConfig.database.NewRef("/messages/arcs/" + strconv.Itoa(v.id) + "/" + strconv.Itoa(m.id))
	case Circle:
		ref = arcConfig.database.NewRef("/messages/circles/" + strconv.Itoa(v.id) + "/" + strconv.Itoa(m.id))
	default:
		return fmt.Errorf("an object that was neither an Arc nor a Circle was provided")
	}
	if err := ref.Set(context.Background(), m); err != nil {
		return fmt.Errorf("failed to post message: %v", err)
	}
	return nil

}

func (c Circle) change_name(n string, uid string) error {
	if !contains(c.admin, uid) {
		return fmt.Errorf("action requires administrative privilege")
	}
	ref := arcConfig.database.NewRef("/circles/" + strconv.Itoa(c.id))
	m := make(map[string]interface{})
	m["name"] = n
	ref.Update(context.Background(), m)
	return nil
}

func create_user(d string, e string, p string, u string) (User, error) {
	t := User{
		displayName: d,
		email:       e,
		photoURL:    p,
		uid:         u,
	}
	ref := arcConfig.database.NewRef("/users/" + t.uid)
	if err := ref.Set(context.Background(), t); err != nil {
		return User{}, fmt.Errorf("failed to add user to database")
	}
	return t, nil
}

func (c Circle) add_member(new_uid string, uid string) error {
	if !contains(c.admin, uid) {
		return fmt.Errorf("action requires administrative privilege")
	}
	ref := arcConfig.database.NewRef("/circles/" + strconv.Itoa(c.id))

	u, err1 := getUserByUID(new_uid)
	if err1 != nil {
		return fmt.Errorf("user may not exist")
	}
	for _, s := range c.members {
		if s.uid == new_uid {
			return fmt.Errorf("user already in Circle")
		}
	}
	m := make(map[string]interface{})
	m["members"] = append(c.members, u.toPrivateUser())
	if err := ref.Update(context.Background(), m); err != nil {
		return fmt.Errorf("failed to add new user to Circle")
	}

	m2 := make(map[string]interface{})
	m2["circles"] = append(u.circles, c.get_mini_circle())
	ref2 := arcConfig.database.NewRef("users/" + new_uid)
	if err2 := ref2.Update(context.Background(), m2); err2 != nil {
		// m["members"] = m["members"][:len(m)-1]
		return fmt.Errorf("Failed to add user to Circle")
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

func generate_timestamp_id() int {
	return int(time.Now().UnixMilli()) + 1000000*(1+rand.IntN(1000000))
}
