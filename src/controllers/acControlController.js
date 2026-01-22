const AcControlModel = require("../models/acControlModel");
const RackClusterModel = require("../models/rackClusterModel");

// ================= SET AC CONTROL =================
const setAcControl = async (req, res) => {
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
            { enabled },
            { new: true, upsert: true }
        );

        return res.status(200).json({
            message: "AC control updated successfully",
            data: control,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports =  setAcControl ;
