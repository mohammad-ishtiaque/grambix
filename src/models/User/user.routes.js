const express = require("express");
const router = express.Router();
const userController = require("./user.controller");
const { authUser } = require(".././../middleware/authMiddleware");
const upload = require("../../utils/upload"); // Multer setup=

router.get("/profile/get", authUser, userController.getUserProfile);
router.put("/profile/update", authUser, upload.single("profilePicture"), userController.updateUserProfile);
router.post("/profile/change-password", authUser, userController.changeUserPassword);
router.post("/save-unsave-book", authUser, userController.toggleSaveBook);
router.get("/saved-items", authUser, userController.allSavedItems);
router.delete("/delete-user-account", authUser, userController.deleteUserAccount);

module.exports = router;
