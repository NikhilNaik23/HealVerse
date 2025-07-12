import express from "express";
import {
  adminRoute,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
import {
  assignEquipmentToRoom,
  createEquipment,
  deleteEquipment,
  getAllEquipments,
  getEquipmentById,
  getEquipmentByRoomId,
  markAsAvailable,
  markAsInUse,
  updateEquipment,
} from "../controllers/equipment.controller.js";
import {
  validateEquipment,
  validateObjectId,
} from "../middlewares/validations.js";
const router = express.Router();

router.post("/", protectRoute, adminRoute, validateEquipment, createEquipment);
router.get(
  "/",
  protectRoute,
  authorizeRoles("admin", "doctor", "receptionist"),
  getAllEquipments
);
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("admin", "doctor", "receptionist"),
  validateObjectId,
  getEquipmentById
);
router.put("/:id", protectRoute, adminRoute, validateObjectId, updateEquipment);

router.patch(
  "/:id/assign-room",
  protectRoute,
  adminRoute,
  validateObjectId,
  assignEquipmentToRoom
);

router.get(
  "/:id/get-equipments",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  getEquipmentByRoomId
);

router.patch(
  "/:id/mark-inuse",
  protectRoute,
  authorizeRoles("admin", "doctor"),
  validateObjectId,
  markAsInUse
);

router.patch(
  "/:id/mark-as-available",
  protectRoute,
  authorizeRoles("admin", "doctor"),
  validateObjectId,
  markAsAvailable
);

router.delete(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  deleteEquipment
);

export default router;
