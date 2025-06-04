import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";

import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";

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
    const existingPatient = await Patient.findOne({
      $or: [{ phone }, { email }],
    });

    if (existingPatient) {
      return res
        .status(409)
        .json({ message: "Patient already exists with this phone or email" });
    }

    if (assignedDoctorId && !isValidObjectId(assignedDoctorId)) {
      return res.status(400).json({ message: "Invalid assignedDoctorId" });
    }

    if (departmentId && !isValidObjectId(departmentId)) {
      return res.status(400).json({ message: "Invalid departmentId" });
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

    res.status(201).json({
      message: "Patient Created Successfully",
      patientId: patient._id,
    });
  } catch (error) {
    console.error("createPatient Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
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
    console.error("getAllPatients Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getPatientById = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(404).json({ message: "Invalid Patient Id" });
  }
  try {
    const patient = await Patient.findById(id)
      .populate("assignedDoctorId", "staffId")
      .populate("departmentId", "name");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    return res
      .status(200)
      .json({ message: "Patient fetched successfully", patient });
  } catch (error) {
    console.error("getPatientById Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePatient = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Patient Id" });
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
      return res.status(404).json({ message: "Patient not found" });
    }
    if (email && email !== patient.email) {
      const emailExists = await Patient.findOne({ email });
      if (emailExists) {
        return res.status(409).json({ message: "Email already in use." });
      }
    }

    if (assignedDoctorId && !isValidObjectId(assignedDoctorId)) {
      return res.status(400).json({ message: "Invalid assignedDoctorId" });
    }
    if (departmentId && !isValidObjectId(departmentId)) {
      return res.status(400).json({ message: "Invalid departmentId" });
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
    console.error("updatePatient Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deletePatient = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid Patient Id" });
  }

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
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
    console.error("deletePatient Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updatePatientStatus = async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Patient Id" });
  }
  try {
    const { currentStatus } = req.body;
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    if (patient.currentStatus === currentStatus) {
      return res
        .status(400)
        .json({ message: `patient already marked as ${currentStatus}` });
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
    console.error("updatePatientStatus Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDischargeDate = async (req, res) => {
  const { id } = req.params;
  const { dischargeDate } = req.body;

  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Patient Id" });
  }

  const discharge = dischargeDate ? new Date(dischargeDate) : new Date();
  if (isNaN(discharge.getTime())) {
    return res.status(400).json({ message: "Invalid discharge date format" });
  }

  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    if (patient.admissionDate && discharge < patient.admissionDate) {
      return res.status(400).json({
        message: "Discharge date cannot be before admission date",
      });
    }
    if (patient.currentStatus === "discharged") {
      return res.status(400).json({
        message: "Already discharged",
      });
    }

    patient.dischargeDate = discharge;
    patient.currentStatus = "discharged";
    await patient.save();

    return res.status(200).json({
      message: "Discharge date and status updated successfully",
      patient,
    });
  } catch (error) {
    console.error("updateDischargeDate Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignDoctor = async (req, res) => {
  const { id } = req.params;
  const { doctorId } = req.body;
  if (!isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid Patient Id" });
  }
  if (!isValidObjectId(doctorId)) {
    return res.status(400).json({ message: "Invalid Doctor Id" });
  }
  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    const doctor = await Doctor.findById(doctorId).populate({
      path: "staffId",
      select: "name role departmentId isActive",
    });
    if (!doctor || !doctor.staffId || !doctor.staffId.isActive) {
      return res
        .status(400)
        .json({ message: "Doctor does not exist or is inactive" });
    }
    if (patient.assignedDoctorId?.toString() === doctorId) {
      return res
        .status(400)
        .json({ message: "Doctor already assigned to this patient" });
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
    console.error("assignDoctor Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
