const RackModel = require("../models/rackModel");
const DataCenterModel = require("../models/DataCenterModel");
const HubModel = require("../models/hubModel");
const SensorModel = require("../models/sersorModel");
const RackClusterModel = require("../models/rackClusterModel");

//  CREATE RACK
const createRack = async (req, res) => {
    try {
        const {
            name,
            dataCenterId,
            hubId,
            sensorIds,
            row,
            col,
            conditions,
        } = req.body;

        // 🔹 Basic validation
        if (
            !name ||
            !dataCenterId ||
            !hubId ||
            !Array.isArray(sensorIds) ||
            sensorIds.length === 0 ||
            !row ||
            !col ||
            !conditions
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check DataCenter exists
        const dataCenter = await DataCenterModel.findById(dataCenterId);
        if (!dataCenter) {
            return res.status(404).json({ message: "Data center not found" });
        }

        // Check Hub exists
        const hub = await HubModel.findById(hubId);
        if (!hub) {
            return res.status(404).json({ message: "Hub not found" });
        }

        // Rack name uniqueness inside same DataCenter
        const existingRack = await RackModel.findOne({
            "dataCenter.id": dataCenterId,
            name,
        });

        if (existingRack) {
            return res.status(409).json({
                message: "Rack with this name already exists in this data center",
            });
        }

        // Validate Sensors (exist + linked to hub)
        const sensors = await SensorModel.find({
            _id: { $in: sensorIds },
            hubId,
        });

        if (sensors.length !== sensorIds.length) {
            return res.status(400).json({
                message: "One or more sensors are invalid or not linked to this hub",
            });
        }

        // Validate conditions
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

        // Create Rack (NEW STRUCTURE)
        const rack = await RackModel.create({
            name,

            dataCenter: {
                id: dataCenter._id,
                name: dataCenter.name,
            },

            hub: {
                id: hub._id,
                name: hub.name,
            },

            sensors: sensors.map(sensor => ({
                _id: sensor._id,
                name: sensor.name || sensor.sensorName,
            })),

            row,
            col,
            conditions,
        });

        return res.status(201).json({
            message: "Rack created successfully",
            rack,
        });
    } catch (error) {
        console.error("Create Rack Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// GET ALL RACKS
const getAllRacks = async (req, res) => {
    try {
        const racks = await RackModel.find();

        if (!racks) {
            return res.status(404).json({ message: "Racks Not Found" })
        }

        return res.status(200).json({ racks });
    } catch (error) {
        console.error("Get All Racks Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// GET SINGLE RACK
const getSingleRack = async (req, res) => {
    try {
        const { id } = req.params;

        const rack = await RackModel.findById(id);

        if (!rack) {
            return res.status(404).json({ message: "Rack not found" });
        }

        return res.status(200).json({ rack });
    } catch (error) {
        console.error("Get Single Rack Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// GET RACKS BY RACK-CLUSTER-ID 
const getRacksByClusterId = async (req, res) => {
    try {
        const { clusterId } = req.params;

        if (!clusterId) {
            return res.status(400).json({
                message: "Rack cluster ID is required",
            });
        }

        // ----------- FIND CLUSTER -----------
        const cluster = await RackClusterModel.findById(clusterId);

        if (!cluster) {
            return res.status(404).json({
                message: "Rack cluster not found",
            });
        }

        if (!cluster.racks || cluster.racks.length === 0) {
            return res.status(200).json({
                message: "No racks found in this cluster",
                data: [],
            });
        }

        // ----------- EXTRACT RACK IDS -----------
        const rackIds = cluster.racks.map((rack) => rack._id);

        // ----------- FETCH FULL RACK DATA -----------
        const racks = await RackModel.find({ _id: { $in: rackIds } })
            .populate("dataCenter.id", "name")
            .populate("hub.id", "name")
            .populate("sensors._id", "name");

        return res.status(200).json({
            message: "Racks fetched successfully",
            count: racks.length,
            racks,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch racks by cluster ID",
            error: error.message,
        });
    }
};

// GET RACKS BY DATA-CENTER-ID
const getRacksByDataCenterId = async (req, res) => {
    try {
        const { dataCenterId } = req.params;

        if (!dataCenterId) {
            return res.status(400).json({
                message: "Data center ID is required",
            });
        }

        const racks = await RackModel.find({
            "dataCenter.id": dataCenterId,
        })
            .sort({ createdAt: -1 })
            .populate("dataCenter.id", "name")
            .populate("hub.id", "name")
            .populate("sensors._id", "name");

        if (!racks || racks.length === 0) {
            return res.status(200).json({
                message: "No racks found for this data center",
            });
        }

        return res.status(200).json({
            message: "Racks fetched successfully",
            count: racks.length,
            racks,
        });

    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch racks by data center ID",
            error: error.message,
        });
    }
};

// UPDATE RACK
const updateRack = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            name,
            dataCenterId,
            hubId,
            sensorIds,
            row,
            col,
            conditions,
        } = req.body;

        // Check Rack exists
        const rack = await RackModel.findById(id);
        if (!rack) {
            return res.status(404).json({ message: "Rack not found" });
        }

        /* ---------------- DATA CENTER UPDATE ---------------- */
        if (dataCenterId) {
            const dataCenter = await DataCenterModel.findById(dataCenterId);
            if (!dataCenter) {
                return res.status(404).json({ message: "Data center not found" });
            }

            rack.dataCenter = {
                id: dataCenter._id,
                name: dataCenter.name,
            };
        }

        /* ---------------- HUB UPDATE ---------------- */
        if (hubId) {
            const hub = await HubModel.findById(hubId);
            if (!hub) {
                return res.status(404).json({ message: "Hub not found" });
            }

            rack.hub = {
                id: hub._id,
                name: hub.name,
            };
        }

        /* ---------------- NAME UNIQUE VALIDATION ---------------- */
        if (name) {
            const checkDataCenterId =
                dataCenterId || rack.dataCenter.id;

            const existingRack = await RackModel.findOne({
                _id: { $ne: rack._id },
                "dataCenter.id": checkDataCenterId,
                name,
            });

            if (existingRack) {
                return res.status(409).json({
                    message: "Rack with this name already exists in this data center",
                });
            }

            rack.name = name;
        }

        /* ---------------- SENSOR UPDATE ---------------- */
        if (sensorIds) {
            if (!Array.isArray(sensorIds) || sensorIds.length === 0) {
                return res.status(400).json({
                    message: "sensorIds must be a non-empty array",
                });
            }

            const validHubId = hubId || rack.hub.id;

            const sensors = await SensorModel.find({
                _id: { $in: sensorIds },
                hubId: validHubId,
            });

            if (sensors.length !== sensorIds.length) {
                return res.status(400).json({
                    message: "One or more sensors are invalid or not linked to this hub",
                });
            }

            rack.sensors = sensors.map(sensor => ({
                _id: sensor._id,
                name: sensor.name || sensor.sensorName,
            }));
        }

        /* ---------------- ROW / COL ---------------- */
        if (row) rack.row = row;
        if (col) rack.col = col;

        /* ---------------- CONDITIONS ---------------- */
        if (conditions) {
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

            rack.conditions = conditions;
        }

        /* ---------------- SAVE ---------------- */
        await rack.save();

        return res.status(200).json({
            message: "Rack updated successfully",
            rack,
        });
    } catch (error) {
        console.error("Update Rack Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete Rack
const deleteRack = async (req, res) => {
    try {
        const { id } = req.params;

        const rack = await RackModel.findByIdAndDelete(id);
        if (!rack) {
            return res.status(404).json({ message: "Rack not found" });
        }

        return res.status(200).json({
            message: "Rack deleted successfully",
        });
    } catch (error) {
        console.error("Delete Rack Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createRack,
    getAllRacks,
    getSingleRack,
    updateRack,
    deleteRack,
    getRacksByClusterId,
    getRacksByDataCenterId
};
