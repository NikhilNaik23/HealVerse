import express from "express";
import {
  cancelAppointment,
  createAppointment,
  deleteAppointment,
  getAllAppointments,
  getAppointmentById,
  getTodayAppointmentsForDoctor,
  getUpcomingAppointments,
  getUserAppointments,
  rescheduleAppointment,
  updateAppointmentStatus,
} from "../controllers/appointment.controller.js";
import {
  validateAppointment,
  validateObjectId,
} from "../middlewares/validations.js";

import {
  protectRoute,
  authorizeRoles,
  authorizeUser,
  authorizePatientOrStaff,
  adminRoute,
} from "../middlewares/protectRoute.js";

const router = express.Router();

// @route POST /api/appointment/
// @desc create a appointment
// @access Admin/Receptionist/EmergencyStaff/Private
router.post(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist", "emergencyStaff"),
  validateAppointment,
  createAppointment
);

// @route GET /api/appointment
// @desc get all appointments
// @access Admin/Receptionist/Private
router.get(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  getAllAppointments
);

// @route GET /api/appointment/upcoming
// @desc get all upcoming appointments
// @access Admin/Receptionist/Private
router.get(
  "/upcoming",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  getUpcomingAppointments
);

// @route GET /api/appointment/id
// @desc get a specific appointment
// @access Admin Only (Strict Middleware)
router.get(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  getAppointmentById
);

// @route DELETE /api/appointment/id
// @desc delete a specific appointment (admin only)
// @access Admin Only (Strict Middleware)
router.delete(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  deleteAppointment
);

// @route GET /api/appointment/user/:id/upcoming
// @desc get upcoming appointments of a specific user through authId (patient/doctor)
// @access USERS/Private
router.get("/my/upcoming", protectRoute, getUserAppointments);

// @route GET /api/appointment/doctor/:id/daily-summary
// @desc get today's appointments for the logged-in doctor
// @access Admin/Doctor/Private
router.get(
  "/doctor/daily-summary",
  protectRoute,
  authorizeRoles("doctor"),
  getTodayAppointmentsForDoctor
);

// @route PATCH /api/appointment/id/update-status
// @desc update an appointment's status
// @access Admin/Receptionist/Private
router.patch(
  "/:id/update-status",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  updateAppointmentStatus
);

// @route PUT /api/appointment/id/update-status
// @desc reschedule a specific appointment
// @access Admin/Receptionist/Private
router.put(
  "/:id/reschedule",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  rescheduleAppointment
);

// @route PATCH /api/appointment/:id/cancel
// @desc cancel a specific appointment
// @access Admin/Receptionist/Private
router.patch(
  "/:id/cancel",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  cancelAppointment
);

export default router;
