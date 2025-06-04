import Doctor from "../models/doctor.model.js";
import Staff from "../models/staff.model.js";
import Patient from "../models/patient.model.js";
import mongoose from "mongoose";
import Department from "../models/department.model.js";
import moment from "moment";
import { isDoctorAvailable } from "../lib/utils/checkDoctorAvailability.js";

export const createDoctor = async (req, res) => {
  const {
    staffId,
    specialization,
    qualification,
    experience,
    patientsAssigned = [],
  } = req.body;
  try {
    const staff = await Staff.findById(staffId);
    if (!staff || !staff.isActive) {
      return res.status(400).json({ message: "Invalid or inactive Staff Id" });
    }

    const existingDoctor = await Doctor.findOne({ staffId });
    if (existingDoctor) {
      return res
        .status(400)
        .json({ message: "Doctor already exists for this staff" });
    }

    if (staff.role !== "doctor") {
      return res
        .status(400)
        .json({ message: "Staff is not assigned as a doctor" });
    }

    const department = await Department.findById(staff.departmentId);
    if (!department) {
      return res
        .status(400)
        .json({ message: "Department not found for this staff." });
    }

    const allSpecsValid = specialization.every((spec) =>
      department.specializations.includes(spec)
    );
    if (!allSpecsValid) {
      return res.status(400).json({
        message:
          "Doctor specialization(s) do not match department specializations.",
      });
    }

    const doctor = await Doctor.create({
      staffId,
      specialization,
      qualification,
      experience,
      patientsAssigned,
    });
    return res
      .status(201)
      .json({ message: "Doctor Created Successfully", doctor });
  } catch (error) {
    console.error("createDoctor Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllDoctors = async (req, res) => {
  try {
    const filters = {};
    if (req.query.specialization)
      filters.specialization = req.query.specialization;
    if (req.query.qualification)
      filters.qualification = req.query.qualification;
    if (req.query.minExperience)
      filters.experience = { $gte: Number(req.query.minExperience) };
    if (req.query.isSurgeon !== undefined)
      filters.isSurgeon = req.query.isSurgeon === "true";

    const doctors = await Doctor.find(filters).populate({
      path: "staffId",
      select: "name role departmentId",
      populate: { path: "departmentId", select: "name" },
    });

    const message = doctors.length
      ? "Doctors fetched successfully"
      : "No doctors found";
    return res
      .status(200)
      .json({ message, doctorCount: doctors.length, doctors });
  } catch (error) {
    console.error("getAllDoctors Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDoctorById = async (req, res) => {
  const { id } = req.params;
  try {
    const doctor = await Doctor.findById(id).populate({
      path: "staffId",
      select: "name email role departmentId isActive workingHours",
      populate: { path: "departmentId", select: "name" },
    });

    if (!doctor || !doctor.staffId?.isActive) {
      return res
        .status(400)
        .json({ message: "Doctor does not exist or is inactive" });
    }

    const requestedDateTime = moment();
    const isAvailable = isDoctorAvailable(
      doctor.staffId.workingHours,
      requestedDateTime
    );
    return res
      .status(200)
      .json({ message: "Doctor fetched successfully", doctor, isAvailable });
  } catch (error) {
    console.error("getDoctorById Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDoctor = async (req, res) => {
  const { id } = req.params;
  const {
    specialization,
    qualification,
    experience,
    patientsAssigned,
    isSurgeon,
  } = req.body;

  try {
    const doctor = await Doctor.findById(id).populate("staffId");
    if (!doctor || !doctor.staffId?.isActive) {
      return res
        .status(400)
        .json({ message: "Associated staff is inactive or does not exist" });
    }

    if (specialization !== undefined) {
      const department = await Department.findById(doctor.staffId.departmentId);
      if (!department) {
        return res
          .status(400)
          .json({ message: "Department not found for this staff." });
      }
      const allSpecsValid = specialization.every((spec) =>
        department.specializations.includes(spec)
      );
      if (!allSpecsValid) {
        return res.status(400).json({
          message:
            "Updated specialization(s) do not match department specializations.",
        });
      }
      doctor.specialization = specialization;
    }

    if (qualification !== undefined) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = experience;
    if (patientsAssigned !== undefined)
      doctor.patientsAssigned = patientsAssigned;
    if (isSurgeon !== undefined) doctor.isSurgeon = isSurgeon;

    await doctor.save();
    return res
      .status(200)
      .json({ message: "Doctor updated successfully", doctor });
  } catch (error) {
    console.error("updateDoctor Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAvailableDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find().populate({
      path: "staffId",
      select: "name email role departmentId isActive workingHours",
      populate: { path: "departmentId", select: "name" },
    });

    const requestedDateTime = moment();

    const availableDoctors = doctors.filter((doc) => {
      const staff = doc.staffId;
      return (
        staff?.isActive &&
        isDoctorAvailable(staff.workingHours, requestedDateTime)
      );
    });

    const message = availableDoctors.length
      ? "Available doctors fetched successfully"
      : "No doctors currently available";
    return res.status(200).json({
      message,
      doctorCount: availableDoctors.length,
      doctors: availableDoctors,
    });
  } catch (error) {
    console.error("getAvailableDoctors Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const assignPatients = async (req, res) => {
  const { doctorId, patientId } = req.params;
  try {
    if (!doctorId || !patientId) {
      return res.status(400).json({ message: "All fields are required" });
    }
    if (
      !mongoose.Types.ObjectId.isValid(doctorId) ||
      !mongoose.Types.ObjectId.isValid(patientId)
    ) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    const doctor = await Doctor.findById(doctorId).populate({
      path: "staffId",
      select: "name role departmentId isActive",
    });
    if (!doctor || !doctor.staffId?.isActive) {
      return res
        .status(404)
        .json({ message: "Doctor does not exist or is inactive" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient)
      return res.status(404).json({ message: "Invalid Patient Id" });

    let patientUpdated = false;
    let doctorUpdated = false;

    if (
      !patient.departmentId ||
      patient.departmentId.toString() !== doctor.staffId.departmentId.toString()
    ) {
      patient.departmentId = doctor.staffId.departmentId;
      patientUpdated = true;
    }

    if (
      !patient.assignedDoctorId ||
      patient.assignedDoctorId.toString() !== doctorId
    ) {
      patient.assignedDoctorId = doctorId;
      patientUpdated = true;
    }

    if (!doctor.patientsAssigned.some((id) => id.toString() === patientId)) {
      doctor.patientsAssigned.push(patientId);
      doctorUpdated = true;
    }

    if (patientUpdated) await patient.save();
    if (doctorUpdated) await doctor.save();

    return res.status(200).json({
      message: "Patient successfully assigned to doctor",
      doctor,
      patient,
    });
  } catch (error) {
    console.error("assignPatients Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getDoctorByStaffId = async (req, res) => {
  const { id } = req.params;
  try {
    const staff = await Staff.findOne({ _id: id, isActive: true });
    if (!staff) {
      return res
        .status(404)
        .json({ message: "Staff does not exist or is inactive" });
    }

    const doctor = await Doctor.findOne({ staffId: staff._id }).populate({
      path: "staffId",
      select: "name email role departmentId isActive workingHours",
      populate: { path: "departmentId", select: "name" },
    });

    if (!doctor) {
      return res
        .status(400)
        .json({ message: "Staff is not assigned as a doctor" });
    }

    return res
      .status(200)
      .json({ message: "Doctor details fetched successfully", doctor });
  } catch (error) {
    console.error("getDoctorByStaffId Error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
