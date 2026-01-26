const AcControlModel = require("../models/acControlModel");
const RackClusterModel = require("../models/rackClusterModel");
const { sendAcStatusToEsp32 } = require("../utils/espAcStatusSocket");

// ================= SET AC CONTROL =================
const setAcAuto = async (req, res) => {
    try {
        const { clusterId, enabled } = req.body;

        if (!clusterId) {
            return res.status(400).json({ message: "clusterId is required" });
        }

        if (typeof enabled !== "boolean") {
            return res.status(400).json({
                message: "enabled must be boolean (true / false)",
            });
        }

        const cluster = await RackClusterModel.findById(clusterId);
        if (!cluster) {
            return res.status(404).json({ message: "Cluster not found" });
        }

        const control = await AcControlModel.findOneAndUpdate(
            { clusterId },
            {
                enabled, ...(enabled === true && { manualStatus: false })
            },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            // message: "AC control updated successfully",
            message: enabled
                ? "AUTO mode enabled (manual disabled)"
                : "AUTO mode disabled (manual enabled)",
            data: control,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};


const setAcManual = async (req, res) => {
    try {
        const { clusterId, status } = req.body;

        if (!clusterId) {
            return res.status(400).json({ message: "clusterId is required" });
        }

        if (typeof status !== "boolean") {
            return res.status(400).json({
                message: "status must be boolean (true / false)",
            });
        }

        const acControl = await AcControlModel.findOne({ clusterId });

        if (!acControl || acControl.enabled === true) {
            return res.status(400).json({
                message: "Manual control is disabled (AUTO mode active)",
            });
        }

        // Save manual state
        acControl.manualStatus = status;
        await acControl.save();

        // 🔥 SEND COMMAND TO ESP32
        sendAcStatusToEsp32(clusterId, status, null);

        return res.status(200).json({
            message: "Manual AC control sent",
            manualStatus: status ? "ON" : "OFF",
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { setAcAuto, setAcManual };
