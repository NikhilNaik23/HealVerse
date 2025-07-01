import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Auth from "../models/auth.model.js";

import { sendEmail } from "../lib/utils/sendMail.js";

import crypto from "crypto";
import Bed from "../models/bed.model.js";

function generateRandomPassword(length = 12) {
  return crypto
    .randomBytes(length)
    .toString("base64")
    .slice(0, length)
    .replace(/\+/g, "A")
    .replace(/\//g, "B");
}

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createPatient = async (req, res) => {
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
    assignedDoctorId,
    departmentId,
  } = req.body;

  try {
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

    if (assignedDoctorId && !isValidObjectId(assignedDoctorId)) {
      return res.status(400).json({ error: "Invalid assignedDoctorId" });
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

    const patient = new Patient({
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
      assignedDoctorId,
      departmentId,
    });

    await patient.save();
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

    res.status(201).json({
      message: "Patient Created Successfully",
      patientId: patient._id,
    });
  } catch (error) {
    console.error("createPatient Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllPatients = async (req, res) => {
  try {
    const filters = {};
    const {
      name,
      email,
      phone,
      admissionDate,
      assignedDoctorId,
      departmentId,
      currentStatus,
    } = req.query;

    if (name) {
      filters.name = { $regex: name, $options: "i" };
    }

    if (email) filters.email = email;
    if (phone) filters.phone = phone;

    if (admissionDate) {
      const date = new Date(admissionDate);
      filters.admissionDate = {
        $gte: new Date(date.setHours(0, 0, 0, 0)),
        $lt: new Date(date.setHours(23, 59, 59, 999)),
      };
    }

    if (assignedDoctorId && isValidObjectId(assignedDoctorId)) {
      filters.assignedDoctorId = assignedDoctorId;
    }

    if (departmentId && isValidObjectId(departmentId)) {
      filters.departmentId = departmentId;
    }
    if (currentStatus) filters.currentStatus = currentStatus;

    const patients = await Patient.find(filters)
      .populate("assignedDoctorId", "name")
      .populate("departmentId", "name");

    const msg =
      !patients || patients.length === 0
        ? "No patients found"
        : "Patients fetched successfully";

    res
      .status(200)
      .json({ message: msg, patientCount: patients.length, patients });
  } catch (error) {
    console.error("getAllPatients Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPatientById = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ error: "Invalid Patient Id" });
  }
  try {
    const patient = await Patient.findById(id)
      .populate("assignedDoctorId", "staffId")
      .populate("departmentId", "name");

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    return res
      .status(200)
      .json({ message: "Patient fetched successfully", patient });
  } catch (error) {
    console.error("getPatientById Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updatePatient = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid Patient Id" });
  }

  const {
    name,
    dateOfBirth,
    gender,
    phone,
    email,
    linkedAuthId,
    address,
    emergencyContact,
    currentStatus,
    statusHistory,
    admissionDate,
    dischargeDate,
    assignedDoctorId,
    departmentId,
  } = req.body;

  try {
    const patient = await Patient.findById(id);

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (email && email !== patient.email) {
      const emailExists = await Patient.findOne({ email });
      if (emailExists) {
        return res.status(409).json({ error: "Email already in use." });
      }
    }

    if (assignedDoctorId && !isValidObjectId(assignedDoctorId)) {
      return res.status(400).json({ error: "Invalid assignedDoctorId" });
    }
    if (departmentId && !isValidObjectId(departmentId)) {
      return res.status(400).json({ error: "Invalid departmentId" });
    }

    if (name) patient.name = name;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (phone) patient.phone = phone;
    if (email) patient.email = email;
    if (linkedAuthId !== undefined) patient.linkedAuthId = linkedAuthId;
    if (address) patient.address = address;
    if (emergencyContact) patient.emergencyContact = emergencyContact;
    if (currentStatus) patient.currentStatus = currentStatus;
    if (statusHistory) patient.statusHistory = statusHistory;
    if (admissionDate) patient.admissionDate = admissionDate;
    if (dischargeDate) patient.dischargeDate = dischargeDate;
    if (assignedDoctorId) patient.assignedDoctorId = assignedDoctorId;
    if (departmentId) patient.departmentId = departmentId;

    if (req.files && req.files.length > 0) {
      const newDocs = req.files.map((file) => ({
        documentUrl: file.path,
        public_id: file.filename,
        documentType: file.mimetype.includes("pdf") ? "pdf" : "image",
        uploadedAt: new Date(),
        description: "",
      }));
      patient.medicalHistory = patient.medicalHistory.concat(newDocs);
    }

    await patient.save();

    return res
      .status(200)
      .json({ message: "Patient updated successfully", patient });
  } catch (error) {
    console.error("updatePatient Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePatient = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid Patient Id" });
  }

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    await Doctor.updateMany(
      { patientsAssigned: id },
      { $pull: { patientsAssigned: id } }
    );

    if (patient.medicalHistory && patient.medicalHistory.length > 0) {
      for (const doc of patient.medicalHistory) {
        if (doc.public_id) {
          await cloudinary.uploader.destroy(doc.public_id);
        }
      }
    }

    await Patient.findByIdAndDelete(id);
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    console.error("deletePatient Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updatePatientStatus = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid Patient Id" });
  }
  try {
    const { currentStatus } = req.body;
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (patient.currentStatus === currentStatus) {
      return res
        .status(400)
        .json({ error: `patient already marked as ${currentStatus}` });
    }
    patient.statusHistory.push({
      status: patient.currentStatus,
      updatedAt: Date.now(),
      updatedBy: req.user?._id || null,
    });
    patient.currentStatus = currentStatus;
    await patient.save();
    res
      .status(200)
      .json({ message: "Patient status updated successfully", patient });
  } catch (error) {
    console.error("updatePatientStatus Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateDischargeDate = async (req, res) => {
  const { id } = req.params;
  const { dischargeDate } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid Patient Id" });
  }

  const discharge = dischargeDate ? new Date(dischargeDate) : new Date();
  if (isNaN(discharge.getTime())) {
    return res.status(400).json({ error: "Invalid discharge date format" });
  }

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    if (patient.admissionDate && discharge < patient.admissionDate) {
      return res.status(400).json({
        error: "Discharge date cannot be before admission date",
      });
    }
    if (patient.currentStatus === "discharged") {
      return res.status(400).json({
        error: "Already discharged",
      });
    }

    patient.dischargeDate = discharge;
    patient.currentStatus = "discharged";
    const bed = await Bed.findOne({ patientId: patient._id });
    if (bed) {
      bed.isOccupied = false;
      bed.patientId = null;
      await bed.save();
      console.log(`Bed ${bed.bedNumber} freed from patient ${patient.name}`);
    }
    await patient.save();

    return res.status(200).json({
      message: "Discharge date and status updated successfully",
      patient,
    });
  } catch (error) {
    console.error("updateDischargeDate Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const assignDoctor = async (req, res) => {
  const { id } = req.params;
  const { doctorId } = req.body;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ error: "Invalid Patient Id" });
  }
  if (!isValidObjectId(doctorId)) {
    return res.status(400).json({ error: "Invalid Doctor Id" });
  }
  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    const doctor = await Doctor.findById(doctorId).populate({
      path: "staffId",
      select: "name role departmentId isActive",
    });
    if (!doctor || !doctor.staffId || !doctor.staffId.isActive) {
      return res
        .status(400)
        .json({ error: "Doctor does not exist or is inactive" });
    }
    if (patient.assignedDoctorId?.toString() === doctorId) {
      return res
        .status(400)
        .json({ error: "Doctor already assigned to this patient" });
    }

    if (patient.assignedDoctorId) {
      const prevDoctor = await Doctor.findById(patient.assignedDoctorId);
      if (prevDoctor) {
        prevDoctor.patientsAssigned = prevDoctor.patientsAssigned.filter(
          (pid) => pid.toString() !== id
        );
        await prevDoctor.save();
      }
    }
    patient.assignedDoctorId = doctorId;
    patient.departmentId = doctor.staffId.departmentId;
    if (!doctor.patientsAssigned.includes(id)) {
      doctor.patientsAssigned.push(id);
      await doctor.save();
    }
    await patient.save();

    res
      .status(200)
      .json({ message: "Successfully assigned a doctor to patient" });
  } catch (error) {
    console.error("assignDoctor Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
