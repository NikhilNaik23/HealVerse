import express from "express";
import {
  activateRoom,
  assignBeds,
  assignInchargeStaff,
  createRoom,
  getAllBedsWithStatus,
  getAllRooms,
  getRoomById,
  manageRoomType,
  softDeletion,
} from "../controllers/room.controller.js";
import {
  adminRoute,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
import { validateObjectId, validateRoom } from "../middlewares/validations.js";

const router = express.Router();

// @route   POST /api/rooms
// @desc    Create a new room
// @access  Admin
router.post("/", protectRoute, adminRoute, validateRoom, createRoom);

// @route   GET /api/rooms
// @desc    Get all rooms with optional filters
// @access  Admin, Receptionist
router.get(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  getAllRooms
);



// @route   GET /api/rooms/:id
// @desc    Get room by ID
// @access  Admin, Receptionist
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  getRoomById
);

// @route   DELETE /api/rooms/:id
// @desc    Soft delete a room (only if unoccupied)
// @access  Admin
router.delete("/:id", protectRoute, adminRoute, softDeletion);

// @route   GET /api/rooms/occupancy-status
// @desc    Get occupancy status of all beds for a room 
// @access  Admin, Receptionist
router.get(
  "/:id/occupancy-status",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  getAllBedsWithStatus
);

// @route   PATCH /api/rooms/:id/activate
// @desc    Reactivate a soft-deleted room
// @access  Admin
router.patch("/:id/activate", protectRoute, adminRoute, activateRoom);

// @route   PATCH /api/rooms/:id/assign-incharge
// @desc    Assign in-charge staff to a room
// @access  Admin
router.patch(
  "/:id/assign-incharge",
  protectRoute,
  adminRoute,
  validateObjectId,
  assignInchargeStaff
);

// @route   PATCH /api/rooms/:id/assign-beds
// @desc    Assign multiple beds to a room
// @access  Admin
router.patch(
  "/:id/assign-beds",
  protectRoute,
  adminRoute,
  validateObjectId,
  assignBeds
);

// @route   PATCH /api/rooms/:id/manage-room-type
// @desc    Change the type of the room (e.g., to ICU, Emergency)
// @access  Admin
router.patch(
  "/:id/manage-room-type",
  protectRoute,
  adminRoute,
  validateObjectId,
  manageRoomType
);

export default router;
