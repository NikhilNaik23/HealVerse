import mongoose from "mongoose";
const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    visitDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    visitType: {
      type: String,
      enum: ["outpatient", "inpatient", "emergency", "teleconsultation"],
      required: true,
      default: "outpatient",
    },
    symptoms: {
      type: [String],
      required: true,
    },
    diagnosis: {
      type: String,
      required: true,
    },
    testsOrdered: {
      type: [String],
    },
    treatmentGiven: {
      type: [String],
    },
    notes: {
      type: String,
      required: true,
      trim: true,
    },
    attachments: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Report",
        },
      ],
    },
    followUpDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["open", "closed", "follow-up required"],
      default: "open",
    },
    prescriptions: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Prescription",
        },
      ],
      default: [],
    },
    billingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Billing",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
medicalRecordSchema.index({ patientId: 1, isDeleted: 1 });
medicalRecordSchema.index({ doctorId: 1, isDeleted: 1 });
medicalRecordSchema.index({ departmentId: 1, isDeleted: 1 });

const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);
export default MedicalRecord;
