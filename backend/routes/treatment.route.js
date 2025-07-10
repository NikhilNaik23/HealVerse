import express from "express";
import {
  adminRoute,
  authorizePatientOrStaff,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
import {
  createTreatment,
  getAllTreatments,
  getTreatmentById,
  getTreatmentsByDoctorId,
  getTreatmentsByPatientId,
  markFollowUpComplete,
  updateTreatment,
} from "../controllers/treatment.controller.js";
import {
  validateObjectId,
  validateTreatment,
} from "../middlewares/validations.js";
import { admin } from "googleapis/build/src/apis/admin/index.js";
const router = express.Router();

router.post(
  "/",
  protectRoute,
  authorizeRoles("admin", "doctor"),
  validateTreatment,
  createTreatment
);

router.get("/", protectRoute, adminRoute, getAllTreatments);
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("doctor"),
  validateObjectId,
  getTreatmentById
);
router.put(
  "/:id",
  protectRoute,
  authorizeRoles("doctor", "admin"),
  validateObjectId,
  validateTreatment,
  updateTreatment
);
router.get(
  "/:id/patient",
  protectRoute,
  authorizePatientOrStaff,
  validateObjectId,
  getTreatmentsByPatientId
);
router.get(
  "/:id/doctor",
  protectRoute,
  authorizeRoles("admin", "doctor"),
  validateObjectId,
  getTreatmentsByDoctorId
);
router.patch(
  "/:id/mark-followup",
  protectRoute,
  authorizeRoles("admin", "doctor"),
  validateObjectId,
  markFollowUpComplete
);

export default router;
