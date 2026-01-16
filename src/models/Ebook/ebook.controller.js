const asyncHandler = require("../../utils/asyncHandler");
const EbookService = require("./ebook.service");
const BookCategory = require("../BookCategory/BookCategory");

/** Create Ebook */
exports.createEbook = asyncHandler(async (req, res) => {
  const { bookName, synopsis, totalPages, tags } = req.body;

  // validate category
  let categoryData;
  if (req.body.category) {
    categoryData = await BookCategory.findById(req.body.category);
    if (!categoryData) {
      throw new ApiError("Category not found", 404);
    }
  } else {
    throw new ApiError("Category is required", 400);
  }

  const categoryName = categoryData.name;
  const category = categoryData._id;


  let tagsArray = [];
  if (typeof tags === "string") {
    tagsArray = tags.split(",").map((tag) => tag.trim());
  } else if (Array.isArray(tags)) {
    tagsArray = tags;
  }

  const ebook = await EbookService.createEbook(
    {
      bookName,
      synopsis,
      category,
      categoryName,
      totalPages,
      bookCover: req.body.bookCover || req.files?.bookCover?.[0]?.location || null,
      pdfFile: req.body.pdfFile || req.files?.pdfFile?.[0]?.location || null,
      tags: tagsArray,
    },
    req.admin
  );

  // console.log(ebook);

  res.status(201).json({ success: true, message: "Ebook created successfully", data: ebook });
});

/** Get all ebooks (search + pagination) */
exports.getAllEbooks = asyncHandler(async (req, res) => {
  const result = await EbookService.getAllEbooks(req.query);
  res.status(200).json({ success: true, ...result });
});

/** Get single ebook */
exports.getEbookById = asyncHandler(async (req, res) => {
  const ebook = await EbookService.getEbookById(req.params.id);
  EbookService.incrementViewCount(req.params.id);
  res.status(200).json({ success: true, data: ebook });
});

/** Update ebook */
exports.updateEbook = asyncHandler(async (req, res) => {
  const updateData = { ...req.body };

  if (req.body.category) {
    const categoryData = await BookCategory.findById(req.body.category);
    if (!categoryData) {
      throw new ApiError("Category not found", 404);
    }
    updateData.category = categoryData._id;
    updateData.categoryName = categoryData.name;
  }

  if (req.body.tags) {
    updateData.tags = typeof req.body.tags === "string"
      ? req.body.tags.split(",").map((tag) => tag.trim())
      : req.body.tags;
  }

  if (req.files?.bookCover) {
    updateData.bookCover = req.files.bookCover[0].location;
  }
  if (req.files?.pdfFile) {
    updateData.pdfFile = req.files.pdfFile[0].location;
  }

  const ebook = await EbookService.updateEbook(
    req.params.id,
    updateData,
    req.admin
  );

  res.status(200).json({ success: true, message: "Ebook updated successfully", data: ebook });
});

/** Delete ebook */
exports.deleteEbook = asyncHandler(async (req, res) => {
  await EbookService.deleteEbook(req.params.id, req.admin);
  res.status(200).json({ success: true, message: "Ebook deleted successfully" });
});
