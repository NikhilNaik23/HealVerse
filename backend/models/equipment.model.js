import mongoose from "mongoose";

const equipmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      enum: [
        "defibrillator",
        "oxygen_cylinder",
        "ventilator",
        "suction_pump",
        "infusion_pump",
        "monitor",
        "wheelchair",
        "bedside_lamp",
        "ecg_machine",
        "nebulizer",
      ],
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["working", "maintenance", "damaged", "in_use"],
      default: "working",
    },
    assignedRoom: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
    purchaseDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

const Equipment = mongoose.model("Equipment", equipmentSchema);
export default Equipment;
