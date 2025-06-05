import express from "express";
import {
  createHospital,
  deleteHospital,
  getHospitalById,
  getHospitals,
  updateHospital,
} from "../controllers/hospital.controller.js";
import {
  validateHospital,
  validateObjectId,
} from "../middlewares/validations.js";
import { adminRoute, protectRoute } from "../middlewares/protectRoute.js";
const router = express.Router();

// @route POST api/hospital/
// @desc create a new hospital (admin only)
// @access Admin Only (Strict Middleware)
router.post("/", protectRoute, adminRoute, validateHospital, createHospital);

// @route GET api/hospital/
// @desc get all hospitals (admin only)
// @access Admin Only (Strict Middleware)
router.get("/", protectRoute, adminRoute, getHospitals);

// @route GET api/hospital/:id
// @desc get a specific hospital (admin only)
// @access Admin Only (Strict Middleware)
router.get("/:id", protectRoute, adminRoute, validateObjectId, getHospitalById);

// @route PUT api/hospital/:id
// @desc update a specific hospital (admin only)
// @access Admin Only (Strict Middleware)
router.put(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  validateHospital,
  updateHospital
);

// @route DELETE api/hospital/:id
// @desc delete a specific hospital (admin only)
// @access Admin Only (Strict Middleware)
router.delete(
  "/:id",
  protectRoute,
  adminRoute,
  validateObjectId,
  deleteHospital
);
export default router;
