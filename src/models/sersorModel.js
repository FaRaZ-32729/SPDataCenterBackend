const mongoose = require("mongoose");

const SensorSchema = new mongoose.Schema(
    {
        // dataCenterId: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: "dataCenters",
        //     required: true,
        // },
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
