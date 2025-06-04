import express from "express";
import {
  getProfile,
  loginUser,
  registerStaff,
  registerUser,
  setStaffPassword,
} from "../controllers/auth.controller.js";
import {
  validateAuth,
  validatePatientSelfRegister,
  validateRegisterForStaff,
  validateSetPassword,
} from "../middlewares/validations.js";
import { protectRoute } from "../middlewares/protectRoute.js";
const router = express.Router();

// @route POST /api/register
// @desc register a user(patient)
// @access PUBLIC
router.post("/register", validatePatientSelfRegister, registerUser);

// @route POST /api/login
// @desc user login
// @access PUBLIC
router.post("/login", validateAuth, loginUser);

// @route GET /api/profile
// @desc get user profile
// @access USER/PRIVATE
router.get("/profile", protectRoute, getProfile);

// @route POST /api/staff
// @desc register a user(staff) (admin only)
// @access ADMIN/PRIVATE
router.post("/register-staff",  validateRegisterForStaff, registerStaff);

// @route PUT /api/set-password
// @desc set password (staff only)
// @access ADMIN/PRIVATE
router.put("/set-password", validateSetPassword, setStaffPassword);

export default router;
