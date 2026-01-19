const RackClusterModel = require("../models/rackClusterModel");
const AckitModel = require("../models/ackitModel");
const RackModel = require("../models/rackModel");

// ================= CREATE RACK CLUSTER =================

const createRackCluster = async (req, res) => {
    try {
        const { name, ackitName, racks } = req.body;

        // ----------- VALIDATIONS -----------
        if (!name) {
            return res.status(400).json({ message: "Cluster name is required" });
        }

        if (!ackitName) {
            return res.status(400).json({ message: "Ackit name is required" });
        }

        if (!Array.isArray(racks) || racks.length === 0) {
            return res
                .status(400)
                .json({ message: "At least one rack ID is required" });
        }

        // ----------- VALIDATE ACKIT NAME -----------
        const ackitExists = await AckitModel.findOne({ name: ackitName });
        if (!ackitExists) {
            return res.status(404).json({
                message: "Ackit with this name does not exist",
            });
        }

        // ----------- VALIDATE RACK IDS AND FETCH NAMES -----------
        const rackObjects = await RackModel.find({ _id: { $in: racks } });

        if (rackObjects.length !== racks.length) {
            return res.status(404).json({
                message: "One or more racks are invalid",
            });
        }

        // Build racks array with _id + name
        const racksWithNames = rackObjects.map((rack) => ({
            _id: rack._id,
            name: rack.name,
        }));

        // ----------- CREATE CLUSTER -----------
        const rackCluster = await RackClusterModel.create({
            name,
            ackitName,
            racks: racksWithNames,
        });

        return res.status(201).json({
            message: "Rack cluster created successfully",
            data: rackCluster,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Rack cluster with this name already exists",
            });
        }

        return res.status(500).json({
            message: "Failed to create rack cluster",
            error: error.message,
        });
    }
};

// ================= GET ALL RACK CLUSTERS =================
const getAllRackClusters = async (req, res) => {
    try {
        const clusters = await RackClusterModel.find().sort({
            createdAt: -1,
        });

        return res.status(200).json({
            message: "Rack clusters fetched successfully",
            clusters
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch rack clusters",
            error: error.message,
        });
    }
};

// ================= GET SINGLE RACK CLUSTER =================
const getSingleRackCluster = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res
                .status(400)
                .json({ message: "Rack cluster ID is required" });
        }

        const cluster = await RackClusterModel.findById(id);

        if (!cluster) {
            return res.status(404).json({
                message: "Rack cluster not found",
            });
        }

        return res.status(200).json({
            message: "Rack cluster fetched successfully",
            data: cluster,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch rack cluster",
            error: error.message,
        });
    }
};

// ================= UPDATE RACK CLUSTER =================
const updateRackCluster = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ackitName, racks } = req.body;

        if (!id) {
            return res
                .status(400)
                .json({ message: "Rack cluster ID is required" });
        }

        // ----------- VALIDATE ACKIT NAME IF PROVIDED -----------
        if (ackitName) {
            const ackitExists = await AckitModel.findOne({ name: ackitName });
            if (!ackitExists) {
                return res.status(404).json({
                    message: "Ackit with this name does not exist",
                });
            }
        }

        let racksWithNames;
        if (racks) {
            if (!Array.isArray(racks) || racks.length === 0) {
                return res.status(400).json({
                    message: "Racks must be a non-empty array",
                });
            }

            // ----------- VALIDATE RACK IDS AND FETCH NAMES -----------
            const rackObjects = await RackModel.find({ _id: { $in: racks } });

            if (rackObjects.length !== racks.length) {
                return res.status(404).json({
                    message: "One or more rack IDs are invalid",
                });
            }

            // Build racks array with _id + name
            racksWithNames = rackObjects.map((rack) => ({
                _id: rack._id,
                name: rack.name,
            }));
        }

        // ----------- UPDATE CLUSTER -----------
        const updatedCluster = await RackClusterModel.findByIdAndUpdate(
            id,
            {
                name,
                ackitName,
                ...(racksWithNames && { racks: racksWithNames }),
            },
            { new: true, runValidators: true }
        );

        if (!updatedCluster) {
            return res.status(404).json({
                message: "Rack cluster not found",
            });
        }

        return res.status(200).json({
            message: "Rack cluster updated successfully",
            data: updatedCluster,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Rack cluster with this name already exists",
            });
        }

        return res.status(500).json({
            message: "Failed to update rack cluster",
            error: error.message,
        });
    }
};

// ================= DELETE RACK CLUSTER =================
const deleteRackCluster = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) {
            return res
                .status(400)
                .json({ message: "Rack cluster ID is required" });
        }

        const deletedCluster = await RackClusterModel.findByIdAndDelete(id);

        if (!deletedCluster) {
            return res.status(404).json({
                message: "Rack cluster not found",
            });
        }

        return res.status(200).json({
            message: "Rack cluster deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete rack cluster",
            error: error.message,
        });
    }
};


module.exports = {
    createRackCluster,
    getAllRackClusters,
    getSingleRackCluster,
    updateRackCluster,
    deleteRackCluster
}