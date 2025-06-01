import mongoose from "mongoose";

import { departmentValidationSchema } from "../validations/department.validation.js";
import { hospitalValidationSchema } from "../validations/hospital.validation.js";
import { staffValidationSchema } from "../validations/staff.validation.js";
import { doctorValidationSchema } from "../validations/doctorValidationSchema.js";

export const validateHospital = async (req, res, next) => {
  const { error } = hospitalValidationSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};

export const validateStaff = async (req, res, next) => {
  const { error } = staffValidationSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};

export const validateDepartment = async (req, res, next) => {
  const { error } = departmentValidationSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const errors = error.details.map((detail) => detail.message);
    return res.status(400).json({ errors });
  }
  next();
};
export const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "Invalid ID format" });
  }
  next();
};

export const validateDoctor = (req, res, next) => {
  const { error } = doctorValidationSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    const messages = error.details.map((d) => d.message);
    return res.status(400).json({ errors: messages });
  }
  next();
};
