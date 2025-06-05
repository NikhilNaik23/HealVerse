import jwt from "jsonwebtoken";
export const generateTokenForSetPassword = (userId, role) => {
  return jwt.sign({ id: userId, role: role }, process.env.JWT_SET_PASSWORD, {
    expiresIn: "15m",
  });
};
