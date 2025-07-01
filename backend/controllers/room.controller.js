import mongoose from "mongoose";
import Room from "../models/room.model.js";
import Staff from "../models/staff.model.js";
import Department from "../models/department.model.js";
import Bed from "../models/bed.model.js";

const typesRequiringInCharge = [
  "icu",
  "emergency",
  "operation",
  "labor_delivery",
  "post_op",
  "isolation",
  "dialysis",
  "chemo",
  "nursery",
];

const validTypes = [
  "ward",
  "private",
  "semi_private",
  "icu",
  "emergency",
  "operation",
  "labor_delivery",
  "post_op",
  "isolation",
  "dialysis",
  "chemo",
  "radiology",
  "examination",
  "consultation",
  "waiting",
  "nursery",
];

export const createRoom = async (req, res) => {
  const {
    roomNumber,
    type = "ward",
    floor,
    isOccupied = false,
    inChargeStaffId,
    departmentId,
    equipmentList = [],
    bedList = [],
  } = req.body;

  try {
    const existingRoom = await Room.findOne({
      roomNumber: roomNumber.toUpperCase(),
      floor,
    });
    if (existingRoom) {
      return res.status(400).json({
        error: "A room with this number already exists on this floor",
      });
    }

    const criticalTypes = [
      "icu",
      "emergency",
      "operation",
      "labor_delivery",
      "post_op",
      "isolation",
      "dialysis",
      "chemo",
      "nursery",
    ];
    if (criticalTypes.includes(type)) {
      if (!inChargeStaffId) {
        return res
          .status(400)
          .json({ error: "In-charge staff is required for this room type" });
      }

      const staff = await Staff.findById(inChargeStaffId);
      if (!staff || !staff.isActive) {
        return res
          .status(400)
          .json({ error: "Invalid or inactive in-charge staff ID" });
      }

      if (departmentId && String(staff.departmentId) !== String(departmentId)) {
        return res.status(400).json({
          error: "In-charge staff does not belong to the provided department",
        });
      }
    }

    if (type !== "emergency") {
      const department = await Department.findById(departmentId);
      if (!department || !department.isActive) {
        return res
          .status(400)
          .json({ error: "Invalid or inactive department ID" });
      }
    }

    const newRoom = new Room({
      roomNumber: roomNumber.toUpperCase(),
      type,
      floor,
      isOccupied,
      inChargeStaffId,
      departmentId,
      equipmentList,
      bedList,
    });

    await newRoom.save();

    return res.status(201).json({
      message: "Room created successfully",
      room: newRoom,
    });
  } catch (error) {
    console.error("createRoom Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const assignInchargeStaff = async (req, res) => {
  const { id } = req.params;
  const { staffId } = req.body;
  if (!mongoose.Types.ObjectId.isValid(staffId)) {
    return res.status(400).json({ error: "Invalid Staff Id" });
  }
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(400).json({ error: "Room not found or is deleted" });
    }
    if (room.inChargeStaffId) {
      return res
        .status(400)
        .json({ error: "Room already has an in-charge staff assigned" });
    }
    const staff = await Staff.findById(staffId);
    if (!staff || !staff.isActive) {
      return res
        .status(400)
        .json({ error: "Invalid or inactive staff member" });
    }

    if (
      room.departmentId &&
      String(staff.departmentId) !== String(room.departmentId)
    ) {
      return res.status(400).json({
        error: "Staff does not belong to the department assigned to this room",
      });
    }

    room.inChargeStaffId = staffId;
    await room.save();

    return res.status(200).json({
      message: "In-charge staff assigned successfully",
      room,
    });
  } catch (error) {
    console.error("assignInchargeStaff Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    const { type, floor, isOccupied, departmentId } = req.query;
    const filter = { isDeleted: false };
    if (type) filter.type = type;
    if (floor !== undefined) filter.floor = Number(floor);
    if (departmentId) filter.departmentId = departmentId;
    let rooms = await Room.find(filter)
      .populate("bedList")
      .populate("equipmentList")
      .populate("inChargeStaffId", "name role")
      .populate("departmentId", "name");
    if (isOccupied !== undefined) {
      const occupied = isOccupied === "true";
      rooms = rooms.filter((room) => room.isOccupied === occupied);
    }
    res.status(200).json({
      message: "Rooms fetched successfully",
      total: rooms.length,
      rooms,
    });
  } catch (error) {
    console.error("getAllRooms Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findById(id).populate("bedList");
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    res.status(200).json({
      message: "Room fetched successfully",
      room,
    });
  } catch (error) {
    console.error("getRoomById Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const assignBeds = async (req, res) => {
  const { id: roomId } = req.params;
  const { bedIds } = req.body;
  if (!Array.isArray(bedIds) || bedIds.length === 0) {
    return res.status(400).json({ error: "bedIds must be a non-empty array" });
  }
  for (let bedId of bedIds) {
    if (!mongoose.Types.ObjectId.isValid(bedId)) {
      return res.status(400).json({ error: `Invalid Bed ID: ${bedId}` });
    }
  }
  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    const beds = await Bed.find({ _id: { $in: bedIds } });

    if (beds.length !== bedIds.length) {
      return res.status(400).json({ error: "Some beds were not found" });
    }

    const alreadyAssigned = beds.filter(
      (bed) => bed.roomId && bed.roomId.toString() !== roomId
    );
    if (alreadyAssigned.length > 0) {
      return res.status(400).json({
        error: "Some beds are already assigned to other rooms",
        conflictedBeds: alreadyAssigned.map((bed) => bed._id),
      });
    }

    await Bed.updateMany(
      { _id: { $in: bedIds } },
      { $set: { roomId: roomId } }
    );

    room.bedList = [...new Set([...room.bedList.map(String), ...bedIds])];
    await room.save();

    return res.status(200).json({
      message: "Beds successfully assigned to room",
      roomId: room._id,
      assignedBeds: bedIds,
    });
  } catch (error) {
    console.error("assignBeds Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const manageRoomType = async (req, res) => {
  const { id: roomId } = req.params;
  const { newType } = req.body;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ error: "Invalid Room ID" });
  }

  if (!validTypes.includes(newType)) {
    return res.status(400).json({ error: "Invalid Room Type" });
  }

  try {
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (room.isOccupied) {
      return res
        .status(400)
        .json({ error: "Cannot change type of an occupied room" });
    }

    room.type = newType;

    if (!typesRequiringInCharge.includes(newType)) {
      room.inChargeStaffId = undefined;
    }

    if (newType === "emergency") {
      room.departmentId = undefined;
    }

    await room.save();

    return res.status(200).json({
      message: "Room type updated successfully",
      updatedRoom: room,
    });
  } catch (error) {
    console.error("manageRoomType Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllBedsWithStatus = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id).populate(
      "bedList",
      "bedNumber isOccupied"
    );
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    const bedsWithStatus = room.bedList.map((bed) => ({
      id: bed._id,
      bedNumber: bed.bedNumber,
      status: bed.isOccupied ? "unavailable" : "available",
    }));
    return res.status(200).json({
      message: "All beds with status fetched successfully",
      total: bedsWithStatus.length,
      beds: bedsWithStatus,
    });
  } catch (error) {
    console.error("getAllBedsOfARoom Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const softDeletion = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (room.isDeleted) {
      return res.status(400).json({ error: "Room is already deleted" });
    }
    await room.populate("bedList", "isOccupied");
    const hasOccupiedBeds = room.bedList.some((bed) => bed.isOccupied);
    if (hasOccupiedBeds) {
      return res
        .status(400)
        .json({ error: "Cannot delete room with occupied beds" });
    }
    room.isDeleted = true;
    await room.save();
    res.status(200).json({ message: "Room is deleted successfully" });
  } catch (error) {
    console.error("softDeletion Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const activateRoom = async (req, res) => {
  const { id } = req.params;
  try {
    const room = await Room.findById(id);
    if (!room) {
      return res.status(404).json({ error: "Room not found" });
    }
    if (!room.isDeleted) {
      return res.status(400).json({ error: "Room is already active" });
    }
    room.isDeleted = false;
    await room.save();
    res.status(200).json({ message: "Room has activated", room });
  } catch (error) {
    console.error("softDeletion Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
