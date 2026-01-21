// const mongoose = require("mongoose");

// const AckitSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//       trim: true,
//     },
//     condition: {
//       type: {
//         type: String,
//         required: true,
//         trim: true,
//       },
//       operator: {
//         type: String,
//         enum: [">", "<"],
//         required: true,
//       },
//       value: {
//         type: Number,
//         required: true,
//       },
//     },
//   },
//   { timestamps: true }
// );

// const AckitModel = mongoose.model("ackit", AckitSchema);

// module.exports = AckitModel;


const mongoose = require("mongoose");

const AckitSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    dataCenter: {
      _id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "dataCenters",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
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


AckitSchema.index(
  { name: 1, "dataCenter._id": 1 },
  { unique: true }
);

const AckitModel = mongoose.model("ackit", AckitSchema);

module.exports = AckitModel;
