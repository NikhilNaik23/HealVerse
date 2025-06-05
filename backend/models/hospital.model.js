import mongoose from "mongoose";
const contactDetailsSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      minLength: 10,
      trim: true,
      unique: true,
      required: true,
      match: [
        /^[6-9]\d{9}$/,
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits long.",
      ],
    },
    email: {
      type: String,
      trim: true,
      unique: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
      required: true,
    },
  },
  { _id: false }
);

const hospitalSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      required: true,
    },
    contactDetails: contactDetailsSchema,
    directorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
    },
    establishedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);
hospitalSchema.index({ name: 1, location: 1 }, { unique: true });
hospitalSchema.index({ directorId: 1 });
const Hospital = mongoose.model("Hospital", hospitalSchema);
export default Hospital;
