const express = require("express");
const {
    createRack,
    getAllRacks,
    getSingleRack,
    updateRack,
    deleteRack,
    getRacksByClusterId,
    getRacksByDataCenterId,
    getRackOccupancyByDataCenter
} = require("../controllers/rackController");

const router = express.Router();

router.post("/add", createRack);
router.get("/all", getAllRacks);
router.get("/single/:id", getSingleRack);
router.get("/by-cluster/:clusterId", getRacksByClusterId);
router.get("/row-col/:dataCenterId", getRackOccupancyByDataCenter);
router.get("/by-datacenter/:dataCenterId", getRacksByDataCenterId);
router.put("/update/:id", updateRack);
router.delete("/delete/:id", deleteRack);

module.exports = router;
