const express = require("express");
const {createDataCenter, getDataCenter, updateDataCenter, deleteDataCenter, getDataCenterById, getDataCenterByUserId } = require("../controllers/dataCenterController");
const router = express.Router();

router.post("/add",  createDataCenter);
router.get("/all-data-centers",  getDataCenter);
router.get("/:userId", getDataCenterByUserId);
router.put("/update/:id",  updateDataCenter);
router.delete("/delete/:id",  deleteDataCenter);

module.exports = router