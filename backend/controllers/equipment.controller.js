import Equipment from "../models/equipment.model.js";
import Room from "../models/room.model.js";

export const createEquipment = async (req, res) => {
  try {
    const { name, description, status, assignedRoom, purchaseDate } = req.body;
    const existing = await Equipment.findOne({ name });
    if (existing) {
      return res.status(409).json({
        error: "Equipment with this name already exists",
      });
    }
    const newEquipment = await Equipment.create({
      name,
      description,
      status,
      assignedRoom,
      purchaseDate,
    });
    return res.status(201).json({
      message: "Equipment created successfully",
      equipment: newEquipment,
    });
  } catch (err) {
    console.error("createEquipment Controller Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllEquipments = async (req, res) => {
  try {
    const { status, name, assignedRoom } = req.query;
    const query = { isDeleted: false };
    if (status) {
      query.status = status;
    }
    if (name) {
      query.name = name;
    }
    if (assignedRoom) {
      query.assignedRoom = assignedRoom;
    }
    const equipments = await Equipment.find(query).populate(
      "assignedRoom",
      "roomNumber"
    );
    return res.status(200).json({
      count: equipments.length,
      equipments,
    });
  } catch (err) {
    console.error("getAllEquipments Controller Error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getEquipmentById = async (req, res) => {
  const { id: equipmentId } = req.params;
  try {
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment || equipment.isDeleted) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    return res.status(200).json({
      message: "Equipment fetched successfully",
      equipment,
    });
  } catch (error) {
    console.error("getEquipmentById Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateEquipment = async (req, res) => {
  const { id: equipmentId } = req.params;
  const { name, description, status, assignedRoom, purchaseDate } = req.body;

  try {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    if (assignedRoom) {
      const roomExists = await Room.findById(assignedRoom);
      if (!roomExists || roomExists.isDeleted) {
        return res
          .status(404)
          .json({ error: "Assigned room not found or is deleted" });
      }
      equipment.assignedRoom = assignedRoom;
    }

    if (name) equipment.name = name.trim();
    if (description) equipment.description = description;
    if (status) equipment.status = status;
    if (purchaseDate) equipment.purchaseDate = purchaseDate;

    await equipment.save();

    return res.status(200).json({
      message: "Equipment updated successfully",
      equipment,
    });
  } catch (error) {
    console.error("updateEquipment Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteEquipment = async (req, res) => {
  const { id: equipmentId } = req.body;
  try {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.isDeleted) {
      return res
        .status(404)
        .json({ error: "Equipment not found or already deleted" });
    }

    equipment.isDeleted = true;
    await equipment.save();

    return res.status(200).json({
      message: "Equipment soft-deleted successfully",
      equipment,
    });
  } catch (error) {
    console.log("deleteEquipment Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const assignEquipmentToRoom = async (req, res) => {
  const { id: equipmentId } = req.params;
  const { roomId } = req.body;

  try {
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment || equipment.isDeleted) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    const room = await Room.findById(roomId);
    if (!room || room.isDeleted) {
      return res.status(404).json({ error: "Room not found" });
    }

    if (equipment.assignedRoom?.toString() === roomId.toString()) {
      return res
        .status(400)
        .json({ error: "Equipment is already assigned to this room" });
    }

    equipment.assignedRoom = roomId;
    await equipment.save();

    return res.status(200).json({
      message: "Equipment assigned to room successfully",
      equipment,
    });
  } catch (error) {
    console.error("assignEquipmentToRoom Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markAsInUse = async (req, res) => {
  const { id: equipmentId } = req.params;

  try {
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment || equipment.isDeleted) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    if (equipment.status === "in-use") {
      return res
        .status(400)
        .json({ error: "Equipment is already marked as in-use" });
    }

    equipment.status = "in-use";
    await equipment.save();

    return res.status(200).json({
      message: "Equipment marked as in-use successfully",
      equipment,
    });
  } catch (error) {
    console.error("markAsInUse Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const markAsAvailable = async (req, res) => {
  const { id: equipmentId } = req.params;

  try {
    const equipment = await Equipment.findById(equipmentId);

    if (!equipment || equipment.isDeleted) {
      return res.status(404).json({ error: "Equipment not found" });
    }

    if (equipment.status === "available") {
      return res
        .status(400)
        .json({ error: "Equipment is already marked as available" });
    }

    equipment.status = "available";
    await equipment.save();

    return res.status(200).json({
      message: "Equipment marked as available successfully",
      equipment,
    });
  } catch (error) {
    console.error("markAsAvailable Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getEquipmentByRoomId = async (req, res) => {
  const { id:roomId } = req.params;

  try {
    const equipmentList = await Equipment.find({
      assignedRoom: roomId,
      isDeleted: { $ne: true },
    });

    if (!equipmentList || equipmentList.length === 0) {
      return res.status(404).json({
        error: "No equipment found for this room",
      });
    }

    return res.status(200).json({
      message: "Equipment fetched successfully",
      equipment: equipmentList,
    });
  } catch (error) {
    console.error("getEquipmentByRoomId Controller Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
