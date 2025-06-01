import express from "express";
import {
    activateDepartment,
  createDepartment,
  deleteDepartment,
  getAllDepartments,
  getDepartmentById,
  getDepartmentsByHospital,
  getDepartmentStaff,
  updateDepartment,
} from "../controllers/department.controller.js";
import { validateDepartment, validateObjectId } from "../middlewares/validations.js";
const router = express.Router();

// @route POST /api/department/
// @desc create a new dept (admin only)
// @access Private/Admin
router.post("/", validateDepartment, createDepartment);
// @route GET /api/department/
// @desc fetch all depts (admin only)
// @access Private/Admin
router.get("/", getAllDepartments);


// @route GET /api/department/hospital/:hospitalId
// @desc Get all departments under a hospital
// @access Private/Admin
router.get("/hospital/:id", validateObjectId, getDepartmentsByHospital);



// @route GET /api/department/:id
// @desc get a specific dept (admin only)
// @access Private/Admin
router.get("/:id", validateObjectId, getDepartmentById);

// @route PUT /api/department/:id
// @desc update a specific dept (admin only)
// @access Private/Admin
router.put("/:id", validateObjectId, validateDepartment, updateDepartment);

// @route DELETE /api/department/:id
// @desc delete a specific dept (admin only)
// @access Private/Admin
router.delete("/:id", validateObjectId, deleteDepartment);
// @route PATCH /api/department/:id/activate
// @desc activate a specific dept that's been deleted (admin only)
// @access Private/Admin
router.patch("/:id/activate", validateObjectId, activateDepartment);

// @route GET /api/department/:id
// @desc get staff detail of a specific dept (admin only)
// @access Private/Admin
router.get("/:id/staff", validateObjectId, getDepartmentStaff);

export default router;
