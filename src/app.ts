import path from "path";
import adminRouter from "./features/admin/route/admin.route";
import followRouter from "./features/follow/route/follow.route";
import commentRouter from "./features/posts/route/comment.route";
import postRouter from "./features/posts/route/post.route";
import userRouter from "./features/user/route/user.route";
import express, { Application } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import challengeRouter from "./features/challenge/route/challenge.route";

const app: Application = express();
// let corsOptions = {
//   origin: ["http://localhost:5000", "http://localhost:3000"],
//   // which url can access backend
//   // put your frontend domain/url here
// };
let corsOptions = {
  origin: ["http://localhost:3000"],
  credentials: true,
};

// origin: "*", // yo sabai url lai access dinxa
app.use(cors(corsOptions));

app.use("/uploads", express.static(path.join(__dirname, "../uploads"))); // static file serving

// Middleware
app.use(bodyParser.json());

// Admin Routes
app.use("/api/admin", adminRouter);

// User Routes
app.use("/api/user", userRouter);

// Post Routes
app.use("/api/post", postRouter);
app.use("/api/comment", commentRouter);

// Follow Route
app.use("/api/follow", followRouter);

// Challenge Route
app.use("/api/challenge", challengeRouter);

export default app;
