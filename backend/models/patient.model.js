import mongoose from "mongoose";

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
    match: [
      /^[6-9]\d{9}$/,
      "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits long.",
    ],
  },
  relation: {
    type: String,
    required: true,
    trim: true,
  },
});

const patientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female", "others"],
      required: true,
    },
    phone: {
      type: String,
      required: true,
      match: [
        /^[6-9]\d{9}$/,
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits long.",
      ],
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address.",
      ],
    },
    linkedAuthId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    address: {
      type: String,
      required: true,
    },
    emergencyContact: {
      type: emergencyContactSchema,
      required: true,
    },
    medicalHistory: {
      type: [
        {
          documentUrl: { type: String, required: true, trim: true },
          documentType: {
            type: String,
            enum: ["pdf", "image"],
            required: true,
          },
          description: { type: String, trim: true, default: "" },
          uploadedAt: { type: Date, default: Date.now },
        },
      ],
      default: [],
    },
    currentStatus: {
      type: String,
      enum: [
        "registered",
        "admitted",
        "discharged",
        "under observation",
        "critical",
        "awaiting diagnosis",
        "stable",
        "recovering",
      ],
      default: "registered",
    },
    statusHistory: [
      {
        status: {
          type: String,
          enum: [
            "registered",
            "admitted",
            "discharged",
            "awaiting diagnosis",
            "stable",
            "under observation",
            "critical",
            "recovering",
          ],
          required: true,
          default: "registered",
        },
        updatedAt: {
          type: Date,
          default: Date.now,
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Staff",
        },
      },
    ],
    admissionDate: {
      type: Date,
      default: Date.now,
    },
    dischargeDate: {
      type: Date,
    },
    assignedDoctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      index: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      index: true,
    },
  },
  { timestamps: true }
);

patientSchema.virtual("age").get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const m = today.getMonth() - this.dateOfBirth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age--;
  }
  return age;
});

const Patient = mongoose.model("Patient", patientSchema);
export default Patient;
