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
            default: [],
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

        row: {
            type: String,
            required: true,
            match: /^r([1-9]|1[0-9]|2[0-5])$/,
            index: true,
        },

        col: {
            type: String,
            required: true,
            match: /^c([1-9]|1[0-9]|2[0-5])$/,
            index: true,
        },


        // 🔥 RACK LEVEL STATUS
        tempA: { type: Boolean, default: false },
        humiA: { type: Boolean, default: false },
        tempV: { type: Number, default: null },
        humiV: { type: Number, default: null },
    },
    { timestamps: true }
);

// ONE rack per (row + col) in a datacenter
RackSchema.index(
    { "dataCenter.id": 1, row: 1, col: 1 },
    { unique: true }
);

RackSchema.index({ "dataCenter.id": 1 });
RackSchema.index({ "hub.id": 1 });

module.exports = mongoose.model("racks", RackSchema);
