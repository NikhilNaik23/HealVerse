import mongoose from "mongoose";
const emergencyPatientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "Unknown",
    },
    age: {
      type: Number,
      min: 0,
      required: false,
    },
    gender: {
      type: String,
      enum: ["male", "female", "others", "unknown"],
      default: "unknown",
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits long.",
      ],
      required: false,
    },
    emergencyContact: {
      name: { type: String, required: false },
      phone: {
        type: String,
        required: false,
        trim: true,
        match: [
          /^[6-9]\d{9}$/,
          "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits long.",
        ],
      },
      relation: { type: String, required: false },
    },
    arrivalTime: { type: Date, required: true, default: Date.now },
    triageLevel: {
      type: String,
      enum: ["critical", "urgent", "non-urgent"],
      required: true,
    },
    initialDiagnosis: { type: String, default: "" },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: false,
      default: null,
    },
    status: {
      type: String,
      enum: ["waiting", "in-treatment", "discharged", "transferred"],
      default: "waiting",
    },
    notes: { type: String, default: "" },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    isEscalated: {
      type: Boolean,
      default: false,
    },
    linkedPatientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);
const EmergencyPatient = mongoose.model(
  "EmergencyPatient",
  emergencyPatientSchema
);
export default EmergencyPatient;
