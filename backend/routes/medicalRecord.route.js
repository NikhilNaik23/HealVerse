import express from "express";
import {
  validateMedicalRecord,
  validateObjectId,
} from "../middlewares/validations.js";
import {
  createMedicalRecord,
  getMedicalRecordById,
  getMedicalRecordsByPatient,
  updateMedicalRecord,
} from "../controllers/medicalRecord.controller.js";
import {
  authorizePatientOrStaff,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
const router = express.Router();

// @route POST /api/medicalRecords/
// @desc create a medical record
// @access DOCTOR/RECEPTIONIST/PRIVATE
router.post(
  "/",
  protectRoute,
  authorizeRoles("doctor", "receptionist"),
  validateMedicalRecord,
  createMedicalRecord
);

// @route GET /api/medicalRecords/:id
// @desc get a specific medical record
// @access Doctor/Admin/Patient/PRIVATE
router.get(
  "/patient/:id",
  protectRoute,
  authorizePatientOrStaff,
  validateObjectId,
  getMedicalRecordsByPatient
);

// @route GET /api/medicalRecords/:id
// @desc get a specific medical record
// @access Doctor/Admin/PRIVATE
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  validateObjectId,
  getMedicalRecordById
);

// @route PUT /api/medicalRecords/:id
// @desc update a specific medical record
// @access Doctor/Admin/PRIVATE
router.put(
  "/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  validateObjectId,
  validateMedicalRecord,
  updateMedicalRecord
);

export default router;
