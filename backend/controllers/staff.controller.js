import mongoose from "mongoose";
import Staff from "../models/staff.model.js";
import Department from "../models/department.model.js";
import Hospital from "../models/hospital.model.js";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

export const createStaff = async (req, res) => {
  const {
    name,
    email,
    phone = null,
    address = null,
    dateOfBirth = null,
    gender,
    photo = null,
    role,
    departmentId,
    hospitalId,
    salary = null,
    dateOfJoining,
    workingHours,
  } = req.body;

  try {
    const existing = await Staff.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already in use" });

    if (!isValidObjectId(departmentId))
      return res.status(400).json({ message: "Invalid Department ID" });
    if (!isValidObjectId(hospitalId))
      return res.status(400).json({ message: "Invalid Hospital ID" });

    const [hospitalExists, department] = await Promise.all([
      Hospital.findById(hospitalId),
      Department.findOne({ _id: departmentId, isActive: true }),
    ]);

    if (!hospitalExists)
      return res.status(404).json({ message: "Hospital does not exist" });
    if (!department)
      return res
        .status(404)
        .json({ message: "Department does not exist or is inactive" });

    const staff = new Staff({
      name,
      email,
      phone,
      address,
      dateOfBirth,
      gender,
      photo,
      role,
      departmentId,
      hospitalId,
      salary,
      dateOfJoining: dateOfJoining || new Date(),
      workingHours,
    });

    await staff.save();

    await Department.findByIdAndUpdate(departmentId, {
      $addToSet: { staffList: staff._id },
    });

    return res
      .status(201)
      .json({ message: "Staff created successfully", staff });
  } catch (error) {
    console.error("createStaff error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getAllStaff = async (req, res) => {
  try {
    const filter = { isActive: true };

    const { role, departmentId, hospitalId, gender } = req.query;

    if (role) filter.role = role;
    if (departmentId && isValidObjectId(departmentId))
      filter.departmentId = departmentId;
    if (hospitalId && isValidObjectId(hospitalId))
      filter.hospitalId = hospitalId;
    if (gender) filter.gender = gender;

    const staffs = await Staff.find(filter)
      .populate("departmentId", "name")
      .populate("hospitalId", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: staffs.length ? "Staff fetched successfully" : "No staff found",
      staffCount: staffs.length,
      staffs,
    });
  } catch (error) {
    console.error("getAllStaff error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getStaffById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "Invalid staff ID" });

    const staff = await Staff.findOne({ _id: id, isActive: true })
      .populate({
        path: "departmentId",
        select: "name headOfDepartment",
        populate: {
          path: "headOfDepartment",
          select: "name email role",
        },
      })
      .populate("hospitalId", "name")
      .lean();

    if (!staff)
      return res
        .status(404)
        .json({ message: "Staff does not exist or is inactive" });

    staff.departmentId.headOfDepartment ??= { name: "Not Assigned" };

    return res.status(200).json({ message: "Staff found", staff });
  } catch (error) {
    console.error("getStaffById error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateStaff = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    email,
    phone = null,
    address = null,
    dateOfBirth = null,
    gender,
    photo = null,
    role,
    departmentId,
    hospitalId,
    salary = null,
    dateOfJoining,
    workingHours,
  } = req.body;

  try {
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "Invalid staff ID" });

    if (email) {
      const existing = await Staff.findOne({ email, _id: { $ne: id } });
      if (existing)
        return res
          .status(409)
          .json({ message: "Email already in use by another staff member" });
    }

    if (!isValidObjectId(departmentId))
      return res.status(400).json({ message: "Invalid Department ID" });
    if (!isValidObjectId(hospitalId))
      return res.status(400).json({ message: "Invalid Hospital ID" });

    const [department, hospitalExists] = await Promise.all([
      Department.findOne({ _id: departmentId, isActive: true }),
      Hospital.findById(hospitalId),
    ]);

    if (!department)
      return res
        .status(404)
        .json({ message: "Department does not exist or is inactive" });
    if (!hospitalExists)
      return res.status(404).json({ message: "Hospital does not exist" });

    const staff = await Staff.findByIdAndUpdate(
      id,
      {
        name,
        email,
        phone,
        address,
        dateOfBirth,
        gender,
        photo,
        role,
        departmentId,
        hospitalId,
        salary,
        dateOfJoining,
        workingHours,
      },
      { new: true, runValidators: true }
    );

    if (!staff) return res.status(404).json({ message: "Staff not found" });

    return res
      .status(200)
      .json({ message: "Staff updated successfully", staff });
  } catch (error) {
    console.error("updateStaff error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deactivateStaff = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "Invalid staff ID" });

    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (!staff.isActive)
      return res.status(400).json({ message: "Staff is already inactive" });

    staff.isActive = false;
    await staff.save();
    await Department.findByIdAndUpdate(staff.departmentId, {
      $pull: { staffList: staff._id },
    });

    return res
      .status(200)
      .json({ message: "Staff Deactivated Successfully", id });
  } catch (error) {
    console.error("deactivateStaff error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const activateStaff = async (req, res) => {
  const { id } = req.params;
  try {
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "Invalid staff ID" });

    const staff = await Staff.findById(id);
    if (!staff) return res.status(404).json({ message: "Staff not found" });
    if (staff.isActive)
      return res.status(400).json({ message: "Staff is already active" });

    staff.isActive = true;
    await staff.save();
    await Department.findByIdAndUpdate(staff.departmentId, {
      $push: { staffList: staff._id },
    });

    return res
      .status(200)
      .json({ message: "Staff Activated Successfully", staff });
  } catch (error) {
    console.error("activateStaff error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { departmentId } = req.body;

  try {
    if (!isValidObjectId(id))
      return res.status(400).json({ message: "Invalid staff ID" });
    if (!isValidObjectId(departmentId))
      return res.status(400).json({ message: "Invalid Department ID" });

    const staff = await Staff.findOne({ _id: id, isActive: true }).populate(
      "departmentId",
      "name"
    );
    if (!staff)
      return res.status(404).json({ message: "Staff not found or inactive" });

    const newDepartment = await Department.findOne({
      _id: departmentId,
      isActive: true,
    });
    if (!newDepartment)
      return res
        .status(404)
        .json({ message: "Department not found or inactive" });

    if (staff.departmentId._id.toString() === departmentId)
      return res
        .status(400)
        .json({ message: "Staff is already in this department" });

    const oldDepartmentId = staff.departmentId._id;

    staff.departmentId = departmentId;
    await staff.save();

    await Promise.all([
      Department.findByIdAndUpdate(oldDepartmentId, {
        $pull: { staffList: staff._id },
      }),
      Department.findByIdAndUpdate(departmentId, {
        $addToSet: { staffList: staff._id },
      }),
    ]);

    return res
      .status(200)
      .json({ message: "Updated Department Successfully", staff });
  } catch (error) {
    console.error("updateDepartment error:", error.message);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
