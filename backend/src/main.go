package main

import (
	"context"
	"fmt"
	"log"
	"math/rand/v2"
	"strconv"
	"time"

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
	arcs      []int
	circles   []int
	flags     []string
	requests  map[string]PrivateUser
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
		fmt.Println("New device connected to server")
		url := s.URL()
		token := url.Query().Get("token")
		uid := getUIDfromToken(token)
		if uid == "403" {
			s.Emit("error", "Token verification failed")
			s.Close()
			return nil
		}
		u, err := getUserByUID(uid)
		if err != nil {
			token_data, _ := arcConfig.auth.VerifyIDToken(context.Background(), token)
			claims := token_data.Claims
			firstName, _ := claims["firstName"].(string)
			lastName, _ := claims["lastName"].(string)
			email, _ := claims["email"].(string)
			photoURL, _ := claims["photoURL"].(string)
			u, err = create_user(firstName, lastName, email, photoURL, uid)
		}
		s.Emit("user data", u)
		return nil
	})
	server.OnEvent("/", "user data", func(s socketio.Conn, token string) {
		uid := getUIDfromToken(token)
		if uid == "403" {
			s.Emit("error", "Token verification failed")
			return
		}
		u, err := getUserByUID(uid)
		if err != nil {
			s.Emit("error", "User not found")
			return
		}
		s.Emit("user data", u)
	})
	server.OnEvent("/", "join", func(s socketio.Conn, id int, token string, circle bool) {
		uid := getUIDfromToken(token)
		if uid != "403" {
			var source string
			if circle {
				source = "circles"
			} else {
				source = "arcs"
			}
			ref := arcConfig.database.NewRef(source + "/" + strconv.Itoa(id))
			cir := &Circle{}
			if err := ref.Get(context.Background(), cir); err != nil {
				s.Emit("error", "This Arc/Circle may not exist. Try again later.")
			} else {
				var success bool
				for _, user := range cir.members {
					if uid == user.uid {
						s.Join(source + "/" + strconv.Itoa(id))
						s.Emit(cir.name + ": Success")
						success = true
						break
					}
				}
				if !success {
					s.Emit("error", "You do not have permission to join this Arc/Circle. Please try again later.")
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
					s.Emit("error", err.Error())
					return
				}

				msg_err := post_message(m, c)
				if msg_err != nil {
					s.Emit("error", "Message failed to post.")
				}
				server.BroadcastToRoom("/", strconv.Itoa(id), "new message", m)
			}
		} else {
			a := get_arc(id)
			if a.valid {
				m, err := a.construct_message(uid, content)
				if err != nil {
					s.Emit("error", err.Error())
					return
				}
				msg_err := post_message(m, a)
				if msg_err != nil {
					s.Emit("error", "Message failed to post.")
				}

				s.Emit("success!")
				server.BroadcastToRoom("/", strconv.Itoa(id), "new message", m)
			} else {
				s.Emit("error", "This Arc may not exist.")
			}

		}

	})
	server.OnEvent("/", "new circle", func(s socketio.Conn, name string, token string) {
		uid := getUIDfromToken(token)
		if uid == "403" {
			s.Emit("error", "token verification failed")
			return
		}
		c, err := post_new_circle(name, uid)
		if err != nil {
			s.Emit("error", err.Error())
			return
		}
		s.Emit("circle posted", c.id)
	})
	server.OnEvent("/", "add member", func(s socketio.Conn, uid string, id int, token string) {
		uid2 := getUIDfromToken(token)
		if uid2 == "403" {
			s.Emit("error", "Token verification failed")
			return
		}
		c := get_circle(id)
		if !c.valid {
			s.Emit("error", "Circle not valid")
			return
		}
		if err := c.add_member(uid, uid2); err != nil {
			s.Emit("error", err.Error())
			return
		}
		s.Emit("success")

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

	ref := arcConfig.database.NewRef("circles/" + strconv.Itoa(id))
	if err := ref.Set(context.Background(), c); err != nil {
		return Circle{}, fmt.Errorf("posting new Circle failed")
	}
	u.circles = append(u.circles, c.id)
	m := make(map[string]interface{})
	m["circles"] = u.circles

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
		return fmt.Errorf("This action requires administrative privilege.")
	}
	ref := arcConfig.database.NewRef("/circles/" + strconv.Itoa(c.id))
	m := make(map[string]interface{})
	m["name"] = n
	ref.Update(context.Background(), m)
	return nil
}

func create_user(f string, l string, e string, p string, u string) (User, error) {
	t := User{
		firstName: f,
		lastName:  l,
		email:     e,
		photoURL:  p,
		uid:       u,
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
	m2["circles"] = append(u.circles, c.id)
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
