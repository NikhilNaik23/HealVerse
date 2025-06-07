import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    helpers.error("any.invalid");
  }
  return value;
}, "ObjectId validation");

const tests = [
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
];

export const reportValidationSchema = Joi.object({
  type: Joi.string()
    .required()
    .valid(...tests)
    .messages({
      "any.required": "Report type is required.",
    }),
  patientId: objectId.required().messages({
    "any.invalid": "Invalid Patient ID",
    "any.required": "Patient ID is required",
  }),
  doctorId: objectId.required().messages({
    "any.invalid": "Invalid Patient ID",
    "any.required": "Patient ID is required",
  }),
  fileURLs: Joi.array()
    .items(
      Joi.string()
        .uri()
        .pattern(/^https:\/\/res\.cloudinary\.com\/.+/)
    )
    .required()
    .messages({
      "any.required": "File URLs are required.",
      "string.pattern.base":
        "One or more file URLs are invalid Cloudinary URLs",
    }),
  reportDate: Joi.date().optional(),
  notes: Joi.string().allow("").optional(),
  uploadedBy: objectId.required().messages({
    "any.invalid": "Invalid Staff ID",
    "any.required": "Uploader (staff) ID is required",
  }),
});
