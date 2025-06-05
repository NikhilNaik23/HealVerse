import express from "express";
import {
  activateStaff,
  createStaff,
  deactivateStaff,
  getAllStaff,
  getStaffById,
  updateDepartment,
  updateStaff,
} from "../controllers/staff.controller.js";
import {
  validateAssignDepartment,
  validateObjectId,
  validateStaff,
} from "../middlewares/validations.js";
import { adminRoute, protectRoute } from "../middlewares/protectRoute.js";
const router = express.Router();

// @route POST /api/staff/
// @desc create a new staff (admin only)
// @access Private/Admin
router.post("/", protectRoute, adminRoute, validateStaff, createStaff);

// @route GET /api/staff/
// @desc get all existing staff (admin only)
// @access Private/Admin
router.get("/", protectRoute, adminRoute, getAllStaff);

// @route GET /api/staff/:id
// @desc get a specific staff (admin only)
// @access Private/Admin
router.get("/:id", protectRoute, adminRoute, validateObjectId, getStaffById);

// @route PUT /api/staff/:id
// @desc update a staff (admin only)
// @access Private/Admin
router.put(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  updateStaff
);

// @route PATCH /api/staff/:id/deactivate
// @desc deactivate a staff (admin only)
// @access Private/Admin
router.patch(
  "/:id/deactivate",
  protectRoute,
  adminRoute,
  validateObjectId,
  deactivateStaff
);

// @route PATCH /api/staff/:id/activate
// @desc activate a staff (admin only)
// @access Private/Admin
router.patch(
  "/:id/activate",
  protectRoute,
  adminRoute,
  validateObjectId,
  activateStaff
);

// @route PATCH /api/staff/:id/assign-department
// @desc update a dept of a staff (admin only)
// @access Private/Admin
router.patch(
  "/:id/update-department",
  protectRoute,
  adminRoute,
  validateObjectId,
  validateAssignDepartment,
  updateDepartment
);
export default router;
