const RackModel = require("../models/rackModel");
const DataCenterModel = require("../models/DataCenterModel");
const HubModel = require("../models/hubModel");
const SensorModel = require("../models/sersorModel");

/**
 * CREATE RACK
 */
const createRack = async (req, res) => {
    try {
        const {
            dataCenterId,
            hubId,
            sensorIds,
            row,
            col,
            conditions,
        } = req.body;

        //  Basic validation
        if (!dataCenterId || !hubId || !sensorIds?.length || !row || !col || !conditions) {
            return res.status(400).json({ message: "All fields are required" });
        }

        //  Check DataCenter exists
        const dataCenter = await DataCenterModel.findById(dataCenterId);
        if (!dataCenter) {
            return res.status(404).json({ message: "Data center not found" });
        }

        //  Check Hub exists
        const hub = await HubModel.findById(hubId);
        if (!hub) {
            return res.status(404).json({ message: "Hub not found" });
        }

        //  Validate Sensors
        const sensorsCount = await SensorModel.countDocuments({
            _id: { $in: sensorIds },
            hubId,
        });

        if (sensorsCount !== sensorIds.length) {
            return res.status(400).json({
                message: "One or more sensors are invalid or not linked to this hub",
            });
        }

        //  Validate conditions array
        if (!Array.isArray(conditions) || conditions.length === 0) {
            return res.status(400).json({ message: "Invalid condition format" });
        }

        for (const cond of conditions) {
            if (
                !cond.type ||
                !["temp", "humidity"].includes(cond.type) ||
                !cond.operator ||
                !["<", ">"].includes(cond.operator) ||
                typeof cond.value !== "number"
            ) {
                return res.status(400).json({ message: "Invalid condition format" });
            }
        }

        //  Create Rack
        const rack = await RackModel.create({
            dataCenterId,
            hubId,
            sensorIds,
            row,
            col,
            conditions,
        });

        res.status(201).json({
            message: "Rack created successfully",
            rack,
        });
    } catch (error) {
        console.error("Create Rack Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET ALL RACKS
 */
const getAllRacks = async (req, res) => {
    try {
        const racks = await RackModel.find()
            .populate("dataCenterId", "name")
            .populate("hubId", "name")
            .populate("sensorIds", "sensorName");

        res.status(200).json({ racks });
    } catch (error) {
        console.error("Get All Racks Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET SINGLE RACK
 */
const getSingleRack = async (req, res) => {
    try {
        const { id } = req.params;

        const rack = await RackModel.findById(id)
            .populate("dataCenterId", "name")
            .populate("hubId", "name")
            .populate("sensorIds", "sensorName");

        if (!rack) {
            return res.status(404).json({ message: "Rack not found" });
        }

        res.status(200).json({ rack });
    } catch (error) {
        console.error("Get Single Rack Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * UPDATE RACK
 */
const updateRack = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Validate conditions if updating
        if (updateData.conditions) {
            if (!Array.isArray(updateData.conditions) || updateData.conditions.length === 0) {
                return res.status(400).json({ message: "Invalid condition format" });
            }

            for (const cond of updateData.conditions) {
                if (
                    !cond.type ||
                    !["temp", "humidity"].includes(cond.type) ||
                    !cond.operator ||
                    !["<", ">"].includes(cond.operator) ||
                    typeof cond.value !== "number"
                ) {
                    return res.status(400).json({ message: "Invalid condition format" });
                }
            }
        }

        const rack = await RackModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true,
        });

        if (!rack) {
            return res.status(404).json({ message: "Rack not found" });
        }

        res.status(200).json({
            message: "Rack updated successfully",
            rack,
        });
    } catch (error) {
        console.error("Update Rack Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * DELETE RACK
 */
const deleteRack = async (req, res) => {
    try {
        const { id } = req.params;

        const rack = await RackModel.findByIdAndDelete(id);
        if (!rack) {
            return res.status(404).json({ message: "Rack not found" });
        }

        res.status(200).json({
            message: "Rack deleted successfully",
        });
    } catch (error) {
        console.error("Delete Rack Error:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createRack,
    getAllRacks,
    getSingleRack,
    updateRack,
    deleteRack,
};
