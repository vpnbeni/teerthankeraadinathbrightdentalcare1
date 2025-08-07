import express from "express";
import { auth } from "../middleware/auth.js";
import { uploadFile, getFile } from "../controllers/fileController.js";

const router = express.Router();

router.use(auth); // All routes require authentication
router.post("/upload", uploadFile);
router.get("/:fileId", getFile);

export default router;
