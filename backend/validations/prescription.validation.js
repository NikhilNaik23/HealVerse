import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId Validation");

const medicineSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Medicine name is required",
  }),
  dosage: Joi.string().trim().required().messages({
    "string.empty": "Dosage is required",
  }),
  frequency: Joi.string().trim().required().messages({
    "string.empty": "Frequency is required",
  }),
});

export const prescriptionSchema = Joi.object({
  patientId: objectId.required().messages({
    "any.invalid": "Invalid Patient ID",
  }),
  doctorId: objectId.required().messages({
    "any.invalid": "Invalid Doctor ID",
  }),
  appointmentId: objectId.required().messages({
    "any.invalid": "Invalid Appointment ID",
  }),
  diagnosis: Joi.string().trim().max(1000).required().messages({
    "string.empty": "Diagnosis is required",
    "string.max": "Diagnosis must be under 1000 characters",
  }),
  medicines: Joi.array().items(medicineSchema).min(1).required().messages({
    "array.min": "At least one medicine is required",
  }),
  advice: Joi.string().trim().max(1000).required().messages({
    "string.empty": "Advice is required",
    "string.max": "Advice must be under 1000 characters",
  }),
  uploadedBy: objectId.required().messages({
    "any.invalid": "Invalid Staff ID (uploadedBy)",
  }),
  issuedDate: Joi.date(),
});
