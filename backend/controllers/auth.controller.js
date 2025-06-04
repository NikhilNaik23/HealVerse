import { generateToken } from "../lib/utils/generateToken.js";
import { generateTokenForSetPassword } from "../lib/utils/generateTokenForPassword.js";
import { sendEmail } from "../lib/utils/sendMail.js";
import Auth from "../models/auth.model.js";
import Patient from "../models/patient.model.js";
import Staff from "../models/staff.model.js";
import jwt from "jsonwebtoken"

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Auth.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    if (!user.linkedProfileId) {
      return res.status(400).json({
        message: "Profile not linked. Please register properly before login.",
      });
    }
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: "Successfully Logged in",
      token,
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const registerUser = async (req, res) => {
  const {
    name,
    dateOfBirth,
    gender,
    phone,
    email,
    address,
    emergencyContact,
    password,
    role = "Patient",
  } = req.body;
  try {
    if (role !== "Patient") {
      return res.status(403).json({
        message: "Unauthorized role. Only patients can register themselves.",
      });
    }
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) {
      return res.status(409).json({
        message:
          "This email is already associated with an account. Try logging in.",
      });
    }
    const newAuth = new Auth({
      email,
      password,
      role: "Patient",
    });
    await newAuth.save();
    const patient = await Patient.create({
      name,
      dateOfBirth,
      gender,
      phone,
      email,
      address,
      emergencyContact,
      medicalHistory: [],
      linkedAuthId: newAuth._id,
    });
    await patient.save();
    newAuth.linkedProfileId = patient._id;
    await newAuth.save();
    const token = generateToken(newAuth._id, newAuth.role);

    return res.status(201).json({
      message: "Registration successful",
      token,
      patient: {
        _id: patient._id,
        name: patient.name,
        email: patient.email,
        role: newAuth.role,
      },
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getProfile = async (req, res) => {
  const { linkedProfileId, role } = req.user;
  try {
    if (role === "Patient") {
      const patient = await Patient.findById(linkedProfileId).lean();
      if (!patient)
        return res.status(404).json({ message: "Patient profile not found." });
      return res.status(200).json({
        message: "Profile fetched successfully",
        patient,
      });
    }
    const staff = await Staff.findById(linkedProfileId).lean();
    if (!staff)
      return res.status(404).json({ message: "Staff profile not found." });

    return res.status(200).json({
      message: "Successfully Logged in",
      staff,
    });
  } catch (error) {
    console.error("GetProfile Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const registerStaff = async (req, res) => {
  const { email, linkedProfileId } = req.body;
  try {
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) {
      return res.status(409).json({
        message:
          "This email is already associated with an account. Try logging in.",
      });
    }
    const auth = await Auth.create({
      email,
      role:"Staff",
      linkedProfileId,
      isPasswordSet: false,
    });
    const token = generateTokenForSetPassword(auth._id, auth.role);
    const url = `http://localhost:5000/api/set-password?token=${token}`;
    const html = `
      <p>Hi,</p>
      <p>You have been registered as a staff member on HealVerse HMS.</p>
      <p>Please click the link below to set your password and activate your account:</p>
      <a href="${url}">${url}</a>
      <p>This link will expire in 1 hour.</p>
      <p>If you did not expect this email, please ignore it.</p>
      <br/>
      <p>Thanks,<br/>HealVerse Team</p>
    `;

    const emailResult = await sendEmail({
      to: email,
      subject: "Set Your HealVerse Staff Password",
      html,
    });

    if (!emailResult.success) {
      console.warn("Warning: Failed to send password setup email:", emailResult.error);
    }

    return res.status(201).json({
      message: "Staff registration successful. Password setup email sent.",
      auth,
    });
  } catch (error) {
    console.error("registerStaff Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const setStaffPassword = async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SET_PASSWORD);
    const user = await Auth.findById(decoded.id).select(
      "+password isPasswordSet"
    );
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.isPasswordSet) {
      return res
        .status(400)
        .json({ message: "Password has already been set." });
    }
    user.password = password;
    user.isPasswordSet = true;

    await user.save();

    return res
      .status(200)
      .json({ message: "Password set successfully. You may now log in." });
  } catch (error) {
    console.error("setStaffPassword Error:", error.message);
    return res.status(400).json({ message: "Invalid or expired token." });
  }
};
