import express from "express";
import { createStaff, getAllStaff } from "../controllers/staff.controller.js";
import { validateStaff } from "../middlewares/validations.js";
const router = express.Router();

// @route POST api/staff/
// @desc create a new staff (admin only)
// @access Private/Admin
router.post("/", validateStaff, createStaff);

// @route GET api/staff/
// @desc get all existing staff (admin only)
// @access Private/Admin
router.get("/", getAllStaff);
export default router;
