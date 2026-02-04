import dotenv from "dotenv";
import connectDB from "./database/db";
import app from "./app";
dotenv.config();

// const app: Application = express();
const PORT = process.env.PORT;

//database connection
connectDB();

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at: http://localhost:${PORT}`);
});
