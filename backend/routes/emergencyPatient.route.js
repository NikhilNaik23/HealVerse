import express from "express";
import { authorizeRoles, protectRoute } from "../middlewares/protectRoute.js";
import {
  assignDoctorToEmergencyPatient,
  createEmergencyPatient,
  escalateToRegularPatient,
  getAllEmergencyPatient,
} from "../controllers/emergencyPatient.controller.js";
import {
  validateEmergencyPatient,
  validatePatientAdminRegister,
} from "../middlewares/validations.js";
const router = express.Router();

// @route POST /api/emergency-patients/
// @desc create a emergencyPatient
// @access Receptionist/EmergencyStaff/Admin/Private
router.post(
  "/",
  protectRoute,
  authorizeRoles("admin", "emergencyStaff", "receptionist"),
  validateEmergencyPatient,
  createEmergencyPatient
);

// @route GET /api/emergency-patients/
// @desc get all emergency patient with filters
// @access Admin/Receptionist/Doctor/Private
router.get(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist", "doctor"),
  getAllEmergencyPatient
);

// @route   POST /api/emergency-patients/:id/escalate
// @desc    Escalate an emergency patient to a regular patient
// @access  Admin, Emergency Staff, Receptionist (Private)
router.post(
  "/:id/escalate",
  protectRoute,
  authorizeRoles("admin", "emergencyStaff", "receptionist"),
  validatePatientAdminRegister,
  escalateToRegularPatient
);

// @route   POST /api/emergency-patients/:id/assignDoctor
// @desc    Assign a doctor to an emergency patient case
// @access  Admin, Emergency Staff, Receptionist (Private)
router.patch(
  "/:id/assignDoctor",
  protectRoute,
  authorizeRoles("admin", "emergencyStaff", "receptionist"),
  assignDoctorToEmergencyPatient
);

export default router;
