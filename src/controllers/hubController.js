const DataCenterModel = require("../models/DataCenterModel");
const HubModel = require("../models/hubModel");
const SensorModel = require("../models/sersorModel");
const mongoose = require("mongoose");



const generateApiKey = (hubName, sensorQuantity) => {

    const raw = [hubName, sensorQuantity].join(",");
    return Buffer.from(raw).toString("base64");
};

const createHub = async (req, res) => {
    try {
        const { dataCenterId, name, sensorQuantity } = req.body;

        // Validation
        if (!dataCenterId || !name) {
            return res.status(400).json({
                message: "dataCenterId and hub name are required",
            });
        }

        // Check DataCenter exists
        const dataCenter = await DataCenterModel.findById(dataCenterId);
        if (!dataCenter) {
            return res.status(404).json({
                message: "Data center not found",
            });
        }

        // Check hub name inside same data center
        const existingHub = await HubModel.findOne({ dataCenterId, name });
        if (existingHub) {
            return res.status(409).json({
                message: "Hub with this name already exists in this data center",
            });
        }

        // Decide sensor quantity
        const totalSensors = sensorQuantity || 15;

        // Create Hub (apiKey later)
        const hub = await HubModel.create({
            dataCenterId,
            name,
            sensorQuantity: totalSensors,
            apiKey: "apiKey",
        });

        // Create Sensors
        const sensors = [];
        const sensorNames = [];

        for (let i = 1; i <= totalSensors; i++) {
            const sensorName = `S-${i}`;
            sensorNames.push(sensorName);

            sensors.push({
                hubId: hub._id,
                sensorName,
            });
        }

        await SensorModel.insertMany(sensors);

        // Generate API Key
        const apiKey = generateApiKey(name, sensorNames);

        // Update Hub with apiKey
        hub.apiKey = apiKey;
        await hub.save();

        return res.status(201).json({
            message: "Hub created successfully",
            hub: {
                id: hub._id,
                name: hub.name,
                apiKey: hub.apiKey,
                sensorQuantity: hub.sensorQuantity,
            },
        });
    } catch (error) {
        console.error("Create Hub Error:", error);
        res.status(500).json({
            message: "Internal server error",
        });
    }
};


// Get All Hubs
const getAllHubs = async (req, res) => {
    try {
        // Fetch all hubs with their datacenter names
        const hubs = await HubModel.find()
            .populate("dataCenterId", "name")
            .lean();

        if (!hubs || hubs.length === 0) {
            return res.status(404).json({ message: "Hubs Not Found" });
        }

        // Fetch sensors for each hub
        const hubsWithSensors = await Promise.all(
            hubs.map(async (hub) => {
                const sensors = await SensorModel.find({ hubId: hub._id }, "_id sensorName").lean();
                return {
                    ...hub,
                    sensors, // attach sensors array
                };
            })
        );

        return res.status(200).json(hubsWithSensors);
    } catch (err) {
        console.error("Get All Hubs Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
};


// Get Single Hub
const getHubById = async (req, res) => {
    try {
        const { hubId } = req.params;
        const hub = await HubModel.findById(hubId).populate("dataCenterId", "name").lean();
        if (!hub) return res.status(404).json({ message: "Hub not found" });

        const sensors = await SensorModel.find({ hubId }, "_id sensorName").lean();
        hub.sensors = sensors;

        return res.status(200).json(hub);
    } catch (err) {
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get Hubs by DataCenter ID
const getHubsByDataCenter = async (req, res) => {
    try {
        const { dataCenterId } = req.params;

        // Fetch all hubs for the given data center
        const hubs = await HubModel.find({ dataCenterId }).lean();
        if (!hubs || hubs.length === 0) {
            return res.status(404).json({ message: "Hubs Not Found" });
        }

        // Fetch sensors for each hub (only _id and sensorName)
        const hubsWithSensors = await Promise.all(
            hubs.map(async (hub) => {
                const sensors = await SensorModel.find({ hubId: hub._id }, "_id sensorName").lean();
                return {
                    ...hub,
                    sensors,
                };
            })
        );

        return res.status(200).json(hubsWithSensors);
    } catch (err) {
        console.error("Get Hubs By DataCenter Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Get Sensors By  Hub-Id
const getSensorsByHubId = async (req, res) => {
    try {
        const { hubId } = req.params;

        // Validate MongoDB ObjectId
        if (!mongoose.Types.ObjectId.isValid(hubId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid hubId",
            });
        }

        // Check if hub exists
        const hub = await HubModel.findById(hubId);
        if (!hub) {
            return res.status(404).json({
                success: false,
                message: "Hub not found",
            });
        }

        // Fetch sensors for this hub
        const sensors = await SensorModel.find({ hubId })
            .select("-__v")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            hub: {
                _id: hub._id,
                name: hub.name,
                sensorQuantity: hub.sensorQuantity,
            },
            count: sensors.length,
            sensors,
        });
    } catch (error) {
        console.error("getSensorsByHubId error:", error);
        return res.status(500).json({
            success: false,
            message: "Internal server error",
        });
    }
};

// Update Hub
const updateHub = async (req, res) => {
    try {
        const { hubId } = req.params;
        const { name, dataCenterId } = req.body;

        // Find hub
        const hub = await HubModel.findById(hubId);
        if (!hub) {
            return res.status(404).json({ message: "Hub not found" });
        }

        let regenerateApiKey = false;

        // ---------------- UPDATE HUB NAME ----------------
        if (name && name !== hub.name) {
            // Check if hub name already exists in the same data center
            const exists = await HubModel.findOne({
                dataCenterId: hub.dataCenterId,
                name,
                _id: { $ne: hubId },
            });
            if (exists) {
                return res.status(409).json({
                    message: "Hub with this name already exists in this data center",
                });
            }

            hub.name = name;
            regenerateApiKey = true;
        }

        // ---------------- UPDATE DATA CENTER ----------------
        if (dataCenterId && dataCenterId.toString() !== hub.dataCenterId.toString()) {
            const dataCenter = await DataCenterModel.findById(dataCenterId);
            if (!dataCenter) {
                return res.status(404).json({ message: "Data center not found" });
            }

            hub.dataCenterId = dataCenterId;
            // Do NOT regenerate API key when only data center changes
        }

        // ---------------- REGENERATE API KEY IF NAME CHANGED ----------------
        if (regenerateApiKey) {
            const sensors = await SensorModel.find({ hubId }).lean();
            const sensorNames = sensors.map((s) => s.sensorName);
            hub.apiKey = generateApiKey(hub.name, sensorNames);
        }

        await hub.save();

        // ---------------- RESPONSE MESSAGE ----------------
        const responseMessage = regenerateApiKey
            ? "Hub updated and new API key generated successfully"
            : "Hub updated successfully";

        return res.status(200).json({
            message: responseMessage,
            hub: {
                id: hub._id,
                name: hub.name,
                apiKey: hub.apiKey,
                sensorQuantity: hub.sensorQuantity,
                dataCenterId: hub.dataCenterId,
            },
        });
    } catch (err) {
        console.error("Update Hub Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};

// Delete Hub
const deleteHub = async (req, res) => {
    try {
        const { hubId } = req.params;
        const hub = await HubModel.findById(hubId);
        if (!hub) return res.status(404).json({ message: "Hub not found" });

        // Delete all sensors first
        await SensorModel.deleteMany({ hubId });

        // Delete hub
        await hub.deleteOne();

        res.status(200).json({ message: "Hub and its sensors deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
};


module.exports = { createHub, getAllHubs, getHubById, getHubsByDataCenter, updateHub, deleteHub, getSensorsByHubId };
