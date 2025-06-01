import { generateToken } from "../lib/utils/generateToken.js";
import Auth from "../models/auth.model.js";
import Patient from "../models/patient.model.js";
import Staff from "../models/staff.model.js";

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }
    const user = await Auth.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const token = generateToken(user._id, user.role);
    const { _id, role } = user;
    res.status(200).json({
      message: "Successfully Logged in",
      token,
      user: { _id, email, role },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const register = async (req, res) => {
  const {
    email,
    password,
    role,
    name,
    gender,
    staffRole,
    departmentId,
    hospitalId,
    phone,
    address,
    dateOfBirth,
  } = req.body;
  try {
    if (!name?.trim() || !email?.trim() || !password?.trim() || !role?.trim()) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters long" });
    }
    const existingUser = await Auth.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    let profileDoc;
    if (role === "Staff") {
      profileDoc = await Staff.create({
        email,
        name,
        gender,
        role: staffRole,
        departmentId,
        hospitalId,
        phone,
        address,
        dateOfBirth,
      });
    } else if (role === "Patient") {
      profileDoc = await Patient.create({
        email,
        name,
        gender,
        phone,
        address,
        dateOfBirth,
      });
    } else {
      return res.status(400).json({ message: "Invalid role" });
    }

    const newUser = new Auth({
      email,
      password,
      role,
      linkedProfileId: profileDoc._id,
    });
    await newUser.save();

    const token = generateToken(newUser._id, newUser.role);
    const { _id, linkedProfileId } = newUser;

    res.status(201).json({
      message: "Successfully Registered",
      token,
      user: { _id, email, role, linkedProfileId },
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
