import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    roomNumber: {
      type: String,
      trim: true,
      required: true,
      uppercase: true,
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
      required: function () {
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
        return typesRequiringInCharge.includes(this.type);
      },
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: function () {
        return this.type !== "emergency";
      },
    },
    equipmentList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Equipment",
      },
    ],

    bedList: [{ type: mongoose.Schema.Types.ObjectId, ref: "Bed" }],
  },
  { timestamps: true }
);
roomSchema.index({ roomNumber: 1, floor: 1 }, { unique: true });

roomSchema.virtual("isOccupied").get(function () {
  if (!this.bedList || this.bedList.length === 0) return false;
  const isPopulated = typeof this.bedList[0] === "object" && this.bedList[0].isOccupied !== undefined;
  if (!isPopulated) return null; 
  return this.bedList.every(bed => bed.isOccupied === true);
});

roomSchema.set("toJSON", { virtuals: true });
roomSchema.set("toObject", { virtuals: true });


const Room = mongoose.model("Room", roomSchema);
export default Room;
