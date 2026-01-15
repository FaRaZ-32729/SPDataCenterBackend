const express = require("express");
const { createDataCenter, getDataCenter, updateDataCenter, deleteDataCenter, getDataCenterById, getDataCenterByUserId } = require("../controllers/dataCenterController");
const router = express.Router();

router.post("/add", createDataCenter);
router.get("/all", getDataCenter);
router.get("/user/:userId", getDataCenterByUserId);
router.get("/single/:id", getDataCenterById);
router.put("/update/:id", updateDataCenter);
router.delete("/delete/:id", deleteDataCenter);

module.exports = router