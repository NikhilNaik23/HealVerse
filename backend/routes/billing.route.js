import express from "express";
import {
  finalizeTheBill,
  getBillByAdmissionId,
  getBillsByPatientId,
} from "../controllers/billing.controller.js";
import { validateObjectId } from "../middlewares/validations.js";
import {
  authorizeRoles,
  authorizeUser,
  protectRoute,
} from "../middlewares/protectRoute.js";
const router = express.Router();

router.get(
  "/:id",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  getBillByAdmissionId
);

// @route GET /api/bills/:id/patient
// @desc get bill by patientid
// @access Admin/Receptionist

router.get(
  "/:id/patient",
  protectRoute,
  authorizeUser,
  validateObjectId,
  getBillsByPatientId
);

router.get(
  "/:id/patients",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  getBillsByPatientId
);

router.patch(
  "/:id/finalize",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  finalizeTheBill
);
router.patch(
  "/:id/mark-paid",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  finalizeTheBill
);

export default router;
