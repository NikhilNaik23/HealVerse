import mongoose from "mongoose";
import Bed from "../models/bed.model.js";
import Room from "../models/room.model.js";
import Patient from "../models/patient.model.js";

export const createBed = async (req, res) => {
  const { bedNumber, roomId } = req.body;
  try {
    const existingBedInRoom = await Bed.findOne({ bedNumber, roomId });
    if (existingBedInRoom) {
      return res.status(400).json({ error: "Bed already exists in this room" });
    }
    const existingRoom = await Room.findById(roomId);
    if (!existingRoom || existingRoom.isDeleted) {
      return res
        .status(404)
        .json({ message: "Room does not exist or is deleted" });
    }
    const bed = await Bed.create({ bedNumber, roomId });
    existingRoom.bedList.push(bed._id);
    await existingRoom.save();
    res
      .status(201)
      .json({ message: "Bed created and allocated successfully", bed });
  } catch (error) {
    console.log("createBed Controller Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllBeds = async (req, res) => {
  const { bedNumber, roomId } = req.query;
  try {
    const filter = {};
    if (bedNumber) {
      filter.bedNumber = bedNumber;
    }
    if (roomId) {
      filter.roomId = roomId;
    }
    const beds = await Bed.find(filter);
    if (beds.length === 0) {
      return res
        .status(200)
        .json({ message: "Data fetched successfully", beds: [] });
    }
    res.status(200).json({ message: "Data fetched successfully", beds });
  } catch (error) {
    console.log("getAllBeds Controller Error: ", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBedById = async (req, res) => {
  const { id } = req.params;
  try {
    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" });
    }
    return res.status(200).json({ message: "Bed Fetched Successfully", bed });
  } catch (error) {
    console.log("getBedById Controller Id:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const updateBedById = async (req, res) => {
  const { id } = req.params;
  const { bedNumber, roomId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ error: "Invalid Room Id" });
  }

  try {
    const bed = await Bed.findById(id);
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" });
    }

    const newRoom = await Room.findById(roomId);
    if (!newRoom || newRoom.isDeleted) {
      return res
        .status(404)
        .json({ error: "Room does not exist or is deleted" });
    }

    const isBedNumberTaken = await Bed.findOne({
      bedNumber,
      roomId: newRoom._id,
      _id: { $ne: bed._id },
    });

    if (isBedNumberTaken) {
      return res
        .status(400)
        .json({ error: "Bed number already exists in the selected room" });
    }

    if (bed.roomId.toString() !== roomId.toString()) {
      const prevRoom = await Room.findById(bed.roomId);
      if (prevRoom) {
        prevRoom.bedList = prevRoom.bedList.filter(
          (bedId) => bedId.toString() !== bed._id.toString()
        );
        await prevRoom.save();
      }

      newRoom.bedList.push(bed._id);
      await newRoom.save();
    }

    bed.bedNumber = bedNumber;
    bed.roomId = roomId;
    await bed.save();

    res.status(200).json({ message: "Bed updated successfully", bed });
  } catch (error) {
    console.error("updateBedById Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const assignBedToPatient = async (req, res) => {
  const { id: bedId } = req.params;
  const { patientId, roomId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(patientId)) {
    return res.status(400).json({ error: "Invalid Patient ID" });
  }

  try {
    const patient = await Patient.findById(patientId);
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    const bed = await Bed.findById(bedId);
    if (!bed) {
      return res.status(404).json({ error: "Bed not found" });
    }

    if (bed.patientId) {
      if (bed.patientId.toString() === patient._id.toString()) {
        return res
          .status(400)
          .json({ error: "Bed is already assigned to this patient" });
      }
      return res
        .status(409)
        .json({ error: "Bed is already assigned to another patient" });
    }

    if (bed.roomId.toString() !== roomId) {
      return res
        .status(400)
        .json({ error: "Room ID mismatch with assigned bed" });
    }

    bed.patientId = patient._id;
    await bed.save();

    res
      .status(200)
      .json({ message: "Bed successfully assigned to patient", bed });
  } catch (error) {
    console.error("assignBedToPatient Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAllBedsOfRoom = async (req, res) => {
  const { id: roomId } = req.params;
  try {
    const beds = await Bed.find({ roomId }).populate("roomId", "roomNumber");

    let msg = "";
    if (beds.length === 0) {
      msg = `No beds assigned to this room yet.`;
    } else {
      msg = `Beds fetched successfully for Room ${beds[0].roomId.roomNumber}`;
    }

    return res.status(200).json({
      message: msg,
      beds,
      bedsCount: beds.length,
    });
  } catch (error) {
    console.error("getAllBedsOfRoom Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getAvailableBeds = async (req, res) => {
  try {
    const details = await Bed.find({}).populate("roomId", "roomNumber");
    const beds = details.filter((detail) => detail.isOccupied !== true);
    res.status(200).json({
      message: "Fetched available beds with room numbers successfully",
      bedsAvailable: beds.length,
      beds: beds.map((bed) => ({
        bedId: bed._id,
        bedNumber: bed.bedNumber,
        roomNumber: bed.roomId?.roomNumber || "N/A",
      })),
    });
  } catch (error) {
    console.error("getAvailableBeds Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getBedByPatientId = async (req, res) => {
  const { id: patientId } = req.params;
  try {
    const bed = await Bed.findOne({ patientId: patientId }).populate(
      "roomId",
      "roomNumber"
    );
    if (!bed) {
      return res
        .status(400)
        .json({ error: "Bed is not assigned to patient yet." });
    }
    return res.status(200).json({ message: "Fetching bed details", bed });
  } catch (error) {
    console.error("getBedByPatientId Controller Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
