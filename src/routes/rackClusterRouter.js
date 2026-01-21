const express = require("express");
const { createRackCluster, getAllRackClusters, getSingleRackCluster, updateRackCluster, deleteRackCluster, getRackClustersByDataCenterId, getRackClusterMean } = require("../controllers/rackClusterController");
const router = express.Router();


router.post("/add", createRackCluster);
router.get("/all", getAllRackClusters);
router.get("/single/:id", getSingleRackCluster);
router.get("/by-dataCenter/:dataCenterId", getRackClustersByDataCenterId);
router.get("/mean/:clusterId", getRackClusterMean);
router.put("/update/:id", updateRackCluster);
router.delete("/delete/:id", deleteRackCluster);

module.exports = router;
