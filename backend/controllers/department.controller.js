import mongoose from "mongoose";
import Department from "../models/department.model.js";
import Staff from "../models/staff.model.js";
import Hospital from "../models/hospital.model.js";

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
    specializations,
  } = req.body;
  if (
    !specializations ||
    !Array.isArray(specializations) ||
    specializations.length === 0
  ) {
    return res.status(400).json({
      error: "Specializations are required and must be a non-empty array",
    });
  }

  try {
    const hospital = await Hospital.findById(hospitalId);
    if (!hospital) {
      return res.status(404).json({ error: "Hospital not found" });
    }
    const existingDepartment = await Department.findOne({
      name: new RegExp(`^${escapeRegex(name)}$`, "i"),
    });

    if (existingDepartment) {
      return res.status(409).json({ error: "Department already exists" });
    }
    if (headOfDepartment) {
      const hodExists = await Staff.findOne({
        _id: headOfDepartment,
        isActive: true,
      });
      if (!hodExists) {
        return res
          .status(400)
          .json({ error: "Invalid or inactive Head of Department" });
      }
    }

    if (staffList.length > 0) {
      const staffCount = await Staff.countDocuments({
        _id: { $in: staffList },
        isActive: true,
      });
      if (staffCount !== staffList.length) {
        return res.status(400).json({
          error: "One or more staff members are invalid or inactive",
        });
      }
    }

    const department = await Department.create({
      name,
      description,
      hospitalId,
      headOfDepartment: headOfDepartment,
      floor: floor,
      numberOfBeds: numberOfBeds,
      staffList,
      specializations,
    });

    return res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.error("createDepartment Error:", error);

    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error });
    }

    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllDepartments = async (req, res) => {
  try {
    const filters = { isActive: true };

    const { floor, headOfDepartment, name, specialization } = req.query;

    if (floor) {
      filters.floor = Number(floor);
    }

    if (headOfDepartment) {
      filters.headOfDepartment = new RegExp(escapeRegex(headOfDepartment), "i");
    }

    if (name) {
      filters.name = new RegExp(escapeRegex(name), "i");
    }

    if (specialization) {
      filters.specializations = {
        $regex: new RegExp(escapeRegex(specialization), "i"),
      };
    }

    const departments = await Department.find(filters)
      .select("-staffList -numberOfBeds")
      .populate("headOfDepartment", "name role")
      .sort({ createdAt: -1 });

    if (!departments || departments.length === 0) {
      return res
        .status(200)
        .json({ message: "No department found", departments: [] });
    }

    const departmentsWithHod = departments.map((dept) => {
      const deptObj = dept.toObject();
      deptObj.headOfDepartment = deptObj.headOfDepartment || "Not Assigned";
      return deptObj;
    });

    res.status(200).json({
      message: "Departments fetched successfully",
      departmentCount: departmentsWithHod.length,
      departments: departmentsWithHod,
    });
  } catch (error) {
    console.error("getAllDepartments Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getDepartmentById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    const department = await Department.findOne({ _id: id, isActive: true })
      .populate("hospitalId", "name address")
      .populate("headOfDepartment", "name role");

    if (!department) {
      return res.status(404).json({ error: "Department not found " });
    }
    return res.status(200).json({ message: "Department found", department });
  } catch (error) {
    console.error("getDepartmentById Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
    specializations,
  } = req.body;
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    if (name) {
      const existingDept = await Department.findOne({
        _id: { $ne: id },
        name: new RegExp(`^${escapeRegex(name)}$`, "i"),
      });
      if (existingDept) {
        return res
          .status(409)
          .json({ error: "Department name already in use" });
      }
    }

    if (headOfDepartment !== undefined && headOfDepartment !== null) {
      const hodExists = await Staff.findOne({
        _id: headOfDepartment,
        isActive: true,
      });
      if (!hodExists) {
        return res
          .status(400)
          .json({ error: "Invalid or inactive Head of Department" });
      }
    }

    if (staffList !== undefined && staffList.length > 0) {
      const staffCount = await Staff.countDocuments({
        _id: { $in: staffList },
        isActive: true,
      });
      if (staffCount !== staffList.length) {
        return res
          .status(400)
          .json({
            error: "One or more staff members are invalid or inactive",
          });
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
    if (specializations !== undefined)
      updateFields.specializations = specializations;

    const updatedDepartment = await Department.findByIdAndUpdate(
      id,
      updateFields,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!updatedDepartment) {
      return res.status(404).json({ error: "Department not found" });
    }

    return res.status(200).json({
      message: "Department updated successfully",
      department: updatedDepartment,
    });
  } catch (error) {
    console.error("updateDepartment Error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: error });
    }
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteDepartment = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid department ID" });
    }
    const department = await Department.findOneAndUpdate(
      { _id: id, isActive: true },
      { isActive: false, deletedAt: new Date() },
      { new: true }
    );

    if (!department) {
      return res
        .status(404)
        .json({ error: "Department not found or already deleted" });
    }

    return res
      .status(200)
      .json({ message: "Department soft deleted successfully", id });
  } catch (error) {
    console.error("deleteDepartment Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const activateDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    const department = await Department.findOneAndUpdate(
      { _id: id, isActive: false },
      { isActive: true, deletedAt: null },
      { new: true }
    );

    if (!department) {
      return res
        .status(404)
        .json({ error: "Department not found or already active" });
    }

    res
      .status(200)
      .json({ message: "Department reactivated successfully", department });
  } catch (error) {
    console.error("activateDepartment Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getDepartmentStaff = async (req, res) => {
  const { id } = req.params;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid department ID" });
    }

    const staff = await Staff.find({ departmentId: id, isActive: true }).select(
      "name role email"
    );

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
    console.error("getDepartmentStaff Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getDepartmentsByHospital = async (req, res) => {
  const { id } = req.params;

  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Hospital ID" });
    }

    const hospitalExists = await Hospital.exists({ _id: id });
    if (!hospitalExists) {
      return res.status(404).json({ error: "Hospital not found" });
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
        error: "No departments found for this hospital",
        departments: [],
      });
    }

    return res.status(200).json({
      message: "Departments fetched successfully",
      departmentCount: departments.length,
      departments,
    });
  } catch (error) {
    console.error("getDepartmentsByHospital Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const assignHeadOfDepartment = async (req, res) => {
  const { id } = req.params;
  const { staffId } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid Department ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(staffId)) {
      return res.status(400).json({ error: "Invalid Staff ID" });
    }

    const department = await Department.findOne({
      _id: id,
      isActive: true,
    }).select("-floor -numberOfBeds -isActive -deletedAt -staffList");
    if (!department) {
      return res
        .status(404)
        .json({ error: "Department does not exist or is inactive" });
    }
    if (department.headOfDepartment?.toString() === staffId) {
      return res.status(400).json({
        error: "This staff member is already assigned as Head of Department",
      });
    }

    const staff = await Staff.findOne({
      _id: staffId,
      isActive: true,
    }).populate("departmentId", "name");
    if (!staff) {
      return res
        .status(404)
        .json({ error: "Staff does not exist or is inactive" });
    }
    if (staff.role !== "doctor") {
      return res.status(400).json({
        error: "Only doctors can be assigned as Head of Department",
      });
    }
    if (staff.departmentId.name !== department.name) {
      return res.status(400).json({
        error:
          "Staff member must belong to the same department to be assigned as Head of Department",
      });
    }

    if (staff.departmentId) department.headOfDepartment = staffId;
    await department.save();

    await department.populate("headOfDepartment", "name role");

    return res
      .status(200)
      .json({ message: "HOD assigned successfully", department });
  } catch (error) {
    console.error("assignHeadOfDepartment Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
