const mongoose = require("mongoose");

const AcControlSchema = new mongoose.Schema(
    // {
    //     clusterId: {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "rackClusters",
    //         required: true,
    //         unique: true,
    //     },

    //     enabled: {
    //         type: Boolean,
    //         default: false, // ❗ checkbox OFF by default
    //     },
    // },
    // { timestamps: true }
    {
        clusterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "rackClusters",
            required: true,
            unique: true,
        },

        enabled: {                 // AUTO MODE
            type: Boolean,
            default: false,
        },

        manualStatus: {             // MANUAL MODE STATE
            type: Boolean,         // true = ON, false = OFF
            default: false,
        },
    }, { timestamps: true }

);

const AcControlModel = mongoose.model("acControls", AcControlSchema);

module.exports = AcControlModel;
