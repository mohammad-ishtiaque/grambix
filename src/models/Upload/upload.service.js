const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const s3 = require("../../config/s3");
const { ApiError } = require("../../errors/errorHandler");
const path = require("path");

exports.generatePresignedUrl = async (fileType, fileName, folder = "others") => {
    if (!fileType) {
        throw new ApiError("File type is required", 400);
    }

    // Determine folder if not explicit
    if (fileType.startsWith("image/")) {
        folder = "images";
    } else if (fileType === "application/pdf") {
        folder = "pdfs";
    } else if (fileType.startsWith("audio/")) {
        folder = "audios";
    }

    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = fileName ? path.extname(fileName) : ("." + fileType.split("/")[1]);
    const key = `${folder}/${uniqueSuffix}${extension}`;

    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        ContentType: fileType,
        // ACL: "private" // optional, depends on bucket settings
    });

    try {
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 }); // 5 minutes
        return {
            signedUrl,
            key,
            url: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`
        };
    } catch (error) {
        console.error("Presigned URL Error:", error);
        throw new ApiError("Could not generate presigned URL", 500);
    }
};
