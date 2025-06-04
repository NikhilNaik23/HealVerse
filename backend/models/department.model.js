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
    specializations: {
      type: [String],
      enum: [
        "general_practitioner",
        "internist",
        "pediatrician",
        "cardiologist",
        "cardiothoracic_surgeon",
        "neurologist",
        "neurosurgeon",
        "orthopedic_surgeon",
        "plastic_surgeon",
        "general_surgeon",
        "vascular_surgeon",
        "urologist",
        "dermatologist",
        "psychiatrist",
        "radiologist",
        "anesthesiologist",
        "emergency_medicine",
        "endocrinologist",
        "gastroenterologist",
        "hematologist",
        "immunologist",
        "nephrologist",
        "obstetrician_gynecologist",
        "oncologist",
        "ophthalmologist",
        "otolaryngologist",
        "pathologist",
        "pulmonologist",
        "rheumatologist",
        "sports_medicine",
        "family_medicine",
        "physical_medicine_rehabilitation",
        "preventive_medicine",
        "critical_care_medicine",
        "addiction_medicine",
        "palliative_care",
        "sleep_medicine",
        "clinical_geneticist",
        "occupational_medicine",
      ],
      default: [],
    },
  },
  { timestamps: true }
);
const Department = mongoose.model("Department", departmentSchema);
export default Department;
