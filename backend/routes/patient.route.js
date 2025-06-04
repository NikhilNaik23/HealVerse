import express from "express";
import {
  assignDoctor,
  createPatient,
  deletePatient,
  getAllPatients,
  getPatientById,
  updateDischargeDate,
  updatePatient,
  updatePatientStatus,
} from "../controllers/patient.controller.js";
import {
  validateObjectId,
  validatePatientAdminRegister,
} from "../middlewares/validations.js";
import upload from "../middlewares/upload.js";
const router = express.Router();

// @route   POST /api/patient/
// @desc    Create a new patient record with optional medical documents
// @access  Admin/Private
router.post(
  "/",
  upload.array("medicalDocuments"),
  validatePatientAdminRegister,
  createPatient
);

// @route   GET /api/patient/
// @desc    Get all patients (with optional filters like name, doctor, etc.)
// @access  Admin/Receptionist/Doctor/Private
router.get("/", getAllPatients);

// @route GET /api/patient/:id
// @desc Get a specific patient
// @access Admin/Receptionist/Doctor/Private
router.get("/:id", validateObjectId,getPatientById);

// @route GET /api/patient/:id
// @desc Get a specific patient
// @access Admin/Private
router.put("/:id", validateObjectId,validatePatientAdminRegister, updatePatient);

// @route DELETE /api/patient/:id
// @desc delete a specific patient
// @access Admin/Private
router.delete("/:id", validateObjectId, deletePatient);

// @route PATCH /api/patient/:id/status
// @desc update a patient status
// @access Admin/Receptionist/Private
router.patch("/:id/status", validateObjectId, updatePatientStatus);

// @route PATCH /api/patient/:id/discharge
// @desc update a patient's discharge date
// @access Admin/Receptionist/Private
router.patch("/:id/discharge", validateObjectId, updateDischargeDate);

// @route PATCH /api/patient/:id/discharge
// @desc assign a doctor to patient
// @access Admin/Receptionist/Private
router.patch("/:id/assign-doctor", validateObjectId, assignDoctor);

export default router;
