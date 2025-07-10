import mongoose from "mongoose";
const prescriptionSchema = new mongoose.Schema(
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
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    diagnosis: {
      type: String,
      trim: true,
      required: [true, "Diagnosis is required"],
      maxlength: 1000,
    },

    medicines: {
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
          duration: {
            type: String,
            trim: true,
            required: true,
          },
        },
      ],
      required: true,
      validate: [(arr) => arr.length > 0, "At least one medicine is required"],
    },
    advice: {
      type: String,
      trim: true,
      required: [true, "Advice is required"],
      maxlength: 1000,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
    },
    issuedDate: {
      type: Date,
      default: Date.now,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
  },
  { timestamps: true }
);
const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
