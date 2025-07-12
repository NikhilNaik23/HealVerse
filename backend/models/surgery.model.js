import mongoose from "mongoose";
const surgerySchema = new mongoose.Schema(
  {
    operationRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
      index: true,
    },
    leadSurgeonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },
    assistantSurgeons: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Staff",
        },
      ],
      required: true,
      validate: [
        (arr) => arr.length > 0,
        "At least one assistant surgeon is required",
      ],
    },
    anesthetistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    scrubNurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    circulatingNurseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: false,
    },
    operationStartTime: {
      type: Date,
      required: true,
    },
    operationEndTime: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "ongoing", "completed", "cancelled"],
      required: true,
      index: true,
    },
    notes: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

surgerySchema.methods.getDurationMinutes = function () {
  return (this.operationEndTime - this.operationStartTime) / (1000 * 60);
};
surgerySchema.virtual("durationFormatted").get(function () {
  const mins = this.getDurationMinutes();
  const hours = Math.floor(mins / 60);
  const minutes = Math.floor(mins % 60);
  return `${hours}h ${minutes}m`;
});

surgerySchema.pre("save", function (next) {
  if (this.operationEndTime && this.operationEndTime <= this.operationStartTime) {
    return next(new Error("Operation end time must be after start time"));
  }
  next();
});

const Surgery = mongoose.model("Surgery", surgerySchema);
export default Surgery;
