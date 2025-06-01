import mongoose from "mongoose";
const admissionSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    admitDate: {
      type: Date,
      required: true,
    },
    dischargeDate: {
      type: Date,
    },
    admittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    bedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bed",
      required: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["admitted", "discharged", "transferred"],
      default: "admitted",
    },
    notes: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);
const Admission = mongoose.model("Admission", admissionSchema);
export default Admission;
