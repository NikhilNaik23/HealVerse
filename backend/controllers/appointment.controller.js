import mongoose from "mongoose";
import moment from "moment";

import Doctor from "../models/doctor.model.js";
import Auth from "../models/auth.model.js";
import Patient from "../models/patient.model.js";
import Appointment from "../models/appointment.model.js";
import { isDoctorAvailable } from "../lib/utils/checkDoctorAvailability.js";

const validateObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createAppointment = async (req, res) => {
  const { patientId, doctorId, departmentId, date, time, reason } = req.body;

  if (!validateObjectId(patientId))
    return res.status(400).json({ error: "Invalid Patient Id" });
  if (!validateObjectId(doctorId))
    return res.status(400).json({ error: "Invalid Doctor Id" });
  if (!validateObjectId(departmentId))
    return res.status(400).json({ error: "Invalid Department Id" });

  if (!date || !time)
    return res
      .status(400)
      .json({ error: "Appointment date and time are required." });

  const requestedDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
  if (!requestedDateTime.isValid())
    return res.status(400).json({ error: "Invalid date or time format." });

  if (requestedDateTime.isBefore(moment())) {
    return res
      .status(400)
      .json({ error: "Appointment must be scheduled for a future time." });
  }
  try {
    const doctor = await Doctor.findById(doctorId).populate(
      "staffId",
      "name role isActive workingHours departmentId"
    );
    if (!doctor || !doctor.staffId || !doctor.staffId.isActive)
      return res
        .status(404)
        .json({ error: "Doctor does not exist or is inactive." });

    const patient = await Patient.findById(patientId);
    if (!patient)
      return res.status(404).json({ error: "Patient does not exist." });

    if (!patient.departmentId) {
      return res
        .status(400)
        .json({ error: "Patient has no department assigned." });
    }

    if (
      !doctor.staffId.departmentId ||
      !patient.departmentId ||
      doctor.staffId.departmentId.toString() !== departmentId ||
      patient.departmentId.toString() !== departmentId
    ) {
      return res
        .status(400)
        .json({ error: "Department mismatch for appointment." });
    }

    if (!patient.assignedDoctorId) {
      return res
        .status(400)
        .json({ error: "Patient has no assigned doctor yet." });
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
          .json({ error: "Assigned doctor does not exist or is inactive." });
      }

      if (
        !assignedDoctor.staffId.departmentId ||
        assignedDoctor.staffId.departmentId.toString() !== departmentId
      ) {
        return res
          .status(400)
          .json({ error: "Assigned doctor department mismatch." });
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
          error:
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
        .json({ error: "Doctor not available at this time." });

    const existingAppointment = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: "cancelled" },
    });
    if (existingAppointment)
      return res
        .status(400)
        .json({ error: "Doctor already booked at this time." });

    const existingAppointmentOfPatient = await Appointment.findOne({
      patientId,
      date,
      time,
      status: { $ne: "cancelled" },
    });
    if (existingAppointmentOfPatient)
      return res
        .status(400)
        .json({ error: "Patient already booked at this time." });

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
    return res.status(500).json({ error: "Internal server error" });
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
    return res.status(500).json({ error: "Internal server error" });
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
      return res.status(404).json({ error: "Appointment not found" });
    }
    return res
      .status(200)
      .json({ message: "Appointment fetched successfully", appointment });
  } catch (error) {
    console.error("getAppointmentById Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const updateAppointmentStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    if (!["scheduled", "completed", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
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
      return res.status(404).json({ error: "Appointment not found" });
    }
    if (appointment.status === status) {
      return res
        .status(409)
        .json({ error: `Status already is set to ${status}` });
    }
    if (appointment.status === "cancelled" && status === "completed") {
      return res
        .status(400)
        .json({ error: "Cannot mark a cancelled appointment as completed" });
    }
    appointment.status = status;
    await appointment.save();
    return res
      .status(200)
      .json({ message: "Appointment Status Updated", appointment });
  } catch (error) {
    console.error("updateAppointmentStatus Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const rescheduleAppointment = async (req, res) => {
  const { id } = req.params;
  const { date, time } = req.body;

  if (!date || !time) {
    return res
      .status(400)
      .json({ error: "New appointment date and time are required." });
  }

  const newDateTime = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm");
  if (!newDateTime.isValid()) {
    return res.status(400).json({ error: "Invalid date or time format." });
  }

  if (newDateTime.isBefore(moment())) {
    return res
      .status(400)
      .json({ error: "Rescheduled appointment must be for a future time." });
  }

  try {
    const appointment = await Appointment.findById(id)
      .populate({
        path: "doctorId",
        populate: {
          path: "staffId",
          select: "workingHours isActive",
        },
      })
      .populate("patientId");

    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found." });
    }

    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Cannot reschedule a cancelled appointment." });
    }

    const isSameDate = moment(appointment.date).isSame(date, "day");
    const isSameTime = appointment.time === time;

    if (isSameDate && isSameTime) {
      return res
        .status(409)
        .json({ error: "Appointment is already scheduled for this time." });
    }

    const doctor = appointment.doctorId;
    const patient = appointment.patientId;

    if (!doctor || !doctor.staffId?.isActive) {
      return res
        .status(400)
        .json({ error: "Doctor does not exist or is inactive." });
    }

    const isAvailable = isDoctorAvailable(
      doctor.staffId.workingHours,
      newDateTime
    );
    if (!isAvailable) {
      return res
        .status(400)
        .json({ error: "Doctor not available at the new requested time." });
    }

    const doctorId = doctor._id.toString();
    const patientId = patient._id.toString();

    const conflict = await Appointment.findOne({
      doctorId,
      date,
      time,
      status: { $ne: "cancelled" },
      _id: { $ne: id },
    });
    if (conflict) {
      return res
        .status(400)
        .json({ error: "Doctor is already booked at the new requested time." });
    }

    const patientConflict = await Appointment.findOne({
      patientId,
      date,
      time,
      status: { $ne: "cancelled" },
      _id: { $ne: id },
    });
    if (patientConflict) {
      return res.status(400).json({
        error: "Patient is already booked at the new requested time.",
      });
    }

    appointment.date = date;
    appointment.time = time;
    await appointment.save();

    return res.status(200).json({
      message: "Appointment rescheduled successfully.",
      appointment,
    });
  } catch (error) {
    console.error("rescheduleAppointment Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ error: "Appointment has already been cancelled." });
    }
    if (appointment.status === "completed") {
      return res
        .status(400)
        .json({ error: "Appointment has already been completed" });
    }
    appointment.status = "cancelled";
    await appointment.save();
    return res
      .status(200)
      .json({ message: "Appointment Cancelled Successfully" });
  } catch (error) {
    console.error("cancelAppointment Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUpcomingAppointments = async (req, res) => {
  try {
    const filters = {
      date: { $gte: moment().format("YYYY-MM-DD") },
      status: "scheduled",
    };

    const { doctorId, patientId, departmentId } = req.query;
    if (doctorId && validateObjectId(doctorId)) filters.doctorId = doctorId;
    if (patientId && validateObjectId(patientId)) filters.patientId = patientId;
    if (departmentId && validateObjectId(departmentId))
      filters.departmentId = departmentId;

    const appointments = await Appointment.find(filters)
      .sort({ date: 1 })
      .lean()
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        populate: {
          path: "staffId",
          select: "name departmentId",
        },
      })
      .populate("departmentId", "name");

    if (!appointments.length) {
      return res
        .status(200)
        .json({ message: "No Upcoming Appointments", appointments: [] });
    }

    return res.status(200).json({
      message: "Upcoming appointments fetched successfully",
      appointmentCount: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("getUpcomingAppointments: ", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserAppointments = async (req, res) => {
  try {
    const id = req.user.auth?._id;
    const user = await Auth.findById(id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const role = user.role;
    const linkedId = user.linkedProfileId;
    if (!linkedId) {
      return res.status(400).json({ error: "Linked profile ID missing" });
    }
    const today = moment().format("YYYY-MM-DD");

    const query = {
      date: { $gte: today },
      status: "scheduled",
    };

    if (role === "Patient") {
      query.patientId = linkedId;
    } else if (role === "Staff") {
      const doctor = await Doctor.findOne({ staffId: linkedId });
      if (!doctor) {
        return res
          .status(404)
          .json({ error: "Doctor profile not found for this staff" });
      }

      query.doctorId = doctor._id;
    } else {
      return res
        .status(400)
        .json({ error: "Invalid user role for fetching appointments" });
    }

    const appointments = await Appointment.find(query)
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

    if (appointments.length === 0) {
      return res.status(200).json({
        message: "No appointments are scheduled for the upcoming days",
        appointments: [],
      });
    }

    return res.status(200).json({
      message: "Appointments fetched successfully",
      appointments,
    });
  } catch (error) {
    console.error("getUserAppointments Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTodayAppointmentsForDoctor = async (req, res) => {
  const id = req.user.auth?._id;
  const today = moment().format("YYYY-MM-DD");
  try {
    const auth = await Auth.findById(id);
    if (!auth || auth.role !== "Staff") {
      return res.status(404).json({ error: "Staff not found" });
    }
    const doctor = await Doctor.findOne({ staffId: auth.linkedProfileId });
    if (!doctor) {
      return res
        .status(404)
        .json({ error: "Doctor profile not found for this staff" });
    }
    const appointments = await Appointment.find({
      date: today,
      doctorId: doctor._id,
    });
    if (appointments.length === 0) {
      return res.status(200).json({
        message: "No appointments are scheduled for the upcoming days",
        appointments: [],
      });
    }

    return res.status(200).json({
      message: "Appointments fetched successfully",
      appointments,
    });
  } catch (error) {
    console.error("getTodayAppointmentsForDoctor Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteAppointment = async (req, res) => {
  const { id } = req.params;
  try {
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    await appointment.deleteOne();
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("deleteAppointment Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
