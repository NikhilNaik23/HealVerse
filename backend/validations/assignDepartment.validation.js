import Joi from "joi";
import mongoose from "mongoose";

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

export const assignDepartmentValidationSchema = Joi.object({
  departmentId: Joi.string().required().custom(objectIdValidation, "ObjectId validation"),
});
