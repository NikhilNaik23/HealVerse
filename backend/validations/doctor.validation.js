import Joi from "joi";
import { objectId } from "./objectId.validation.js";


const validDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];


const specializations = [
  "general_practitioner", "internist", "pediatrician", "cardiologist",
  "cardiothoracic_surgeon", "neurologist", "neurosurgeon", "orthopedic_surgeon",
  "plastic_surgeon", "general_surgeon", "vascular_surgeon", "urologist",
  "dermatologist", "psychiatrist", "radiologist", "anesthesiologist",
  "emergency_medicine", "endocrinologist", "gastroenterologist", "hematologist",
  "immunologist", "nephrologist", "obstetrician_gynecologist", "oncologist",
  "ophthalmologist", "otolaryngologist", "pathologist", "pulmonologist",
  "rheumatologist", "sports_medicine", "family_medicine",
  "physical_medicine_rehabilitation", "preventive_medicine",
  "critical_care_medicine", "addiction_medicine", "palliative_care",
  "sleep_medicine", "clinical_geneticist", "occupational_medicine"
];


const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const doctorValidationSchema = Joi.object({
  staffId: objectId.required(),

  specialization: Joi.array()
    .items(Joi.string().valid(...specializations))
    .min(1)
    .required()
    .unique(),

  qualification: Joi.string().trim().required(),

  experience: Joi.number()
    .min(0)
    .max(60)
    .required(),

  patientsAssigned: Joi.array().items(objectId),
});
