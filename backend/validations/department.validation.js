import Joi from "joi";
import mongoose from "mongoose";

// Reusable ObjectId validator
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId Validation");

export const departmentValidationSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),

  description: Joi.string().trim().required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),

  hospitalId: objectId.required().messages({
    "any.invalid": "Invalid Hospital ID for Hospital's department",
    "any.required": "Hospital ID is required",
  }),

  headOfDepartment: objectId.optional().messages({
    "any.invalid": "Invalid Staff ID for Head of Department",
  }),

  floor: Joi.number().integer().min(0).optional().messages({
    "number.base": "Floor must be a number",
    "number.min": "Floor cannot be negative",
  }),
  isActive: Joi.boolean().optional().default(true),

  numberOfBeds: Joi.number().integer().min(0).optional().messages({
    "number.base": "Number of beds must be a number",
    "number.min": "Number of beds cannot be negative",
  }),

  staffList: Joi.array().items(objectId).min(0).optional().messages({
    "any.invalid": "Staff list contains an invalid ObjectId",
  }),
});
