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

        // 🔥 LIVE SENSOR VALUES (OPTIONAL)
        sensorValues: {
            type: [
                {
                    _id: false,
                    sensorId: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: "sensors",
                    },
                    sensorName: {
                        type: String,
                    },
                    temperature: {
                        type: Number,
                    },
                    humidity: {
                        type: Number,
                    },
                    updatedAt: {
                        type: Date,
                        default: Date.now,
                    },
                },
            ],
            default: [], // ⭐ IMPORTANT
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

        // 🔥 RACK LEVEL STATUS
        tempA: { type: Boolean, default: false },
        humiA: { type: Boolean, default: false },
        tempV: { type: Number, default: null },
        humiV: { type: Number, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("racks", RackSchema);
