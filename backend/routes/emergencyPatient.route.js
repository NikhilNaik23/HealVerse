import express from "express";
import { authorizeRoles, protectRoute } from "../middlewares/protectRoute.js";
import { createEmergencyPatient } from "../controllers/emergencyPatient.controller.js";
const router = express.Router();

// @route POST /api/emergency-patients/
// @desc create a emergencyPatient
// @access Receptionist/EmergencyStaff/Admin/Private
router.post(
  "/",
  protectRoute,
  authorizeRoles("admin", "emergencyStaff","receptionist"),
  createEmergencyPatient
);

// @route GET /api/emergency-patients/
// @desc get all emergency patient with filters
// @access Admin/Receptionist/Doctor

export default router;
