const asyncHandler = require("../../utils/asyncHandler");
const EbookService = require("./ebook.service");
const BookCategory = require("../BookCategory/BookCategory");

/** Create Ebook */
exports.createEbook = asyncHandler(async (req, res) => {
  const { bookName, synopsis, totalPages, tags } = req.body;
  const category = await BookCategory.findById(req.body.category);
  const categoryName = category?.name;


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
      bookCover: req.files?.bookCover?.[0]?.location  || null,
      pdfFile: req.files?.pdfFile?.[0]?.location  || null,
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
  res.status(200).json({ success: true, data: ebook });
});

/** Update ebook */
exports.updateEbook = asyncHandler(async (req, res) => {
  const ebook = await EbookService.updateEbook(
    req.params.id,
    {
      ...req.body,
      bookCover: req.files?.bookCover?.[0]?.location  || undefined,
      pdfFile: req.files?.pdfFile?.[0]?.location  || undefined,
      tags: req.body.tags ? req.body.tags.split(",").map((tag) => tag.trim()) : [],
    },
    req.admin
  );

  res.status(200).json({ success: true, message: "Ebook updated successfully", data: ebook });
});

/** Delete ebook */
exports.deleteEbook = asyncHandler(async (req, res) => {
  await EbookService.deleteEbook(req.params.id, req.admin);
  res.status(200).json({ success: true, message: "Ebook deleted successfully" });
});
