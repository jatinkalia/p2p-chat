// App.js (Frontend)
import React, { useState, useEffect } from "react";
import axios from "axios";
import io from "socket.io-client";
import {
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Divider,
  Badge,
  Snackbar,
  Alert,
  Grid,
  IconButton,
  Box,
  Drawer,
} from "@mui/material";
import { Send as SendIcon } from "@mui/icons-material";

const socket = io("http://localhost:5000");

function App() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);
  const [users, setUsers] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileOpen, setProfileOpen] = useState(false); // For profile sidebar
  const [selectedUser, setSelectedUser] = useState(null); // Selected user details

  // Fetch registered users from the backend
  useEffect(() => {
    axios
      .get("http://localhost:5000/users")
      .then((response) => {
        setUsers(response.data.users);
      })
      .catch((error) => {
        setError("Failed to fetch users");
      });
  }, []);

  // Sign up user
  const signUp = async () => {
    if (!name || !email || !phone) {
      setError("Name, email, and phone are required");
      return;
    }
    try {
      await axios.post("http://localhost:5000/register", { name, email, phone });
      setSuccess("Sign up successful");
      setLoggedIn(true);
      socket.emit("authenticate", email);
      const response = await axios.get("http://localhost:5000/users");
      setUsers(response.data.users);
    } catch (error) {
      setError(error.response?.data?.error || "Sign up failed");
    }
  };

  // Send message
  const sendMessage = () => {
    if (!recipientEmail || !message) {
      setError("Recipient email and message are required");
      return;
    }
    socket.emit("sendMessage", { recipientEmail, senderEmail: email, message });
    setChat((prevChat) => [
      ...prevChat,
      { senderEmail: email, message, timestamp: new Date() },
    ]);
    setMessage("");
  };

  // Receive messages
  useEffect(() => {
    const handleMessage = (msg) => {
      setChat((prevChat) => [...prevChat, msg]);
    };

    socket.on("message", handleMessage);

    // Cleanup the event listener
    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  // Close snackbar
  const handleClose = () => {
    setError("");
    setSuccess("");
  };

  // Open profile sidebar
  const openProfile = (user) => {
    setSelectedUser(user);
    setProfileOpen(true);
  };

  // Close profile sidebar
  const closeProfile = () => {
    setProfileOpen(false);
  };

  return (
    <Container maxWidth="lg" style={{ height: "100vh", padding: 0, backgroundColor: "#E6E6FA" }}>
      {!loggedIn ? (
        <Paper
          elevation={3}
          style={{
            padding: "20px",
            margin: "20px auto",
            maxWidth: "400px",
            textAlign: "center",
          }}
        >
          {/* Logo and Chat Text */}
          <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
            <img
              src="https://via.placeholder.com/50"
              alt="Logo"
              style={{ width: "50px", height: "50px", marginRight: "10px" }}
            />
            <Typography variant="h4" component="h1">
              Chat
            </Typography>
          </Box>

          {/* Sign Up Form */}
          <Typography variant="h5" gutterBottom>
            Sign Up
          </Typography>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            label="Phone Number"
            fullWidth
            margin="normal"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={signUp}>
            Sign Up
          </Button>
        </Paper>
      ) : (
        <Grid container style={{ height: "100vh" }}>
          {/* Sidebar */}
          <Grid
            item
            xs={4}
            style={{
              borderRight: "1px solid #ddd",
              height: "100%",
              overflowY: "auto",
            }}
          >
            <Typography variant="h6" style={{ padding: "16px" }}>
              Chats
            </Typography>
            <Divider />
            <List>
              {users.map((user, index) => (
                <ListItem
                  button
                  key={index}
                  onClick={() => setRecipientEmail(user.email)}
                >
                  <Avatar style={{ marginRight: "10px" }}>
                    {user.name[0].toUpperCase()}
                  </Avatar>
                  <ListItemText
                    primary={user.name}
                    secondary={
                      <Badge color="primary" variant="dot">
                        Online
                      </Badge>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Grid>

          {/* Chat Window */}
          <Grid item xs={8} style={{ display: "flex", flexDirection: "column" }}>
            {/* Chat Header */}
            <Box
              display="flex"
              alignItems="center"
              style={{ padding: "16px", borderBottom: "1px solid #ddd" }}
            >
              {recipientEmail && (
                <>
                  <Avatar
                    style={{ marginRight: "10px", cursor: "pointer" }}
                    onClick={() =>
                      openProfile(users.find((u) => u.email === recipientEmail))
                    }
                  >
                    {users.find((u) => u.email === recipientEmail)?.name[0].toUpperCase()}
                  </Avatar>
                  <Typography variant="h6">
                    {users.find((u) => u.email === recipientEmail)?.name}
                  </Typography>
                </>
              )}
            </Box>

            {/* Chat Messages */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "16px",
                backgroundColor: "#f5f5f5",
                display: "flex",
                flexDirection: "column",
              }}
            >
              {chat.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    display: "flex",
                    justifyContent:
                      msg.senderEmail === email ? "flex-end" : "flex-start",
                    marginBottom: "8px",
                  }}
                >
                  <Paper
                    elevation={1}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      backgroundColor:
                        msg.senderEmail === email ? "#dcf8c6" : "#fff",
                    }}
                  >
                    <Typography variant="body1">{msg.message}</Typography>
                    <Typography variant="caption" color="textSecondary">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </Typography>
                  </Paper>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div style={{ padding: "16px", borderTop: "1px solid #ddd" }}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Type a message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                InputProps={{
                  endAdornment: (
                    <IconButton color="primary" onClick={sendMessage}>
                      <SendIcon />
                    </IconButton>
                  ),
                }}
              />
            </div>
          </Grid>

          {/* Profile Sidebar */}
          <Drawer anchor="right" open={profileOpen} onClose={closeProfile}>
            <Box style={{ width: "300px", padding: "16px" }}>
              {selectedUser && (
                <>
                  <Box display="flex" justifyContent="center" mb={2}>
                    <Avatar
                      style={{ width: "100px", height: "100px" }}
                      src="https://via.placeholder.com/100"
                    />
                  </Box>
                  <Typography variant="h6" align="center">
                    {selectedUser.name}
                  </Typography>
                  <Typography variant="body2" align="center" color="textSecondary">
                    {selectedUser.email}
                  </Typography>
                  <Typography variant="body2" align="center" color="textSecondary">
                    {selectedUser.phone}
                  </Typography>
                </>
              )}
            </Box>
          </Drawer>
        </Grid>
      )}

      {/* Snackbars for error and success messages */}
      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error">
          {error}
        </Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="success">
          {success}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default App;