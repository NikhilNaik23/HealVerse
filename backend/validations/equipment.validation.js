import Joi from "joi";
import { objectId } from "./objectId.validation.js";

export const equipmentSchema = Joi.object({
  name: Joi.string()
    .valid(
      "defibrillator",
      "oxygen_cylinder",
      "ventilator",
      "suction_pump",
      "infusion_pump",
      "monitor",
      "wheelchair",
      "bedside_lamp",
      "ecg_machine",
      "nebulizer"
    )
    .required(),
  description: Joi.string().optional(),
  status: Joi.string().valid("working", "maintenance", "damaged", "in_use").default("working"),
  assignedRoom: objectId.allow(null),
  purchaseDate: Joi.date().optional(),
});
