import mongoose from "mongoose";
const treatmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    treatmentDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    prescribedMedications: {
      type: [
        {
          name: {
            type: String,
            trim: true,
            required: true,
          },
          dosage: {
            type: String,
            trim: true,
            required: true,
          },
          frequency: {
            type: String,
            trim: true,
            required: true,
          },
        },
      ],
      validate: [
        (arr) => arr.length > 0,
        "At least one medication is required",
      ],
    },
    followUpRequired: {
      type: Boolean,
      required: true,
    },
    followDate: {
      type: Date,
      validate: {
        validator: function (v) {
          return !this.followUpRequired || (this.followUpRequired && v);
        },
        message: "Follow-up date is required when follow-up is marked true.",
      },
    },

    operationRoomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      default: null,
    },
  },
  { timestamps: true }
);
const Treatment = mongoose.model("Treatment", treatmentSchema);
export default Treatment;
