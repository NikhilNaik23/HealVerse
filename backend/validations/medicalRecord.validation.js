import Joi from "joi";
import mongoose from "mongoose";
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId Validation");

export const medicalRecordValidationSchema = Joi.object({
  patientId: objectId.required().messages({
    "any.invalid": "Invalid Patient Id",
  }),
  doctorId: objectId.required().messages({
    "any.invalid": "Invalid Doctor Id",
  }),
  departmentId: objectId.required().messages({
    "any.invalid": "Invalid Department Id",
  }),
  visitDate: Joi.date().iso().optional(),
  visitType: Joi.string().valid(
    "outpatient",
    "inpatient",
    "emergency",
    "teleconsultation"
  ),
  symptoms: Joi.array().items(Joi.string()).min(1).required(),
  diagnosis: Joi.string().required(),
  notes: Joi.string().required(),
  testsOrdered: Joi.array().items(Joi.string()).optional(),
  treatmentGiven: Joi.array().items(Joi.string()).optional(),
  attachments: Joi.array().items(objectId).optional(),
  followUpDate: Joi.date().iso().optional(),
  status: Joi.string().valid("open", "closed", "follow-up required").optional(),
  prescriptions: Joi.array().items(objectId).optional(),
  billingId: objectId.allow(null).optional(),
});
