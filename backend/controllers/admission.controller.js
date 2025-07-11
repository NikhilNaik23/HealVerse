import Admission from "../models/admission.model.js";
import Patient from "../models/patient.model.js";
import Room from "../models/room.model.js";
import Bed from "../models/bed.model.js";
import {
  createBillIfNotExists,
  addBillingItemToAdmissionBill,
} from "../lib/utils/billing.helper.js";

export const createAdmission = async (req, res) => {
  const {
    patientId,
    admitDate,
    dischargeDate,
    roomId,
    bedId,
    reason,
    status = "admitted",
    notes,
  } = req.body;
  const staffId = req.user?.profile?._id;

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    const existingAdmissions = await Admission.find({ patientId });
    const isAlreadyAdmitted = existingAdmissions.some(
      (admission) => admission.status !== "discharged"
    );

    if (isAlreadyAdmitted) {
      return res.status(400).json({ error: "Patient is already admitted" });
    }
    const room = await Room.findById(roomId);
    if (!room || room.isDeleted) {
      return res.status(404).json({ error: "Room not found or deleted" });
    }

    const bed = await Bed.findById(bedId);
    if (!bed) {
      return res.status(404).json({ error: "Bed not found " });
    }

    if (bed.isOccupied) {
      return res.status(400).json({ error: "Bed is already occupied" });
    }
    const admission = await Admissios.create({
      patientId,
      admitDate,
      dischargeDate,
      roomId,
      bedId,
      reason,
      status,
      notes,
      admittedBy: staffId,
    });
    bed.isOccupied = true;
    await bed.save();

    await createBillIfNotExists(admission._id, staffId);
    await addBillingItemToAdmissionBill(admission._id, {
      service: "admission",
      referenceId: admission._id,
      description: "Admission Charges",
      cost: 1500,
    });


    return res.status(201).json({
      message: "Patient admitted successfully",
      admission,
    });
  } catch (error) {
    console.error("createAdmission Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllAdmissions = async (req, res) => {
  const { admitDate, dischargeDate, admittedBy, roomId, status } = req.query;

  try {
    const filter = {};

    if (admitDate) {
      filter.admitDate = new Date(admitDate);
    }

    if (dischargeDate) {
      filter.dischargeDate = new Date(dischargeDate);
    }

    if (admittedBy) {
      filter.admittedBy = admittedBy;
    }

    if (roomId) {
      filter.roomId = roomId;
    }

    if (status) {
      filter.status = status;
    }

    const admissions = await Admission.find(filter)
      .populate("patientId", "name age gender phoneNumber")
      .populate("admittedBy", "name role phone")
      .populate("roomId", "roomNumber floor type")
      .populate("bedId", "bedNumber status");

    if (admissions.length === 0) {
      return res
        .status(404)
        .json({ message: "No admissions found for the given filters" });
    }

    return res
      .status(200)
      .json({ message: "Admissions retrieved successfully", admissions });
  } catch (error) {
    console.error("getAllAdmissions Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAdmissionById = async (req, res) => {
  const { id: admissionId } = req.params;
  const role = req.user?.profile?.role?.toLowerCase();
  const staffProfile = req.user?.profile;
  const doctorId = staffProfile?.doctorId;

  try {
    const admission = await Admission.findById(admissionId)
      .populate("patientId", "name age gender phoneNumber assignedDoctorId")
      .populate("admittedBy", "name role phone departmentId")
      .populate("roomId", "roomNumber floor type")
      .populate("bedId", "bedNumber status");

    if (!admission) {
      return res.status(404).json({ error: "Admission not found" });
    }

    if (role === "doctor") {
      const assignedDoctor = admission.patientId?.assignedDoctorId?.toString();
      if (!assignedDoctor || assignedDoctor !== doctorId?.toString()) {
        return res
          .status(403)
          .json({ error: "Access denied. Not the treating doctor." });
      }
    }

    return res.status(200).json({
      message: "Admission retrieved successfully",
      admission,
    });
  } catch (error) {
    console.error("getAdmissionById Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateAdmission = async (req, res) => {
  const { id: admissionId } = req.body;
  const { admitDate, dischargeDate, roomId, bedId, reason, status, notes } =
    req.body;

  try {
    const admission = await Admission.findById(admissionId);
    if (!admission) {
      return res.status(404).json({ error: "Admission not found" });
    }

    if (bedId && bedId !== admission.bedId.toString()) {
      const bed = await Bed.findById(bedId);
      if (!bed || bed.status === "occupied") {
        return res.status(400).json({ error: "Invalid or occupied bed" });
      }
    }

    if (roomId && roomId !== admission.roomId.toString()) {
      const room = await Room.findById(roomId);
      if (!room || room.isDeleted) {
        return res.status(400).json({ error: "Invalid room" });
      }
    }
    if (admitDate) admission.admitDate = admitDate;
    if (dischargeDate) admission.dischargeDate = dischargeDate;
    if (roomId) admission.roomId = roomId;
    if (bedId) admission.bedId = bedId;
    if (reason) admission.reason = reason;
    if (status) admission.status = status;
    if (notes) admission.notes = notes;

    await admission.save();

    return res
      .status(200)
      .json({ message: "Admission updated successfully", admission });
  } catch (error) {
    console.error("updateAdmission Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const dischargePatient = async (req, res) => {
  const { id: admissionId } = req.params;
  const staffId = req.user?.profile?._id;
  const role = req.user?.profile?.role?.toLowerCase();

  try {
    const admission = await Admission.findById(admissionId);
    if (!admission) {
      return res.status(404).json({
        error: "Admission not found",
      });
    }

    if (admission.status === "discharged") {
      return res.status(400).json({ error: "Patient is already discharged" });
    }

    if (role === "receptionist") {
      if (!staffId || staffId.toString() !== admission.admittedBy?.toString()) {
        return res.status(403).json({ error: "Unauthorized receptionist" });
      }
    } else if (role !== "admin") {
      return res
        .status(403)
        .json({ error: "Only admin or admitting receptionist can discharge" });
    }

    const bed = await Bed.findById(admission.bedId);
    if (bed) {
      bed.isOccupied = false;
      await bed.save();
    }

    admission.status = "discharged";
    admission.dischargeDate = new Date();
    await admission.save();

    return res.status(200).json({
      message: "Patient discharged successfully",
      admission,
    });
  } catch (error) {
    console.error("dischargePatient Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const transferAdmission = async (req, res) => {
  const { id: admissionId } = req.params;
  const { newRoomId, newBedId } = req.body;

  try {
    const admission = await Admission.findById(admissionId);
    if (!admission || admission.status !== "admitted") {
      return res.status(400).json({
        error: "Admission not found or patient not currently admitted",
      });
    }
    const newBed = await Bed.findById(newBedId);
    const newRoom = await Room.findById(newRoomId);

    if (!newRoom || newRoom.isDeleted) {
      return res.status(404).json({ error: "New room not found or deleted" });
    }

    if (
      !newBed ||
      newBed.isOccupied ||
      newBed.roomId.toString() !== newRoomId
    ) {
      return res.status(400).json({ error: "Invalid or occupied new bed" });
    }

    const oldBed = await Bed.findById(admission.bedId);
    if (oldBed) {
      oldBed.isOccupied = false;
      await oldBed.save();
    }

    newBed.isOccupied = true;
    await newBed.save();

    admission.roomId = newRoomId;
    admission.bedId = newBedId;
    admission.status = "transferred";
    admission.notes += `\nTransferred to new room and bed on ${new Date().toISOString()}`;
    await admission.save();

    return res.status(200).json({
      message: "Patient transferred successfully",
      admission,
    });
  } catch (error) {
    console.error("transferAdmission Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAdmissionsByPatientId = async (req, res) => {
  const { id: patientId } = req.params;
  try {
    const admissions = await Admission.find({ patientId })
      .populate("roomId", "roomNumber floor")
      .populate("bedId", "bedNumber isOccupied")
      .populate("admittedBy", "name email phone");

    if (!admissions || admissions.length === 0) {
      return res
        .status(404)
        .json({ error: "No admissions found for this patient" });
    }

    return res.status(200).json({
      message: "Admissions retrieved successfully",
      admissions,
    });
  } catch (error) {
    console.error("getAdmissionsByPatientId Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
