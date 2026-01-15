const express = require("express");
const { createHub, getAllHubs, getHubById, getHubsByDataCenter, updateHub, deleteHub } = require("../controllers/hubController");

const router = express.Router();

router.post("/add", createHub);
router.get("/all", getAllHubs);
router.get("/:hubId", getHubById);
router.get("/dataCenter/:dataCenterId", getHubsByDataCenter);
router.put("/update/:hubId", updateHub);
router.delete("/delete/:hubId", deleteHub);

module.exports = router;
