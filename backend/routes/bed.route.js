import express from "express";
import { validateBed, validateObjectId } from "../middlewares/validations.js";
import {
  adminRoute,
  authorizeRoles,
  protectRoute,
} from "../middlewares/protectRoute.js";
import {
  assignBedToPatient,
  createBed,
  getAllBeds,
  getAllBedsOfRoom,
  getAvailableBeds,
  getBedById,
  getBedByPatientId,
  updateBedById,
} from "../controllers/bed.controller.js";
const router = express.Router();

// @route POST /api/beds/
// @desc Create a new bed
// @access Admin
router.post("/", protectRoute, adminRoute, validateBed, createBed);

// @route GET /api/beds/
// @desc Get all beds
// @access Admin/Receptionist
router.get(
  "/",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  getAllBeds
);

// @route GET /api/beds/get-all-available-beds
// @desc retrieve unoccupied beds
// @access Admin/Receptionist/Doctor
router.get(
  "/get-all-available-beds",
  protectRoute,
  authorizeRoles("admin", "receptionist", "doctor"),
  getAvailableBeds
);

// @route GET /api/beds/:id
// @desc Get a Specific bed
// @access Admin/Receptionist
router.get(
  "/:id",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  getBedById
);
// @route PUT /api/beds/:id
// @desc Update a Specific bed
// @access Admin
router.put("/:id", protectRoute, adminRoute, validateObjectId, updateBedById);
// @route PATCH /api/beds/:id/assign-patient
// @desc Assign a Bed to a patient
// @access Admin/Receptionist
router.patch(
  "/:id/assign-patient",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  assignBedToPatient
);

// @route GET /api/beds/:id/get-all-beds
// @desc retrieve beds based on room
// @access Admin/Receptionist
router.get(
  "/:id/get-all-beds",
  protectRoute,
  authorizeRoles("admin", "receptionist"),
  validateObjectId,
  getAllBedsOfRoom
);

// @route GET /api/beds/:id/get-bed-of-patient
// @desc retrieve bed from a patient id
// @access Admin/Receptionist/Doctor
router.get(
  "/:id/get-bed-of-patient",
  protectRoute,
  authorizeRoles("admin", "receptionist", "doctor"),
  validateObjectId,
  getBedByPatientId
);

export default router;
