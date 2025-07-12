import Joi from "joi";
import { objectId } from "./objectId.validation.js";

export const surgeryValidationSchema = Joi.object({
  operationRoomId: objectId.required().label("Operation Room ID"),
  patientId: objectId.required().label("Patient ID"),
  leadSurgeonId: objectId.required().label("Lead Surgeon ID"),

  assistantSurgeons: Joi.array()
    .items(objectId.label("Assistant Surgeon ID"))
    .min(1)
    .required()
    .label("Assistant Surgeons"),

  anesthetistId: objectId.required().label("Anesthetist ID"),
  scrubNurseId: objectId.required().label("Scrub Nurse ID"),
  circulatingNurseId: objectId.optional().label("Circulating Nurse ID"),

  operationStartTime: Joi.date().required().label("Operation Start Time"),
  operationEndTime: Joi.when("status", {
    is: "completed",
    then: Joi.date()
      .greater(Joi.ref("operationStartTime"))
      .required()
      .label("Operation End Time (required when completed)"),
    otherwise: Joi.date().optional(),
  }),

  status: Joi.string()
    .valid("scheduled", "ongoing", "completed", "cancelled")
    .default("scheduled")
    .label("Surgery Status"),

  notes: Joi.string().trim().max(1000).optional().label("Notes"),
});
