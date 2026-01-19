const express = require("express");
const { createRackCluster, getAllRackClusters, getSingleRackCluster, updateRackCluster, deleteRackCluster } = require("../controllers/rackClusterController");
const router = express.Router();


router.post("/add", createRackCluster);
router.get("/all", getAllRackClusters);
router.get("/single/:id", getSingleRackCluster);
router.put("/update/:id", updateRackCluster);
router.delete("/delete/:id", deleteRackCluster);

module.exports = router;
