import Joi from "joi";
import { objectId } from "./objectId.validation.js";
export const hospitalValidationSchema = Joi.object({
  name: Joi.string().required().messages({
    "string.empty": "Hospital name is required.",
  }),
  location: Joi.string().required().messages({
    "string.empty": "Hospital Location or Branch is required",
  }),
  contactDetails: Joi.object({
    phone: Joi.string()
      .pattern(/^[6-9]\d{9}$/)
      .required()
      .messages({
        "string.pattern.base":
          "Phone number must be exactly 10 digits and start with 6, 7, 8, or 9.",
        "string.empty": "Phone number is required.",
      }),
    email: Joi.string().email().required().lowercase().messages({
      "string.email": "Please enter a valid email address",
      "string.empty": "Email is required",
    }),
  })
    .required()
    .messages({
      "object.base": "contactDetails is required",
    }),
  directorId: objectId.optional().messages({
    "any.invalid": "Invalid Staff ID",
  }),
  establishedDate: Joi.date().optional(),
});
