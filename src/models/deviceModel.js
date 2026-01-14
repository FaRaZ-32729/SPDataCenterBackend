const mongoose = require("mongoose");

const deviceSchema = new mongoose.Schema(
  {
    orgId: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    venue: { type: mongoose.Schema.Types.ObjectId, ref: "Venue", required: true },
    deviceId: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    voltage: { type: Boolean, default: null }
  },
  { timestamps: true }
);

const deviceModel = mongoose.model("Device", deviceSchema);

module.exports = deviceModel;

