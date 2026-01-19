const mongoose = require("mongoose");

const RackSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },

        dataCenter: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "dataCenters",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
        },

        hub: {
            id: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "hubs",
                required: true,
            },
            name: {
                type: String,
                required: true,
            },
        },

        sensors: [
            {
                _id: false,

                _id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "sensors",
                    required: true,
                },
                name: {
                    type: String,
                    required: true,
                },
            },
        ],

        row: {
            type: String,
            required: true,
            trim: true,
        },

        col: {
            type: String,
            required: true,
            trim: true,
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
            },
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
