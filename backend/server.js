import express from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import "./scheduler/appointmentReminder.js";

import authRoute from "./routes/auth.route.js";
import hospitalRoute from "./routes/hospital.route.js";
import staffRoute from "./routes/staff.route.js";
import departmentRoute from "./routes/department.route.js";
import doctorRoute from "./routes/doctor.route.js";
import patientRoute from "./routes/patient.route.js";
import appointmentRoute from "./routes/appointment.route.js";
import medicalRecordRoute from "./routes/medicalRecord.route.js";
import reportRoute from "./routes/report.route.js";
import prescriptionRoute from "./routes/prescription.route.js";
import emergencyPatientRoute from "./routes/emergencyPatient.route.js";
import roomRoute from "./routes/room.route.js";
import bedRoute from "./routes/bed.route.js";

dotenv.config();

const PORT = process.env.PORT || 5000;
const app = express();
connectDB();

app.use(express.json());

app.use("/api/", authRoute);
app.use("/api/hospital/", hospitalRoute);
app.use("/api/staff/", staffRoute);
app.use("/api/department/", departmentRoute);
app.use("/api/doctor/", doctorRoute);
app.use("/api/patient/", patientRoute);
app.use("/api/appointment/", appointmentRoute);
app.use("/api/medical-records/", medicalRecordRoute);
app.use("/api/reports/", reportRoute);
app.use("/api/prescriptions/", prescriptionRoute);
app.use("/api/emergency-patients/", emergencyPatientRoute);
app.use("/api/rooms/", roomRoute);
app.use("/api/beds/", bedRoute);

app.listen(PORT, () => {
  console.log(`The app is running at http://localhost:${PORT}`);
});
