import express from "express";
import { createAppointment } from "../controllers/appointment.controller.js";
import { validateAppointment } from "../middlewares/validations.js";
const router = express.Router();

// @route POST /api/appointment/
// @desc create a appointment
// @access Admin/Receptionist/Patients/Private

router.post("/", validateAppointment, createAppointment);
export default router;
