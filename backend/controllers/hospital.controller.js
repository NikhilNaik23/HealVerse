import mongoose from "mongoose";
import Hospital from "../models/hospital.model.js";

export const createHospital = async (req, res) => {
  const { name, location, contactDetails, directorId, establishedDate } = req.body;

  try {
    if (directorId && !mongoose.Types.ObjectId.isValid(directorId)) {
      return res.status(400).json({ message: "Invalid director ID" });
    }

    const existingHospital = await Hospital.findOne({ name, location,contactDetails });
    if (existingHospital) {
      return res.status(409).json({ message: "Hospital already exists" });
    }

    const hospital = await Hospital.create({
      name,
      location,
      contactDetails,
      directorId: directorId || null,
      establishedDate,
    });

    return res.status(201).json({
      message: "Hospital created successfully",
      hospital,
    });
  } catch (error) {
    console.error("createHospital Error:", error.message);

    if (error.code === 11000) {
      const duplicateKey = Object.keys(error.keyValue)[0];
      return res.status(409).json({ message: `${duplicateKey} already exists.` });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getHospitals = async (req, res) => {
  try {
    const hospitals = await Hospital.find({}).lean();
    if (hospitals.length === 0) {
      return res.status(200).json({ message: "No hospitals are found", hospitals: [] });
    }
    return res.status(200).json({ message: "Hospitals fetched successfully",hospitalCount:hospitals.length, hospitals });
  } catch (error) {
    console.error("getHospitals Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getHospitalById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    const hospital = await Hospital.findById(id).lean();
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    return res.status(200).json({ message: "Hospital fetched successfully", hospital });
  } catch (error) {
    console.error("getHospitalById Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateHospital = async (req, res) => {
  const { name, location, contactDetails, directorId, establishedDate } = req.body;
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    if (directorId && !mongoose.Types.ObjectId.isValid(directorId)) {
      return res.status(400).json({ message: "Invalid director ID" });
    }

    const hospital = await Hospital.findById(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    const updatedHospital = await Hospital.findByIdAndUpdate(
      id,
      { name, location, contactDetails, directorId: directorId || null, establishedDate },
      { new: true, runValidators: true }
    );

    return res.status(200).json({
      message: "Hospital updated successfully",
      hospital: updatedHospital,
    });
  } catch (error) {
    console.error("updateHospital Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteHospital = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid hospital ID" });
    }

    const hospital = await Hospital.findByIdAndDelete(id);
    if (!hospital) {
      return res.status(404).json({ message: "Hospital not found" });
    }

    res.status(200).json({ message: "Hospital deleted successfully", id });
  } catch (error) {
    console.error("deleteHospital Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
