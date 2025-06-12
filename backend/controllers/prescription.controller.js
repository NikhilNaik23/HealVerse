import Prescription from "../models/prescription.model.js";
import Doctor from "../models/doctor.model.js";
import Appointment from "../models/appointment.model.js";
import Patient from "../models/patient.model.js";
import Staff from "../models/staff.model.js";

export const createPrescription = async (req, res) => {
  const staffId = req.user?.profile?._id;
  const role = req.user?.profile?.role;

  const {
    patientId,
    doctorId: doctorIdFromBody,
    appointmentId,
    diagnosis,
    medicines,
    advice,
    issuedDate,
  } = req.body;

  try {
    const existingPrescription = await Prescription.findOne({ appointmentId });
    if (existingPrescription) {
      return res
        .status(409)
        .json({ error: "A prescription already exists for this appointment" });
    }
    const staff = await Staff.findById(staffId);
    if (!staff || !staff.isActive) {
      return res
        .status(403)
        .json({ error: "Staff account is inactive or not found" });
    }
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ error: "Patient not found" });

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment)
      return res.status(404).json({ error: "Appointment not found" });

    let doctorId;

    if (role === "doctor") {
      const doctor = await Doctor.findOne({ staffId }).populate(
        "staffId",
        "isActive"
      );
      if (!doctor || !doctor.staffId?.isActive)
        return res.status(404).json({ error: "Doctor not found" });
      doctorId = doctor._id;
    } else if (role === "nurse" || role === "admin") {
      if (!doctorIdFromBody)
        return res
          .status(400)
          .json({ error: "Doctor ID is required for nurses/admins" });

      const doctor = await Doctor.findById(doctorIdFromBody);
      if (!doctor) return res.status(404).json({ error: "Doctor not found" });

      doctorId = doctor._id;
    } else {
      return res.status(403).json({ error: "Unauthorized role" });
    }
    if (
      !appointment.doctorId.equals(doctorId) ||
      !appointment.patientId.equals(patientId)
    ) {
      return res
        .status(400)
        .json({ error: "Appointment does not match patient or doctor" });
    }

    const prescription = new Prescription({
      patientId,
      doctorId,
      appointmentId,
      diagnosis,
      medicines,
      advice,
      uploadedBy: staffId,
      issuedDate: issuedDate || Date.now(),
    });

    await prescription.save();

    return res.status(201).json({
      message: "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error("Error in createPrescription:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPrescriptionById = async (req, res) => {
  const { id } = req.params;
  try {
    const prescription = await Prescription.findById(id)
      .populate("patientId", "name email gender")
      .populate({
        path: "doctorId",
        select: "specialization staffId",
        populate: {
          path: "staffId",
          select: "name email role isActive",
        },
      })
      .populate("uploadedBy", "name role email");
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }
    return res
      .status(200)
      .json({ message: "Prescription fetched successfully", prescription });
  } catch (error) {
    console.log("getPrescriptionById Error: ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPrescriptions = async (req, res) => {
  const { patientId, doctorId, appointmentId } = req.query;

  const filter = { isDeleted: false };
  if (patientId) filter.patientId = patientId;
  if (doctorId) filter.doctorId = doctorId;
  if (appointmentId) filter.appointmentId = appointmentId;

  try {
    const prescriptions = await Prescription.find(filter)
      .populate("patientId", "name email gender")
      .populate({
        path: "doctorId",
        select: "specialization staffId",
        populate: {
          path: "staffId",
          select: "name email role isActive",
        },
      })
      .populate("uploadedBy", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "Prescriptions fetched successfully",
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    console.error("getPrescriptions Error:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updatePrescription = async (req, res) => {
  const { id } = req.params;
  const staffId = req.user?.profile?._id;
  const role = req.user?.profile?.role;
  const data = req.body;

  try {
    const staff = await Staff.findById(staffId);
    if (!staff || !staff.isActive) {
      return res
        .status(403)
        .json({ error: "Staff does not exist or is inactive" });
    }

    const prescription = await Prescription.findById(id);
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    if (role === "doctor") {
      const doctor = await Doctor.findOne({ staffId });
      if (!doctor || !prescription.doctorId.equals(doctor._id)) {
        return res
          .status(403)
          .json({ error: "Access denied. You are not the assigned doctor." });
      }
    } else {
      return res
        .status(403)
        .json({ error: "Only doctors can update prescriptions" });
    }

    await Prescription.findByIdAndUpdate(id, data, { new: true });

    return res
      .status(200)
      .json({ message: "Prescription updated successfully" });
  } catch (error) {
    console.error("updatePrescription Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getPrescriptionsByPatient = async (req, res) => {
  const patientId = req.user?.auth?._id;

  try {
    const prescriptions = await Prescription.find({ patientId })
      .populate("doctorId", "specialization")
      .populate({
        path: "uploadedBy",
        select: "name role email",
      })
      .sort({ issuedDate: -1 });

    return res.status(200).json({
      message: "Prescriptions fetched successfully",
      count: prescriptions.length,
      prescriptions,
    });
  } catch (error) {
    console.error("getPrescriptionsByPatient Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deletePrescriptionById = async (req, res) => {
  const { id } = req.params;
  const staffId = req.user?.profile?._id;

  try {
    const staff = await Staff.findById(staffId);
    if (!staff || !staff.isActive) {
      return res
        .status(403)
        .json({ error: "Staff does not exist or is inactive" });
    }

    const prescription = await Prescription.findById(id).select(
      "doctorId isDeleted"
    );
    if (!prescription) {
      return res.status(404).json({ error: "Prescription not found" });
    }

    const doctor = await Doctor.findOne({ staffId });
    if (!doctor || !prescription.doctorId.equals(doctor._id)) {
      return res
        .status(403)
        .json({ error: "Access denied. You are not the assigned doctor." });
    }

    await Prescription.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    return res
      .status(200)
      .json({ message: "Prescription deleted successfully" });
  } catch (error) {
    console.error("deletePrescriptionById Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
