import multer from "multer";
import { cloudinary } from "../config/cloudinary";
import { BadRequestError } from "../utils/errors";

const storage = multer.memoryStorage();

/**
 * Multiple files upload middleware (max 5)
 */
export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestError("Only PDF and image files are allowed") as any, false);
    }
  },
});

/**
 * Upload a buffer to Cloudinary with automatic resource type detection.
 */
export const uploadToCloudinary = (
  buffer: Buffer,
  folder: string,
  mimetype: string
): Promise<{ secure_url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    // Determine resource type based on mimetype
    // 'image' for images, 'raw' for PDFs and others to preserve extension
    const resourceType = mimetype.startsWith("image/") ? "image" : "raw";
    
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        // For raw files like PDF, Cloudinary needs the format specified or it might lose the .pdf extension
        format: mimetype === "application/pdf" ? "pdf" : undefined,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Upload failed"));
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

export default upload;
