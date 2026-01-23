const RackClusterModel = require("../models/rackClusterModel");
const AckitModel = require("../models/ackitModel");
const RackModel = require("../models/rackModel");
const mongoose = require("mongoose");
const DataCenterModel = require("../models/DataCenterModel");
const evaluateRackCluster = require("../utils/evaluateRackCluster");
const { sendAcStatusToEsp32 } = require("../utils/espAcStatusSocket");
const AcControlModel = require("../models/acControlModel");

// ================= CREATE RACK CLUSTER =================
const createRackCluster = async (req, res) => {
    try {
        const { name, dataCenterId, ackitId, racks } = req.body;

        // ----------- BASIC VALIDATIONS -----------
        if (!name) {
            return res.status(400).json({ message: "Cluster name is required" });
        }

        if (!dataCenterId) {
            return res.status(400).json({ message: "Data center ID is required" });
        }

        if (!ackitId) {
            return res.status(400).json({ message: "Ackit ID is required" });
        }

        if (!Array.isArray(racks) || racks.length === 0) {
            return res.status(400).json({
                message: "At least one rack ID is required",
            });
        }

        // ----------- VALIDATE DATA CENTER ID -----------
        if (!mongoose.Types.ObjectId.isValid(dataCenterId)) {
            return res.status(400).json({ message: "Invalid data center ID" });
        }

        // ----------- VALIDATE ACKIT ID -----------
        if (!mongoose.Types.ObjectId.isValid(ackitId)) {
            return res.status(400).json({ message: "Invalid ackit ID" });
        }

        const ackit = await AckitModel.findById(ackitId);
        if (!ackit) {
            return res.status(404).json({
                message: "Ackit not found",
            });
        }

        // ----------- VALIDATE RACKS -----------
        const rackObjects = await RackModel.find({
            _id: { $in: racks },
            "dataCenter.id": dataCenterId,
        });

        if (rackObjects.length !== racks.length) {
            return res.status(404).json({
                message:
                    "One or more racks are invalid or do not belong to this data center",
            });
        }

        const racksWithNames = rackObjects.map((rack) => ({
            _id: rack._id,
            name: rack.name,
        }));

        // ----------- CREATE CLUSTER -----------
        const rackCluster = await RackClusterModel.create({
            name,
            dataCenterId,
            ackit: {
                _id: ackit._id,
                name: ackit.name,
            },
            racks: racksWithNames,
        });

        return res.status(201).json({
            message: "Rack cluster created successfully",
            data: rackCluster,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Rack cluster with this name already exists in this data center",
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

// ================= GET RACK CLUSTERS BY DATA CENTER =================
const getRackClustersByDataCenterId = async (req, res) => {
    try {
        const { dataCenterId } = req.params;

        if (!dataCenterId) {
            return res.status(400).json({
                message: "Data center ID is required",
            });
        }

        // ----------- VALIDATE OBJECT ID -----------
        if (!mongoose.Types.ObjectId.isValid(dataCenterId)) {
            return res.status(400).json({
                message: "Invalid data center ID",
            });
        }

        //------------ CHECK DATA-CENTER IN DB---------
        const existingDatacenter = await DataCenterModel.findById(dataCenterId);
        if (!existingDatacenter) {
            return res.status(404).json({ message: "Data-Center Not Found" })
        }

        // ----------- FETCH CLUSTERS -----------
        const clusters = await RackClusterModel.find({
            dataCenterId,
        }).sort({ createdAt: -1 });

        if (!clusters.length) {
            return res.status(404).json({
                message: "No rack clusters found for this data center",
            });
        }

        return res.status(200).json({
            message: "Rack clusters fetched successfully",
            totalClusters: clusters.length,
            dataCenterId,
            clusters,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch rack clusters",
            error: error.message,
        });
    }
};

// ================= UPDATE RACK CLUSTER =================
const updateRackCluster = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, ackitId, racks, dataCenterId } = req.body;

        if (!id) {
            return res.status(400).json({
                message: "Rack cluster ID is required",
            });
        }

        const existingCluster = await RackClusterModel.findById(id);
        if (!existingCluster) {
            return res.status(404).json({
                message: "Rack cluster not found",
            });
        }

        // ----------- DATA CENTER -----------
        let finalDataCenterId = existingCluster.dataCenterId;

        if (dataCenterId) {
            if (!mongoose.Types.ObjectId.isValid(dataCenterId)) {
                return res.status(400).json({
                    message: "Invalid data center ID",
                });
            }
            finalDataCenterId = dataCenterId;
        }

        // ----------- ACKIT VALIDATION -----------
        let ackitObject;

        if (ackitId) {
            if (!mongoose.Types.ObjectId.isValid(ackitId)) {
                return res.status(400).json({
                    message: "Invalid ackit ID",
                });
            }

            const ackit = await AckitModel.findById(ackitId);
            if (!ackit) {
                return res.status(404).json({
                    message: "Ackit not found",
                });
            }

            ackitObject = {
                _id: ackit._id,
                name: ackit.name,
            };
        }

        // ----------- RACK VALIDATION -----------
        let racksWithNames;

        if (racks) {
            if (!Array.isArray(racks) || racks.length === 0) {
                return res.status(400).json({
                    message: "Racks must be a non-empty array",
                });
            }

            const rackObjects = await RackModel.find({
                _id: { $in: racks },
                "dataCenter.id": finalDataCenterId,
            });

            if (rackObjects.length !== racks.length) {
                return res.status(404).json({
                    message:
                        "One or more racks are invalid or do not belong to this data center",
                });
            }

            racksWithNames = rackObjects.map((rack) => ({
                _id: rack._id,
                name: rack.name,
            }));
        }

        // ----------- UPDATE -----------
        const updatedCluster = await RackClusterModel.findByIdAndUpdate(
            id,
            {
                ...(name && { name }),
                ...(dataCenterId && { dataCenterId: finalDataCenterId }),
                ...(ackitObject && { ackit: ackitObject }),
                ...(racksWithNames && { racks: racksWithNames }),
            },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: "Rack cluster updated successfully",
            data: updatedCluster,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message:
                    "Rack cluster with this name already exists in this data center",
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

// ================= GET MEANS & STATUS, CHECK AC CONTROL STATUS, TRIGGERS ESP32   =================
const getRackClusterMean = async (req, res) => {
    try {
        const { clusterId } = req.params;

        const cluster = await RackClusterModel.findById(clusterId);
        if (!cluster) return res.status(404).json({ message: "Cluster not found" });

        // Run evaluation for all racks in this cluster
        // Note: we pass all rackIds to your evaluateRackCluster function
        const rackIds = cluster.racks.map(r => r._id);

        let result = null;
        for (const rackId of rackIds) {
            result = await evaluateRackCluster(rackId); // updates cluster state
        }

        // Send result + trigger ESP32 signal if needed
        if (result) {

            // sendAcStatusToEsp32(
            //     result.clusterId,
            //     result.ackitStatus,
            //     result.meanTemp
            // );

            // CHECK AC CONTROL FLAG
            const acControl = await AcControlModel.findOne({
                clusterId: result.clusterId,
            });

            if (acControl?.enabled === true) {
                // SEND TO ESP32 ONLY IF ENABLED
                sendAcStatusToEsp32(
                    result.clusterId,
                    result.desiredAcStatus,
                    result.meanTemp
                );
            }

            return res.json({
                message: "Cluster evaluated",
                cluster: result.clusterId,
                meanTemp: result.meanTemp,
                meanHumi: result.meanHumi,
                desiredAc: result.desiredAcStatus ? "ON" : "OFF",
                actualAc: result.actualAcStatus ? "ON" : "OFF"
            });
        }

        res.status(400).json({ message: "No racks found for evaluation" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

//===================== GET MEAN AND STATUS OF ALL RACK-CLUSTERS IN A DATA-CENTER ==============
const getRackClusterMeansByDcId = async (req, res) => {
    try {
        const { dataCenterId } = req.params;

        if (!dataCenterId) {
            return res.status(400).json({ message: "dataCenterId is required" });
        }

        // Fetch all clusters for this data center
        const clusters = await RackClusterModel.find({ dataCenterId });

        if (!clusters || clusters.length === 0) {
            return res.status(404).json({ message: "No clusters found for this data center" });
        }

        // Prepare response
        let totalTemp = 0;
        let totalHumi = 0;
        let count = 0;

        const clusterData = clusters.map(cluster => {
            const { _id, name, meanTemp, meanHumi, ackitStatus } = cluster;

            if (meanTemp != null) {
                totalTemp += meanTemp;
                count++;
            }

            if (meanHumi != null) {
                totalHumi += meanHumi;
            }

            return {
                id: _id,
                name,
                meanTemp,
                meanHumi,
                ackitStatus: ackitStatus ? "on" : "off",
            };
        });

        // const overallMeanTemp = count > 0 ? Number((totalTemp / count).toFixed(2)) : null;
        // const overallMeanHumi = clusters.length > 0 ? Number((totalHumi / clusters.length).toFixed(2)) : null;

        return res.status(200).json({
            dataCenterId,
            clusters: clusterData,
            // overall: {
            //     meanTemp: overallMeanTemp,
            //     meanHumi: overallMeanHumi,
            // },
        });
    } catch (error) {
        console.error("Cluster Stats Error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    createRackCluster,
    getAllRackClusters,
    getSingleRackCluster,
    updateRackCluster,
    deleteRackCluster,
    getRackClustersByDataCenterId,
    getRackClusterMean,
    getRackClusterMeansByDcId
}