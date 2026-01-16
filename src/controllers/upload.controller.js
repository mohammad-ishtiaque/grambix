const { generatePresignedUploadUrl, generateMultipartUploadUrls, completeMultipartUpload } = require("../../utils/s3Upload");
const { ApiError } = require("../../errors/errorHandler");

/**
 * Generate presigned URL for direct S3 upload
 * POST /api/upload/generate-upload-url
 * Body: { fileName, fileType, fileSize }
 */
const getPresignedUploadUrl = async (req, res, next) => {
    try {
        const { fileName, fileType, fileSize } = req.body;

        if (!fileName || !fileType || !fileSize) {
            throw new ApiError("fileName, fileType, and fileSize are required", 400);
        }

        // For files larger than 100MB, suggest multipart upload
        if (fileSize > 100 * 1024 * 1024) {
            return res.status(200).json({
                success: true,
                message: "File is large. Consider using multipart upload endpoint.",
                recommendMultipart: true,
                data: await generatePresignedUploadUrl(fileName, fileType, fileSize),
            });
        }

        const uploadData = await generatePresignedUploadUrl(fileName, fileType, fileSize);

        res.status(200).json({
            success: true,
            data: uploadData,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Generate presigned URLs for multipart upload
 * POST /api/upload/generate-multipart-upload
 * Body: { fileName, fileType, partCount }
 */
const getMultipartUploadUrls = async (req, res, next) => {
    try {
        const { fileName, fileType, partCount } = req.body;

        if (!fileName || !fileType || !partCount) {
            throw new ApiError("fileName, fileType, and partCount are required", 400);
        }

        if (partCount < 1 || partCount > 10000) {
            throw new ApiError("partCount must be between 1 and 10000", 400);
        }

        const uploadData = await generateMultipartUploadUrls(fileName, fileType, partCount);

        res.status(200).json({
            success: true,
            data: uploadData,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Complete multipart upload
 * POST /api/upload/complete-multipart-upload
 * Body: { fileKey, uploadId, parts: [{ETag, PartNumber}] }
 */
const completeMultipart = async (req, res, next) => {
    try {
        const { fileKey, uploadId, parts } = req.body;

        if (!fileKey || !uploadId || !parts || !Array.isArray(parts)) {
            throw new ApiError("fileKey, uploadId, and parts array are required", 400);
        }

        const result = await completeMultipartUpload(fileKey, uploadId, parts);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getPresignedUploadUrl,
    getMultipartUploadUrls,
    completeMultipart,
};
