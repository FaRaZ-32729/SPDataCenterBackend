// // Returns alerts for all venues under an organization
// const getAlerts = async (req, res) => {
//     try {
//         const { organizationId } = req.params;

//         // Get all venues under this organization
//         const venues = await venueModel.find({ organization: organizationId }).lean();
//         if (!venues.length) return res.status(404).json({ message: "No venues found" });

//         const venueIds = venues.map((v) => v._id);

//         // Get all devices inside those venues
//         const devices = await deviceModel.find({ venue: { $in: venueIds } })
//             .populate("venue", "name")
//             .lean();

//         // Aggregate alerts per venue
//         const result = venues.map((venue) => {
//             const venueDevices = devices.filter(
//                 (d) => d.venue._id.toString() === venue._id.toString()
//             );

//             // NEW ALERT LOGIC
//             const devicesWithAlerts = venueDevices.filter(
//                 (d) => d.temperatureAlert || d.humidityAlert || d.odourAlert
//             );

//             const temperatureAlerts = venueDevices
//                 .filter((d) => d.temperatureAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     temperature: d.espTemprature,
//                     humidity: d.espHumidity
//                 }));

//             const humidityAlerts = venueDevices
//                 .filter((d) => d.humidityAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     temperature: d.espTemprature,
//                     humidity: d.espHumidity
//                 }));

//             const odourAlerts = venueDevices
//                 .filter((d) => d.odourAlert)
//                 .map((d) => ({
//                     deviceId: d.deviceId,
//                     temperature: d.espTemprature,
//                     humidity: d.espHumidity
//                 }));

//             return {
//                 venueId: venue._id,
//                 venueName: venue.name,
//                 totalDevices: venueDevices.length,

//                 // Total active alerts in this venue
//                 totalAlerts: devicesWithAlerts.length,

//                 // Temperature alerts
//                 temperatureAlertCount: temperatureAlerts.length,
//                 temperatureAlertDevices: temperatureAlerts,

//                 // Humidity alerts
//                 humidityAlertCount: humidityAlerts.length,
//                 humidityAlertDevices: humidityAlerts,

//                 // Odour alerts
//                 odourAlertCount: odourAlerts.length,
//                 odourAlertDevices: odourAlerts,
//             };
//         });

//         res.json({ organizationId, venues: result });

//     } catch (err) {
//         console.error("Error fetching alerts:", err.message);
//         res.status(500).json({ message: "Server error" });
//     }
// };


// module.exports = { getAlerts };



const RackModel = require("../models/rackModel");
const RackClusterModel = require("../models/rackClusterModel");

const getAlertsByDataCenterId = async (req, res) => {
    try {
        const { dataCenterId } = req.params;

        // 1️⃣ Get all racks under this data center
        const racks = await RackModel.find({
            "dataCenter.id": dataCenterId,
        }).lean();

        if (!racks.length) {
            return res.status(404).json({
                message: "No racks found for this data center",
            });
        }

        // 2️⃣ Aggregate alerts per rack
        const result = racks.map((rack) => {
            // Sensors stored in this rack
            const sensors = rack.sensorValues || [];

            // Rack level alerts
            const hasTempAlert = rack.tempA === true;
            const hasHumiAlert = rack.humiA === true;

            // Dominant sensor (highest temperature)
            let dominantSensor = null;
            sensors.forEach((s) => {
                if (!dominantSensor || s.temperature > dominantSensor.temperature) {
                    dominantSensor = s;
                }
            });

            return {
                rackId: rack._id,
                rackName: rack.name,
                hubName: rack.hub.name,

                totalSensors: sensors.length,

                // TOTAL ALERTS IN THIS RACK
                totalAlerts:
                    (hasTempAlert ? 1 : 0) + (hasHumiAlert ? 1 : 0),

                // 🔥 TEMPERATURE ALERT
                tempA: hasTempAlert,
                tempV: dominantSensor?.temperature ?? null,

                // 💧 HUMIDITY ALERT
                humiA: hasHumiAlert,
                humiV: dominantSensor?.humidity ?? null,

                // 🔍 SENSOR DETAILS (OPTIONAL BUT USEFUL)
                sensors: sensors.map((s) => ({
                    sensorName: s.sensorName,
                    temperature: s.temperature,
                    humidity: s.humidity,
                    updatedAt: s.updatedAt,
                })),
            };
        });

        res.json({
            dataCenterId,
            totalRacks: racks.length,
            racks: result,
        });
    } catch (err) {
        console.error("❌ Error fetching rack alerts:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};



const getAlertsByRackClusterId = async (req, res) => {
    try {
        const { rackClusterId } = req.params;

        // 1️⃣ Find Rack Cluster
        const rackCluster = await RackClusterModel.findById(rackClusterId).lean();

        if (!rackCluster) {
            return res.status(404).json({
                message: "Rack cluster not found",
            });
        }

        if (!rackCluster.racks || rackCluster.racks.length === 0) {
            return res.json({
                rackClusterId,
                rackClusterName: rackCluster.name,
                totalRacks: 0,
                racks: [],
            });
        }

        // 2️⃣ Extract rack IDs from cluster
        const rackIds = rackCluster.racks.map((r) => r._id);

        // 3️⃣ Fetch racks
        const racks = await RackModel.find({
            _id: { $in: rackIds },
        }).lean();

        // 4️⃣ Build response
        const result = racks.map((rack) => {
            const sensors = rack.sensorValues || [];

            let dominantSensor = null;
            sensors.forEach((s) => {
                if (!dominantSensor || s.temperature > dominantSensor.temperature) {
                    dominantSensor = s;
                }
            });

            return {
                rackId: rack._id,
                rackName: rack.name,
                hubName: rack.hub.name,

                totalSensors: sensors.length,

                totalAlerts:
                    (rack.tempA ? 1 : 0) + (rack.humiA ? 1 : 0),

                temperatureAlert: rack.tempA,
                temperatureValue: dominantSensor?.temperature ?? null,

                humidityAlert: rack.humiA,
                humidityValue: dominantSensor?.humidity ?? null,

                sensors: sensors.map((s) => ({
                    sensorName: s.sensorName,
                    temperature: s.temperature,
                    humidity: s.humidity,
                    updatedAt: s.updatedAt,
                })),
            };
        });

        res.json({
            rackClusterId,
            rackClusterName: rackCluster.name,
            ackitName: rackCluster.ackitName,
            dataCenterId: rackCluster.dataCenterId,
            totalRacks: result.length,
            racks: result,
        });
    } catch (err) {
        console.error("❌ Error fetching rack cluster alerts:", err.message);
        res.status(500).json({ message: "Server error" });
    }
};



module.exports = { getAlertsByDataCenterId, getAlertsByRackClusterId };
