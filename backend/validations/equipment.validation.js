import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId Validation");

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
