import express, { Application } from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import connectDB from "./database/db";
import cors from "cors";
import userRouter from "./routes/user/user.route";
import postRouter from "./routes/post/post.route";
import followRouter from "./routes/follow/follow.route";
import path from "path";
import commentRouter from "./routes/post/comment.route";
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;

let corsOptions = {
  origin: ["http://localhost:5000", "http://localhost:3000"],
  // which url can access backend
  // put your frontend domain/url here
};
// origin: "*", // yo sabai url lai access dinxa
app.use(cors(corsOptions));

app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // static file serving

//database connection
connectDB();

// Middleware
app.use(bodyParser.json());

// User Routes
app.use("/api/user", userRouter);

// Post Routes
app.use("/api/post", postRouter);
app.use("/api/comment", commentRouter);

// Follow Route
app.use("/api/follow", followRouter);


// Start Server
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
