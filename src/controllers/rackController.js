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

        // row and col validation

        const rowRegex = /^r([1-9]|1[0-9]|2[0-5])$/;
        const colRegex = /^c([1-9]|1[0-9]|2[0-5])$/;

        if (!rowRegex.test(row)) {
            return res.status(400).json({
                message: "Invalid row format. Use r1 to r25",
            });
        }

        if (!colRegex.test(col)) {
            return res.status(400).json({
                message: "Invalid column format. Use c1 to c25",
            });
        }


        const rows = await RackModel.distinct("row", {
            "dataCenter.id": dataCenterId,
        });

        if (!rows.includes(row) && rows.length >= 25) {
            return res.status(409).json({
                message: "This data center already has maximum 25 rows",
            });
        }


        const colCountInRow = await RackModel.countDocuments({
            "dataCenter.id": dataCenterId,
            row,
        });

        if (colCountInRow >= 25) {
            return res.status(409).json({
                message: `Row ${row} already has maximum 25 columns`,
            });
        }

        const positionExists = await RackModel.findOne({
            "dataCenter.id": dataCenterId,
            row,
            col,
        });

        if (positionExists) {
            return res.status(409).json({
                message: `Rack already exists at row ${row}, column ${col}`,
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

//get booked rows and cols in data-center
const getRackOccupancyByDataCenter = async (req, res) => {
    try {
        const { dataCenterId } = req.params;

        if (!dataCenterId) {
            return res.status(400).json({
                message: "dataCenterId is required",
            });
        }

        // Check DataCenter exists
        const dataCenter = await DataCenterModel.findById(dataCenterId);
        if (!dataCenter) {
            return res.status(404).json({
                message: "Data center not found",
            });
        }

        // Fetch only required fields
        const racks = await RackModel.find(
            { "dataCenter.id": dataCenterId },
            { row: 1, col: 1, _id: 0 }
        );

        const rowMap = {};

        for (const rack of racks) {
            if (!rowMap[rack.row]) {
                rowMap[rack.row] = new Set();
            }
            rowMap[rack.row].add(rack.col);
        }

        // Convert to array format
        const data = Object.entries(rowMap)
            .map(([row, cols]) => ({
                row,
                colsBooked: Array.from(cols).sort((a, b) =>
                    parseInt(a.slice(1)) - parseInt(b.slice(1))
                ),
            }))
            .sort((a, b) =>
                parseInt(a.row.slice(1)) - parseInt(b.row.slice(1))
            );

        return res.status(200).json({
            dataCenterId,
            rowsBooked: data.length,
            data,
        });
    } catch (error) {
        console.error("Rack Occupancy Error:", error);
        return res.status(500).json({
            message: "Internal server error",
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

        /* ---------------- ROW / COL UPDATE ---------------- */
        if (row || col) {
            const finalRow = row || rack.row;
            const finalCol = col || rack.col;

            const rowRegex = /^r([1-9]|1[0-9]|2[0-5])$/;
            const colRegex = /^c([1-9]|1[0-9]|2[0-5])$/;

            if (!rowRegex.test(finalRow)) {
                return res.status(400).json({
                    message: "Invalid row format. Use r1 to r25",
                });
            }

            if (!colRegex.test(finalCol)) {
                return res.status(400).json({
                    message: "Invalid column format. Use c1 to c25",
                });
            }

            const effectiveDataCenterId =
                dataCenterId || rack.dataCenter.id;

            // 🔹 DISTINCT ROW LIMIT (ignore current rack)
            const rows = await RackModel.distinct("row", {
                "dataCenter.id": effectiveDataCenterId,
                _id: { $ne: rack._id },
            });

            if (!rows.includes(finalRow) && rows.length >= 25) {
                return res.status(409).json({
                    message: "This data center already has maximum 25 rows",
                });
            }

            // 🔹 COLUMN LIMIT IN ROW (ignore current rack)
            const colCountInRow = await RackModel.countDocuments({
                "dataCenter.id": effectiveDataCenterId,
                row: finalRow,
                _id: { $ne: rack._id },
            });

            if (colCountInRow >= 25) {
                return res.status(409).json({
                    message: `Row ${finalRow} already has maximum 25 columns`,
                });
            }

            // 🔹 POSITION CONFLICT CHECK
            const positionExists = await RackModel.findOne({
                "dataCenter.id": effectiveDataCenterId,
                row: finalRow,
                col: finalCol,
                _id: { $ne: rack._id },
            });

            if (positionExists) {
                return res.status(409).json({
                    message: `Rack already exists at row ${finalRow}, column ${finalCol}`,
                });
            }

            rack.row = finalRow;
            rack.col = finalCol;
        }


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
    getRacksByDataCenterId,
    getRackOccupancyByDataCenter
};
