import moment from "moment";
import Doctor from "../models/doctor.model.js";
import Staff from "../models/staff.model.js";
import Patient from "../models/patient.model.js";
import mongoose from "mongoose";
import Department from "../models/department.model.js";
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
    if (!staff) {
      return res.status(400).json({ message: "Invalid Staff Id" });
    }
    if (!staff.isActive) {
      return res
        .status(400)
        .json({ message: "Cannot assign doctor role to inactive staff" });
    }

    const existingStaffasDoctor = await Doctor.findOne({ staffId: staff._id });
    if (existingStaffasDoctor) {
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
          "Doctor specialization(s) do not match the staff's department specializations.",
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

    if (req.query.specialization) {
      filters.specialization = req.query.specialization;
    }
    if (req.query.qualification) {
      filters.qualification = req.query.qualification;
    }
    if (req.query.minExperience) {
      filters.experience = { $gte: Number(req.query.minExperience) };
    }

    if (req.query.isSurgeon !== undefined) {
      filters.isSurgeon = req.query.isSurgeon === "true";
    }

    const doctors = await Doctor.find(filters).populate({
      path: "staffId",
      select: "name role departmentId",
      populate: { path: "departmentId", select: "name" },
    });

    const msg =
      doctors.length === 0
        ? "No doctors found"
        : "Doctors fetched successfully";

    return res
      .status(200)
      .json({ message: msg, doctorCount: doctors.length, doctors });
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

    if (!doctor || !doctor.staffId || !doctor.staffId.isActive) {
      return res
        .status(400)
        .json({ message: "Doctor does not exist or is inactive" });
    }

    const { workingHours } = doctor.staffId;
    let isAvailable = false;

    if (
      workingHours &&
      workingHours.days &&
      workingHours.start &&
      workingHours.end
    ) {
      const today = moment().format("ddd");
      const now = moment();

      if (workingHours.days.includes(today)) {
        const [startHour, startMinute] = workingHours.start
          .split(":")
          .map(Number);
        const [endHour, endMinute] = workingHours.end.split(":").map(Number);

        const todayStart = moment().set({
          hour: startHour,
          minute: startMinute,
          second: 0,
          millisecond: 0,
        });

        const todayEnd = moment().set({
          hour: endHour,
          minute: endMinute,
          second: 0,
          millisecond: 0,
        });

        if (todayStart.isBefore(todayEnd)) {
          isAvailable = now.isBetween(todayStart, todayEnd);
        } else {
          isAvailable = now.isAfter(todayStart) || now.isBefore(todayEnd);
        }
      }
    }

    return res.status(200).json({
      message: "Doctor fetched successfully",
      doctor,
      isAvailable,
    });
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

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!doctor.staffId || !doctor.staffId.isActive) {
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
            "Updated specialization(s) do not match the staff's department specializations.",
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

    const today = moment().format("ddd");
    const now = moment();

    const availableDoctors = doctors.filter((doctor) => {
      const staff = doctor.staffId;
      if (!staff || !staff.isActive) return false;

      const { workingHours } = staff;
      if (
        !workingHours ||
        !workingHours.days ||
        !workingHours.start ||
        !workingHours.end
      )
        return false;

      if (!workingHours.days.includes(today)) return false;

      const [startHour, startMinute] = workingHours.start
        .split(":")
        .map(Number);
      const [endHour, endMinute] = workingHours.end.split(":").map(Number);

      const todayStart = moment().set({
        hour: startHour,
        minute: startMinute,
        second: 0,
        millisecond: 0,
      });
      const todayEnd = moment().set({
        hour: endHour,
        minute: endMinute,
        second: 0,
        millisecond: 0,
      });

      if (todayStart.isBefore(todayEnd)) {
        return now.isBetween(todayStart, todayEnd);
      } else {
        return now.isAfter(todayStart) || now.isBefore(todayEnd);
      }
    });

    if (availableDoctors.length === 0) {
      return res
        .status(200)
        .json({ message: "No doctors currently available", doctors: [] });
    }

    return res.status(200).json({
      message: "Available doctors fetched successfully",
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

    if (!doctor || !doctor.staffId || !doctor.staffId.isActive) {
      return res
        .status(404)
        .json({ message: "Doctor does not exist or is inactive" });
    }

    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ message: "Invalid Patient Id" });
    }

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
