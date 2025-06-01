import mongoose from "mongoose";

const surgeonSpecs = [
  "cardiothoracic_surgeon",
  "neurosurgeon",
  "orthopedic_surgeon",
  "plastic_surgeon",
  "general_surgeon",
  "vascular_surgeon",
];

const doctorSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Staff",
      required: true,
      index: { unique: true },
    },
    specialization: {
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
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: "At least one specialization is required.",
      },
    },
    isSurgeon: {
      type: Boolean,
      default: false,
    },
    qualification: {
      type: String,
      required: true,
    },
    experience: {
      type: Number,
      required: true,
      min: 0,
      max: 60,
    },
    consultationHours: {
      start: {
        type: String,
        required: true,
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "Start time must be in HH:mm format",
        ],
      },
      end: {
        type: String,
        required: true,
        match: [
          /^([01]\d|2[0-3]):([0-5]\d)$/,
          "End time must be in HH:mm format",
        ],
      },
    },
    availableDays: {
      type: [String],
      required: true,
      validate: {
        validator: function (daysArray) {
          const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
          return daysArray.every((day) => validDays.includes(day));
        },
        message:
          "Days must be valid weekday abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun).",
      },
    },
    patientsAssigned: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Patient",
      default: [],
    },
  },
  { timestamps: true }
);

doctorSchema.pre("save", function (next) {
  this.isSurgeon = this.specialization.some((spec) =>
    surgeonSpecs.includes(spec)
  );

  const [startH, startM] = this.consultationHours.start.split(":").map(Number);
  const [endH, endM] = this.consultationHours.end.split(":").map(Number);
  if (endH < startH || (endH === startH && endM <= startM)) {
    return next(new Error("Consultation end time must be after start time"));
  }

  next();
});

const Doctor = mongoose.model("Doctor", doctorSchema);

export default Doctor;
