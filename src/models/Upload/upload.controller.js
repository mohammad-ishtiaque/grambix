const asyncHandler = require("../../utils/asyncHandler");
const uploadService = require("./upload.service");

exports.getPresignedUrl = asyncHandler(async (req, res) => {
    const { fileType, fileName, folder } = req.body;

    const data = await uploadService.generatePresignedUrl(fileType, fileName, folder);

    res.status(200).json({
        success: true,
        data
    });
});
