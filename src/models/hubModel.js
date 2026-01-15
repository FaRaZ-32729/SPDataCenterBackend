const mongoose = require("mongoose");

const HubSchema = new mongoose.Schema(
    {
        dataCenterId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "dataCenters",
            required: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        sensorQuantity: {
            type: Number,
            default: 15,
        },
        apiKey: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

const HubModel = mongoose.model("hubs", HubSchema);

module.exports = HubModel;
