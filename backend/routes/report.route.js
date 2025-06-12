import express from "express";
import {
  createReport,
  // downloadReportFile,
  getAllReports,
  getReportsByPatientId,
  getReportsOfLoggedInDoctors,
  getReportsOfLoggedInPatient,
} from "../controllers/report.controller.js";
import {
  adminRoute,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
import upload from "../middlewares/upload.js";
import { validateObjectId } from "../middlewares/validations.js";
const router = express.Router();

// @route POST /api/reports/
// @desc create a new report
// @access Admin/Doctor/Nurse/Private
router.post(
  "/",
  protectRoute,
  authorizeRoles("admin", "doctor", "nurse"),
  upload.array("fileURLs", 5),
  createReport
);

// @route GET /api/reports/
// @desc get all reports (admin only)
// @access Admin/Private
router.get("/", protectRoute, adminRoute, getAllReports);

// @route GET /api/reports/patient
// @desc get reports of logged in patient
// @access Patient/Private
router.get("/patient", protectRoute, getReportsOfLoggedInPatient);

// @route GET /api/reports/doctor
// @desc get reports of logged in doctors
// @access Doctor/Private
router.get(
  "/patient",
  protectRoute,
  authorizeRoles("doctor"),
  getReportsOfLoggedInDoctors
);

// @route GET /api/reports/:id/
// @desc get all reports of a specific patient
// @access Doctor/Nurse/Admin/Private
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("nurse", "doctor", "admin"),
  validateObjectId,
  getReportsByPatientId
);

// @route GET /api/reports/:reportId/download/:fileIndex
// @desc Download a report file (secured)
// @access Authorized roles only
/* router.get(
  "/:reportId/download/:fileIndex",
  protectRoute,
  downloadReportFile
); */

export default router;
