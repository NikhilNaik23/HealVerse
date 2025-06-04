import mongoose from "mongoose";

import { departmentValidationSchema } from "../validations/department.validation.js";
import { hospitalValidationSchema } from "../validations/hospital.validation.js";
import { staffValidationSchema } from "../validations/staff.validation.js";
import { doctorValidationSchema } from "../validations/doctor.validation.js";
import { assignDepartmentValidationSchema } from "../validations/assignDepartment.validation.js";
import { patientAdminRegisterSchema, patientSelfRegisterSchema } from "../validations/patient.validation.js";
import { appointmentValidationSchema } from "../validations/appointment.validation.js";
import { authValidationSchema, staffRegisterValidationSchema } from "../validations/auth.validation.js";
import { setPasswordValidationSchema } from "../validations/setPassword.validation.js";

const createValidationMiddleware = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    const errors = error.details.map((d) => d.message);
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


export const validateHospital = createValidationMiddleware(hospitalValidationSchema);
export const validateStaff = createValidationMiddleware(staffValidationSchema);
export const validateDepartment = createValidationMiddleware(departmentValidationSchema);
export const validateAssignDepartment = createValidationMiddleware(assignDepartmentValidationSchema);
export const validateDoctor = createValidationMiddleware(doctorValidationSchema);
export const validatePatientSelfRegister = createValidationMiddleware(patientSelfRegisterSchema);
export const validatePatientAdminRegister = createValidationMiddleware(patientAdminRegisterSchema);
export const validateAppointment= createValidationMiddleware(appointmentValidationSchema)
export const validateAuth= createValidationMiddleware(authValidationSchema)
export const validateRegisterForStaff= createValidationMiddleware(staffRegisterValidationSchema)
export const validateSetPassword= createValidationMiddleware(setPasswordValidationSchema)
