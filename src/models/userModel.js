const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["admin", "manager", "user"], default: "user" },
    isActive: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    suspensionReason: { type: String, default: "" },
    otp: { type: String },
    otpExpiry: { type: Date },
    setupToken: { type: String },
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null },
    createdBy: { type: String, required: true },
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: false },
    dataCenters: [
        {
            dataCenterId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "dataCenters",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
        }
    ],

}, { timestamps: true });

module.exports = mongoose.model("users", userSchema);