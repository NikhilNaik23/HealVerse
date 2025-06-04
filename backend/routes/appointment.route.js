import express from "express";
import {
  createAppointment,
  getAllAppointments,
  getAppointmentById,
  updateAppointmentDetails,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";
import {
  validateAppointment,
  validateObjectId,
} from "../middlewares/validations.js";
const router = express.Router();

// @route POST /api/appointment/
// @desc create a appointment
// @access Admin/Receptionist/EmergencyStaff/Private
router.post("/", validateAppointment, createAppointment);

// @route GET /api/appointment
// @desc get all appointments
// @access Admin/Receptionist/Private
router.get("/", getAllAppointments);

// @route GET /api/appointment/id
// @desc get a specific appointment
// @access Admin/Private
router.get("/:id", validateObjectId, getAppointmentById);

// @route PATCH /api/appointment/id/update-status
// @desc update an appointment's status
// @access Admin/Private
router.patch("/:id/update-status", validateObjectId, updateAppointmentStatus);

// @route GET /api/appointment/id/update-status
// @desc get a specific appointment
// @access Admin/Private
router.put(
  "/:id",
  validateObjectId,
  validateAppointment,
  updateAppointmentDetails
);

export default router;
