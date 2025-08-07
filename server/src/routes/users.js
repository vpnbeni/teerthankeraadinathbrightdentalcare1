import express from "express";
import multer from "multer";
import path from "path";
import { auth } from "../middleware/auth.js";
import {
  getProfile,
  updatePersonalInfo,
  updateMedicalInfo,
  getDocuments,
  uploadDocument,
  deleteDocument,
  getSubscription,
} from "../controllers/userController.js";

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/documents");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const upload = multer({
  storage: storage,
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

// Subscription routes
router.get("/subscription", getSubscription);

export default router;
