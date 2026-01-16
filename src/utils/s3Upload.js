const { PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../config/s3");
const dotenv = require("dotenv");

dotenv.config();

// Allowed file types
const allowedImageTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const allowedAudioTypes = ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/ogg"];
const allowedPdfTypes = ["application/pdf"];

const allAllowedTypes = [...allowedImageTypes, ...allowedAudioTypes, ...allowedPdfTypes];

/**
 * Generate a presigned URL for direct upload to S3
 * @param {string} fileName - Original filename
 * @param {string} fileType - MIME type
 * @param {number} fileSize - File size in bytes
 * @returns {Promise<{uploadUrl: string, fileKey: string, fileUrl: string}>}
 */
const generatePresignedUploadUrl = async (fileName, fileType, fileSize) => {
    // Validate file type
    if (!allAllowedTypes.includes(fileType)) {
        throw new Error("Only image (jpg, png, webp), PDF, and audio files are allowed");
    }

    // Determine folder based on file type
    let folder = "others";
    if (fileType.startsWith("image/")) {
        folder = "images";
    } else if (fileType === "application/pdf") {
        folder = "pdfs";
    } else if (fileType.startsWith("audio/")) {
        folder = "audios";
    }

    // Generate unique file key
    const fileExtension = fileName.split(".").pop();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileKey = `${folder}/${uniqueSuffix}.${fileExtension}`;

    // Create PutObject command
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
        ContentDisposition: "inline", // Open in browser instead of download
    });

    // Generate presigned URL (valid for 15 minutes)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 900 });

    return {
        uploadUrl,
        fileKey,
        fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
    };
};

/**
 * Generate presigned URL for multipart upload (for large files > 100MB)
 * @param {string} fileName - Original filename
 * @param {string} fileType - MIME type
 * @param {number} partCount - Number of parts to upload
 * @returns {Promise<{uploadId: string, fileKey: string, partUrls: string[]}>}
 */
const generateMultipartUploadUrls = async (fileName, fileType, partCount) => {
    // Validate file type
    if (!allAllowedTypes.includes(fileType)) {
        throw new Error("Only image (jpg, png, webp), PDF, and audio files are allowed");
    }

    // Determine folder
    let folder = "audios"; // Large files are typically audio
    if (fileType.startsWith("image/")) {
        folder = "images";
    } else if (fileType === "application/pdf") {
        folder = "pdfs";
    }

    // Generate unique file key
    const fileExtension = fileName.split(".").pop();
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const fileKey = `${folder}/${uniqueSuffix}.${fileExtension}`;

    // Initiate multipart upload
    const createCommand = new CreateMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        ContentType: fileType,
        ContentDisposition: "inline",
    });

    const { UploadId } = await s3.send(createCommand);

    // Generate presigned URLs for each part
    const partUrls = [];
    for (let i = 1; i <= partCount; i++) {
        const uploadPartCommand = new UploadPartCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: fileKey,
            UploadId,
            PartNumber: i,
        });

        const partUrl = await getSignedUrl(s3, uploadPartCommand, { expiresIn: 3600 }); // 1 hour
        partUrls.push(partUrl);
    }

    return {
        uploadId: UploadId,
        fileKey,
        partUrls,
    };
};

/**
 * Complete multipart upload
 * @param {string} fileKey - S3 object key
 * @param {string} uploadId - Upload ID from initiation
 * @param {Array} parts - Array of {ETag, PartNumber}
 * @returns {Promise<{fileUrl: string}>}
 */
const completeMultipartUpload = async (fileKey, uploadId, parts) => {
    const command = new CompleteMultipartUploadCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: fileKey,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
    });

    await s3.send(command);

    return {
        fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileKey}`,
    };
};

module.exports = {
    generatePresignedUploadUrl,
    generateMultipartUploadUrls,
    completeMultipartUpload,
};
