const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema(
    {
        hubId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "hubs",
            required: true,
        },
        sensorName: {
            type: String,
            required: true,
            trim: true,
        },
    },
    { timestamps: true }
);

const SensorModel = mongoose.model("sensors", SensorSchema);

module.exports = SensorModel;
