import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import "./scheduler/appointmentReminder.js";
import { registerRoutes } from "./apis/healverse_apis.js";

dotenv.config();
const PORT = process.env.PORT || 5000;

const app = express();
connectDB();

app.use(express.json());
registerRoutes(app);

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
