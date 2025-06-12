import express from "express";
import {
  createPrescription,
  deletePrescriptionById,
  getPrescriptionById,
  getPrescriptions,
  getPrescriptionsByPatient,
  updatePrescription,
} from "../controllers/prescription.controller.js";
import {
  authorizeRoles,
  patientOnly,
  protectRoute,
} from "../middlewares/protectRoute.js";
import {
  validateObjectId,
  validatePrescription,
} from "../middlewares/validations.js";
const router = express.Router();

// @route POST /api/prescriptions/
// @desc create a presciption
// @access Doctor/Nurse/Private
router.post(
  "/",
  protectRoute,
  authorizeRoles("doctor", "nurse"),
  validatePrescription,
  createPrescription
);

// @route GET /api/prescriptions/
// @desc get all presciptions
// @access Nurse/Admin/Private
router.post(
  "/",
  protectRoute,
  authorizeRoles("nurse", "admin"),
  getPrescriptions
);

// @route GET /api/prescriptions/patient
// @desc Get all prescriptions for the logged-in patient
// @access Patient/Private
router.get("/patient", protectRoute, patientOnly, getPrescriptionsByPatient);

// @route GET /api/prescriptions/:id
// @desc get a specific prescription
// @access Doctor/Receptionist/Admin/Private
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("doctor", "receptionist", "admin"),
  validateObjectId,
  getPrescriptionById
);

// @route PUT /api/prescriptions/:id
// @desc update a specific prescription
// @access Doctor/Private
router.put(
  "/:id",
  protectRoute,
  authorizeRoles("doctor"),
  validateObjectId,
  updatePrescription
);

// @route PATCH /api/prescriptions/:id/delete
// @desc soft delete a prescription
// @access Doctor/Private
router.patch(
  "/:id/delete",
  protectRoute,
  authorizeRoles("doctor"),
  validateObjectId,
  deletePrescriptionById
);

export default router;
