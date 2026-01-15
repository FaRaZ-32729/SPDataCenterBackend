const DataCenterModel = require("../models/DataCenterModel");
const HubModel = require("../models/hubModel");
const SensorModel = require("../models/sersorModel");



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

module.exports = { createHub };
