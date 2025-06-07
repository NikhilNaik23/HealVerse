import express from "express";
import { createReport } from "../controllers/report.controller.js";
import { authorizeRoles, protectRoute } from "../middlewares/protectRoute.js";
import upload from "../middlewares/upload.js";
const router = express.Router();

// @route POST /api/reports/
// @desc create a new report
// @access Admin/Doctor/Nurse/Private
router.post(
  "/",
  protectRoute,
  authorizeRoles("admin", "doctor", "nurse"),
  upload.array("fileURLs",5),
  createReport
);
export default router;
