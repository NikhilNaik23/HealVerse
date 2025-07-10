import Joi from "joi";
import { objectId } from "./objectId.validation.js";

const validSpecializations = [
  "general_practitioner",
  "internist",
  "pediatrician",
  "cardiologist",
  "cardiothoracic_surgeon",
  "neurologist",
  "neurosurgeon",
  "orthopedic_surgeon",
  "plastic_surgeon",
  "general_surgeon",
  "vascular_surgeon",
  "urologist",
  "dermatologist",
  "psychiatrist",
  "radiologist",
  "anesthesiologist",
  "emergency_medicine",
  "endocrinologist",
  "gastroenterologist",
  "hematologist",
  "immunologist",
  "nephrologist",
  "obstetrician_gynecologist",
  "oncologist",
  "ophthalmologist",
  "otolaryngologist",
  "pathologist",
  "pulmonologist",
  "rheumatologist",
  "sports_medicine",
  "family_medicine",
  "physical_medicine_rehabilitation",
  "preventive_medicine",
  "critical_care_medicine",
  "addiction_medicine",
  "palliative_care",
  "sleep_medicine",
  "clinical_geneticist",
  "occupational_medicine",
  "hr_manager",
  "recruiter",
  "payroll_officer",
];

export const departmentValidationSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
    "any.required": "Name is required",
  }),

  description: Joi.string().trim().required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description is required",
    "any.required": "Description is required",
  }),

  hospitalId: objectId.required().messages({
    "any.invalid": "Invalid Hospital ID for Hospital's department",
    "any.required": "Hospital ID is required",
  }),

  headOfDepartment: objectId.optional().messages({
    "any.invalid": "Invalid Staff ID for Head of Department",
  }),

  floor: Joi.number().integer().min(0).optional().messages({
    "number.base": "Floor must be a number",
    "number.min": "Floor cannot be negative",
  }),
  isActive: Joi.boolean().optional().default(true),

  numberOfBeds: Joi.number().integer().min(0).optional().messages({
    "number.base": "Number of beds must be a number",
    "number.min": "Number of beds cannot be negative",
  }),

  staffList: Joi.array().items(objectId).min(0).optional().messages({
    "any.invalid": "Staff list contains an invalid ObjectId",
  }),
  specializations: Joi.array()
    .items(Joi.string().valid(...validSpecializations))
    .min(1)
    .required()
    .messages({
      "any.only": "One or more specializations are invalid",
      "array.min": "At least one specialization must be selected",
      "any.required": "Specializations field is required",
    }),
});
