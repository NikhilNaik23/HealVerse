import Joi from "joi";

const surgeonSpecs = [
  "cardiothoracic_surgeon",
  "neurosurgeon",
  "orthopedic_surgeon",
  "plastic_surgeon",
  "general_surgeon",
  "vascular_surgeon",
];

export const doctorValidationSchema = Joi.object({
  staffId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      "string.length": "staffId must be a valid 24-character ObjectId",
      "any.required": "staffId is required",
    }),

  specialization: Joi.array()
    .items(
      Joi.string().valid(
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
        "occupational_medicine"
      )
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one specialization is required",
      "any.required": "specialization is required",
    }),

  qualification: Joi.string().required().messages({
    "string.empty": "qualification is required",
    "any.required": "qualification is required",
  }),

  experience: Joi.number().min(0).max(60).required().messages({
    "number.min": "experience cannot be negative",
    "number.max": "experience cannot exceed 60 years",
    "any.required": "experience is required",
  }),

  consultationHours: Joi.object({
    start: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required()
      .messages({
        "string.pattern.base": "Start time must be in HH:mm format",
        "any.required": "Start time is required",
      }),
    end: Joi.string()
      .pattern(/^([01]\d|2[0-3]):([0-5]\d)$/)
      .required()
      .messages({
        "string.pattern.base": "End time must be in HH:mm format",
        "any.required": "End time is required",
      }),
  }).required(),

  availableDays: Joi.array()
    .items(
      Joi.string().valid("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
    )
    .min(1)
    .required()
    .messages({
      "array.min": "At least one available day is required",
      "any.required": "availableDays is required",
      "any.only": "Days must be valid weekday abbreviations (Mon, Tue, Wed, Thu, Fri, Sat, Sun)",
    }),

  patientsAssigned: Joi.array()
    .items(Joi.string().hex().length(24))
    .optional(),
});
