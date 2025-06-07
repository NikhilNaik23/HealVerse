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
      default: Date.now,
    },
    fileURLs: {
      type: [String],
      required: true,
      validate: {
        validator: (urls) =>
          urls.every((url) => /^https:\/\/res\.cloudinary\.com\/.+/.test(url)),
        message: "One or more file URLs are invalid Cloudinary URLs",
      },
    },
    notes: {
      type: String,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
  },
  { timestamps: true }
);
const Report = mongoose.model("Report", reportSchema);
export default Report;
