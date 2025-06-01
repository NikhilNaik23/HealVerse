import mongoose from "mongoose";
import Department from "../models/department.model.js";

const escapeRegex = (str) => str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");

export const createDepartment = async (req, res) => {
  const {
    name,
    description,
    headOfDepartment = null,
    floor = null,
    numberOfBeds = null,
    staffList = [],
    hospitalId,
  } = req.body;

  try {
    const existingDepartment = await Department.findOne({
      name: new RegExp(`^${name}$`, "i"),
    });

    if (existingDepartment) {
      return res.status(409).json({ message: "Department already exists" });
    }

    const department = await Department.create({
      name,
      description,
      hospitalId,
      headOfDepartment: headOfDepartment,
      floor: floor,
      numberOfBeds: numberOfBeds,
      staffList,
    });

    return res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("createDepartment Error:", error.message);

    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const filters = { isActive: true };

    const { floor, headOfDepartment, name } = req.query;

    if (floor) {
      filters.floor = Number(floor);
    }

    if (headOfDepartment) {
      filters.headOfDepartment = new RegExp(escapeRegex(headOfDepartment), "i");
    }

    if (name) {
      filters.name = new RegExp(escapeRegex(name), "i");
    }

    const departments = await Department.find(filters)
      .select("-staffList -numberOfBeds")
      .sort({ createdAt: -1 });

    if (!departments || departments.length === 0) {
      return res
        .status(200)
        .json({ message: "No department found", departments: [] });
    }

    res
      .status(200)
      .json({ message: "Departments fetched successfully", departments });
  } catch (error) {
    console.error("getAllDepartments Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    const department = await Department.findOne({ _id: id, isActive: true })
      .populate("hospitalId", "name address") // Populates hospital name and address
      .populate("headOfDepartment", "name role"); // Populates headOfDepartment's name and role

    if (!department) {
      return res.status(404).json({ message: "Department not found " });
    }
    return res.status(200).json({ message: "Department found", department });
  } catch (error) {
    console.error("getDepartmentById Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDepartment = async (req, res) => {
  const {
    name,
    description,
    headOfDepartment,
    floor,
    numberOfBeds,
    staffList = [],
  } = req.body;
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    // Check if new name exists on another department (case-insensitive)
    if (name) {
      const existingDept = await Department.findOne({
        _id: { $ne: id }, // exclude current
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
      });
      if (existingDept) {
        return res
          .status(409)
          .json({ message: "Department name already in use" });
      }
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (description) updateFields.description = description;
    if (headOfDepartment !== undefined)
      updateFields.headOfDepartment = headOfDepartment;
    if (floor !== undefined) updateFields.floor = floor;
    if (numberOfBeds !== undefined) updateFields.numberOfBeds = numberOfBeds;
    if (staffList !== undefined) updateFields.staffList = staffList;


    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDepartment) {
      return res.status(404).json({ message: "Department not found" });
    }

    return res.status(200).json({
      message: "Department updated successfully",
      department: updatedDepartment,
    });
  } catch (error) {
    console.error("updateDepartment Error:", error.message);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }
    const department = await Department.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );

    if (!department) {
      return res
        .status(404)
        .json({ message: "Department not found or already deleted" });
    }

    return res
      .status(200)
      .json({ message: "Department soft deleted successfully", id });
  } catch (error) {
    console.error("deleteDepartment Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const activateDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }

    const department = await Department.findOneAndUpdate(
      { _id: id, isActive: false },
      { isActive: true, deletedAt: null },
      { new: true }
    );

    if (!department) {
      return res
        .status(404)
        .json({ message: "Department not found or already active" });
    }

    res
      .status(200)
      .json({ message: "Department reactivated successfully", department });
  } catch (error) {
    console.error("activateDepartment Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDepartmentStaff = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid department ID" });
    }
    const department = await Department.findOne({
      _id: id,
      isActive: true,
    }).populate("staffList", "name role email");
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }

    const staff = department.staffList;
    const msg =
      staff.length === 0
        ? "No staff members found"
        : "Staff fetched successfully";
    return res.status(200).json({
      message: msg,
      staffCount: staff.length,
      staff,
    });
  } catch (error) {
    console.error("getDepartmentStaff Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getDepartmentsByHospital = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Hospital ID" });
    }

    const departments = await Department.find({
      hospitalId: id,
      isActive: true,
    })
      .select("-staffList")
      .populate("headOfDepartment", "name role email")
      .sort({ createdAt: -1 });

    if (departments.length === 0) {
      return res.status(200).json({
        message: "No departments found for this hospital",
        departments: [],
      });
    }

    return res.status(200).json({
      message: "Departments fetched successfully",
      departmentCount: departments.length,
      departments,
    });
  } catch (error) {
    console.error("getDepartmentsByHospital Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
