import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { User } from "./models/User.js";
import { MessageModel } from "./models/Message.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import cookieParser from "cookie-parser";
import bcrypt from "bcrypt";
import WebSocket, { WebSocketServer } from "ws";

dotenv.config();

mongoose.connect(process.env.MONGO_URL);

const jwtSecret = process.env.JWT_SECRET;
const bcryptSalt = bcrypt.genSaltSync(8);
const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL, // my frontend URL
    credentials: true, //allow cookies
  })
);

// getting user details through req using cookies
async function getUserDataFromRequest(req) {
  return new Promise((resolve, reject) => {
    const token = req.cookies?.token;
    if (token) {
      jwt.verify(token, jwtSecret, {}, (err, userData) => {
        if (err) throw err;
        resolve(userData);
      });
    } else {
      reject("no token");
    }
  });
}

app.get("/test", (req, res) => {
  res.json("test ok");
});

// handling message acessing requests
app.get("/messages/:userId", async (req, res) => {
  // recipient id
  const { userId } = req.params;
  // our id
  const userData = await getUserDataFromRequest(req);
  const ourUserId = userData.userId;

  // acessing from database
  const messages = await MessageModel.find({
    sender: { $in: [userId, ourUserId] },
    recipient: { $in: [userId, ourUserId] },
  }).sort({ createdAt: 1 });
  res.json(messages);
});

app.get("/profile", (req, res) => {
  const token = req.cookies?.token;

  if (token) {
    jwt.verify(token, jwtSecret, {}, (err, userData) => {
      if (err) throw err;
      res.json(userData);
    });
  } else {
    res.status(401).json("no token");
  }
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const foundUser = await User.findOne({ username });

  if (!foundUser) {
    return res.status(400).json({ error: "User not found" });
  }

  const passOK = bcrypt.compareSync(password, foundUser.password);

  if (passOK) {
    jwt.sign(
      { userId: foundUser._id, username },
      jwtSecret,
      {},
      (err, token) => {
        res.cookie("token", token).json({
          id: foundUser._id,
        });
      }
    );
  }
});

app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    // Create user in DB
    const hashedPassword = bcrypt.hashSync(password, bcryptSalt);
    const createdUser = await User.create({
      username: username,
      password: hashedPassword,
    });

    // Sign JWT token (synchronously)
    const token = jwt.sign({ userId: createdUser._id, username }, jwtSecret);

    // Send token back to client
    res
      .cookie("token", token, { sameSite: "none", secure: true })
      .status(201)
      .json({
        id: createdUser._id,
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
});

const server = app.listen(4000);

const wss = new WebSocketServer({ server });

wss.on("connection", (connection, req) => {
  /*read username and id from the cookie for this coonection*/
  const cookies = req.headers.cookie;
  if (cookies) {
    const tokenCookieString = cookies
      .split(";")
      .find((str) => str.startsWith("token="));
    if (tokenCookieString) {
      const token = tokenCookieString.split("=")[1];

      if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
          if (err) throw err;
          const { userId, username } = userData;
          connection.userId = userId;
          connection.username = username;
        });
      }
    }
  }
  // sending message to appropriate recipient and saving into database
  connection.on("message", async (message) => {
    const messageData = JSON.parse(message.toString());
    const { recipient, text } = messageData;

    if (recipient && text) {
      const messageDoc = await MessageModel.create({
        sender: connection.userId,
        recipient,
        text,
      });

      [...wss.clients]
        .filter((c) => c.userId === recipient)
        .forEach((c) =>
          c.send(
            JSON.stringify({
              text,
              recipient,
              sender: connection.userId,
              _id: messageDoc._id,
            })
          )
        );
    }
  });

  /* Notify everyone about online people when someone connects*/
  [...wss.clients].forEach((client) => {
    client.send(
      JSON.stringify({
        online: [...wss.clients].map((c) => ({
          userId: c.userId,
          username: c.username,
        })),
      })
    );
  });
});

//bZ4DFKr8Pj5A7M9c
