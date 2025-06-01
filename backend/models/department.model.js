import mongoose from "mongoose";
const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },

    headOfDepartment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },

    floor: {
      type: Number,
      min: 0,
    },
    numberOfBeds: {
      type: Number,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    staffList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Staff",
      },
    ],
  },
  { timestamps: true }
);
const Department = mongoose.model("Department", departmentSchema);
export default Department;
