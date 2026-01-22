const mongoose = require("mongoose");

const RackClusterSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },

        dataCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dataCenters",
            required: true,
        },

        ackit: {

            _id: false,

            _id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "ackit",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
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
        meanTemp: {
            type: Number,
            default: null
        },
        meanHumi: {
            type: Number,
            default: null
        },
        ackitStatus: {
            type: Boolean,
            default: false
        },
        ackitStatus: {
            type: Boolean,
            default: false
        }
    },

    { timestamps: true }
);

RackClusterSchema.index(
    { name: 1, dataCenterId: 1 },
    { unique: true }
);

const RackClusterModel = mongoose.model("rackClusters", RackClusterSchema);

module.exports = RackClusterModel;