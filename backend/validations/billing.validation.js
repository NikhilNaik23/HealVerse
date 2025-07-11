import Joi from "joi";
import { objectId } from "./objectId.validation.js";

const billingItemSchema = Joi.object({
  service: Joi.string()
    .valid("admission", "treatment", "prescription", "report", "surgery")
    .required(),
  referenceId: objectId.required().messages({
    "any.required": "Reference ID is required for the billing item",
  }),
  description: Joi.string().allow(""),
  cost: Joi.number().min(0).required().messages({
    "number.base": "Cost must be a number",
    "number.min": "Cost must be a positive number",
    "any.required": "Cost is required",
  }),
  addedAt: Joi.date().iso().optional(),
});

export const billValidationSchema = Joi.object({
  patientId: objectId.required().messages({
    "any.required": "Patient ID is required",
  }),
  admissionId: objectId.required().messages({
    "any.required": "Admission ID is required",
  }),
  items: Joi.array()
    .items(billingItemSchema)
    .min(1)
    .required()
    .messages({
      "array.base": "Items must be an array",
      "array.min": "At least one billing item is required",
    }),
  status: Joi.string()
    .valid("open", "finalized", "paid")
    .default("open"),
  generatedBy: objectId.optional(),
  paidAmount: Joi.number().min(0).default(0),
  paymentMethod: Joi.string().valid("cash", "card", "upi", "insurance"),
  invoiceNumber: Joi.string().optional(),
  notes: Joi.string().allow("").optional(),
});
