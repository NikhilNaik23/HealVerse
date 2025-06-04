import mongoose from "mongoose";
import bcrypt from "bcrypt";
const authSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      trim: true,
      required: true,
      lowercase: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: {
      type: String,
      required: function () {
        return this.isPasswordSet === true;
      },
      select: false,
      minLength: 8,
    },

    role: {
      type: String,
      enum: ["Patient", "Staff"],
    },
    linkedProfileId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false,
      refPath: "role",
    },
    isPasswordSet: {
      type: Boolean,
      default: function () {
        return this.role === "Patient";
      },
    },
    permissions: {
      type: [String],
      default: [],
    },
  },
  { timestamps: true }
);
authSchema.pre("save", async function (next) {
  if (this.isModified("email")) {
    this.email = this.email.toLowerCase();
  }
  if (!this.isModified("password") || !this.password) return next();

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
