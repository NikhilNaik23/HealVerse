import Joi from "joi";
import { objectId } from "./objectId.validation.js";

export const bedValidateSchema = Joi.object({
  bedNumber: Joi.string().trim().required().messages({
    "string.empty": "Bed number is required",
  }),
  isOccupied: Joi.boolean().default(false).messages({
    "boolean.base": "isOccupied must be a boolean",
  }),
  roomId: objectId.required().messages({
    "any.invalid": "Invalid room ID",
    "any.required": "roomId is required",
  }),
  patientId: objectId.allow(null).optional().messages({
    "any.invalid": "Invalid patient ID",
  }),
});
