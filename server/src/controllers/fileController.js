import { fileService } from "../services/fileService.js";

/**
 * File Upload Controller
 * Handles all file upload and document management HTTP requests
 */

/**
 * @desc    Upload user document
 * @route   POST /api/files/upload-document
 * @access  Private
 */
export const uploadDocument = async (req, res) => {
  try {
    const { documentType } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
      });
    }

    // Validate file
    fileService.validateFile(req.file);

    const result = await fileService.uploadUserDocument(
      req.user._id,
      req.file,
      documentType
    );

    res.status(201).json({
      success: true,
      data: result,
      message: "Document uploaded successfully",
    });
  } catch (error) {
    console.error("Upload document error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Upload profile picture
 * @route   POST /api/files/upload-profile-picture
 * @access  Private
 */
export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Validate image file
    const allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    fileService.validateFile(req.file, allowedImageTypes);

    const result = await fileService.uploadProfilePicture(
      req.user._id,
      req.file
    );

    res.status(201).json({
      success: true,
      data: result,
      message: "Profile picture uploaded successfully",
    });
  } catch (error) {
    console.error("Upload profile picture error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user documents
 * @route   GET /api/files/my-documents
 * @access  Private
 */
export const getMyDocuments = async (req, res) => {
  try {
    const result = await fileService.getUserDocuments(req.user._id);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get my documents error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get user documents by ID (Admin or Self)
 * @route   GET /api/files/user-documents/:userId
 * @access  Private
 */
export const getUserDocuments = async (req, res) => {
  try {
    const { userId } = req.params;

    // Check if user is accessing their own documents or is admin
    if (req.user.role !== "admin" && userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    const result = await fileService.getUserDocuments(userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get user documents error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete user document
 * @route   DELETE /api/files/document/:documentType
 * @access  Private
 */
export const deleteDocument = async (req, res) => {
  try {
    const { documentType } = req.params;

    const result = await fileService.deleteUserDocument(
      req.user._id,
      documentType
    );

    res.status(200).json({
      success: true,
      data: result,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Delete document error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Delete user document by admin
 * @route   DELETE /api/files/admin/user-document/:userId/:documentType
 * @access  Private (Admin)
 */
export const deleteUserDocument = async (req, res) => {
  try {
    const { userId, documentType } = req.params;

    const result = await fileService.deleteUserDocument(userId, documentType);

    res.status(200).json({
      success: true,
      data: result,
      message: "User document deleted successfully",
    });
  } catch (error) {
    console.error("Delete user document error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Generate signed URL for secure file access
 * @route   POST /api/files/generate-signed-url
 * @access  Private
 */
export const generateSignedUrl = async (req, res) => {
  try {
    const { publicId, expiresIn = 3600 } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    const signedUrl = fileService.generateSignedUrl(publicId, { expiresIn });

    res.status(200).json({
      success: true,
      data: {
        signedUrl,
        expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });
  } catch (error) {
    console.error("Generate signed URL error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get file metadata
 * @route   GET /api/files/metadata/:publicId
 * @access  Private (Admin)
 */
export const getFileMetadata = async (req, res) => {
  try {
    const { publicId } = req.params;

    const metadata = await fileService.getFileMetadata(publicId);

    res.status(200).json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    console.error("Get file metadata error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Get storage statistics (Admin only)
 * @route   GET /api/files/admin/storage-stats
 * @access  Private (Admin)
 */
export const getStorageStats = async (req, res) => {
  try {
    const stats = await fileService.getStorageStats();

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get storage stats error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Bulk delete files (Admin only)
 * @route   DELETE /api/files/admin/bulk-delete
 * @access  Private (Admin)
 */
export const bulkDeleteFiles = async (req, res) => {
  try {
    const { publicIds } = req.body;

    if (!publicIds || !Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Public IDs array is required",
      });
    }

    const result = await fileService.bulkDeleteFiles(publicIds);

    res.status(200).json({
      success: true,
      data: result,
      message: "Files deleted successfully",
    });
  } catch (error) {
    console.error("Bulk delete files error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @desc    Upload multiple documents
 * @route   POST /api/files/upload-multiple
 * @access  Private
 */
export const uploadMultipleDocuments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const { documentTypes } = req.body;

    if (!documentTypes || documentTypes.length !== req.files.length) {
      return res.status(400).json({
        success: false,
        message: "Document types must match the number of files",
      });
    }

    const uploadPromises = req.files.map((file, index) => {
      fileService.validateFile(file);
      return fileService.uploadUserDocument(
        req.user._id,
        file,
        documentTypes[index]
      );
    });

    const results = await Promise.all(uploadPromises);

    res.status(201).json({
      success: true,
      data: {
        uploadedDocuments: results,
        totalUploaded: results.length,
      },
      message: "Documents uploaded successfully",
    });
  } catch (error) {
    console.error("Upload multiple documents error:", error);
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};
