import Joi from "joi";
import { objectId } from "./objectId.validation.js";

const validTypes = [
  "ward",
  "private",
  "semi_private",
  "icu",
  "emergency",
  "operation",
  "labor_delivery",
  "post_op",
  "isolation",
  "dialysis",
  "chemo",
  "radiology",
  "examination",
  "consultation",
  "waiting",
  "nursery",
];

const typesRequiringInCharge = [
  "icu",
  "emergency",
  "operation",
  "labor_delivery",
  "post_op",
  "isolation",
  "dialysis",
  "chemo",
  "nursery",
];

export const roomSchema = Joi.object({
  roomNumber: Joi.string().trim().uppercase().required().messages({
    "string.empty": "Room number is required",
  }),

  type: Joi.string()
    .valid(...validTypes)
    .default("ward")
    .required(),

  floor: Joi.number().min(0).required().messages({
    "number.base": "Floor must be a number",
    "any.required": "Floor is required",
  }),

  inChargeStaffId: Joi.when("type", {
    is: Joi.valid(...typesRequiringInCharge),
    then: objectId.required().messages({
      "any.invalid": "Invalid inChargeStaffId",
      "any.required": "In-charge staff is required for this room type",
    }),
    otherwise: objectId.optional(),
  }),

  departmentId: Joi.when("type", {
    is: "emergency",
    then: objectId.optional(),
    otherwise: objectId.required().messages({
      "any.invalid": "Invalid departmentId",
      "any.required": "Department is required for non-emergency rooms",
    }),
  }),

  equipmentList: Joi.array().items(objectId).optional(),

  bedList: Joi.array().items(objectId).optional(),
});
