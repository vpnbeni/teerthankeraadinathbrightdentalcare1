import express from "express";
import multer from "multer";
import { auth } from "../middleware/auth.js";
import {
  getProfile,
  updatePersonalInfo,
  updateMedicalInfo,
  getDocuments,
  uploadDocument,
  deleteDocument,
  getDocumentFile,
  getSubscription,
} from "../controllers/userController.js";

// Configure multer for memory storage (for Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only JPEG, PNG and PDF files are allowed."
        )
      );
    }
  },
});

const router = express.Router();

router.use(auth); // All routes require authentication

// Profile routes
router.get("/profile", getProfile);
router.put("/profile/personal", updatePersonalInfo);
router.put("/profile/medical", updateMedicalInfo);

// Document routes
router.get("/documents", getDocuments);
router.post("/documents", upload.single("file"), uploadDocument);
router.delete("/documents/:documentId", deleteDocument);
router.get("/documents/:documentId/file", getDocumentFile);

// Test Cloudinary connection
router.get("/test-cloudinary", async (req, res) => {
  try {
    const { v2: cloudinary } = await import("cloudinary");
    const config = cloudinary.config();

    res.json({
      success: true,
      cloudinary_configured: !!(
        config.cloud_name &&
        config.api_key &&
        config.api_secret
      ),
      cloud_name: config.cloud_name,
      has_api_key: !!config.api_key,
      has_api_secret: !!config.api_secret,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Subscription routes
router.get("/subscription", getSubscription);

export default router;
