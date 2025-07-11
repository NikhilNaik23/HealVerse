import express from "express";
import {
  adminRoute,
  authorizePatientOrStaff,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
import {
  validateAdmission,
  validateObjectId,
} from "../middlewares/validations.js";
import {
  createAdmission,
  dischargePatient,
  getAdmissionById,
  getAdmissionsByPatientId,
  getAllAdmissions,
  transferAdmission,
  updateAdmission,
} from "../controllers/admission.controller.js";
const router = express.Router();

router.post(
  "/",
  protectRoute,
  authorizeRoles("receptionist", "admin"),
  validateAdmission,
  createAdmission
);

router.get(
  "/",
  protectRoute,
  authorizeRoles("receptionist", "admin"),
  getAllAdmissions
);

router.get(
  "/:id",
  protectRoute,
  authorizeRoles("receptionist", "doctor", "admin"),
  validateObjectId,
  getAdmissionById
);

router.put(
  "/:id",
  protectRoute,
  adminRoute,
  validateAdmission,
  validateObjectId,
  updateAdmission
);

router.patch(
  "/:id/discharge",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  dischargePatient
);
router.patch(
  "/:id/transfer",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  transferAdmission
);
router.get(
  "/:id,patient",
  protectRoute,
  authorizePatientOrStaff,
  authorizeRoles("admin", "doctor", "receptionist"),
  validateObjectId,
  getAdmissionsByPatientId
);

export default router;
