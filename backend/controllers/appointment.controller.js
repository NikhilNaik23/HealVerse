import mongoose from "mongoose";
import moment from "moment";

import Doctor from "../models/doctor.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import { isDoctorAvailable } from "../lib/utils/checkDoctorAvailability.js";

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createAppointment = async (req, res) => {
  const { patientId, doctorId, departmentId, date, time, reason } = req.body;

  if (!validateObjectId(patientId))
    return res.status(400).json({ message: "Invalid Patient Id" });
  if (!validateObjectId(doctorId))
    return res.status(400).json({ message: "Invalid Doctor Id" });
  if (!validateObjectId(departmentId))
    return res.status(400).json({ message: "Invalid Department Id" });

  if (!date || !time)
    return res
      .status(400)
      .json({ message: "Appointment date and time are required." });

  const requestedDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
  if (!requestedDateTime.isValid())
    return res.status(400).json({ message: "Invalid date or time format." });

  if (requestedDateTime.isBefore(moment())) {
    return res
      .status(400)
      .json({ message: "Appointment must be scheduled for a future time." });
  }
  try {
    const doctor = await Doctor.findById(doctorId).populate(
      "staffId",
      "name role isActive workingHours departmentId"
    );
    if (!doctor || !doctor.staffId || !doctor.staffId.isActive)
      return res
        .status(404)
        .json({ message: "Doctor does not exist or is inactive." });

    const patient = await Patient.findById(patientId);
    if (!patient)
      return res.status(404).json({ message: "Patient does not exist." });

    if (!patient.departmentId) {
      return res
        .status(400)
        .json({ message: "Patient has no department assigned." });
    }

    if (
      !doctor.staffId.departmentId ||
      !patient.departmentId ||
      doctor.staffId.departmentId.toString() !== departmentId ||
      patient.departmentId.toString() !== departmentId
    ) {
      return res
        .status(400)
        .json({ message: "Department mismatch for appointment." });
    }

    if (!patient.assignedDoctorId) {
      return res
        .status(400)
        .json({ message: "Patient has no assigned doctor yet." });
    }
    const assignedDoctorIdStr = patient.assignedDoctorId.toString();
    const requestedDoctorIdStr = doctorId.toString();

    if (requestedDoctorIdStr !== assignedDoctorIdStr) {
      const assignedDoctor = await Doctor.findById(
        assignedDoctorIdStr
      ).populate("staffId", "name role isActive workingHours departmentId");
      if (
        !assignedDoctor ||
        !assignedDoctor.staffId ||
        !assignedDoctor.staffId.isActive
      ) {
        return res
          .status(400)
          .json({ message: "Assigned doctor does not exist or is inactive." });
      }

      if (
        !assignedDoctor.staffId.departmentId ||
        assignedDoctor.staffId.departmentId.toString() !== departmentId
      ) {
        return res
          .status(400)
          .json({ message: "Assigned doctor department mismatch." });
      }

      const isAssignedDocAvailable = isDoctorAvailable(
        assignedDoctor.staffId.workingHours,
        requestedDateTime
      );

      const assignedDocBooked = await Appointment.findOne({
        doctorId: assignedDoctorIdStr,
        date,
        time,
        status: { $ne: "cancelled" },
      });

      if (isAssignedDocAvailable && !assignedDocBooked) {
        return res.status(400).json({
          message:
            "Appointment must be with the assigned doctor unless they are unavailable.",
        });
      }
    }

    const isAvailable = isDoctorAvailable(
      doctor.staffId.workingHours,
      requestedDateTime
    );
    if (!isAvailable)
      return res
        .status(400)
        .json({ message: "Doctor not available at this time." });

    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: "cancelled" },
    });
    if (existingAppointment)
      return res
        .status(400)
        .json({ message: "Doctor already booked at this time." });

    const existingAppointmentOfPatient = await Appointment.findOne({
      patientId,
      date,
      time,
      status: { $ne: "cancelled" },
    });
    if (existingAppointmentOfPatient)
      return res
        .status(400)
        .json({ message: "Patient already booked at this time." });

    const newAppointment = await Appointment.create({
      patientId,
      doctorId,
      departmentId,
      date,
      time,
      reason,
      status: "scheduled",
    });

    return res.status(201).json({
      message: "Appointment created successfully.",
      appointment: newAppointment,
    });
  } catch (error) {
    console.error("createAppointment Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAllAppointments = async (req, res) => {
  try {
    const { patientId, doctorId, departmentId, date, status } = req.query;
    const filters = {};
    if (patientId && validateObjectId(patientId)) {
      filters.patientId = patientId;
    }
    if (doctorId && validateObjectId(doctorId)) {
      filters.doctorId = doctorId;
    }
    if (departmentId && validateObjectId(departmentId)) {
      filters.departmentId = departmentId;
    }
    if (date) {
      filters.date = date;
    }
    if (status && ["scheduled", "completed", "cancelled"].includes(status)) {
      filters.status = status;
    }
    const appointments = await Appointment.find(filters)
      .lean()
      .populate("patientId", "name email")
      .populate("doctorId", "staffId")
      .populate({
        path: "doctorId",
        populate: {
          path: "staffId",
          select: "name departmentId",
        },
      })
      .populate("departmentId", "name");
    if (!appointments || appointments.length === 0) {
      return res
        .status(200)
        .json({ message: "No Appointments Found", appointments: [] });
    }
    return res.status(200).json({
      message: "Appointments fetched successfully",
      appointmentCount: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("getAppointments Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const getAppointmentById = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findById(id)
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        select: "staffId specialization",
        populate: { path: "staffId", select: "name departmentId" },
      })

      .populate("departmentId", "name specialization");
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    return res
      .status(200)
      .json({ message: "Appointment fetched successfully", appointment });
  } catch (error) {
    console.error("getAppointmentById Error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!["scheduled", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    const appointment = await Appointment.findById(id)
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        select: "staffId",
        populate: {
          path: "staffId",
          select: "name",
        },
      });
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.status === status) {
      return res
        .status(409)
        .json({ message: `Status already is set to ${status}` });
    }
    appointment.status = status;
    await appointment.save();
    return res
      .status(200)
      .json({ message: "Appointment Status Updated", appointment });
  } catch (error) {}
};

export const updateAppointmentDetails = async (req, res) => {};
