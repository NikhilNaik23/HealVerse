import mongoose from "mongoose";
const reportSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "blood_test",
        "x_ray",
        "mri_scan",
        "ct_scan",
        "ultrasound",
        "pathology",
        "ecg",
        "biopsy",
        "discharge_summary",
        "prescription_report",
        "echocardiogram",
        "endoscopy",
        "colonoscopy",
        "angiogram",
        "mammogram",
        "genetic_test",
        "immunology_report",
        "microbiology_report",
        "cytology_report",
        "neurology_report",
        "radiotherapy_report",
        "surgical_report",
        "pathology_biopsy_report",
        "consultation_notes",
        "discharge_instructions",
        "therapy_report",
        "mental_health_evaluation",
      ],
      required: true,
    },
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
    reportDate: {
      type: Date,
      required: true,
    },
    fileURL: {
      type: String,
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);
const Report = mongoose.model("Report", reportSchema);
export default Report;
