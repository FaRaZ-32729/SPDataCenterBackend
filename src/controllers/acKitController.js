const AckitModel = require("../models/ackitModel");
const mongoose = require("mongoose");
const DataCenterModel = require("../models/DataCenterModel");


// ================= CREATE ACKIT =================
// const createAckit = async (req, res) => {
//     try {
//         const { name, condition } = req.body;

//         // ---------- VALIDATIONS ----------
//         if (!name) {
//             return res.status(400).json({ message: "Name is required" });
//         }

//         if (!condition) {
//             return res.status(400).json({ message: "Condition is required" });
//         }

//         const { type, operator, value } = condition;

//         if (!type || !operator || value === undefined) {
//             return res.status(400).json({
//                 message: "Condition must include type, operator, and value",
//             });
//         }

//         // ---------- CREATE ----------
//         const ackit = await AckitModel.create({
//             name,
//             condition,
//         });

//         return res.status(201).json({
//             message: "Ackit created successfully",
//             data: ackit,
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: "Failed to create ackit",
//             error: error.message,
//         });
//     }
// };


const createAckit = async (req, res) => {
    try {
        const { name, condition, dataCenterId } = req.body;

        // ---------- VALIDATIONS ----------
        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        if (!condition) {
            return res.status(400).json({ message: "Condition is required" });
        }

        if (!dataCenterId || !mongoose.Types.ObjectId.isValid(dataCenterId)) {
            return res.status(400).json({ message: "Valid dataCenterId is required" });
        }

        const { type, operator, value } = condition;

        if (!type || !operator || value === undefined) {
            return res.status(400).json({
                message: "Condition must include type, operator, and value",
            });
        }

        // ---------- VALIDATE DATA CENTER ----------
        const dataCenter = await DataCenterModel.findById(dataCenterId);
        if (!dataCenter) {
            return res.status(404).json({ message: "Data center not found" });
        }

        // ---------- CREATE ----------
        const ackit = await AckitModel.create({
            name,
            condition,
            dataCenter: {
                _id: dataCenter._id,
                name: dataCenter.name,
            },
        });

        return res.status(201).json({
            message: "Ackit created successfully",
            data: ackit,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Ackit with this name already exists in this data center",
            });
        }

        return res.status(500).json({
            message: "Failed to create ackit",
            error: error.message,
        });
    }
};



// ================= GET ALL ACKITS =================
const getAllAckits = async (req, res) => {
    try {
        const ackits = await AckitModel.find().sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Ackits fetched successfully",
            total: ackits.length,
            data: ackits,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch ackits",
            error: error.message,
        });
    }
};

// ================= GET SINGLE ACKIT =================
const getSingleAckit = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Ackit ID is required" });
        }

        const ackit = await AckitModel.findById(id);

        if (!ackit) {
            return res.status(404).json({ message: "Ackit not found" });
        }

        return res.status(200).json({
            message: "Ackit fetched successfully",
            data: ackit,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch ackit",
            error: error.message,
        });
    }
};


// ================= GET ACKITS BY DATA CENTER =================
const getAckitsByDataCenter = async (req, res) => {
    try {
        const { dataCenterId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(dataCenterId)) {
            return res.status(400).json({ message: "Invalid data center ID" });
        }

        const ackits = await AckitModel.find({ "dataCenter._id": dataCenterId }).sort({ createdAt: -1 });

        if (!ackits) {
            return res.status(404).json({ message: "ackit not found" })
        }

        return res.status(200).json({
            message: "Ackits fetched successfully",
            total: ackits.length,
            data: ackits,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch ackits",
            error: error.message,
        });
    }
};


// ================= UPDATE ACKIT =================
// const updateAckit = async (req, res) => {
//     try {
//         const { id } = req.params;
//         const { name, condition } = req.body;

//         if (!id) {
//             return res.status(400).json({ message: "Ackit ID is required" });
//         }

//         if (condition) {
//             const { type, operator, value } = condition;

//             if (!type || !operator || value === undefined) {
//                 return res.status(400).json({
//                     message: "Condition must include type, operator, and value",
//                 });
//             }
//         }

//         const updatedAckit = await AckitModel.findByIdAndUpdate(
//             id,
//             { name, condition },
//             { new: true, runValidators: true }
//         );

//         if (!updatedAckit) {
//             return res.status(404).json({ message: "Ackit not found" });
//         }

//         return res.status(200).json({
//             message: "Ackit updated successfully",
//             data: updatedAckit,
//         });
//     } catch (error) {
//         return res.status(500).json({
//             message: "Failed to update ackit",
//             error: error.message,
//         });
//     }
// };

const updateAckit = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, condition, dataCenterId } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Ackit ID is required" });
        }

        let updatePayload = {};

        if (name) updatePayload.name = name;

        if (condition) {
            const { type, operator, value } = condition;

            if (!type || !operator || value === undefined) {
                return res.status(400).json({
                    message: "Condition must include type, operator, and value",
                });
            }

            updatePayload.condition = condition;
        }

        if (dataCenterId) {
            if (!mongoose.Types.ObjectId.isValid(dataCenterId)) {
                return res.status(400).json({ message: "Invalid dataCenterId" });
            }

            const dataCenter = await DataCenterModel.findById(dataCenterId);
            if (!dataCenter) {
                return res.status(404).json({ message: "Data center not found" });
            }

            updatePayload.dataCenter = {
                _id: dataCenter._id,
                name: dataCenter.name,
            };
        }

        const updatedAckit = await AckitModel.findByIdAndUpdate(
            id,
            updatePayload,
            { new: true, runValidators: true }
        );

        if (!updatedAckit) {
            return res.status(404).json({ message: "Ackit not found" });
        }

        return res.status(200).json({
            message: "Ackit updated successfully",
            data: updatedAckit,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Ackit with this name already exists in this data center",
            });
        }

        return res.status(500).json({
            message: "Failed to update ackit",
            error: error.message,
        });
    }
};

// ================= DELETE ACKIT =================
const deleteAckit = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ message: "Ackit ID is required" });
        }

        const deletedAckit = await AckitModel.findByIdAndDelete(id);

        if (!deletedAckit) {
            return res.status(404).json({ message: "Ackit not found" });
        }

        return res.status(200).json({
            message: "Ackit deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete ackit",
            error: error.message,
        });
    }
};


module.exports = {
    createAckit,
    getAllAckits,
    getSingleAckit,
    updateAckit,
    deleteAckit,
    getAckitsByDataCenter
}