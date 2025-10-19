import express from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import { uploadProfilePicture } from "../controllers/fileController.js";

const router = express.Router();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."));
    }
  },
});

router.use(auth); // All routes require authentication
router.post("/upload-profile-picture", upload.single("photo"), uploadProfilePicture);

export default router;
