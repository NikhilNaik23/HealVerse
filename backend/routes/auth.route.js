import express from "express";
import {
  changePassword,
  forgotPassword,
  getProfile,
  loginUser,
  registerStaff,
  registerUser,
  resetPassword,
  setStaffPassword,
} from "../controllers/auth.controller.js";
import {
  validateAuth,
  validatePatientSelfRegister,
  validateRegisterForStaff,
  validateSetPassword,
} from "../middlewares/validations.js";
import { adminRoute, protectRoute } from "../middlewares/protectRoute.js";
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

// @route POST /api/register-staff
// @desc register a user(staff) (admin only)
// @access ADMIN/PRIVATE
router.post(
  "/register-staff",
  protectRoute,
  adminRoute,
  validateRegisterForStaff,
  registerStaff
);

// @route PUT /api/set-password
// @desc set password (staff only)
// @access Staff/PRIVATE
router.put("/set-password", validateSetPassword, setStaffPassword);

// @route PUT /api/forgot-password
// @desc user can login through email via LINK if they've forgotten
// @access PUBLIC
router.put("/forgot-password", forgotPassword);

// @route   PUT /api/reset-password
// @desc    Send LINK to user's email and allow password reset via OTP
// @access  PUBLIC
router.put("/reset-password", validateSetPassword, resetPassword);

// @route   PUT /api/reset-password
// @desc    change password only users
// @access  USERS/PRIVATE
router.put("/change-password", protectRoute, changePassword);

export default router;
