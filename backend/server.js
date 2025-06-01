import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

import authRoute from "./routes/auth.route.js";
import hospitalRoute from "./routes/hospital.route.js";
import staffRoute from "./routes/staff.route.js";
import departmentRoute from "./routes/department.route.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
connectDB();

app.use(express.json());

app.use("/api/", authRoute);
app.use("/api/hospital/", hospitalRoute);
app.use("/api/staff/", staffRoute);
app.use("/api/department/", departmentRoute);

app.listen(PORT, () => {
  console.log(`The app is running at http://localhost:${PORT}`);
});
