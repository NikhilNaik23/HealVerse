import Joi from "joi";
import mongoose from "mongoose";
const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId Validation");

export const treatmentSchema = Joi.object({
  patientId: objectId.required().messages({
    "any.invalid": "Invalid Patient ID",
  }),
  doctorId: objectId.optional().messages({
    "any.invalid": "Invalid Doctor ID",
  }),
  treatmentDate: Joi.date().required().messages({
    "date.base": "Invalid treatment date",
  }),
  description: Joi.string().trim().required().messages({
    "string.base": "Description must be a string",
    "any.required": "Description is required",
  }),
  prescriptionIds: Joi.array().items(objectId).default([]),
  prescribedMedications: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().trim().required(),
        dosage: Joi.string().trim().required(),
        frequency: Joi.string().trim().required(),
      })
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one medication is required",
    }),
  followUpRequired: Joi.boolean().required(),
  followDate: Joi.when("followUpRequired", {
    is: true,
    then: Joi.date().required().messages({
      "date.base": "Follow-up date must be a valid date",
      "any.required": "Follow-up date is required when follow-up is true",
    }),
    otherwise: Joi.date().optional(),
  }),
  operationRoomId: objectId.allow(null).optional().messages({
    "any.invalid": "Invalid Operation Room ID",
  }),
});
