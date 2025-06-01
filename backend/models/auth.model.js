import mongoose from "mongoose";
import bcrypt from "bcrypt";
const authSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      trim: true,
      required: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: true,
      select: false,
      minLength: 8,
    },
    role: {
      type: String,
      enum: ["Patient", "Staff"],
      default: "Patient",
    },
    linkedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: "role",
    },
    permissions: {
      type: [String],
    },
  },
  { timestamps: true }
);
authSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

authSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

const Auth = mongoose.model("Auth", authSchema);
export default Auth;
