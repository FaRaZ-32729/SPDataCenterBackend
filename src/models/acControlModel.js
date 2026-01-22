const mongoose = require("mongoose");

const AcControlSchema = new mongoose.Schema(
    {
        clusterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "rackClusters",
            required: true,
            unique: true,
        },

        enabled: {
            type: Boolean,
            default: false, // ❗ checkbox OFF by default
        },
    },
    { timestamps: true }
);

const AcControlModel = mongoose.model("acControls", AcControlSchema);

module.exports = AcControlModel;
