import mongoose from "mongoose";
const bedSchema = new mongoose.Schema(
  {
    bedNumber: {
      type: String,
      required: true,
    },
    isOccupied: {
      type: Boolean,
      required: true,
      default: false,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      default: null,
      required: false,
    },
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
  },
  { timestamps: true }
);
bedSchema.index({ roomId: 1, bedNumber: 1 }, { unique: true });

const Bed = mongoose.model("Bed", bedSchema);
export default Bed;
