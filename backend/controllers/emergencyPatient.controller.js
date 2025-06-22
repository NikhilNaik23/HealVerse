import mongoose from "mongoose";
import EmergencyPatient from "../models/emergencyPatient.model.js";
import Patient from "../models/patient.model.js";

import { sendEmail } from "../lib/utils/sendMail.js";

import crypto from "crypto";
import Auth from "../models/auth.model.js";
import Doctor from "../models/doctor.model.js";

function generateRandomPassword(length = 12) {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .slice(0, length)
    .replace(/\+/g, "A")
    .replace(/\//g, "B");
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createEmergencyPatient = async (req, res) => {
  const {
    name = "Unknown",
    age = 0,
    gender = "unknown",
    phoneNumber,
    emergencyContact,
    triageLevel,
    initialDiagnosis,
    assignedDoctorId,
    status = "waiting",
    notes,
  } = req.body;
  const staffId = req.user?.profile;
  if (!staffId) {
    return res.status(401).json({ error: "Unauthorized: Staff ID missing" });
  }

  try {
    const emergencyPatient = await EmergencyPatient.create({
      name,
      age,
      gender,
      phoneNumber,
      emergencyContact,
      triageLevel,
      initialDiagnosis,
      assignedDoctorId,
      status,
      notes,
      createdBy: staffId,
    });
    return res
      .status(200)
      .json({ message: "Patient created successfully", emergencyPatient });
  } catch (error) {
    console.log("createEmergencyPatient Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllEmergencyPatient = async (req, res) => {
  const { triageLevel, status, createdBy } = req.query;

  try {
    const filter = {};

    if (triageLevel) {
      filter.triageLevel = triageLevel;
    }

    if (status) {
      filter.status = status;
    }

    if (createdBy) {
      filter.createdBy = createdBy;
    }

    const emergencyPatients = await EmergencyPatient.find(filter)
      .populate("createdBy", "name role")
      .sort({ createdAt: -1 });

    if (!emergencyPatients || emergencyPatients.length === 0) {
      return res.status(404).json({ message: "No emergency patients found" });
    }

    return res.status(200).json({ emergencyPatients });
  } catch (error) {
    console.error("getAllEmergencyPatient Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const escalateToRegularPatient = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    dateOfBirth,
    gender,
    phone,
    email,
    linkedAuthId = null,
    address,
    emergencyContact,
    currentStatus,
    statusHistory = [],
    admissionDate,
    dischargeDate,
    departmentId,
  } = req.body;
  try {
    if (!isValidObjectId(id)) {
      return res.status(400).json({ error: "Invalid Patient Id" });
    }
    const existingAuth = await Auth.findOne({ email });
    if (existingAuth) {
      return res
        .status(409)
        .json({ error: "An account already exists with this email" });
    }
    const existingPatient = await Patient.findOne({
      $or: [{ phone }, { email }],
    });

    if (existingPatient) {
      return res
        .status(409)
        .json({ error: "Patient already exists with this phone or email" });
    }
    const emergencyPatient = await EmergencyPatient.findById(id);
    if (!emergencyPatient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (!emergencyPatient.assignedDoctorId) {
      return res
        .status(400)
        .json({ error: "Assign a doctor before escalating" });
    }

    if (departmentId && !isValidObjectId(departmentId)) {
      return res.status(400).json({ error: "Invalid departmentId" });
    }

    const medicalHistory = (req.files || []).map((file) => ({
      documentUrl: file.path,
      public_id: file.filename,
      documentType: file.mimetype.includes("pdf") ? "pdf" : "image",
      uploadedAt: new Date(),
      description: "",
    }));
    const doctor = await Doctor.findById(
      emergencyPatient.assignedDoctorId
    ).populate("staffId", "isActive");
    if (!doctor) {
      return res
        .status(400)
        .json({ error: "Assigned doctor no longer exists" });
    }
    if (!doctor.staffId?.isActive) {
      return res
        .status(403)
        .json({ error: "Assigned doctor is currently inactive" });
    }
    const finalDepartmentId = departmentId || doctor.departmentId;

    if (!finalDepartmentId) {
      return res.status(400).json({
        error: "Department ID is required or must be linked to doctor",
      });
    }

    const patient = await Patient.create({
      name,
      dateOfBirth,
      gender,
      phone,
      email,
      linkedAuthId,
      address,
      emergencyContact,
      medicalHistory,
      currentStatus,
      statusHistory,
      admissionDate,
      dischargeDate,
      assignedDoctorId: emergencyPatient.assignedDoctorId,
      departmentId: finalDepartmentId,
    });

    const password = generateRandomPassword(12);

    const auth = await Auth.create({
      email,
      password,
      role: "Patient",
      linkedProfileId: patient._id,
    });

    const html = `
          <p>Hi ${name},</p>
          <p>You've been registered successfully on <strong>HealVerse HMS</strong>.</p>
          <p><strong>Login Email:</strong> ${email}<br/>
          <strong>Password:</strong> ${password}</p>
          <p>Please log in and change your password immediately for security.</p>
          <br/>
          <p>Thanks,<br/>HealVerse Team</p>
        `;
    patient.linkedAuthId = auth._id;
    await patient.save();
    const emailResult = await sendEmail({
      to: email,
      subject: "Welcome to HealVerse HMS",
      html,
    });

    if (!emailResult.success) {
      console.warn("Warning: Failed to send LINK to email:", emailResult.error);
    }
    emergencyPatient.isEscalated = true;
    emergencyPatient.linkedPatientId = patient._id;
    await emergencyPatient.save();
    if (!doctor.patientsAssigned.includes(patient._id)) {
      doctor.patientsAssigned.push(patient._id);
      await doctor.save();
    }

    res.status(201).json({
      message: "Patient Escalated Successfully",
      patientId: patient._id,
    });
  } catch (error) {
    console.log("escalateToRegularPatient Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const assignDoctorToEmergencyPatient = async (req, res) => {
  const { id } = req.params;
  const { doctorId } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid EmergencyPatient ID" });
  }

  if (!isValidObjectId(doctorId)) {
    return res.status(400).json({ error: "Invalid Doctor ID" });
  }

  try {
    const emergencyPatient = await EmergencyPatient.findById(id);
    if (!emergencyPatient) {
      return res.status(404).json({ error: "Emergency patient not found" });
    }

    const doctor = await Doctor.findById(doctorId).populate(
      "staffId",
      "isActive"
    );
    if (!doctor || !doctor.staffId?.isActive) {
      return res.status(400).json({ error: "Doctor not found or inactive" });
    }

    if (emergencyPatient.assignedDoctorId?.toString() === doctorId) {
      return res
        .status(400)
        .json({ error: "Doctor already assigned to this emergency patient" });
    }

    emergencyPatient.assignedDoctorId = doctorId;
    await emergencyPatient.save();

    res.status(200).json({
      message: "Doctor assigned successfully to emergency patient",
      assignedDoctorId: doctorId,
    });
  } catch (error) {
    console.error("assignDoctorToEmergencyPatient Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
