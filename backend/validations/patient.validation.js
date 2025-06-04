import Joi from "joi";
import mongoose from "mongoose";

const objectId = Joi.string().custom((value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
}, "ObjectId Validation");

const emergencyContactSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .trim()
    .messages({
      "string.pattern.base":
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits",
      "string.empty": "Phone number is required",
    }),
  relation: Joi.string().trim().required().messages({
    "string.base": "Relation must be a string",
    "string.empty": "Relation is required",
  }),
});

export const patientSelfRegisterSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
  }),
  dateOfBirth: Joi.date().iso().required().messages({
    "date.base": "Date of Birth must be a valid date",
    "any.required": "Date of Birth is required",
  }),
  gender: Joi.string().valid("male", "female", "others").required().messages({
    "any.only": "Gender must be one of: male, female, others",
    "any.required": "Gender is required",
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .trim()
    .messages({
      "string.pattern.base":
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits",
      "string.empty": "Phone number is required",
    }),
  email: Joi.string().email().required().trim().lowercase().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  password: Joi.string()
    .min(8)
    .required()
    .messages({
      "string.base": "Password must be a string",
      "string.min": "Password must be at least 8 characters",
      "any.required": "Password is required",
    }),
  linkedAuthId: objectId.optional().allow(null).messages({
    "any.invalid": "Invalid Auth ID",
  }),
  address: Joi.string().required().messages({
    "string.base": "Address must be a string",
    "string.empty": "Address is required",
  }),
  emergencyContact: emergencyContactSchema.required().messages({
    "any.required": "Emergency contact is required",
  }),
  medicalHistory: Joi.array()
    .items(
      Joi.object({
        documentUrl: Joi.string().uri().required().messages({
          "string.uri": "Document URL must be a valid URI",
          "any.required": "Document URL is required",
        }),
        documentType: Joi.string()
          .valid("pdf", "image")
          .required()
          .messages({
            "any.only": "Document type must be one of pdf, image",
            "any.required": "Document type is required",
          }),
        description: Joi.string().trim().allow("").optional(),
        uploadedAt: Joi.date().iso().optional(),
      })
    )
    .default([]),
});


export const patientAdminRegisterSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name is required",
  }),
  dateOfBirth: Joi.date().iso().required().messages({
    "date.base": "Date of Birth must be a valid date",
    "any.required": "Date of Birth is required",
  }),
  gender: Joi.string().valid("male", "female", "others").required().messages({
    "any.only": "Gender must be one of: male, female, others",
    "any.required": "Gender is required",
  }),
  phone: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .trim()
    .messages({
      "string.pattern.base":
        "Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits",
      "string.empty": "Phone number is required",
    }),
  email: Joi.string().email().required().trim().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  linkedAuthId: objectId.optional().allow(null).messages({
    "any.invalid": "Invalid Auth ID",
  }),
  address: Joi.string().required().messages({
    "string.base": "Address must be a string",
    "string.empty": "Address is required",
  }),
  emergencyContact: emergencyContactSchema.required().messages({
    "any.required": "Emergency contact is required",
  }),
  medicalHistory: Joi.array()
    .items(
      Joi.object({
        documentUrl: Joi.string().uri().required().messages({
          "string.uri": "Document URL must be a valid URI",
          "any.required": "Document URL is required",
        }),
        documentType: Joi.string().valid("pdf", "image").required().messages({
          "any.only": "Document type must be one of pdf, image",
          "any.required": "Document type is required",
        }),
        description: Joi.string().trim().allow("").optional(),
        uploadedAt: Joi.date().iso().optional(),
      })
    )
    .default([]),

  currentStatus: Joi.string()
    .valid(
      "registered",
      "admitted",
      "discharged",
      "awaiting diagnosis",
      "stable",
      "under observation",
      "critical",
      "recovering"
    )
    .optional()
    .messages({
      "any.only": "Invalid current status value",
    }),
  statusHistory: Joi.array()
    .items(
      Joi.object({
        status: Joi.string()
          .valid(
            "registered",
            "admitted",
            "discharged",
            "under observation",
            "critical",
            "awaiting diagnosis",
            "stable",
            "recovering"
          )
          .required()
          .messages({
            "any.only": "Invalid status value",
            "any.required": "Status is required in status history",
          }),
        updatedAt: Joi.date().iso().optional(),
        updatedBy: objectId.required().messages({
          "any.invalid": "Invalid staff ID",
          "any.required": "Staff ID is required",
        }),
      })
    )
    .optional(),
  admissionDate: Joi.date().iso().optional(),
  dischargeDate: Joi.date().iso().optional(),
  assignedDoctorId: objectId.optional().messages({
    "any.invalid": "Invalid Doctor ID",
  }),
  departmentId: objectId.optional().messages({
    "any.invalid": "Invalid Department ID",
  }),
});
