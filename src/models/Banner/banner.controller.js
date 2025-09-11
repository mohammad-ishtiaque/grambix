const asyncHandler = require("../../utils/asyncHandler");
const bannerService = require("./banner.service");
const { ApiError } = require("../../errors/errorHandler");

exports.createBanner = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError("Image file is required", 400);
    }
    const banner = await bannerService.createBanner({ image: req.file.location  }, req.admin);
    res.status(201).json({ success: true, message: "Banner created successfully", data: banner });
});

exports.getAllBanners = asyncHandler(async (req, res) => {
    const banners = await bannerService.getAllBanners(req.query);
    res.json({ success: true, message: "Banners fetched successfully", data: banners });
});

exports.getBannerById = asyncHandler(async (req, res) => {
    const banner = await bannerService.getBannerById(req.params.id);
    res.json({ success: true, message: "Banner fetched successfully", data: banner });
});

exports.updateBanner = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError("Image file is required for update", 400);
    }
    const banner = await bannerService.updateBanner(
        req.query.id,
        { image: req.file.location  },
        req.admin
    );
    res.json({ success: true, message: "Banner updated successfully", data: banner });
});

exports.deleteBanner = asyncHandler(async (req, res) => {
    const banner = await bannerService.deleteBanner(req.query.id, req.admin);
    res.json({ success: true, message: "Banner deleted successfully", data: banner });
});