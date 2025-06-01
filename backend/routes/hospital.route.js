import express from "express";
import { createHospital, deleteHospital, getHospitalById, getHospitals, updateHospital } from "../controllers/hospital.controller.js";
import { validateHospital, validateObjectId } from "../middlewares/validations.js";
const router = express.Router();

// @route POST api/hospital/
// @desc create a new hospital (admin only)
// @access Private/Admin
router.post("/",validateHospital,createHospital)

// @route GET api/hospital/
// @desc get all hospitals (admin only)
// @access Private/Admin
router.get("/",getHospitals)

// @route GET api/hospital/:id
// @desc get a specific hospital (admin only)
// @access Private/Admin
router.get("/:id",validateObjectId,getHospitalById)

// @route PUT api/hospital/:id
// @desc update a specific hospital (admin only)
// @access Private/Admin
router.put("/:id",validateObjectId,validateHospital,updateHospital)

// @route DELETE api/hospital/:id
// @desc delete a specific hospital (admin only)
// @access Private/Admin
router.delete("/:id",validateObjectId,deleteHospital)
export default router;