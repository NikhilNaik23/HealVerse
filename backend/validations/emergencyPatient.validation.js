import Joi from "joi";
import { objectId } from "./objectId.validation.js";

const emergencyContactSchema = Joi.object({
  name: Joi.string().trim().messages({
    "string.base": "Name must be a string",
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .trim()
    .messages({
      "string.pattern.base":
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits",
    }),
  relation: Joi.string().trim().messages({
    "string.base": "Relation must be a string",
  }),
});

export const emergencyPatientSchema = Joi.object({
  name: Joi.string().trim().messages({
    "string.base": "Name must be a string",
  }),
  age: Joi.number().min(0),
  gender: Joi.string().valid("male", "female", "others", "unknown").messages({
    "string.only": "Invalid gender value",
  }),
  phoneNumber: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .trim()
    .messages({
      "string.pattern.base":
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits",
    }),
  emergencyContact: emergencyContactSchema,
  triageLevel: Joi.string()
    .valid("critical", "urgent", "non-urgent")
    .required()
    .messages({
      "string.only": "Invalid triage level value",
      "string.required": "TriageLevel is required",
    }),
  initialDiagnosis: Joi.string().messages({
    "string.base": "Initial diagnosis must be a string",
  }),
  assignedDoctorId: objectId.optional().messages({
    "any.invalid": "Invalid doctor Id",
  }),
  status: Joi.string()
    .valid("waiting", "in-treatment", "discharged", "transferred")
    .messages({
      "string.only": "Invalid status value",
    }),
  notes: Joi.string().messages({
    "string.base": "Initial diagnosis must be a string",
  }),
});
