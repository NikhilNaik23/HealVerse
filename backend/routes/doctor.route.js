import express from "express";
import {
  assignPatients,
  createDoctor,
  getAllDoctors,
  getAvailableDoctors,
  getDoctorById,
  getDoctorByStaffId,
  updateDoctor,
} from "../controllers/doctor.controller.js";
import {
  validateDoctor,
  validateObjectId,
} from "../middlewares/validations.js";
import {
  adminRoute,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
const router = express.Router();

// @route POST /api/doctor/
// @desc create a doc prof for a staff (admin only)
// @access Admin Only (Strict Middleware)
router.post("/", protectRoute, adminRoute, validateDoctor, createDoctor);

// @route GET /api/doctor/
// @desc get all doctors (admin, receptionist)
// @access Admin/Receptionist/Private
router.get(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  getAllDoctors
);

// @route GET /api/doctor/available
// @desc get all available doctors (admin, receptionist)
// @access Receptionist/Admin/Private
router.get(
  "/available",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  getAvailableDoctors
);

// @route GET /api/doctor/:id/staff
// @desc get a doctor by staff id (admin only)
// @access Admin Only (Strict Middleware)
router.get(
  "/:id/staff",
  protectRoute,
  adminRoute,
  validateObjectId,
  getDoctorByStaffId
);

// @route GET /api/doctor/:id
// @desc get a specific doctor (admin, receptionist)
// @access Receptionist/Admin/Private
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  getDoctorById
);

// @route PUT /api/doctor/:id
// @desc update a doctor (admin only)
// @access Admin Only (Strict Middleware)
router.put(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  validateDoctor,
  updateDoctor
);

// @route PUT /api/doctor/:doctorId/assignPatient/:patientId
// @desc assigning a patient to a doctor (admin, receptionist)
// @access Receptionist/Admin/Private
router.put(
  "/:doctorId/assignPatient/:patientId",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  assignPatients
);

export default router;
