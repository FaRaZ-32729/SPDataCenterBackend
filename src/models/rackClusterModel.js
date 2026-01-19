const mongoose = require("mongoose");

const RackClusterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        ackitName: {
            type: String,
            required: true,
            trim: true,
        },

        racks: [
            {
                _id: false,

                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "racks",
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
            },
        ],
    },
    { timestamps: true }
);

const RackClusterModel = mongoose.model("rackClusters", RackClusterSchema);

module.exports = RackClusterModel;