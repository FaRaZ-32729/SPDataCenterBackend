const express = require("express");
const { getAlertsByDataCenterId, getAlertsByRackClusterId } = require("../controllers/alertController");
const router = express.Router();

router.get("/by-data-center/:dataCenterId", getAlertsByDataCenterId);
router.get("/by-rack-cluster/:rackClusterId", getAlertsByRackClusterId);

module.exports = router;