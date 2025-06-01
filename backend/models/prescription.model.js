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
      required: true,
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
        },
      ],
      required: true,
      validate: [(arr) => arr.length > 0, "At least one medicine is required"],
    },
    advice: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);
const Prescription = mongoose.model("Prescription", prescriptionSchema);
export default Prescription;
