import Staff from "../models/staff.model.js";
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
    dateOfJoining = new Date(),
    workingHours,
  } = req.body;
  try {
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
      dateOfJoining,
      workingHours,
    });
    await staff.save();

    res.status(201).json({ message: "Staff created successfully", staff });
  } catch (error) {
    console.error("createStaff error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getAllStaff = async (req, res) => {
  try {
    const staffs = await Staff.findOne({ isActive: true });
    if(!staffs || staffs.length === 0){
      return res.status(200).json({message:""})
    }
  } catch (error) {}
};
