const bookCategoryService = require("./bookCategory.service");
const asyncHandler = require("../../utils/asyncHandler");


exports.createBookCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const bookCategory = await bookCategoryService.createBookCategory(
        {
            name,
            image: req.file?.location ,
        },
        req.admin
    );
    res.json({ success: true, message: "Book category created successfully", data: bookCategory });
});

exports.getAllBookCategories = asyncHandler(async (req, res) => {
    const bookCategories = await bookCategoryService.getAllBookCategories(req.query);
    res.json({ success: true, message: "Book categories fetched successfully", data: bookCategories });
});

exports.getBookCategoryById = asyncHandler(async (req, res) => {
    const bookCategory = await bookCategoryService.getBookCategoryById(req.params.id);
    res.json({ success: true, message: "Book category fetched successfully", data: bookCategory });
});

exports.updateBookCategory = asyncHandler(async (req, res) => {
    const updateData = {
        name: req.body.name
    };
    
    // Only add image to update data if a file was uploaded
    if (req.file) {
        updateData.image = req.file?.location ;
    }
    
    const bookCategory = await bookCategoryService.updateBookCategory(
        req.params.id,
        updateData,
        req.admin
    );
    res.json({ success: true, message: "Book category updated successfully", data: bookCategory });
});

exports.deleteBookCategory = asyncHandler(async (req, res) => {
    const bookCategory = await bookCategoryService.deleteBookCategory(req.params.id, req.admin);
    res.json({ success: true, message: "Book category deleted successfully", data: bookCategory });
});
