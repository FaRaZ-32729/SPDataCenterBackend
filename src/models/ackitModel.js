const mongoose = require("mongoose");

const AckitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    condition: {
      type: {
        type: String,
        required: true,
        trim: true,
      },
      operator: {
        type: String,
        enum: [">", "<"],
        required: true,
      },
      value: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true }
);

const AckitModel = mongoose.model("ackit", AckitSchema);

module.exports = AckitModel;
