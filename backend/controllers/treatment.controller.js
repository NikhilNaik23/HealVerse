import Admission from "../models/admission.model.js";
import Patient from "../models/patient.model.js";
import Prescription from "../models/prescription.model.js";
import Room from "../models/room.model.js";
import Treatment from "../models/treatment.model.js";
import { addBillingItemToAdmissionBill } from "../lib/utils/billing.helper.js";

export const createTreatment = async (req, res) => {
  let {
    patientId,
    doctorId,
    treatmentDate,
    description,
    prescriptionIds = [],
    prescribedMedications = [],
    followUpRequired = false,
    followDate,
    operationRoomId,
  } = req.body;

  try {
    if (req.user?.profile?.role === "doctor") {
      doctorId = req.user?.profile?.doctorId;
    }
    if (req.user?.profile?.role === "admin") {
      if (!doctorId) {
        return res.status(400).json({ error: "Doctor Id is required" });
      }
    }
    const existingTreatment = await Treatment.findOne({
      patientId,
      doctorId,
      treatmentDate: {
        $gte: new Date(new Date(treatmentDate).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(treatmentDate).setHours(23, 59, 59, 999)),
      },
    });

    if (existingTreatment) {
      return res.status(400).json({
        error:
          "A treatment already exists for this patient on the given date with this doctor",
      });
    }
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }
    if (
      patient.assignedDoctorId.toString() !== req.user.profile._id.toString()
    ) {
      return res
        .status(403)
        .json({ error: "You are not assigned to this patient" });
    }
    if (prescriptionIds.length > 0) {
      const invalidPrescriptions = await Prescription.find({
        _id: { $in: prescriptionIds },
      });

      if (invalidPrescriptions.length !== prescriptionIds.length) {
        return res
          .status(400)
          .json({ error: "Some prescription IDs are invalid" });
      }
    }
    if (operationRoomId) {
      if (!mongoose.Types.ObjectId.isValid(operationRoomId)) {
        return res.status(400).json({ error: "Invalid operation room ID" });
      }

      const operationRoom = await Room.findById(operationRoomId);
      if (!operationRoom || operationRoom.isDeleted) {
        return res
          .status(404)
          .json({ error: "Operation room does not exist or is deleted" });
      }
    }
    const treatment = await Treatment.create({
      patientId,
      doctorId,
      treatmentDate,
      description,
      prescriptionIds,
      prescribedMedications,
      followUpRequired,
      followDate,
      operationRoomId,
    });

    try {
      const admission = await Admission.findOne({
        patientId,
        status: "admitted",
      });

      if (admission) {
        await addBillingItemToAdmissionBill(admission._id, {
          service: "treatment",
          referenceId: treatment._id,
          description: "Treatment Charges",
        });
      }
    } catch (billingErr) {
      console.error("Billing Integration Error:", billingErr.message);
    }

    return res.status(201).json({
      message: "Treatment created successfully",
      treatment,
    });
  } catch (error) {
    console.error("createTreatment Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTreatmentById = async (req, res) => {
  const { id: treatmentId } = req.params;
  const DoctorId = req.user?.profile?.doctorId;
  const role = req.user?.profile?.role;

  try {
    const treatment = await Treatment.findById(treatmentId)
      .populate("patientId", "name phone gender medicalHistory")
      .populate({
        path: "doctorId",
        select: "specialization staffId",
        populate: {
          path: "staffId",
          select: "name email phone role departmentId",
        },
      })
      .populate({
        path: "operationRoomId",
        select: "roomNumber floor inChargeStaffId",
        populate: {
          path: "inChargeStaffId",
          select: "name email phone role departmentId",
        },
      });

    if (!treatment) {
      return res.status(404).json({ error: "Treatment is not found" });
    }

    if (role?.toLowerCase() === "doctor") {
      if (
        !DoctorId ||
        DoctorId.toString() !== treatment.doctorId._id.toString()
      ) {
        return res
          .status(401)
          .json({ error: "Unauthorized: You are not the treating doctor" });
      }
    }

    return res
      .status(200)
      .json({ message: "Treatment retrieved successfully", treatment });
  } catch (error) {
    console.log("getTreatmentById Controller Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTreatmentsByPatientId = async (req, res) => {
  const { id: patientId } = req.params;
  const DoctorId = req.user?.profile?.doctorId;
  const role = req.user?.profile?.role;

  try {
    const treatments = await Treatment.find({ patientId })
      .populate("doctorId", "specialization staffId")
      .populate("operationRoomId", "roomNumber");

    if (!treatments || treatments.length === 0) {
      return res
        .status(404)
        .json({ error: "No treatments found for this patient" });
    }

    if (role?.toLowerCase() === "doctor") {
      const isAuthorized = treatments.some(
        (t) => t.doctorId && t.doctorId._id.toString() === DoctorId?.toString()
      );

      if (!isAuthorized) {
        return res
          .status(401)
          .json({ error: "Unauthorized: You are not the treating doctor" });
      }
    }

    return res
      .status(200)
      .json({ message: "Treatments retrieved successfully", treatments });
  } catch (error) {
    console.log("getTreatmentsByPatientId Controller Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTreatmentsByDoctorId = async (req, res) => {
  const { id: DocId } = req.params;
  const DoctorId = req.user?.profile?.doctorId;
  const role = req.user?.profile?.role;
  try {
    const treatments = await Treatment.find({ doctorId: DocId })
      .populate("doctorId", "specialization staffId")
      .populate("operationRoomId", "roomNumber");

    if (!treatments || treatments.length === 0) {
      return res
        .status(404)
        .json({ error: "No treatments found for this patient" });
    }
    if (role?.toLowerCase() === "doctor") {
      const isAuthorized = treatments.some(
        (t) => t.doctorId && t.doctorId._id.toString() === DoctorId?.toString()
      );

      if (!isAuthorized) {
        return res
          .status(401)
          .json({ error: "Unauthorized: You are not the treating doctor" });
      }
    }

    return res
      .status(200)
      .json({ message: "Treatments retrieved successfully", treatments });
  } catch (error) {
    console.log("getTreatmentsByDoctorId Controller Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateTreatment = async (req, res) => {
  const { id: treatmentId } = req.params;
  const DoctorId = req.user?.profile?.doctorId;
  const role = req.user?.profile?.role;
  const updateData = req.body;

  try {
    const treatment = await Treatment.findById(treatmentId);
    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    if (role?.toLowerCase() === "doctor") {
      if (!DoctorId || treatment.doctorId.toString() !== DoctorId.toString()) {
        return res
          .status(403)
          .json({ error: "Unauthorized: Not the treating doctor" });
      }
    }

    const updated = await Treatment.findByIdAndUpdate(treatmentId, updateData, {
      new: true,
    });

    return res
      .status(200)
      .json({ message: "Treatment updated successfully", treatment: updated });
  } catch (error) {
    console.error("updateTreatment Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllTreatments = async (req, res) => {
  try {
    const treatments = await Treatment.find()
      .populate("patientId", "name")
      .populate({
        path: "doctorId",
        select: "specialization staffId",
        populate: {
          path: "staffId",
          select: "name",
        },
      });

    return res
      .status(200)
      .json({ message: "All treatments fetched", treatments });
  } catch (error) {
    console.error("getAllTreatments Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markFollowUpComplete = async (req, res) => {
  const { id: treatmentId } = req.params;
  const role = req.user?.profile?.role?.toLowerCase();
  const doctorId = req.user?.profile?.doctorId;

  try {
    const treatment = await Treatment.findById(treatmentId);

    if (!treatment) {
      return res.status(404).json({ error: "Treatment not found" });
    }

    if (
      role === "doctor" &&
      treatment.doctorId.toString() !== doctorId?.toString()
    ) {
      return res
        .status(403)
        .json({ error: "Unauthorized: You are not the treating doctor" });
    }

    treatment.followUpRequired = false;
    treatment.followDate = null;
    await treatment.save();

    return res.status(200).json({
      message: "Follow-up marked as complete",
      treatment,
    });
  } catch (error) {
    console.error("markFollowUpComplete Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
