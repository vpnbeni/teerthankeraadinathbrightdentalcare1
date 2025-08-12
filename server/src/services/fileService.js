import { v2 as cloudinary } from "cloudinary";
import multer from "multer";
import { config } from "../config/environment.js";
import { User } from "../models/index.js";

/**
 * File Upload Service using Cloudinary
 * Handles file uploads, validation, and management
 */

// Configure Cloudinary
cloudinary.config({
  cloud_name: config.CLOUDINARY.CLOUD_NAME,
  api_key: config.CLOUDINARY.API_KEY,
  api_secret: config.CLOUDINARY.API_SECRET,
});

class FileService {
  constructor() {
    this.allowedImageTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    this.allowedDocumentTypes = [
      "application/pdf",
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];
    this.maxFileSize = 10 * 1024 * 1024; // 10MB
  }

  /**
   * Configure multer for file upload
   */
  getMulterConfig() {
    return multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: this.maxFileSize,
      },
      fileFilter: (req, file, cb) => {
        if (this.allowedDocumentTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file type. Only PDF and image files are allowed."
            ),
            false
          );
        }
      },
    });
  }

  /**
   * Upload file to Cloudinary
   */
  async uploadToCloudinary(fileBuffer, options = {}) {
    try {
      console.log("Cloudinary upload starting with options:", options);

      const uploadOptions = {
        resource_type: "auto",
        folder: options.folder || "dental-care",
        public_id: options.publicId,
        transformation: options.transformation,
        ...options,
      };

      return new Promise((resolve, reject) => {
        cloudinary.uploader
          .upload_stream(uploadOptions, (error, result) => {
            if (error) {
              console.error("Cloudinary upload stream error:", error);
              reject(error);
            } else {
              console.log("Cloudinary upload successful:", {
                public_id: result.public_id,
                secure_url: result.secure_url,
                resource_type: result.resource_type,
              });
              resolve(result);
            }
          })
          .end(fileBuffer);
      });
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      throw new Error("Failed to upload file to cloud storage");
    }
  }

  /**
   * Delete file from Cloudinary
   */
  async deleteFromCloudinary(publicId, resourceType = "image") {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      return result;
    } catch (error) {
      console.error("Cloudinary delete error:", error);
      throw new Error("Failed to delete file from cloud storage");
    }
  }

  /**
   * Upload user document
   */
  async uploadUserDocument(userId, file, documentType) {
    try {
      console.log(
        "FileService: Starting upload for user:",
        userId,
        "type:",
        documentType
      );
      console.log("Cloudinary config:", {
        cloud_name: cloudinary.config().cloud_name,
        api_key: cloudinary.config().api_key ? "***" : "missing",
      });

      // Validate file
      console.log("Validating file:", {
        mimetype: file.mimetype,
        size: file.size,
        hasBuffer: !!file.buffer,
      });
      this.validateFile(file);

      // Validate document type
      const validTypes = ["id_proof", "medical_record", "insurance"];
      if (!validTypes.includes(documentType)) {
        throw new Error("Invalid document type");
      }

      // Generate unique public ID
      const timestamp = Date.now();
      const publicId = `users/${userId}/documents/${documentType}_${timestamp}`;

      // Upload to Cloudinary
      const uploadResult = await this.uploadToCloudinary(file.buffer, {
        folder: "dental-care/documents",
        publicId,
        resource_type: "auto",
      });

      // Update user document in database
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      // Remove existing document of same type
      const existingDocIndex = user.documents.findIndex(
        (doc) => doc.type === documentType
      );

      if (existingDocIndex !== -1) {
        // Delete old file from Cloudinary
        const oldPublicId = this.extractPublicIdFromUrl(
          user.documents[existingDocIndex].url
        );
        if (oldPublicId) {
          await this.deleteFromCloudinary(oldPublicId, "auto");
        }
        user.documents.splice(existingDocIndex, 1);
      }

      // Add new document
      user.documents.push({
        type: documentType,
        url: uploadResult.secure_url,
        uploadDate: new Date(),
      });

      await user.save();

      return {
        documentType,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploadDate: new Date(),
      };
    } catch (error) {
      console.error("Upload user document error:", error);
      throw new Error(error.message || "Failed to upload document");
    }
  }

  /**
   * Delete user document
   */
  async deleteUserDocument(userId, documentType) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error("User not found");
      }

      const documentIndex = user.documents.findIndex(
        (doc) => doc.type === documentType
      );

      if (documentIndex === -1) {
        throw new Error("Document not found");
      }

      const document = user.documents[documentIndex];
      const publicId = this.extractPublicIdFromUrl(document.url);

      // Delete from Cloudinary
      if (publicId) {
        await this.deleteFromCloudinary(publicId, "auto");
      }

      // Remove from user documents
      user.documents.splice(documentIndex, 1);
      await user.save();

      return {
        documentType,
        deleted: true,
      };
    } catch (error) {
      console.error("Delete user document error:", error);
      throw new Error(error.message || "Failed to delete document");
    }
  }

  /**
   * Get user documents
   */
  async getUserDocuments(userId) {
    try {
      const user = await User.findById(userId).select("documents");
      if (!user) {
        throw new Error("User not found");
      }

      return {
        documents: user.documents.map((doc) => ({
          type: doc.type,
          url: doc.url,
          uploadDate: doc.uploadDate,
        })),
      };
    } catch (error) {
      console.error("Get user documents error:", error);
      throw new Error(error.message || "Failed to get user documents");
    }
  }

  /**
   * Upload profile picture
   */
  async uploadProfilePicture(userId, file) {
    try {
      // Validate file type
      if (!this.allowedImageTypes.includes(file.mimetype)) {
        throw new Error(
          "Invalid file type. Only image files are allowed for profile pictures."
        );
      }

      const publicId = `users/${userId}/profile/avatar_${Date.now()}`;

      // Upload with image transformations
      const uploadResult = await this.uploadToCloudinary(file.buffer, {
        folder: "dental-care/profiles",
        publicId,
        transformation: [
          { width: 300, height: 300, crop: "fill", gravity: "face" },
          { quality: "auto", fetch_format: "auto" },
        ],
      });

      // Update user profile (if you have a profilePicture field)
      const user = await User.findById(userId);
      if (user) {
        // Delete old profile picture if exists
        if (user.profilePicture) {
          const oldPublicId = this.extractPublicIdFromUrl(user.profilePicture);
          if (oldPublicId) {
            await this.deleteFromCloudinary(oldPublicId);
          }
        }

        user.profilePicture = uploadResult.secure_url;
        await user.save();
      }

      return {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
      };
    } catch (error) {
      console.error("Upload profile picture error:", error);
      throw new Error(error.message || "Failed to upload profile picture");
    }
  }

  /**
   * Generate signed URL for secure file access
   */
  generateSignedUrl(publicId, options = {}) {
    try {
      const signedUrl = cloudinary.utils.private_download_url(
        publicId,
        "auto",
        {
          expires_at:
            Math.floor(Date.now() / 1000) + (options.expiresIn || 3600), // 1 hour default
          ...options,
        }
      );

      return signedUrl;
    } catch (error) {
      console.error("Generate signed URL error:", error);
      throw new Error("Failed to generate signed URL");
    }
  }

  /**
   * Extract public ID from Cloudinary URL
   */
  extractPublicIdFromUrl(url) {
    try {
      if (!url) return null;

      // Extract public ID from Cloudinary URL
      const matches = url.match(/\/v\d+\/(.+)\./);
      return matches ? matches[1] : null;
    } catch (error) {
      console.error("Extract public ID error:", error);
      return null;
    }
  }

  /**
   * Validate file size and type
   */
  validateFile(file, allowedTypes = null, maxSize = null) {
    const types = allowedTypes || this.allowedDocumentTypes;
    const size = maxSize || this.maxFileSize;

    if (!types.includes(file.mimetype)) {
      throw new Error(`Invalid file type. Allowed types: ${types.join(", ")}`);
    }

    if (file.size > size) {
      throw new Error(
        `File too large. Maximum size: ${size / (1024 * 1024)}MB`
      );
    }

    return true;
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(publicId) {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: "auto",
      });

      return {
        publicId: result.public_id,
        format: result.format,
        resourceType: result.resource_type,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        createdAt: result.created_at,
        url: result.secure_url,
      };
    } catch (error) {
      console.error("Get file metadata error:", error);
      throw new Error("Failed to get file metadata");
    }
  }

  /**
   * Bulk delete files
   */
  async bulkDeleteFiles(publicIds) {
    try {
      const result = await cloudinary.api.delete_resources(publicIds, {
        resource_type: "auto",
      });

      return result;
    } catch (error) {
      console.error("Bulk delete files error:", error);
      throw new Error("Failed to delete files");
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats() {
    try {
      const result = await cloudinary.api.usage();

      return {
        totalStorage: result.storage.usage,
        totalTransformations: result.transformations.usage,
        totalRequests: result.requests.usage,
        plan: result.plan,
        lastUpdated: result.last_updated,
      };
    } catch (error) {
      console.error("Get storage stats error:", error);
      throw new Error("Failed to get storage statistics");
    }
  }
}

export const fileService = new FileService();
