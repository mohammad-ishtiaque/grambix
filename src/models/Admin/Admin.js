const mongoose = require("mongoose");


const adminSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        trim: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    role: {
        type: String,
        enum: ["ADMIN", "SUPER_ADMIN"],
        default: "ADMIN",
    },
    profilePicture: {
        type: String,
        default: null,
    },
    isVerified: {
        type: Boolean,
        default: true,
    },
    passwordResetCode: {
        type: Number,
        default: null,
    }
} , {
    timestamps: true
})

const Admin = mongoose.model("Admin", adminSchema);

module.exports = Admin;
