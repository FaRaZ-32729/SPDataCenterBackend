const AckitModel = require("../models/ackitModel");

// ================= CREATE ACKIT =================
const createAckit = async (req, res) => {
    try {
        const { name, condition } = req.body;

        // ---------- VALIDATIONS ----------
        if (!name) {
            return res.status(400).json({ message: "Name is required" });
        }

        if (!condition) {
            return res.status(400).json({ message: "Condition is required" });
        }

        const { type, operator, value } = condition;

        if (!type || !operator || value === undefined) {
            return res.status(400).json({
                message: "Condition must include type, operator, and value",
            });
        }

        // ---------- CREATE ----------
        const ackit = await AckitModel.create({
            name,
            condition,
        });

        return res.status(201).json({
            message: "Ackit created successfully",
            data: ackit,
        });
    } catch (error) {
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

// ================= UPDATE ACKIT =================
const updateAckit = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, condition } = req.body;

        if (!id) {
            return res.status(400).json({ message: "Ackit ID is required" });
        }

        if (condition) {
            const { type, operator, value } = condition;

            if (!type || !operator || value === undefined) {
                return res.status(400).json({
                    message: "Condition must include type, operator, and value",
                });
            }
        }

        const updatedAckit = await AckitModel.findByIdAndUpdate(
            id,
            { name, condition },
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
    deleteAckit
}