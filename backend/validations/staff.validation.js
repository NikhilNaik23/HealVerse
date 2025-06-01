import Joi from "joi";
import mongoose from "mongoose";

// Helper: validate MongoDB ObjectId
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId Validation");

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;
const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const staffValidationSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
  }),

  email: Joi.string().trim().email().required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),

  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .messages({
      "string.pattern.base":
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits",
    }),

  address: Joi.string().trim().optional(),

  dateOfBirth: Joi.date().iso().optional(),

  gender: Joi.string().valid("male", "female", "others").required().messages({
    "any.only": "Gender must be one of: male, female, others",
    "any.required": "Gender is required",
  }),

  photo: Joi.string().uri().optional(),

  role: Joi.string()
    .valid(
      "admin",
      "doctor",
      "nurse",
      "janitor",
      "receptionist",
      "lab_technician",
      "pharmacist",
      "emergencyStaff"
    )
    .required()
    .messages({
      "any.only": "Invalid role",
      "any.required": "Role is required",
    }),

  departmentId: objectId.required().messages({
    "any.invalid": "Invalid department ID",
    "any.required": "Department ID is required",
  }),

  hospitalId: objectId.required().messages({
    "any.invalid": "Invalid hospital ID",
    "any.required": "Hospital ID is required",
  }),

  salary: Joi.number().positive().optional(),

  dateOfJoining: Joi.date().iso().optional(),

  isActive: Joi.boolean().optional().default(true),

  workingHours: Joi.object({
    start: Joi.string().pattern(timePattern).required().messages({
      "string.pattern.base": "Start time must be in HH:mm format",
      "any.required": "Start time is required",
    }),
    end: Joi.string().pattern(timePattern).required().messages({
      "string.pattern.base": "End time must be in HH:mm format",
      "any.required": "End time is required",
    }),
    days: Joi.array()
      .items(Joi.string().valid(...validDays))
      .min(1)
      .required()
      .messages({
        "array.includes": "Invalid day provided",
        "any.required": "Days are required",
      }),
  }).optional(),
});
