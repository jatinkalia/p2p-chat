
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", 
  },
});


const users = {}; 
const messages = {}; 


app.use(express.json());

app.post("/register", (req, res) => {
    const { name, email, phone } = req.body;
    if (!name || !email || !phone) {
      return res.status(400).json({ error: "Name, email, and phone are required" });
    }
    if (users[email]) {
      return res.status(400).json({ error: "User already exists" });
    }
    users[email] = { name, email, phone, socketId: null, online: false };
    res.status(201).json({ message: "User registered successfully" });
  });
  
  app.get("/users", (req, res) => {
    const userList = Object.values(users).map((user) => ({
      name: user.name,
      email: user.email,
    }));
    res.status(200).json({ users: userList });
  });
  

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  
  socket.on("authenticate", (email) => {
    if (users[email]) {
      users[email].socketId = socket.id;
      users[email].online = true;
      socket.emit("authentication", { success: true });

      
      if (messages[email]) {
        messages[email].forEach((msg) => {
          socket.emit("message", msg);
        });
        delete messages[email];
      }
    } else {
      socket.emit("authentication", { success: false });
    }
  });

 
  socket.on("sendMessage", ({ recipientEmail, senderEmail, message }) => {
    const recipient = users[recipientEmail];
    if (recipient && recipient.online) {
      io.to(recipient.socketId).emit("message", { senderEmail, message, timestamp: new Date() });
    } else {
      if (!messages[recipientEmail]) messages[recipientEmail] = [];
      messages[recipientEmail].push({ senderEmail, message, timestamp: new Date() });
    }
  });

  
  socket.on("disconnect", () => {
    const user = Object.keys(users).find((email) => users[email].socketId === socket.id);
    if (user) {
      users[user].online = false;
      users[user].socketId = null;
    }
    console.log("A user disconnected:", socket.id);
  });
});


const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});