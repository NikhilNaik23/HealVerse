import Patient from "../models/patient.model.js";
import Doctor from "../models/doctor.model.js";
import Department from "../models/department.model.js";
import MedicalRecord from "../models/medicalRecord.model.js";
import { isDoctorAvailable } from "../lib/utils/checkDoctorAvailability.js";
import mongoose from "mongoose";
import Prescription from "../models/prescription.model.js";

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
    if (prescriptions && prescriptions.length > 0) {
      const uniquePrescriptionIds = [
        ...new Set(prescriptions.map((id) => id.toString())),
      ];
      if (uniquePrescriptionIds.length !== prescriptions.length) {
        return res.status(400).json({
          error: "Duplicate prescription IDs found in request",
        });
      }

      const validPrescriptions = await Prescription.find({
        _id: { $in: prescriptions },
        patientId,
        doctorId,
        isDeleted: false,
      });

      if (validPrescriptions.length !== prescriptions.length) {
        return res.status(400).json({
          error:
            "One or more prescriptions are invalid, deleted, or not associated with the given patient/doctor",
        });
      }

      const alreadyLinked = await MedicalRecord.findOne({
        prescriptions: { $in: prescriptions },
        isDeleted: false,
      });

      if (alreadyLinked) {
        return res.status(400).json({
          error:
            "One or more prescriptions are already linked to a medical record",
        });
      }
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
      createdBy: req.user.profile?._id,
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
    const record = await MedicalRecord.findOne({ _id: id, isDeleted: false })
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        select: "staffId specialization",
        populate: {
          path: "staffId",
          select: "name role departmentId",
        },
      })
      .populate("createdBy", "name role departmentId")
      .populate("departmentId", "name")
      .populate("attachments");

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

export const getMedicalRecordsForLoggedInPatient = async (req, res) => {
  const id = req.user?.profile?._id;

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

    if (!records.length) {
      return res
        .status(404)
        .json({ error: "No medical records found for this patient" });
    }

    res.status(200).json({
      message: "Medical records fetched successfully",
      records,
    });
  } catch (error) {
    console.error("getMedicalRecordsForLoggedInPatient Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
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
    if (updateFields.prescriptions && updateFields.prescriptions.length > 0) {
      const uniqueIds = [
        ...new Set(updateFields.prescriptions.map((id) => id.toString())),
      ];
      if (uniqueIds.length !== updateFields.prescriptions.length) {
        return res
          .status(400)
          .json({ error: "Duplicate prescription IDs in request" });
      }

      const patientIdToUse =
        updateFields.patientId || record.patientId.toString();
      const doctorIdToUse = updateFields.doctorId || record.doctorId.toString();

      const validPrescriptions = await Prescription.find({
        _id: { $in: updateFields.prescriptions },
        patientId: patientIdToUse,
        doctorId: doctorIdToUse,
        isDeleted: false,
      });

      if (validPrescriptions.length !== updateFields.prescriptions.length) {
        return res.status(400).json({
          error:
            "One or more prescriptions are invalid, deleted, or not associated with the patient/doctor",
        });
      }

      const alreadyLinked = await MedicalRecord.findOne({
        _id: { $ne: id },
        prescriptions: { $in: updateFields.prescriptions },
        isDeleted: false,
      });

      if (alreadyLinked) {
        return res.status(400).json({
          error:
            "One or more prescriptions are already linked to another medical record",
        });
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

export const deleteMedicalRecord = async (req, res) => {
  const { id } = req.params;
  try {
    const record = await MedicalRecord.findById(id);
    if (!record || record.isDeleted) {
      return res.status(404).json({ error: "Record not found" });
    }
    record.isDeleted = true;
    await record.save();
    res.status(200).json({ message: "Medical record soft-deleted" });
  } catch (error) {
    console.error("deleteMedicalRecord Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const uploadReports = async (req, res) => {
  const { id } = req.params;
  const { attachments } = req.body;
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid medical record ID" });
    }

    if (
      !attachments ||
      !Array.isArray(attachments) ||
      attachments.length === 0
    ) {
      return res
        .status(400)
        .json({ error: "Attachments array is required and cannot be empty" });
    }

    const record = await MedicalRecord.findById(id);
    if (!record) {
      return res.status(404).json({ error: "Medical record not found" });
    }

    const existingAttachments = record.attachments || [];

    const uniqueAttachments = attachments.filter(
      (att) => !existingAttachments.includes(att)
    );

    if (uniqueAttachments.length === 0) {
      return res.status(400).json({
        error: "All provided attachments already exist in this medical record",
      });
    }

    record.attachments.push(...uniqueAttachments);
    await record.save();

    return res.status(200).json({
      message: "Attachments uploaded successfully",
      medicalRecord: updatedRecord,
    });
  } catch (error) {
    console.error("Error uploading attachments:", error);
    return res
      .status(500)
      .json({ error: "Server error while uploading attachments" });
  }
};

export const getAllRecords = async (req, res) => {
  try {
    const { doctorId, departmentId, visitDate, visitType, status, createdBy } =
      req.query;
    const filters = {};
    if (doctorId) {
      filters.doctorId = doctorId;
    }
    if (departmentId) {
      filters.departmentId = departmentId;
    }
    if (visitDate) {
      filters.visitDate = visitDate;
    }
    if (visitType) {
      filters.visitType = visitType;
    }
    if (status) {
      filters.status = status;
    }
    if (createdBy) {
      filters.createdBy = createdBy;
    }
    const records = await MedicalRecord.find(filters)
      .populate("patientId", "name email")
      .populate({
        path: "doctorId",
        select: "staffId",
        populate: {
          path: "staffId",
          select: "name email ",
        },
      })
      .populate("departmentId", "name");
    if (records.length === 0) {
      return res.status(200).json({ message: "No records found", records: [] });
    }
    return res
      .status(200)
      .json({ message: "Records fetched successfully", records });
  } catch (error) {
    console.error("getAllRecords Error:", error);
    return res
      .status(500)
      .json({ error: "Server error while uploading attachments" });
  }
};
