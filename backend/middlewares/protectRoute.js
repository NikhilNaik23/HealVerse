import jwt from "jsonwebtoken";
import Auth from "../models/auth.model.js";

export const protectRoute = async (req, res, next) => {
  const authHeaders = req.headers.authorization||"";
  if (!authHeaders || !authHeaders.startsWith("Bearer")) {
    return res.status(401).json({ message: "No token, authorization denied " });
  }
  const token = authHeaders.split(" ")[1]?.trim();
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await Auth.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error.message);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
