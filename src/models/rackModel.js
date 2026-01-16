const mongoose = require("mongoose");

const RackSchema = new mongoose.Schema(
    {
        dataCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dataCenters",
            required: true,
        },

        hubId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "hubs",
            required: true,
        },

        sensorIds: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "sensors",
                required: true,
            },
        ],

        row: {
            type: String,
            required: true,
            trim: true, // e.g. "r1"
        },

        col: {
            type: String,
            required: true,
            trim: true, // e.g. "c1"
        },

        conditions: [
            {
                type: {
                    type: String,
                    enum: ["temp", "humidity"],
                    required: true,
                },
                operator: {
                    type: String,
                    enum: ["<", ">"],
                    required: true,
                },
                value: {
                    type: Number,
                    required: true,
                },
            }
        ],

        tempAlert: {
            type: Boolean,
            default: false,
        },

        humidityAlert: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

const RackModel = mongoose.model("racks", RackSchema);

module.exports = RackModel;
