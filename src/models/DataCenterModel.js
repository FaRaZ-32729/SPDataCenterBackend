
const mongoose = require("mongoose");

const DataCenterSchema = new mongoose.Schema({
    name: { type: String, required: true, lowercase: true, trim: true },
}, { timestamps: true });

const DataCenterModel = mongoose.model("Organization", DataCenterSchema);

module.exports = DataCenterModel;
