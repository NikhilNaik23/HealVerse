import EmergencyPatient from "../models/emergencyPatient.model.js";

export const createEmergencyPatient = async (req, res) => {
  const {
    name = "Unknown",
    age = 0,
    gender = "unknown",
    phoneNumber,
    emergencyContact,
    triageLevel,
    initialDiagnosis,
    assignedDoctorId,
    status = "waiting",
    notes,
  } = req.body;
  const staffId = req.user?.profile;
  if (!staffId) {
    return res.status(401).json({ error: "Unauthorized: Staff ID missing" });
  }

  try {
    const emergencyPatient = await EmergencyPatient.create({
      name,
      age,
      gender,
      phoneNumber,
      emergencyContact,
      triageLevel,
      initialDiagnosis,
      assignedDoctorId,
      status,
      notes,
      createdBy: staffId,
    });
    return res
      .status(200)
      .json({ message: "Patient created successfully", emergencyPatient });
  } catch (error) {
    console.log("createEmergencyPatient Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
