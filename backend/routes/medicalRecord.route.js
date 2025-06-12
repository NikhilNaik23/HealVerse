import express from "express";
import {
  validateMedicalRecord,
  validateObjectId,
} from "../middlewares/validations.js";
import {
  createMedicalRecord,
  deleteMedicalRecord,
  getAllRecords,
  getMedicalRecordById,
  getMedicalRecordsForLoggedInPatient,
  updateMedicalRecord,
  uploadReports,
} from "../controllers/medicalRecord.controller.js";
import {
  adminRoute,
  authorizePatientOrStaff,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
const router = express.Router();

// @route POST /api/medical-records/
// @desc create a medical record
// @access ADMIN/DOCTOR/RECEPTIONIST/PRIVATE
router.post(
  "/",
  protectRoute,
  authorizeRoles("doctor", "receptionist","admin"),
  validateMedicalRecord,
  createMedicalRecord
)

// @route GET /api/medical-records/
// @desc get all medical records
// @access Admin/PRIVATE
router.get(
  "/",
  protectRoute,
  adminRoute,
  getAllRecords
);

// @route GET /api/medical-records/:id
// @desc fetching patient details
// @access Doctor/Admin/Patient/PRIVATE
router.get(
  "/patient",
  protectRoute,
  getMedicalRecordsForLoggedInPatient
);


// @route GET /api/medical-records/:id
// @desc get a specific medical record
// @access Doctor/Admin/PRIVATE
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  validateObjectId,
  getMedicalRecordById
);

// @route PUT /api/medical-records/:id
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

// @route PUT /api/medical-records/:id/attachments
// @desc upload reports in a record
// @access ADMIN/DOCTOR/NURSE/PRIVATE

router.put(
  "/:id/attachments",
  protectRoute,
  authorizeRoles("doctor", "admin", "nurse"),
  validateObjectId,
  uploadReports
);

// @route PATCH /api/medical-records/:id/delete
// @desc delete a medical record
// @access ADMIN/PRIVATE

router.patch("/:id/delete", protectRoute, adminRoute, deleteMedicalRecord);

export default router;
