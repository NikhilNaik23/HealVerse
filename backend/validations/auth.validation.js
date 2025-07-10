import Joi from "joi";
import { objectId } from "./objectId.validation.js";

export const authValidationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .messages({
      "string.email": "Invalid email format",
      "string.empty": "Email is required",
    }),
  password: Joi.string().min(8).required().messages({
    "string.min": "Password must be at least 8 characters long",
    "string.empty": "Password is required",
  }),
});

export const staffRegisterValidationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .messages({
      "string.email": "Invalid email format",
      "string.empty": "Email is required",
    }),
  role: Joi.string().valid("Staff").default("Staff").messages({
    "any.only": "Role must be 'Staff'.",
  }),
  linkedProfileId: objectId.required(),
});
