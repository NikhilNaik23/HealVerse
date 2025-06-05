import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Department from "../models/department.model.js";
import MedicalRecord from "../models/medicalRecord.model.js";
import { isDoctorAvailable } from "../lib/utils/checkDoctorAvailability.js";

export const createMedicalRecord = async (req, res) => {
  const {
    patientId,
    doctorId,
    departmentId,
    visitDate,
    visitType,
    symptoms,
    diagnosis,
    notes,
    testsOrdered,
    treatmentGiven,
    attachments,
    followUpDate,
    status,
    prescriptions,
    billingId,
  } = req.body;
  try {
    const patient = await Patient.findById(patientId);
    const doctor = await Doctor.findById(doctorId).populate(
      "staffId",
      "name role departmentId isActive workingHours"
    );
    const department = await Department.findById(departmentId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    const isAvailable = isDoctorAvailable(
      doctor.staffId.workingHours,
      visitDate
    );
    if (!doctor || !doctor.staffId) {
      return res.status(404).json({ error: "Doctor or staff info not found" });
    }

    if (!doctor.staffId.isActive) {
      return res.status(400).json({ error: "Doctor is inactive" });
    }
    if (!department) {
      return res.status(404).json({ error: "Department not found" });
    }
    if (doctor.staffId.departmentId.toString() !== departmentId) {
      return res
        .status(400)
        .json({ error: "Doctor does not belong to this department" });
    }

    if (!isAvailable) {
      return res
        .status(400)
        .json({ error: "Doctor is not available at this time" });
    }
    const newRecord = new MedicalRecord({
      patientId,
      doctorId,
      departmentId,
      visitDate: visitDate || new Date(),
      visitType,
      symptoms,
      diagnosis,
      notes,
      testsOrdered,
      treatmentGiven,
      attachments,
      followUpDate,
      status: status || "open",
      prescriptions,
      billingId,
    });

    await newRecord.save();
    return res.status(201).json({
      message: "Medical record created successfully",
      medicalRecord: newRecord,
    });
  } catch (error) {
    console.error("createMedicalRecord Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMedicalRecordById = async (req, res) => {
  const { id } = req.params;

  try {
    const record = await MedicalRecord.findById(id)
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        select: "staffId specialization",
        populate: {
          path: "staffId",
          select: "name role departmentId",
        },
      })
      .populate("departmentId", "name")
      .populate("attachments")
      .populate("prescriptions")
      .populate("billingId");

    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    return res
      .status(200)
      .json({ message: "Record fetched successfully", record });
  } catch (error) {
    console.error("getMedicalRecordById Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getMedicalRecordsByPatient = async (req, res) => {
  const { id } = req.params;
  try {
    const patient = await Patient.findById(id);
    if (!patient) {
      return res.status(400).json({ error: "Patient not found" });
    }
    const records = await MedicalRecord.find({ patientId: id })
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        select: "staffId specialization",
        populate: {
          path: "staffId",
          select: "name role departmentId",
        },
      })
      .populate("departmentId", "name")
      .populate("attachments")
      .populate("prescriptions")
      .populate("billingId");
    if (records.length === 0) {
      return res
        .status(404)
        .json({ error: "No medical records found for this patient" });
    }
    res
      .status(200)
      .json({ message: "Medical record fetched successfully", records });
  } catch (error) {
    console.error("getMedicalRecordsByPatient Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateMedicalRecord = async (req, res) => {
  const { id } = req.params;
  const updateFields = req.body;
  try {
    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    if (
      updateFields.patientId &&
      updateFields.patientId !== record.patientId.toString()
    ) {
      const patientExists = await Patient.findById(updateFields.patientId);
      if (!patientExists) {
        return res.status(400).json({ error: "Invalid patientId" });
      }
    }
    if (
      updateFields.doctorId &&
      updateFields.doctorId !== record.doctorId.toString()
    ) {
      const doctorExists = await Doctor.findById(updateFields.doctorId);
      if (!doctorExists) {
        return res.status(400).json({ error: "Invalid doctorId" });
      }
    }
    if (
      updateFields.departmentId &&
      updateFields.departmentId !== record.departmentId.toString()
    ) {
      const deptExists = await Department.findById(updateFields.departmentId);
      if (!deptExists) {
        return res.status(400).json({ error: "Invalid departmentId" });
      }
    }

    Object.assign(record, updateFields);
    await record.save();
    return res
      .status(200)
      .json({ message: "Medical record updated", medicalRecord: record });
  } catch (error) {
    console.error("updateMedicalRecord Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
