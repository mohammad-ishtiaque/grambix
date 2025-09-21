const express = require("express");
const ManageController = require("./manage.controller");
// const config = require("../../../config");
const { authAdminOrSuperAdmin } = require("../../middleware/authMiddleware");

const router = express.Router();

router
    .post(
        "/add-terms-conditions",
        authAdminOrSuperAdmin,
        ManageController.addTermsConditions
    )
    .get("/get-terms-conditions", ManageController.getTermsConditions)
    .delete(
        "/delete-terms-conditions",
        authAdminOrSuperAdmin,
        ManageController.deleteTermsConditions
    )
    .post(
        "/add-privacy-policy",
        authAdminOrSuperAdmin,
        ManageController.addPrivacyPolicy
    )
    .get("/get-privacy-policy", ManageController.getPrivacyPolicy)
    .delete(
        "/delete-privacy-policy",
        authAdminOrSuperAdmin,
        ManageController.deletePrivacyPolicy
    )
    .post(
        "/add-about-us",
        authAdminOrSuperAdmin,
        ManageController.addAboutUs
    )
    .get("/get-about-us", ManageController.getAboutUs)
    .delete(
        "/delete-about-us",
        authAdminOrSuperAdmin,
        ManageController.deleteAboutUs
    )
    .post("/add-faq", authAdminOrSuperAdmin, ManageController.addFaq)
    .patch(
        "/update-faq",
        authAdminOrSuperAdmin,
        ManageController.updateFaq
    )
    .get("/get-faq", ManageController.getFaq)
    .delete(
        "/delete-faq",
        authAdminOrSuperAdmin,
        ManageController.deleteFaq
    )
    .post(
        "/add-contact-us",
        authAdminOrSuperAdmin,
        ManageController.addContactUs
    )
    .get("/get-contact-us", ManageController.getContactUs)
    .delete(
        "/delete-contact-us",
        authAdminOrSuperAdmin,
        ManageController.deleteContactUs
    )
    .post(
        "/create-privacy-policy",
        authAdminOrSuperAdmin,
        ManageController.createPrivacyPolicy
    )
    .get("/get-privacy-policy1", ManageController.getPrivacyPolicy1);

module.exports = router;
