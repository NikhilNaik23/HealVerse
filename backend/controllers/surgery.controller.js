import Surgery from "../models/surgery.model.js";
import Room from "../models/room.model.js";
import Doctor from "../models/doctor.model.js";
import Staff from "../models/staff.model.js";
import Admission from "../models/admission.model.js";
import {
  addBillingItemToAdmissionBill,
  createBillIfNotExists,
} from "../lib/utils/billing.helper.js";

export const createSurgery = async (req, res) => {
  const data = req.body;

  try {
    let admitted = await Admission.findOne({
      patientId: data.patientId,
      status: "admitted",
    });

    if (!admitted) {
      const availableRoom = await Room.findOne({ isDeleted: false });
      if (!availableRoom) {
        return res.status(404).json({ error: "No available rooms found" });
      }

      const availableBed = await Bed.findOne({
        roomId: availableRoom._id,
        isOccupied: false,
      });

      if (!availableBed) {
        return res
          .status(404)
          .json({ error: "No available beds found in the selected room" });
      }

      admitted = await Admission.create({
        patientId: data.patientId,
        roomId: availableRoom._id,
        bedId: availableBed._id,
        admitDate: new Date(),
        reason: "Surgery",
        status: "admitted",
        admittedBy: req.user?.profile?._id,
        notes: "Auto-admitted for surgery",
      });

      availableBed.isOccupied = true;
      await availableBed.save();
    }

    const startTime = new Date(data.operationStartTime);

    const room = await Room.findById(data.operationRoomId);
    if (!room) {
      return res.status(404).json({ error: "Room does not exist" });
    }

    if (room.isOccupied) {
      return res.status(409).json({ error: "Room is already occupied" });
    }

    const conflictSurgery = await Surgery.findOne({
      operationRoomId: data.operationRoomId,
      $or: [
        { status: { $in: ["scheduled", "ongoing"] } },
        {
          status: "completed",
          operationEndTime: {
            $gte: new Date(startTime.getTime() - 15 * 60 * 1000),
          },
        },
      ],
    });

    if (conflictSurgery) {
      return res.status(400).json({
        error:
          "Room is occupied or not free at least 15 minutes before the scheduled start time",
      });
    }

    const leadSurgeon = await Doctor.findById(data.leadSurgeonId);
    if (!leadSurgeon) {
      return res.status(404).json({ error: "Lead surgeon not found" });
    }

    const staffIds = [
      ...data.assistantSurgeons,
      data.anesthetistId,
      data.scrubNurseId,
      data.circulatingNurseId,
    ].filter(Boolean);

    const staffDocs = await Staff.find({ _id: { $in: staffIds } });
    if (staffDocs.length !== staffIds.length) {
      return res
        .status(404)
        .json({ error: "One or more staff members not found" });
    }

    const involvedIds = [
      data.leadSurgeonId,
      ...data.assistantSurgeons,
      data.anesthetistId,
      data.scrubNurseId,
      data.circulatingNurseId,
    ].filter(Boolean);

    const clash = await Surgery.findOne({
      status: { $in: ["scheduled", "ongoing"] },
      operationStartTime: { $lte: new Date(data.operationEndTime) },
      operationEndTime: { $gte: new Date(data.operationStartTime) },
      $or: [
        { leadSurgeonId: { $in: involvedIds } },
        { assistantSurgeons: { $in: involvedIds } },
        { anesthetistId: { $in: involvedIds } },
        { scrubNurseId: { $in: involvedIds } },
        { circulatingNurseId: { $in: involvedIds } },
      ],
    });

    if (clash) {
      return res.status(409).json({
        error: "One or more staff are already occupied during this time",
      });
    }

    const newSurgery = await Surgery.create(data);

    const bill = await createBillIfNotExists(
      admitted._id,
      req.user?.profile?._id
    );
    await addBillingItemToAdmissionBill(admitted._id, {
      service: "surgery",
      referenceId: newSurgery._id,
      cost: 1500,
      description: "Surgical operation charges",
    });

    return res.status(201).json({
      message: "Surgery scheduled successfully",
      surgery: newSurgery,
    });
  } catch (error) {
    console.error("createSurgery Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllSurgeries = async (req, res) => {
  const profile = req.user?.profile;
  const role = profile?.role?.toLowerCase();
  const staffId = profile?._id;
  const doctorIdFromProfile = profile?.doctorId;

  const { status, date, doctorId, patientId } = req.query;

  try {
    const filter = { isDeleted: false };

    if (status) filter.status = status;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.operationStartTime = { $gte: start, $lte: end };
    }

    if (patientId) filter.patientId = patientId;

    if (["admin", "receptionist"].includes(role)) {
      if (doctorId) filter.leadSurgeonId = doctorId;
    } else {
      filter.$or = [];

      if (role === "doctor" && doctorIdFromProfile) {
        filter.$or.push({ leadSurgeonId: doctorIdFromProfile });
      }

      if (["doctor", "nurse", "staff"].includes(role) && staffId) {
        filter.$or.push(
          { assistantSurgeons: staffId },
          { anesthetistId: staffId },
          { scrubNurseId: staffId },
          { circulatingNurseId: staffId }
        );
      }

      if (filter.$or.length === 0) {
        return res.status(403).json({ error: "Access denied" });
      }
    }

    const surgeries = await Surgery.find(filter)
      .populate("patientId", "name gender age")
      .populate("leadSurgeonId", "name specialization")
      .populate("assistantSurgeons", "name role")
      .populate("anesthetistId", "name role")
      .populate("scrubNurseId", "name role")
      .populate("circulatingNurseId", "name role")
      .populate("operationRoomId", "roomNumber floor");

    return res.status(200).json({
      message: "Surgeries fetched successfully",
      total: surgeries.length,
      surgeries,
    });
  } catch (error) {
    console.error("getAllSurgeries Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getSurgeryById = async (req, res) => {
  const { id: surgeryId } = req.params;
  const profile = req.user?.profile;
  const role = profile?.role?.toLowerCase();
  const doctorId = profile?.doctorId;
  const staffId = profile?._id;

  try {
    const surgery = await Surgery.findById(surgeryId)
      .populate("patientId", "name gender age")
      .populate("leadSurgeonId", "name specialization")
      .populate("assistantSurgeons", "name role")
      .populate("anesthetistId", "name role")
      .populate("scrubNurseId", "name role")
      .populate("circulatingNurseId", "name role")
      .populate("operationRoomId", "roomNumber floor");

    if (!surgery || surgery.isDeleted) {
      return res.status(404).json({ error: "Surgery not found" });
    }

    if (["admin", "receptionist"].includes(role)) {
      return res.status(200).json({
        message: "Surgery details fetched successfully",
        surgery,
      });
    }

    if (
      role === "doctor" &&
      surgery.leadSurgeonId?._id.toString() === doctorId?.toString()
    ) {
      return res.status(200).json({
        message: "Surgery details fetched successfully",
        surgery,
      });
    }

    const involvedStaffIds = [
      ...surgery.assistantSurgeons.map((s) => s._id.toString()),
      surgery.anesthetistId?._id?.toString(),
      surgery.scrubNurseId?._id?.toString(),
      surgery.circulatingNurseId?._id?.toString(),
    ];

    if (involvedStaffIds.includes(staffId?.toString())) {
      return res.status(200).json({
        message: "Surgery details fetched successfully",
        surgery,
      });
    }

    return res
      .status(403)
      .json({ error: "Unauthorized: Not involved in this surgery" });
  } catch (error) {
    console.error("getSurgeryById Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markSurgeryAsCompleted = async (req, res) => {
  const doctorId = req.user?.profile?.doctorId;
  const role = req.user?.profile?.role?.toLowerCase();
  const { id: surgeryId } = req.params;

  try {
    const surgery = await Surgery.findById(surgeryId);

    if (!surgery) {
      return res.status(404).json({ error: "Surgery not found" });
    }

    if (["completed", "cancelled"].includes(surgery.status)) {
      return res.status(400).json({
        error:
          "Cannot mark as completed — surgery is already completed or cancelled.",
      });
    }

    if (
      role === "doctor" &&
      surgery.leadSurgeonId?.toString() !== doctorId?.toString()
    ) {
      return res.status(403).json({
        error:
          "Unauthorized: Only the lead surgeon or an admin can complete this surgery.",
      });
    }

    surgery.status = "completed";
    surgery.operationEndTime = new Date();
    await surgery.save();

    await Room.findByIdAndUpdate(surgery.operationRoomId, {
      isOccupied: false,
    });

    return res.status(200).json({
      message: "Surgery marked as completed successfully",
      completedAt: surgery.operationEndTime,
    });
  } catch (error) {
    console.error("markSurgeryAsCompleted error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateSurgery = async (req, res) => {
  const { id: surgeryId } = req.params;
  const updates = req.body;

  try {
    const surgery = await Surgery.findById(surgeryId);
    if (!surgery || surgery.isDeleted) {
      return res.status(404).json({ error: "Surgery not found" });
    }

    if (updates.operationRoomId) {
      const room = await Room.findById(updates.operationRoomId);
      if (!room || room.isDeleted) {
        return res.status(404).json({ error: "Selected room not found" });
      }

      if (
        room.isOccupied &&
        room._id.toString() !== surgery.operationRoomId.toString()
      ) {
        return res
          .status(409)
          .json({ error: "Selected room is currently occupied" });
      }

      const startTime = new Date(
        updates.operationStartTime || surgery.operationStartTime
      );

      const conflictSurgery = await Surgery.findOne({
        _id: { $ne: surgeryId },
        operationRoomId: updates.operationRoomId,
        $or: [
          { status: { $in: ["scheduled", "ongoing"] } },
          {
            status: "completed",
            operationEndTime: {
              $gte: new Date(startTime.getTime() - 15 * 60 * 1000),
            },
          },
        ],
      });

      if (conflictSurgery) {
        return res.status(409).json({
          error:
            "Room is occupied or not free at least 15 minutes before the start time",
        });
      }

      surgery.operationRoomId = updates.operationRoomId;
    }

    const involvedIds = [
      updates.leadSurgeonId || surgery.leadSurgeonId,
      ...(updates.assistantSurgeons || surgery.assistantSurgeons),
      updates.anesthetistId || surgery.anesthetistId,
      updates.scrubNurseId || surgery.scrubNurseId,
      updates.circulatingNurseId || surgery.circulatingNurseId,
    ].filter(Boolean);

    const clash = await Surgery.findOne({
      _id: { $ne: surgeryId },
      status: { $in: ["scheduled", "ongoing"] },
      operationStartTime: {
        $lte: new Date(updates.operationEndTime || surgery.operationEndTime),
      },
      operationEndTime: {
        $gte: new Date(
          updates.operationStartTime || surgery.operationStartTime
        ),
      },
      $or: [
        { leadSurgeonId: { $in: involvedIds } },
        { assistantSurgeons: { $in: involvedIds } },
        { anesthetistId: { $in: involvedIds } },
        { scrubNurseId: { $in: involvedIds } },
        { circulatingNurseId: { $in: involvedIds } },
      ],
    });

    if (clash) {
      return res.status(409).json({
        error: "One or more staff are already occupied during this time",
      });
    }

    if (updates.leadSurgeonId) surgery.leadSurgeonId = updates.leadSurgeonId;
    if (updates.assistantSurgeons)
      surgery.assistantSurgeons = updates.assistantSurgeons;
    if (updates.anesthetistId) surgery.anesthetistId = updates.anesthetistId;
    if (updates.scrubNurseId) surgery.scrubNurseId = updates.scrubNurseId;
    if (updates.circulatingNurseId)
      surgery.circulatingNurseId = updates.circulatingNurseId;
    if (updates.operationStartTime)
      surgery.operationStartTime = updates.operationStartTime;
    if (updates.operationEndTime)
      surgery.operationEndTime = updates.operationEndTime;
    if (updates.status) surgery.status = updates.status;
    if (updates.notes) surgery.notes = updates.notes;

    await surgery.save();

    return res.status(200).json({
      message: "Surgery updated successfully",
      surgery,
    });
  } catch (error) {
    console.error("updateSurgery Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const cancelSurgery = async (req, res) => {
  const { id: surgeryId } = req.params;

  try {
    const surgery = await Surgery.findById(surgeryId);
    if (!surgery) {
      return res.status(404).json({ error: "Surgery not found" });
    }

    if (["completed", "cancelled"].includes(surgery.status)) {
      return res.status(400).json({
        error: `Cannot cancel a ${surgery.status} surgery.`,
      });
    }

    surgery.status = "cancelled";
    await surgery.save();

    await Room.findByIdAndUpdate(surgery.operationRoomId, {
      isOccupied: false,
    });

    return res.status(200).json({ message: "Surgery cancelled successfully" });
  } catch (error) {
    console.error("cancelSurgery error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteSurgery = async (req, res) => {
  const { id: surgeryId } = req.params;

  try {
    const surgery = await Surgery.findById(surgeryId);
    if (!surgery) {
      return res.status(404).json({ error: "Surgery not found" });
    }

    if (!["scheduled", "cancelled"].includes(surgery.status)) {
      return res.status(400).json({
        error: "Only scheduled or cancelled surgeries can be deleted",
      });
    }

    surgery.isDeleted = true;
    await surgery.save();

    return res.status(200).json({ message: "Surgery deleted (soft delete)" });
  } catch (error) {
    console.error("deleteSurgery error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
