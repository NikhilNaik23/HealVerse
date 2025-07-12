import express from "express";
import {
    cancelSurgery,
  createSurgery,
  deleteSurgery,
  getAllSurgeries,
  getSurgeryById,
  updateSurgery,
} from "../controllers/surgery.controller.js";
import { authorizeRoles, protectRoute } from "../middlewares/protectRoute.js";
import {
  validateObjectId,
  validateSurgery,
} from "../middlewares/validations.js";
import { markFollowUpComplete } from "../controllers/treatment.controller.js";
const router = express.Router();

router.post(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateSurgery,
  createSurgery
);
router.get(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist", "doctor", "nurse"),
  getAllSurgeries
);
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("admin", "receptionist", "doctor", "nurse"),
  validateObjectId,
  getSurgeryById
);
router.put(
  "/:id",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  updateSurgery
);
router.patch(
  "/:id/mark-completed",
  protectRoute,
  authorizeRoles("admin", "doctor"),
  validateObjectId,
  markFollowUpComplete
);
router.patch(
  "/:id/cancel",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  cancelSurgery
);
router.delete(
  "/:id/delete",
  protectRoute,
  authorizeRoles("admin"),
  validateObjectId,
  deleteSurgery
);
export default router;
