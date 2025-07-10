import Joi from "joi";
import { objectId } from "./objectId.validation.js";
export const appointmentValidationSchema = Joi.object({
  patientId: objectId.required(),
  doctorId: objectId.required(),
  departmentId: objectId.required(),
  date: Joi.date().iso().required(),
  time: Joi.string()
    .required()
    .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
    .messages({
      "string.pattern.base": "Time must be in HH:mm 24-hour format ",
      "string.empty": "Time is required",
    }),
  status: Joi.string().valid("scheduled", "completed", "cancelled").optional(),
  reason: Joi.string().required(),
});
