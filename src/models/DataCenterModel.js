const mongoose = require("mongoose");

const DataCenterSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
}, { timestamps: true });

const DataCenterModel = mongoose.model("dataCenters", DataCenterSchema);

module.exports = DataCenterModel;
