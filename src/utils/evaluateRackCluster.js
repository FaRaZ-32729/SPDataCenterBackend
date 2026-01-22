const RackClusterModel = require("../models/rackClusterModel");
const RackModel = require("../models/rackModel");
const AckitModel = require("../models/ackitModel");

const evaluateRackCluster = async (rackId) => {

    // Find cluster containing this rack
    const cluster = await RackClusterModel.findOne({
        "racks._id": rackId,
    });



    if (!cluster) return null;

    // Load racks
    const racks = await RackModel.find({
        _id: { $in: cluster.racks.map(r => r._id) },
    });


    let tempSum = 0;
    let humiSum = 0;
    let count = 0;

    // Collect ALL sensor values
    racks.forEach(rack => {
        rack.sensorValues.forEach(sv => {
            if (sv.temperature != null) {
                tempSum += sv.temperature;
                humiSum += sv.humidity;
                count++;
            }
        });
    });

    // Collects Only Dominant Sensor values
    // racks.forEach(rack => {
    //     if (rack.tempV != null) {
    //         tempSum += rack.tempV;
    //         humiSum += rack.humiV;
    //         count++;
    //     }
    // });

    if (count === 0) return null;

    const meanTemp = +(tempSum / count).toFixed(2);
    const meanHumi = +(humiSum / count).toFixed(2);

    // Load Ackit
    const ackit = await AckitModel.findOne({ _id: cluster.ackit._id });
    if (!ackit) return null;

    // Evaluate condition
    let ackitStatus = false;

    if (ackit.condition.type === "temp") {
        ackitStatus =
            ackit.condition.operator === ">"
                ? meanTemp > ackit.condition.value
                : meanTemp < ackit.condition.value;
    }

    // Persist cluster state (optional)
    await RackClusterModel.updateOne(
        { _id: cluster._id },
        {
            meanTemp,
            meanHumi,
            ackitStatus,
        }
    );

    return {
        clusterId: cluster._id,
        meanTemp,
        meanHumi,
        ackitStatus,
    };
};

module.exports = evaluateRackCluster;
