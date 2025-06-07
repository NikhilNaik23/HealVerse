import jwt from "jsonwebtoken";
import Auth from "../models/auth.model.js";
import Staff from "../models/staff.model.js";
import Patient from "../models/patient.model.js";

export const protectRoute = async (req, res, next) => {
  const authHeader = req.headers.authorization || "";

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "No token provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const authUser = await Auth.findById(decoded.id);

    if (!authUser) {
      return res.status(404).json({ message: "User not found" });
    }

    let profile = null;
    if (authUser.role === "Staff") {
      profile = await Staff.findById(authUser.linkedProfileId);
    } else if (authUser.role === "Patient") {
      profile = await Patient.findById(authUser.linkedProfileId);
    }

    if (!profile) {
      return res.status(404).json({ message: "Linked profile not found" });
    }

    req.user = {
      auth: authUser,
      profile,
    };

    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

export const adminRoute = (req, res, next) => {
  const role = req.user?.profile?.role;
  if (!role) {
    return res.status(401).json({ message: "Unauthorized: Role missing" });
  }
  if (role.toLowerCase() === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Access denied: Unauthorized role" });
};

export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || req.user.auth.role !== "Staff") {
      return res.status(403).json({ message: "Access denied: Not a staff" });
    }
    if (!req.user?.profile?.role) {
      return res.status(403).json({ message: "Access denied: Role missing" });
    }

    const allowed = allowedRoles.map((r) => r.toLowerCase());
    const userRole = req.user.profile.role?.toLowerCase();

    if (!allowed.includes(userRole)) {
      return res
        .status(403)
        .json({ message: `Access denied for role: ${req.user.profile.role}` });
    }

    next();
  };
};

export const authorizePatientOrStaff = (req, res, next) => {
  const user = req.user;
  const requestedPatientId = req.params.id;

  if (user.auth.role === "Staff") {
    return next();
  }
  if (
    user.auth.role === "Patient" &&
    user.profile._id.toString() === requestedPatientId
  ) {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
};

export const authorizeUser = (req, res, next) => {
  const userId = req.user?.auth?._id?.toString();
  const requestedAuthId = req.query.id || req.params.id;
  if (!requestedAuthId) {
    return res.status(400).json({ message: "Missing user ID parameter" });
  }
  if (userId === requestedAuthId) {
    return next();
  }
  return res.status(403).json({ message: "Access denied" });
};
