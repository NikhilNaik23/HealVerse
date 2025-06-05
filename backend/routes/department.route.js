import express from "express";
import {
  activateDepartment,
  assignHeadOfDepartment,
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentsByHospital,
  getDepartmentStaff,
  updateDepartment,
} from "../controllers/department.controller.js";
import {
  validateDepartment,
  validateObjectId,
} from "../middlewares/validations.js";

import { adminRoute, protectRoute } from "../middlewares/protectRoute.js";

const router = express.Router();

// @route POST /api/department/
// @desc create a new dept (admin only)
// @access Admin Only (Strict Middleware)
router.post(
  "/",
  protectRoute,
  adminRoute,
  validateDepartment,
  createDepartment
);
// @route GET /api/department/
// @desc fetch all depts (admin only)
// @access Admin Only (Strict Middleware)
router.get("/", protectRoute, adminRoute, getAllDepartments);

// @route GET /api/department/hospital/:hospitalId
// @desc Get all departments under a hospital
// @access Admin Only (Strict Middleware)
router.get(
  "/hospital/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  getDepartmentsByHospital
);

// @route GET /api/department/:id
// @desc get a specific dept (admin only)
// @access Admin Only (Strict Middleware)
router.get(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  getDepartmentById
);

// @route PUT /api/department/:id
// @desc update a specific dept (admin only)
// @access Admin Only (Strict Middleware)
router.put(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  validateDepartment,
  updateDepartment
);

// @route DELETE /api/department/:id
// @desc delete a specific dept (admin only)
// @access Admin Only (Strict Middleware)
router.delete(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  deleteDepartment
);
// @route PATCH /api/department/:id/activate
// @desc activate a specific dept that's been deleted (admin only)
// @access Admin Only (Strict Middleware)
router.patch(
  "/:id/activate",
  protectRoute,
  adminRoute,
  validateObjectId,
  activateDepartment
);

// @route GET /api/department/:id
// @desc get staff detail of a specific dept (admin only)
// @access Admin Only (Strict Middleware)
router.get(
  "/:id/staff",
  protectRoute,
  adminRoute,
  validateObjectId,
  getDepartmentStaff
);

// @route PATCH /api/department/:id
// @desc set a HOD (admin only)
// @access Admin Only (Strict Middleware)
router.patch(
  "/:id/head",
  protectRoute,
  adminRoute,
  validateObjectId,
  assignHeadOfDepartment
);

export default router;
