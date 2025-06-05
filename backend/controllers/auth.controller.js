import { generateToken } from "../lib/utils/generateToken.js";
import { generateTokenForSetPassword } from "../lib/utils/generateTokenForPassword.js";
import { sendEmail } from "../lib/utils/sendMail.js";
import Auth from "../models/auth.model.js";
import Patient from "../models/patient.model.js";
import Staff from "../models/staff.model.js";
import jwt from "jsonwebtoken";

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await Auth.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid Credentials" });
    }
    if (!user.linkedProfileId) {
      return res.status(400).json({
        error: "Profile not linked. Please register properly before login.",
      });
    }
    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: "Successfully Logged in",
      token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
        error: "Unauthorized role. Only patients can register themselves.",
      });
    }
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) {
      return res.status(409).json({
        error:
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
    console.error("Register Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getProfile = async (req, res) => {
  const { linkedProfileId, role } = req.user.auth;
  try {
    if (role === "Patient") {
      const patient = await Patient.findById(linkedProfileId).lean();
      if (!patient)
        return res.status(404).json({ error: "Patient profile not found." });
      return res.status(200).json({
        message: "Profile fetched successfully",
        patient,
      });
    }
    const staff = await Staff.findById(linkedProfileId).lean();
    if (!staff)
      return res.status(404).json({ error: "Staff profile not found." });

    return res.status(200).json({
      message: "Successfully Logged in",
      staff,
    });
  } catch (error) {
    console.error("GetProfile Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const registerStaff = async (req, res) => {
  const { email, linkedProfileId } = req.body;
  try {
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth && !existingAuth.isPasswordSet) {
      const token = generateTokenForSetPassword(
        existingAuth._id,
        existingAuth.role
      );
      const url = `http://localhost:5000/api/set-password?token=${token}`;
      const html = `
        <p>Hi,</p>
        <p>You were already registered as a staff member on HealVerse HMS, but hadn't set your password yet.</p>
        <p>Here's a new link to set it:</p>
        <a href="${url}">${url}</a>
        <p>This link will expire in 15 minutes.</p>
        <br/>
        <p>Thanks,<br/>HealVerse Team</p>
      `;

      const emailResult = await sendEmail({
        to: email,
        subject: "Set Your HealVerse Staff Password",
        html,
      });

      return res.status(200).json({
        message:
          "This account already exists but password wasn't set. New setup link sent.",
      });
    }

    if (existingAuth) {
      return res.status(409).json({
        error:
          "This email is already associated with an account. Try logging in.",
      });
    }
    const auth = await Auth.create({
      email,
      role: "Staff",
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
      <p>This link will expire in 15 minutes.</p>
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
      console.warn(
        "Warning: Failed to send password setup email:",
        emailResult.error
      );
    }

    return res.status(201).json({
      message: "Staff registration successful. Password setup email sent.",
      auth,
    });
  } catch (error) {
    console.error("registerStaff Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
      return res.status(404).json({ error: "User not found." });
    }

    if (user.isPasswordSet) {
      return res.status(400).json({ error: "Password has already been set." });
    }
    user.password = password;
    user.isPasswordSet = true;

    await user.save();

    return res
      .status(200)
      .json({ message: "Password set successfully. You may now log in." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Setup link expired." });
    }
    console.error("setStaffPassword Error:", error);
    return res.status(400).json({ error: "Invalid or expired token." });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const auth = await Auth.findOne({ email });
    if (!auth) {
      return res.status(404).json({ error: "User not found" });
    }
    auth.isPasswordSet = false;
    await auth.save();
    const token = generateTokenForSetPassword(auth._id, auth.role);
    const url = `http://localhost:5000/api/reset-password?token=${token}`;
    const html = `
  <p>Hi,</p>
  <p>You recently requested to reset your password on HealVerse HMS.</p>
  <p>Click the link below to set a new password. This link will expire in 15 minutes.</p>
  <a href="${url}">${url}</a>
  <p>If you didn't request this, please ignore this email.</p>
  <br/>
  <p>Thanks,<br/>HealVerse Team</p>
`;

    const emailResult = await sendEmail({
      to: email,
      subject: "HealVerse Password Reset Request",
      html,
    });
    if (!emailResult.success) {
      console.warn("Warning: Failed to send LINK to email:", emailResult.error);
    }

    return res.status(200).json({
      message: "If a matching account exists, a reset link was sent.",
    });
  } catch (error) {
    console.error("forgotPassword Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const resetPassword = async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SET_PASSWORD);
    const user = await Auth.findById(decoded.id).select("+password");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.isPasswordSet) {
      return res.status(403).json({ error: "Link already used or expired." });
    }
    user.password = password;
    user.isPasswordSet = true;
    await user.save();
    return res
      .status(200)
      .json({ message: "Password reset successfully. You may now log in." });
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Reset link expired." });
    }
    console.error("resetPassword Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const validatePassword = (password) => password?.length >= 8;

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword, confirmNewPassword } = req.body;
  if (!validatePassword(currentPassword)) {
    return res.status(400).json({ error: "Invalid current password" });
  }

  if (!validatePassword(newPassword)) {
    return res.status(400).json({ error: "invalid new password" });
  }
  if (newPassword !== confirmNewPassword) {
    return res
      .status(400)
      .json({ error: "new password and confirm password are not same" });
  }
  try {
    const user = await Auth.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect current password" });
    }

    user.password = confirmNewPassword;
    await user.save();
    return res.status(200).json({ message: "Password changed successfully. " });
  } catch (error) {
    console.error("changePassword Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
