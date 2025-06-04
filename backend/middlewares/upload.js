import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const allowedFormats = ["jpg", "jpeg", "png", "pdf"];

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "healverse/medicalHistory",
    allowed_formats: allowedFormats,
    public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, "-")}`,
  },
});

const fileFilter = (req, file, cb) => {
  const ext = file.originalname.split(".").pop().toLowerCase();
  if (allowedFormats.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF and image files are allowed."), false);
  }
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

export default upload;
