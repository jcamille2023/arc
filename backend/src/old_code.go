c := cors.New(cors.Options{
	AllowedOrigins:   []string{"http://localhost:3001", "https://arc.jcamille.tech"},
	AllowCredentials: true,
	AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
	AllowedHeaders:   []string{"*"},
})
server := socketio.NewServer(&engineio.Options{
	Transports: []transport.Transport{
		&websocket.Transport{
			CheckOrigin: func(r *http.Request) bool {
				return true // Be cautious with this in production
			},
		},
	},
})
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
		s.Emit("error", "token verification failed")
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
// TODO: add a leave room event
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
// TODO: add a arc request event
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
mux := http.NewServeMux()
mux.Handle("/socket.io/", server)
handler := c.Handler(mux)

fmt.Println("Serving at localhost:3000...")
log.Fatal(http.ListenAndServe(":3000", handler))

go func() {
	if err := server.Serve(); err != nil {
		log.Fatalf("Socket.IO server error: %v", err)
	}
}()
defer server.Close()
