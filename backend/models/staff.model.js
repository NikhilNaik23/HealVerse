import mongoose from "mongoose";
const WorkingHoursSchema = new mongoose.Schema(
  {
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
    days: {
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
  },
  { _id: false }
);
const staffSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },
    phone: {
      type: String,
      trim: true,
      match: [
        /^[6-9]\d{9}$/,
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits long.",
      ],
    },
    address: {
      type: String,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "others"],
    },
    photo: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: [
        "admin",
        "doctor",
        "nurse",
        "janitor",
        "receptionist",
        "lab_technician",
        "pharmacist",
        "emergencyStaff",
      ],
      required: true,
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    salary: {
      type: Number,
      select: false,
    },
    dateOfJoining: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    workingHours: WorkingHoursSchema,
  },
  { timestamps: true }
);
staffSchema.index({ hospitalId: 1 });
staffSchema.index({ departmentId: 1 });

const Staff = mongoose.model("Staff", staffSchema);
export default Staff;
