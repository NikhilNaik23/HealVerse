import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Report from "../models/report.model.js";

export const createReport = async (req, res) => {
  const { type, patientId, doctorId, notes } = req.body;
  const fileURLs = req.files?.length ? req.files.map((file) => file.path) : [];
  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (patient.assignedDoctorId == null) {
      return res
        .status(400)
        .json({ error: "Doctor not assigned to patient yet" });
    }
    if (!patient.assignedDoctorId.equals(doctorId)) {
      return res.status(400).json({ error: "Patient not assigned to Doctor" });
    }
    const doctor = await Doctor.findById(doctorId).populate(
      "staffId",
      "name isActive"
    );
    if (!doctor || !doctor.staffId?.isActive) {
      return res
        .status(400)
        .json({ error: "Doctor is not active or doesn't exist" });
    }

    const report = await Report.create({
      type,
      patientId,
      doctorId,
      fileURLs,
      notes,
      uploadedBy: req.user.auth?._id,
    });
    res.status(201).json({ message: "Report created successfully", report });
    return;
  } catch (error) {
    console.error("createdReport Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
