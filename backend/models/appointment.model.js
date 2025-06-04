import mongoose from "mongoose";
const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required:true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required:true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required:true
    },
    date: {
      type: Date,
      required:true
    },
    time: {
      type: String,
      required:true,
      match:[
        /^([01]\d|2[0-3]):([0-5]\d)$/, 
        "Time must be in HH:mm 24-hour format"
      ],
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "cancelled"],
      required: true,
      default:"scheduled"
    },
    reason: {
      type: String,
      trim:true,
      default:""
    },
  },
  { timestamps: true }
);
const Appointment = mongoose.model("Appointment", appointmentSchema);
export default Appointment;
