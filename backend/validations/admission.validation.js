import Joi from "joi";
import { objectId } from "./objectId.validation.js";

export const admissionValidationSchema = Joi.object({
  patientId: objectId.required().messages({
    "any.invalid": "Invalid Patient ID",
    "any.required": "Patient ID is required",
  }),
  admitDate: Joi.date().required().messages({
    "any.required": "Admit Date is required",
  }),
  dischargeDate: Joi.date().optional(),
  roomId: objectId.required().messages({
    "any.invalid": "Invalid Room ID",
    "any.required": "Room ID is required",
  }),
  bedId: objectId.required().messages({
    "any.invalid": "Invalid Bed ID",
    "any.required": "Bed ID is required",
  }),
  reason: Joi.string().trim().required().messages({
    "any.required": "Reason is required",
  }),
  status: Joi.string()
    .valid("admitted", "discharged", "transferred")
    .optional(),
  notes: Joi.string().trim().allow(""),
});
