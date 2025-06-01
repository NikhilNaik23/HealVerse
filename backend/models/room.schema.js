import mongoose from "mongoose";
const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      trim: true,
      required: true,
    },
    type: {
      type: String,
      enum: [
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
      ],
      default: "ward",
    },
    floor: {
      type: Number,
      required: true,
    },
    isOccupied: {
      type: Boolean,
      default: false,
    },
    inChargeStaffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    equipmentList: [
      {
        type: String,
        trim: true,
      },
    ],
    bedList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Bed",
      },
    ],
  },
  { timestamps: true }
);
const Room = mongoose.model("Room", roomSchema);
export default Room;
