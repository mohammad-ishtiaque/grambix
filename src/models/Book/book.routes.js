const express = require("express");
const router = express.Router();

const { createBook, getAllBooks, getBookById, updateBook, deleteBook } = require("./book.controller");
const { authAdmin } = require("../../middleware/authMiddleware");
const upload = require("../../utils/upload");


const uploadBookFiles = upload.fields([
  { name: "bookCover", maxCount: 1 },
  { name: "pdfFile", maxCount: 1 },
  { name: "audioFile", maxCount: 1 }
]);


router.post("/create", authAdmin, uploadBookFiles, createBook);
router.get("/get", getAllBooks);
router.get("/category/:id", require("./book.controller").getBooksByCategory);
router.get("/get/:id", getBookById);
router.put("/update/:id", authAdmin, uploadBookFiles, updateBook);
router.delete("/delete/:id", authAdmin, deleteBook);

module.exports = router;